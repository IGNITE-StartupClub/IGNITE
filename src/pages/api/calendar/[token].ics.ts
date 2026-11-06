export const prerender = false

import type { APIRoute } from 'astro'
import { calendarFeed } from '../../../lib/calendarFeed'
import { calendarFeedMember } from '../../../lib/connectionsStore'
import { memberPagePath } from '../../../lib/memberAuth'
import { openTasks } from '../../../lib/memberHome'
import { loadTaskEvents } from '../../../lib/taskEvents'
import { berlinDay } from '../../../lib/tasks'
import { assignedProjects, taskActor } from '../../../lib/tasksStore'

const text = (status: number, body: string, headers: Record<string, string> = {}) =>
  new Response(body, {
    status,
    headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'private, no-store', ...headers },
  })

/**
 * A member's calendar subscription: the club's events and their own open tasks with a deadline. Calendar apps cannot
 * sign in, so the secret token in the address is the access right, stored only as a hash (connectionsStore.ts).
 */
export const GET: APIRoute = async ({ params, url }) => {
  try {
    const member = await calendarFeedMember(params.token ?? '')
    const actor = member && (await taskActor(member))
    if (!actor) return text(404, 'Not found')

    const [{ events, complete }, projects] = await Promise.all([loadTaskEvents('de'), assignedProjects(actor)])
    // A feed without the Luma events would delete them from the subscribed calendar until the next refresh.
    if (!complete) return text(503, 'Events are unavailable', { 'Retry-After': '900' })

    // Private tasks stay out: subscribed calendars copy their entries to the member's calendar provider.
    const tasks = openTasks(projects, actor.id, berlinDay(Date.now()), [])
      .filter((task) => task.due)
      .map((task) => ({ ...task, url: `${url.origin}${memberPagePath('tasks', 'de')}#${task.projectId}` }))
    return new Response(calendarFeed(events, tasks, new Date()), {
      headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'private, no-store' },
    })
  } catch (err) {
    console.error('Calendar feed failed:', err)
    return text(500, 'Calendar feed failed')
  }
}
