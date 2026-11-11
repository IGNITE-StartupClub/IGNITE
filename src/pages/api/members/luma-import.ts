export const prerender = false

import type { APIRoute } from 'astro'
import { lumaEventFromUrl } from '../../../lib/luma'
import { parseLumaUrl } from '../../../lib/lumaLink'
import { isJsonRequest } from '../../../lib/memberAuth'
import { reply } from '../../../lib/memberSession'
import { loadTaskEvents } from '../../../lib/taskEvents'
import { projectOfLumaEvent } from '../../../lib/tasksStore'
import { logError } from '../../../lib/errorLog'

/**
 * Reads a Luma event by its link for the form of own events (CreateDialog in the tasks module), public or private.
 * Every member may create events, so every member may import; the middleware lets no one without a session in.
 * Body: { url }. Answers { code: 'ok', event } with an ImportedEvent, plus `existing` ({ id, title }) when an own event
 * was imported from it already and `listed` ({ id, title }) when it is in the IGNITE calendar and so needs a planning
 * instead. Saving goes through /api/members/tasks, which takes an own event only with the Luma event it came from.
 * One Luma request per click, never per keystroke: each is a function invocation (see "Vercel budget" in CLAUDE.md).
 */
export const POST: APIRoute = async ({ request }) => {
  if (!isJsonRequest(request.headers.get('content-type'))) {
    return reply(415, { message: 'Erwartet JSON.' })
  }
  // Unparsable JSON ends as a refused link below.
  const body: unknown = await request.json().catch(() => null)
  const link = parseLumaUrl((body as { url?: unknown } | null)?.url)
  if (!link) return reply(400, { code: 'invalid', message: 'Das ist kein Luma-Link. Er beginnt mit luma.com/ oder lu.ma/.' })
  try {
    const event = await lumaEventFromUrl(link.slug)
    if (event === 'missing') {
      return reply(404, { code: 'missing', message: 'Unter diesem Link gibt es kein Luma-Event.' })
    }
    const [existing, { events }] = await Promise.all([projectOfLumaEvent(event.lumaEventId), loadTaskEvents('de')])
    const listed = events.find((entry) => entry.id === event.lumaEventId)
    return reply(200, {
      code: 'ok',
      event,
      ...(existing && { existing }),
      ...(listed && { listed: { id: listed.id, title: listed.title } }),
    })
  } catch (err) {
    await logError('Luma import failed', err)
    return reply(502, { code: 'error', message: 'Luma hat nicht geantwortet. Bitte versuch es gleich noch einmal.' })
  }
}
