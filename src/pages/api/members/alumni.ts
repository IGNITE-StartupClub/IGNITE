export const prerender = false

import type { APIRoute } from 'astro'
import { parseAlumni } from '../../../lib/contacts'
import { alumniSummaries, deleteAlumni, saveAlumni } from '../../../lib/contactsStore'
import { isJsonRequest } from '../../../lib/memberAuth'
import { currentMember, reply } from '../../../lib/memberSession'

/**
 * The alumni network of the members area (AlumniDirectory island). Body: { action: 'save' | 'delete', id?, alumni? }.
 * Saving requires `alumni.consent === true` (parseAlumni): profiles only exist with the person's agreement.
 * Answers with { code, alumni } so the island shows the current list. Deleting is up to admins and the creator.
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isJsonRequest(request.headers.get('content-type'))) {
    return reply(415, { message: 'Erwartet JSON.' })
  }
  try {
    const member = await currentMember(cookies)
    if (!member) {
      return reply(401, { code: 'session', message: 'Nicht angemeldet.' })
    }
    let body: Record<string, unknown> = {}
    try {
      body = await request.json()
    } catch {
      // Unparsable JSON ends as the invalid request below.
    }
    const id = typeof body.id === 'string' && body.id ? body.id : null

    let code: string
    if (body.action === 'save') {
      const fields = parseAlumni(body.alumni)
      if (!fields) return reply(400, { code: 'invalid', message: 'Ungültige Anfrage.' })
      code = (await saveAlumni(id, fields, member)) ? 'saved' : 'unknown'
    } else if (body.action === 'delete' && id) {
      code = await deleteAlumni(id, member)
    } else {
      return reply(400, { code: 'invalid', message: 'Ungültige Anfrage.' })
    }
    const status = code === 'unknown' ? 404 : code === 'forbidden' ? 403 : 200
    return reply(status, { code, alumni: await alumniSummaries(member) })
  } catch (err) {
    console.error('Alumni action failed:', err)
    return reply(500, { code: 'error', message: 'Fehler im Alumni-Netzwerk' })
  }
}
