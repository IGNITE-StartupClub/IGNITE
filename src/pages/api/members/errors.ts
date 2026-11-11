export const prerender = false

import type { APIRoute } from 'astro'
import { logError, setResolved } from '../../../lib/errorLog'
import { parseErrorAction } from '../../../lib/errorReport'
import { isJsonRequest } from '../../../lib/memberAuth'
import { currentMember, reply } from '../../../lib/memberSession'

/**
 * Marks a group of server errors done or open again, for admins (ErrorBoard island on the page "Systemzustand").
 * Body: { action: 'resolve' | 'reopen', key } with the groupKey. Answers { code, key, resolvedAt } (ISO or null); the
 * island derives the status from it.
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isJsonRequest(request.headers.get('content-type'))) {
    return reply(415, { message: 'Erwartet JSON.' })
  }
  try {
    const admin = await currentMember(cookies)
    if (admin?.role !== 'admin') {
      return reply(403, { code: 'forbidden', message: 'Nur für Admins.' })
    }
    let body: unknown = null
    try {
      body = await request.json()
    } catch {
      // Unparsable JSON ends as the invalid request below.
    }
    const change = parseErrorAction(body)
    if (!change) {
      return reply(400, { code: 'invalid', message: 'Ungültige Anfrage.' })
    }
    const resolvedAt = await setResolved(change.key, change.action === 'resolve', admin.email, new Date())
    return reply(200, { code: 'saved', key: change.key, resolvedAt: resolvedAt?.toISOString() ?? null })
  } catch (err) {
    await logError('Error status update failed', err)
    return reply(500, { code: 'error', message: 'Fehler beim Speichern' })
  }
}
