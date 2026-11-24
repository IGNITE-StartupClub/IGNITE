export const prerender = false

import type { APIRoute } from 'astro'
import { feedbackTaskTitle, parseFeedbackAction } from '../../../lib/feedback'
import { feedbackForTask, linkFeedbackTask, sendFeedback, setFeedbackStatus } from '../../../lib/feedbackStore'
import { isJsonRequest } from '../../../lib/memberAuth'
import { reply } from '../../../lib/memberSession'
import { fitsItsKind, parseProject, parseTask } from '../../../lib/tasks'
import { createProject, sessionActor } from '../../../lib/tasksStore'
import { logError } from '../../../lib/errorLog'

const gone = () => reply(404, { code: 'unknown', message: 'Diesen Eintrag gibt es nicht mehr.' })

/**
 * Website feedback (rules in feedback.ts). Every member sends { action: 'send', kind, area, text, named } and gets 201,
 * or 429 once FEEDBACK_DAILY_LIMIT entries of the Berlin day are stored. Admins set { action: 'status', id, status } and
 * make a task of an entry with { action: 'task', id }, which answers its taskId. No mail goes out on a send, because a
 * mail would carry the time an anonymous entry leaves out. The middleware has read the session already (locals.member).
 */
export const POST: APIRoute = async ({ request, locals }) => {
  if (!isJsonRequest(request.headers.get('content-type'))) {
    return reply(415, { message: 'Erwartet JSON.' })
  }

  try {
    const member = locals.member!
    // Unparsable JSON is a malformed request like any other, not a server error.
    const body = parseFeedbackAction(await request.json().catch(() => null))
    if (!body) return reply(400, { code: 'invalid', message: 'Ungültige Anfrage.' })

    if (body.action === 'send') {
      return (await sendFeedback(member.id, body.feedback)) === 'sent'
        ? reply(201, { code: 'sent' })
        : reply(429, { code: 'limited', message: 'Für heute ist das Limit für Feedback erreicht. Ab morgen geht es wieder.' })
    }

    if (member.role !== 'admin') return reply(403, { code: 'forbidden', message: 'Nur für Admins.' })

    if (body.action === 'status') {
      return (await setFeedbackStatus(body.id, body.status)) ? reply(200, { code: 'ok' }) : gone()
    }

    const entry = await feedbackForTask(body.id)
    if (!entry) return gone()
    if (entry.taskId) return reply(200, { code: 'linked', taskId: entry.taskId })
    // A shared single task of the admin who clicks. It carries the text only, never the sender, because every member
    // sees the tasks.
    const actor = sessionActor(member)
    const title = feedbackTaskTitle(entry.text)
    const fields = parseProject({ title, description: entry.text, type: 'task', due: '', leads: [actor.id], team: member.team ?? '' })
    const task = parseTask({ title, description: entry.text, due: '', priority: 'normal', required: false, assignees: [actor.id] })
    if (!fields || !task || !fitsItsKind(fields, false)) throw new Error('Feedback entry gave no valid task')
    const created = await createProject(actor, { fields, status: 'planned', event: null, template: null, task })
    // Only own events can be duplicates, so this is a broken invariant, not a user error.
    if (created === 'duplicate') throw new Error('A single task counted as a duplicate')
    // When another admin linked a task in the same moment, the entry keeps theirs; this admin still gets the own one.
    await linkFeedbackTask(body.id, created.id)
    return reply(201, { code: 'created', taskId: created.id })
  } catch (err) {
    await logError('Website feedback request failed', err)
    return reply(500, { code: 'error', message: 'Fehler beim Speichern' })
  }
}
