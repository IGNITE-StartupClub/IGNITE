export const prerender = false

import type { APIRoute } from 'astro'
import { isJsonRequest } from '../../../lib/memberAuth'
import { parseProfile } from '../../../lib/memberHome'
import { saveName, saveTeam } from '../../../lib/members'
import { currentMember, reply } from '../../../lib/memberSession'

/** Saves what the team choice on the start page asks for. Body: { firstName, lastName, team }. */
export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isJsonRequest(request.headers.get('content-type'))) {
    return reply(415, { message: 'Erwartet JSON.' })
  }

  try {
    const member = await currentMember(cookies)
    if (!member) return reply(401, { code: 'session', message: 'Nicht angemeldet.' })

    const profile = parseProfile(await request.json())
    if (!profile) return reply(400, { code: 'invalid', message: 'Ungültige Anfrage.' })

    await saveName(member.email, profile.firstName, profile.lastName)
    await saveTeam(member.email, profile.team)
    return reply(200, { code: 'ok' })
  } catch (err) {
    console.error('Fehler beim Speichern des Profils:', err)
    return reply(500, { code: 'error', message: 'Fehler beim Speichern des Profils' })
  }
}
