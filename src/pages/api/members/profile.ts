export const prerender = false

import type { APIRoute } from 'astro'
import { isJsonRequest } from '../../../lib/memberAuth'
import { parseProfile } from '../../../lib/memberHome'
import { saveName, saveTeam } from '../../../lib/members'
import { reply } from '../../../lib/memberSession'
import { logError } from '../../../lib/errorLog'

/**
 * Saves what the team choice on the start page asks for. Body: { firstName, lastName, team }. The middleware has read
 * the session already (locals.member), so this route asks the database nothing more than the two writes.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  if (!isJsonRequest(request.headers.get('content-type'))) {
    return reply(415, { message: 'Erwartet JSON.' })
  }

  try {
    const { email } = locals.member!
    // Unparsable JSON is a malformed request like any other, not a server error.
    const profile = parseProfile(await request.json().catch(() => null))
    if (!profile) return reply(400, { code: 'invalid', message: 'Ungültige Anfrage.' })

    // Different fields of the same document, so neither write can undo the other.
    await Promise.all([saveName(email, profile.firstName, profile.lastName), saveTeam(email, profile.team)])
    return reply(200, { code: 'ok' })
  } catch (err) {
    await logError('Saving profile failed', err)
    return reply(500, { code: 'error', message: 'Fehler beim Speichern des Profils' })
  }
}
