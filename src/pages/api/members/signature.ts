export const prerender = false

import type { APIRoute } from 'astro'
import { parseSignature } from '../../../lib/emailSignature'
import { isJsonRequest } from '../../../lib/memberAuth'
import { saveSignature } from '../../../lib/members'
import { currentMember, reply } from '../../../lib/memberSession'

/**
 * Stores the signed-in admin's signature (SignatureGenerator, on copy), which then closes the invitations they send.
 * Body: { name, role, email, phone }. Only admins: members send no invitations, so their data is not kept.
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isJsonRequest(request.headers.get('content-type'))) {
    return reply(415, { message: 'Erwartet JSON.' })
  }
  try {
    const member = await currentMember(cookies)
    if (member?.role !== 'admin') {
      return reply(403, { code: 'forbidden', message: 'Nur für Admins.' })
    }
    let signature = null
    try {
      signature = parseSignature(await request.json())
    } catch {
      // Unparsable JSON is the same invalid request as missing or overlong fields.
    }
    if (!signature) {
      return reply(400, { code: 'invalid', message: 'Die Signatur ist unvollständig.' })
    }
    await saveSignature(member.email, signature)
    return reply(200, {})
  } catch (err) {
    console.error('Saving signature failed:', err)
    return reply(500, { message: 'Fehler beim Speichern der Signatur' })
  }
}
