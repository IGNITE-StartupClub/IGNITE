export const prerender = false

import type { APIRoute } from 'astro'
import { isJsonRequest } from '../../../lib/memberAuth'
import { currentMember, reply } from '../../../lib/memberSession'
import { digestEnabled, setDigestEnabled } from '../../../lib/taskDigest'

/**
 * Settings of the members area for admins (AdminSettings island on the member management page).
 * Body: { taskDigest: boolean } switches the daily task digest on or off for everyone. Answers { code, settings }.
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
    let body: Record<string, unknown> = {}
    try {
      body = await request.json()
    } catch {
      // Unparsable JSON ends as the invalid request below.
    }
    if (typeof body.taskDigest !== 'boolean') {
      return reply(400, { code: 'invalid', message: 'Ungültige Anfrage.' })
    }
    await setDigestEnabled(body.taskDigest, admin.email)
    return reply(200, { code: 'saved', settings: { taskDigest: await digestEnabled() } })
  } catch (err) {
    console.error('Settings update failed:', err)
    return reply(500, { code: 'error', message: 'Fehler bei den Einstellungen' })
  }
}
