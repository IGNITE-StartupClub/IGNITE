/**
 * Mails of the members area: the one-time code to set a password (/api/members/code) and the invitation an admin
 * sends (/api/members/admin).
 */
import { Resend } from 'resend'
import 'dotenv/config'
import { assertSent } from './resend'
import { type MemberLocale, memberPagePath } from './memberAuth'
import { createCode, deleteCode } from './members'
import { globalConfig } from '../data/staticContent'
import { getMemberCodeEmailHTML, getMemberCodeSubject } from '../templates/emails/memberCodeEmail'
import { getMemberInviteEmailHTML, getMemberInviteSubject } from '../templates/emails/memberInviteEmail'

const resend = new Resend(process.env.RESEND_API_KEY!)

const send = async (to: string, subject: string, html: string) =>
  assertSent(
    await resend.emails.send({
      from: 'IGNITE Startup Club <mitglieder@info.ignite-startupclub.de>',
      to,
      replyTo: globalConfig.contactEmail,
      subject,
      html,
    }),
  )

export async function sendCode(email: string) {
  const code = await createCode(email)
  try {
    await send(email, getMemberCodeSubject(code), getMemberCodeEmailHTML(code))
  } catch (err) {
    // Without the mail the code is useless, and it would hold back a retry (rate limit).
    await deleteCode(email)
    throw err
  }
}

export async function sendInvite(email: string, locale: MemberLocale, requestOrigin: string) {
  // Production links always point to the configured site, never to the Host header of the request.
  const origin = import.meta.env.DEV ? requestOrigin : import.meta.env.SITE
  const url = new URL(memberPagePath('login', locale), origin)
  await send(email, getMemberInviteSubject(), getMemberInviteEmailHTML(url.href))
}
