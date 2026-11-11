export const prerender = false

import type { APIRoute } from 'astro'
import { isJsonRequest } from '../../../lib/memberAuth'
import { currentMember, reply } from '../../../lib/memberSession'
import { saveStorageFolders, storageFolders } from '../../../lib/settingsStore'
import { parseStorageFolders } from '../../../lib/storageFolders'
import { logError } from '../../../lib/errorLog'

/**
 * The SharePoint links of the Ablage page, kept by admins (StorageSettings island on the member management page).
 * Body: the whole set (storageFolders.ts). Answers { code, folders } with what is stored.
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
    const folders = parseStorageFolders(body)
    if (!folders) {
      return reply(400, { code: 'invalid', message: 'Ungültige Anfrage.' })
    }
    await saveStorageFolders(folders, admin.email)
    return reply(200, { code: 'saved', folders: await storageFolders() })
  } catch (err) {
    await logError('Storage folders update failed', err)
    return reply(500, { code: 'error', message: 'Fehler beim Speichern der Ablage' })
  }
}
