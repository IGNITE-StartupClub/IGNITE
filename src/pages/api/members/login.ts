export const prerender = false

import type { APIRoute } from 'astro'
import { Resend } from 'resend'
import 'dotenv/config'
import { assertSent } from '../../../lib/resend'
import { memberLoginPath, normalizeEmail } from '../../../lib/memberAuth'
import { countLoginTokens, createLoginToken, deleteLoginToken, isAllowed } from '../../../lib/members'
import { globalConfig } from '../../../data/staticContent'
import { getMemberLoginEmailHTML, getMemberLoginSubject } from '../../../templates/emails/memberLoginEmail'

const resend = new Resend(process.env.RESEND_API_KEY!)
// Resend's free plan allows 100 mails a day, shared with the application, contact and community mails.
const MAX_LINKS_PER_HOUR = 30
const MIN_SECONDS_BETWEEN_LINKS = 60

const reply = (status: number, message: string) =>
  new Response(JSON.stringify({ message }), { status, headers: { 'Content-Type': 'application/json' } })

// Same answer whether or not the address is on the allowlist, so the form does not reveal who is a member.
const accepted = () => reply(200, 'Wenn die Adresse freigeschaltet ist, ist der Login-Link unterwegs.')

export const POST: APIRoute = async ({ request, url }) => {
  try {
    const { email: rawEmail, locale } = await request.json()
    const email = normalizeEmail(rawEmail)
    if (!email) {
      return reply(400, 'Ungültige E-Mail-Adresse.')
    }

    if ((await countLoginTokens(new Date(Date.now() - 3600 * 1000))) >= MAX_LINKS_PER_HOUR) {
      return reply(429, 'Gerade werden zu viele Login-Links angefordert. Bitte versuche es später erneut.')
    }
    if (!(await isAllowed(email))) {
      return accepted()
    }
    // A double click or a reload must not send a second mail.
    if ((await countLoginTokens(new Date(Date.now() - MIN_SECONDS_BETWEEN_LINKS * 1000), email)) > 0) {
      return accepted()
    }

    const token = await createLoginToken(email)
    // Production links always point to the configured site, never to the Host header of the request.
    const origin = import.meta.env.DEV ? url.origin : import.meta.env.SITE
    const loginUrl = new URL(memberLoginPath(locale === 'en' ? 'en' : 'de'), origin)
    loginUrl.searchParams.set('token', token)

    try {
      assertSent(
        await resend.emails.send({
          from: 'IGNITE Startup Club <mitglieder@info.ignite-startupclub.de>',
          to: email,
          replyTo: globalConfig.contactEmail,
          subject: getMemberLoginSubject(),
          html: getMemberLoginEmailHTML(loginUrl.href),
        }),
      )
    } catch (err) {
      // Without the mail the entry would block a retry for a minute.
      await deleteLoginToken(token)
      throw err
    }

    return accepted()
  } catch (err) {
    console.error('Member login link failed:', err)
    return reply(500, 'Fehler beim E-Mail-Versand')
  }
}
