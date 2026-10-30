export const prerender = false

import type { APIRoute } from 'astro'
import { isJsonRequest, normalizeEmail } from '../../../lib/memberAuth'
import { countPasswordTokens, findMember } from '../../../lib/members'
import { sendPasswordLink } from '../../../lib/memberMail'
import { reply } from '../../../lib/memberSession'

// Resend's free plan allows 100 mails a day, shared with the application, contact and community mails.
const MAX_LINKS_PER_HOUR = 30
const MIN_SECONDS_BETWEEN_LINKS = 60

// Same answer whether or not the address is a member, so the form does not reveal who is one.
const accepted = () => reply(200, { message: 'Wenn die Adresse freigeschaltet ist, ist der Link unterwegs.' })

// "Forgot password" and "no password yet": mails a one-time link to set a new password.
export const POST: APIRoute = async ({ request, url }) => {
  if (!isJsonRequest(request.headers.get('content-type'))) {
    return reply(415, { message: 'Erwartet JSON.' })
  }
  try {
    const { email: rawEmail, locale } = await request.json()
    const email = normalizeEmail(rawEmail)
    if (!email) {
      return reply(400, { message: 'Ungültige E-Mail-Adresse.' })
    }

    if ((await countPasswordTokens(new Date(Date.now() - 3600 * 1000))) >= MAX_LINKS_PER_HOUR) {
      return reply(429, { message: 'Gerade werden zu viele Links angefordert. Bitte versuche es später erneut.' })
    }
    if (!(await findMember(email))) {
      return accepted()
    }
    // A double click or a reload must not send a second mail.
    if ((await countPasswordTokens(new Date(Date.now() - MIN_SECONDS_BETWEEN_LINKS * 1000), email)) > 0) {
      return accepted()
    }

    await sendPasswordLink(email, 'reset', locale === 'en' ? 'en' : 'de', url.origin)
    return accepted()
  } catch (err) {
    console.error('Member password link failed:', err)
    return reply(500, { message: 'Fehler beim E-Mail-Versand' })
  }
}
