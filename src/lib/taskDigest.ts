/**
 * The daily digest of new task assignments (cron /api/cron/task-digest). From 19:00 Berlin time on, every member with
 * pending entries in `task_notifications` gets one mail with all of them, grouped by project.
 * `task_digests` holds one document per member and Berlin day (`_id` `${memberId}:${day}`), so a member gets at most
 * one digest a day however often the job runs. A run claims the document before sending; a failed send is tried again
 * by a later run (at most MAX_ATTEMPTS times a day) and keeps the entries for the next day after that. Resend gets the
 * same idempotency key on every try, so a send that went out although the run failed afterwards is not repeated.
 * Entries whose task was finished, deleted, archived or handed to someone else meanwhile are dropped unsent.
 * Admins can switch the digest off for everyone (setting `taskDigest` in `settings`, AdminSettings island); while it is
 * off, each run drops the pending entries, so switching it on again sends no backlog.
 */
import { Resend } from 'resend'
import 'dotenv/config'
import { globalConfig } from '../data/staticContent'
import { getTaskDigestEmailHTML, getTaskDigestSubject, type DigestProject } from '../templates/emails/taskDigestEmail'
import { memberPagePath } from './memberAuth'
import { database } from './members'
import { assertSent } from './resend'
import { berlinDay, berlinHour } from './tasks'
import { dropNotifications, pendingNotifications, projectsForDigest, recipients, type NotificationDoc } from './tasksStore'

export const DIGEST_HOUR = 19
const MAX_ATTEMPTS = 3
/** A claim older than this belongs to a run that died; the next run may take it over. */
const CLAIM_TIMEOUT_MS = 10 * 60 * 1000

interface DigestDoc {
  _id: string
  memberId: string
  day: string
  status: 'sending' | 'sent' | 'failed'
  attempts: number
  claimedAt: Date
  sentAt?: Date
  messageId?: string
  taskIds?: string[]
  error?: string
}

interface SettingDoc {
  _id: 'taskDigest'
  enabled: boolean
  updatedAt: Date
  updatedBy: string
}

const resend = new Resend(process.env.RESEND_API_KEY!)

async function settings() {
  return (await database()).collection<SettingDoc>('settings')
}

/** Whether the daily digest goes out; on until an admin switches it off. */
export async function digestEnabled(): Promise<boolean> {
  const setting = await (await settings()).findOne({ _id: 'taskDigest' })
  return setting?.enabled ?? true
}

export async function setDigestEnabled(enabled: boolean, actor: string): Promise<void> {
  await (await settings()).updateOne(
    { _id: 'taskDigest' },
    { $set: { enabled, updatedAt: new Date(), updatedBy: actor } },
    { upsert: true },
  )
}

async function digests() {
  return (await database()).collection<DigestDoc>('task_digests')
}

/** Takes the member's digest of `day` for this run; false when it was sent, is being sent or has used its attempts. */
async function claim(id: string, memberId: string, day: string, now: Date): Promise<boolean> {
  const collection = await digests()
  try {
    const claimed = await collection.findOneAndUpdate(
      {
        _id: id,
        status: { $ne: 'sent' },
        attempts: { $lt: MAX_ATTEMPTS },
        $or: [{ status: 'failed' }, { claimedAt: { $lt: new Date(now.getTime() - CLAIM_TIMEOUT_MS) } }],
      },
      { $set: { status: 'sending', claimedAt: now, memberId, day }, $inc: { attempts: 1 } },
      { upsert: true, returnDocument: 'after' },
    )
    return !!claimed
  } catch (err) {
    // The upsert collides with the existing document when the filter rejected it: not ours to send.
    if ((err as { code?: number }).code === 11000) return false
    throw err
  }
}

/** The member's entries that still hold, grouped by project, plus the ids of all entries looked at. */
async function digestContent(entries: NotificationDoc[], memberId: string, origin: string) {
  const projects = await projectsForDigest([...new Set(entries.map((entry) => entry.projectId))])
  const byId = new Map(projects.map((project) => [project._id, project]))
  const groups = new Map<string, DigestProject>()
  const taskIds: string[] = []
  for (const entry of entries) {
    const project = byId.get(entry.projectId)
    const task = project?.tasks.find((item) => item.id === entry.taskId)
    if (!project || project.archivedAt || !task || task.done || !task.assignees.includes(memberId)) continue
    const group = groups.get(project._id) ?? {
      title: project.title,
      url: new URL(`${memberPagePath('tasks', 'de')}#${project._id}`, origin).href,
      tasks: [],
    }
    group.tasks.push({ title: task.title, due: task.due })
    groups.set(project._id, group)
    taskIds.push(task.id)
  }
  return { projects: [...groups.values()], taskIds }
}

export interface DigestRun {
  skipped?: 'early' | 'disabled'
  sent: number
  failed: number
  dropped: number
}

/** Sends the digests due at `now`; `origin` is the site the links point to. */
export async function sendDigests(now: Date, origin: string): Promise<DigestRun> {
  if (berlinHour(now.getTime()) < DIGEST_HOUR) return { skipped: 'early', sent: 0, failed: 0, dropped: 0 }
  const pending = await pendingNotifications()
  if (!(await digestEnabled())) {
    await dropNotifications(pending.map((entry) => entry._id))
    return { skipped: 'disabled', sent: 0, failed: 0, dropped: pending.length }
  }
  const day = berlinDay(now.getTime())
  const byMember = new Map<string, NotificationDoc[]>()
  for (const entry of pending) byMember.set(entry.memberId, [...(byMember.get(entry.memberId) ?? []), entry])
  const people = await recipients([...byMember.keys()])
  const collection = await digests()
  const run: DigestRun = { sent: 0, failed: 0, dropped: 0 }

  for (const [memberId, entries] of byMember) {
    const entryIds = entries.map((entry) => entry._id)
    const person = people.get(memberId)
    if (!person) {
      await dropNotifications(entryIds)
      run.dropped += entries.length
      continue
    }
    const id = `${memberId}:${day}`
    if (!(await claim(id, memberId, day, now))) continue
    const { projects, taskIds } = await digestContent(entries, memberId, origin)
    if (!projects.length) {
      // Nothing left to tell: no mail, and the day stays free for assignments that come later.
      await Promise.all([dropNotifications(entryIds), collection.deleteOne({ _id: id })])
      run.dropped += entries.length
      continue
    }
    try {
      const result = assertSent(
        await resend.emails.send(
          {
            from: 'IGNITE Startup Club <mitglieder@info.ignite-startupclub.de>',
            to: person.email,
            replyTo: globalConfig.contactEmail,
            subject: getTaskDigestSubject(taskIds.length),
            html: getTaskDigestEmailHTML(
              person.name,
              projects,
              new URL(`${memberPagePath('tasks', 'de')}?ansicht=meine`, origin).href,
            ),
          },
          { idempotencyKey: `task-digest/${id}` },
        ),
      )
      await collection.updateOne(
        { _id: id },
        { $set: { status: 'sent', sentAt: new Date(), messageId: result?.id ?? '', taskIds }, $unset: { error: '' } },
      )
      await dropNotifications(entryIds)
      run.sent += 1
      run.dropped += entries.length - taskIds.length
    } catch (err) {
      // The entries stay, so a later run or the next day sends them.
      console.error(`Task digest ${id} failed:`, err)
      await collection.updateOne({ _id: id }, { $set: { status: 'failed', error: String(err).slice(0, 500) } })
      run.failed += 1
    }
  }
  return run
}
