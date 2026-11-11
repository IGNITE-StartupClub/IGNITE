export const prerender = false

import type { APIRoute } from 'astro'
import { isJsonRequest } from '../../../lib/memberAuth'
import { currentMember, reply } from '../../../lib/memberSession'
import { logError } from '../../../lib/errorLog'
import { saveErrorMails } from '../../../lib/members'
import { parsePersonalChange, parseSettingsChange } from '../../../lib/settings'
import { allSettings, saveSettings } from '../../../lib/settingsStore'

/**
 * Settings of the members area for admins. Body: the switches to flip (settings.ts), e.g. { connections: true }, each
 * for everyone (AdminSettings island on the member management page), answered with { code, settings }; or the admin's
 * own ones, e.g. { errorMails: true } (ErrorBoard island on the page "Systemzustand"), answered with { code, personal }.
 * One request never mixes both.
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
    const personal = parsePersonalChange(body)
    if (personal) {
      const errorMails = personal.errorMails!
      await saveErrorMails(admin.email, errorMails)
      return reply(200, { code: 'saved', personal: { errorMails } })
    }
    const change = parseSettingsChange(body)
    if (!change) {
      return reply(400, { code: 'invalid', message: 'Ungültige Anfrage.' })
    }
    await saveSettings(change, admin.email)
    return reply(200, { code: 'saved', settings: await allSettings() })
  } catch (err) {
    await logError('Settings update failed', err)
    return reply(500, { code: 'error', message: 'Fehler bei den Einstellungen' })
  }
}
