export const prerender = false

import type { APIRoute } from 'astro'
import { parseAlumni, parseAlumniPatch, type AlumniFields } from '../../../lib/contacts'
import { alumniRevision, alumniState, createAlumni, deleteAlumni, updateAlumni } from '../../../lib/contactsStore'
import { isJsonRequest } from '../../../lib/memberAuth'
import { currentMember, reply } from '../../../lib/memberSession'
import { logError } from '../../../lib/errorLog'

/** The island's regular check: the same revision comes back while nothing changed, otherwise the list. */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const revision = await alumniRevision()
    if (url.searchParams.get('revision') === revision) return reply(200, { revision })
    return reply(200, await alumniState(locals.member!))
  } catch (err) {
    await logError('Alumni read failed', err)
    return reply(500, { code: 'error', message: 'Fehler im Alumni-Netzwerk' })
  }
}

/**
 * The alumni network of the members area (AlumniDirectory island). Body: { action: 'save' | 'delete', id?, alumni? }.
 * Adding requires `alumni.consent === true` (parseAlumni): profiles only exist with the person's agreement. With an id,
 * `alumni` holds only the changed fields. Answers with { code, revision, alumni } so the island shows the current list.
 * Deleting is up to admins and the creator.
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
      const fields = id ? parseAlumniPatch(body.alumni) : parseAlumni(body.alumni)
      if (!fields) return invalid()
      code = 'saved'
      if (id) code = await updateAlumni(id, fields, member)
      else await createAlumni(fields as AlumniFields, member)
      if (code === 'invalid') return invalid()
    } else if (body.action === 'delete' && id) {
      code = await deleteAlumni(id, member)
    } else {
      return invalid()
    }
    const status = code === 'unknown' ? 404 : code === 'forbidden' ? 403 : 200
    return reply(status, { code, ...(await alumniState(member)) })
  } catch (err) {
    await logError('Alumni action failed', err)
    return reply(500, { code: 'error', message: 'Fehler im Alumni-Netzwerk' })
  }
}

const invalid = () => reply(400, { code: 'invalid', message: 'Ungültige Anfrage.' })
