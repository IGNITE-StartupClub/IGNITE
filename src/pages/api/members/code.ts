export const prerender = false

import type { APIRoute } from 'astro'
import { isJsonRequest, normalizeEmail } from '../../../lib/memberAuth'
import { countCodes, findMember } from '../../../lib/members'
import { sendCode } from '../../../lib/memberMail'
import { reply } from '../../../lib/memberSession'

// Resend's free plan allows 100 mails a day, shared with the application, contact and community mails.
const MAX_CODES_PER_HOUR = 30
const MAX_CODES_PER_ADDRESS_PER_HOUR = 5
const MIN_SECONDS_BETWEEN_CODES = 60

// Same answer whether or not the address is a member, so the form does not reveal who is one.
const accepted = () => reply(200, { message: 'Wenn die Adresse freigeschaltet ist, ist der Code unterwegs.' })

// "Forgot password" and "no password yet": mails a one-time code to set a new password (/api/members/password).
export const POST: APIRoute = async ({ request }) => {
  if (!isJsonRequest(request.headers.get('content-type'))) {
    return reply(415, { message: 'Erwartet JSON.' })
  }
  try {
    const { email: rawEmail } = await request.json()
    const email = normalizeEmail(rawEmail)
    if (!email) {
      return reply(400, { message: 'Ungültige E-Mail-Adresse.' })
    }

    const hourAgo = new Date(Date.now() - 3600 * 1000)
    if ((await countCodes(hourAgo)) >= MAX_CODES_PER_HOUR) {
      return reply(429, { message: 'Gerade werden zu viele Codes angefordert. Bitte versuche es später erneut.' })
    }
    if (!(await findMember(email))) {
      return accepted()
    }
    // A double click must not send a second mail, and a member's inbox must not be flooded. Together with
    // CODE_MAX_ATTEMPTS this also caps guessing at 25 entries per address and hour.
    if (
      (await countCodes(new Date(Date.now() - MIN_SECONDS_BETWEEN_CODES * 1000), email)) > 0 ||
      (await countCodes(hourAgo, email)) >= MAX_CODES_PER_ADDRESS_PER_HOUR
    ) {
      return accepted()
    }

    await sendCode(email)
    return accepted()
  } catch (err) {
    console.error('Member code failed:', err)
    return reply(500, { message: 'Fehler beim E-Mail-Versand' })
  }
}
