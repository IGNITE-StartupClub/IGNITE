export const prerender = false

import type { APIRoute } from 'astro'
import { authResponseUrl, parseAuthRequest } from '../../../lib/connections'
import {
  calendarFeedSince,
  clientKey,
  connectionList,
  createAuthCode,
  removeCalendarFeed,
  removeConnection,
  renewCalendarFeed,
} from '../../../lib/connectionsStore'
import { isJsonRequest } from '../../../lib/memberAuth'
import { currentMember, reply } from '../../../lib/memberSession'

const state = async (email: string) => ({
  connections: await connectionList(email),
  calendarSince: await calendarFeedSince(email),
})

/**
 * Apps and calendar link of the signed-in member. Body: { action, … } with action 'approve' or 'deny' (query, the
 * authorization request of the consent page; answers { redirect }), 'disconnect' (id), 'calendar' (a new link, the only
 * moment its address is known; answers { feedUrl, …state }) or 'calendarOff'.
 */
export const POST: APIRoute = async ({ request, cookies, url }) => {
  if (!isJsonRequest(request.headers.get('content-type'))) {
    return reply(415, { message: 'Erwartet JSON.' })
  }
  try {
    const member = await currentMember(cookies)
    if (!member) return reply(401, { code: 'session', message: 'Nicht angemeldet.' })
    if (!member.mayConnect) return reply(403, { code: 'forbidden', message: 'Nicht freigeschaltet.' })
    let body: Record<string, unknown> = {}
    try {
      body = await request.json()
    } catch {
      // Unparsable JSON ends as the invalid request below.
    }

    switch (body.action) {
      case 'approve':
      case 'deny': {
        const params = new URLSearchParams(typeof body.query === 'string' ? body.query : '')
        const authRequest = parseAuthRequest(params, clientKey(), url.origin)
        if (!authRequest) return invalid()
        const result =
          body.action === 'approve'
            ? { code: await createAuthCode(member.email, authRequest) }
            : { error: 'access_denied' }
        return reply(200, { redirect: authResponseUrl(authRequest, url.origin, result) })
      }
      case 'disconnect':
        if (typeof body.id !== 'string') return invalid()
        await removeConnection(member.email, body.id)
        return reply(200, await state(member.email))
      case 'calendar': {
        const token = await renewCalendarFeed(member.email)
        return reply(200, { feedUrl: `${url.origin}/api/calendar/${token}.ics`, ...(await state(member.email)) })
      }
      case 'calendarOff':
        await removeCalendarFeed(member.email)
        return reply(200, await state(member.email))
      default:
        return invalid()
    }
  } catch (err) {
    console.error('Member connections request failed:', err)
    return reply(500, { message: 'Fehler beim Speichern' })
  }
}

const invalid = () => reply(400, { code: 'invalid', message: 'Ungültige Anfrage.' })
