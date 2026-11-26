/**
 * Mongo access of the website feedback (rules in feedback.ts). Collections:
 * - `feedback`: one document per entry (FeedbackEntry), removed by a TTL index twelve months after its day. Anonymous
 *   entries carry no member id, and no entry carries a time finer than its Berlin day.
 * - `feedback_quota`: one counter per member and Berlin day under a keyed id (feedbackQuotaId), removed after the day.
 *   It points to no entry, so it does not tell which entries a member sent.
 * Not revision-polled like tasks or the Netzwerk, so status changes need no `updatedAt`.
 */
import { randomUUID } from 'node:crypto'
import type { ObjectId } from 'mongodb'
import {
  FEEDBACK_DAILY_LIMIT,
  feedbackDay,
  feedbackEntry,
  quotaExpiry,
  type FeedbackArea,
  type FeedbackEntry,
  type FeedbackInput,
  type FeedbackKind,
  type FeedbackStatus,
} from './feedback'
import { feedbackKey, feedbackQuotaId } from './memberAuth'
import { database, displayName, setUpInBackground, type Member } from './members'

interface Quota {
  _id: string
  count: number
  expiresAt: Date
}

let indexed = false

async function collections() {
  const db = await database()
  const entries = db.collection<FeedbackEntry>('feedback')
  const quota = db.collection<Quota>('feedback_quota')
  if (!indexed) {
    indexed = true
    setUpInBackground('feedback', () =>
      Promise.all([
        entries.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
        // removeMember unlinks the named entries of a removed member.
        entries.createIndex({ memberId: 1 }, { sparse: true }),
        quota.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      ]),
    )
  }
  return { entries, quota }
}

let key: Buffer | null = null
const quotaKey = () => (key ??= feedbackKey(process.env.ENCRYPTION_SECRET!))

/** Stores an entry, or answers 'limited' once the member has sent FEEDBACK_DAILY_LIMIT entries this Berlin day. */
export async function sendFeedback(memberId: string, input: FeedbackInput): Promise<'sent' | 'limited'> {
  const { entries, quota } = await collections()
  const day = feedbackDay(Date.now())
  // Counted before the insert and atomically, so parallel sends cannot pass the limit together.
  const counter = await quota.findOneAndUpdate(
    { _id: feedbackQuotaId(memberId, day, quotaKey()) },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: quotaExpiry(day) } },
    { upsert: true, returnDocument: 'after' },
  )
  if (!counter || counter.count > FEEDBACK_DAILY_LIMIT) return 'limited'
  await entries.insertOne(feedbackEntry(input, memberId, day, randomUUID()))
  return 'sent'
}

/** One entry as the admin page shows it. */
export interface FeedbackRow {
  id: string
  kind: FeedbackKind
  area: FeedbackArea
  text: string
  day: string
  status: FeedbackStatus
  /** The sender of a named entry, null for anonymous ones and for members removed since. */
  author: { name: string; email: string } | null
  taskId: string | null
}

/**
 * Every entry, newest day first. Inside a day the random id decides, so the list does not reveal the order in which
 * entries arrived. One aggregation brings the senders of named entries.
 */
export async function feedbackList(): Promise<FeedbackRow[]> {
  const { entries } = await collections()
  const rows = await entries
    .aggregate<FeedbackEntry & { author: (Pick<Member, 'email' | 'firstName' | 'lastName' | 'signature'> & { _id: ObjectId })[] }>([
      { $sort: { day: -1, _id: 1 } },
      // Missing on anonymous entries, which $toObjectId turns into null, and null matches no member id.
      { $addFields: { memberObjectId: { $toObjectId: '$memberId' } } },
      { $lookup: { from: 'members', localField: 'memberObjectId', foreignField: '_id', as: 'author' } },
      {
        $project: {
          kind: 1,
          area: 1,
          text: 1,
          day: 1,
          status: 1,
          taskId: 1,
          author: { email: 1, firstName: 1, lastName: 1, signature: 1 },
        },
      },
    ])
    .toArray()
  return rows.map(({ _id, kind, area, text, day, status, taskId, author }) => ({
    id: _id,
    kind,
    area,
    text,
    day,
    status,
    author: author[0] ? { name: displayName(author[0]), email: author[0].email } : null,
    taskId: taskId ?? null,
  }))
}

/** Sets the status of an entry; false when it is gone. */
export async function setFeedbackStatus(id: string, status: FeedbackStatus): Promise<boolean> {
  const { entries } = await collections()
  const { matchedCount } = await entries.updateOne({ _id: id }, { $set: { status } })
  return matchedCount === 1
}

/** Text and task link of an entry, for "Als Aufgabe anlegen"; null when it is gone. */
export async function feedbackForTask(id: string): Promise<Pick<FeedbackEntry, 'text' | 'taskId'> | null> {
  const { entries } = await collections()
  return entries.findOne({ _id: id }, { projection: { _id: 0, text: 1, taskId: 1 } })
}

/** Links the task an admin made from an entry; false when the entry is gone or another admin linked one meanwhile. */
export async function linkFeedbackTask(id: string, taskId: string): Promise<boolean> {
  const { entries } = await collections()
  const { matchedCount } = await entries.updateOne({ _id: id, taskId: { $exists: false } }, { $set: { taskId } })
  return matchedCount === 1
}
