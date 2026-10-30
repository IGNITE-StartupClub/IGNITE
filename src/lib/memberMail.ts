/**
 * Sends the one-time link to set a members area password (invitation or reset). Shared by
 * /api/members/password-link and /api/members/admin.
 */
import { Resend } from 'resend'
import 'dotenv/config'
import { assertSent } from './resend'
import { INVITE_TTL_SECONDS, type MemberLocale, memberPagePath, PASSWORD_LINK_TTL_SECONDS } from './memberAuth'
import { createPasswordToken, deletePasswordToken } from './members'
import { globalConfig } from '../data/staticContent'
import {
  getMemberPasswordEmailHTML,
  getMemberPasswordSubject,
  type MemberPasswordMailKind,
} from '../templates/emails/memberPasswordEmail'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function sendPasswordLink(email: string, kind: MemberPasswordMailKind, locale: MemberLocale, requestOrigin: string) {
  const token = await createPasswordToken(email, kind === 'invite' ? INVITE_TTL_SECONDS : PASSWORD_LINK_TTL_SECONDS)
  // Production links always point to the configured site, never to the Host header of the request.
  const origin = import.meta.env.DEV ? requestOrigin : import.meta.env.SITE
  const url = new URL(memberPagePath('password', locale), origin)
  url.searchParams.set('token', token)

  try {
    assertSent(
      await resend.emails.send({
        from: 'IGNITE Startup Club <mitglieder@info.ignite-startupclub.de>',
        to: email,
        replyTo: globalConfig.contactEmail,
        subject: getMemberPasswordSubject(kind),
        html: getMemberPasswordEmailHTML(kind, url.href),
      }),
    )
  } catch (err) {
    // Without the mail the link is useless, and it would hold back a retry (rate limit).
    await deletePasswordToken(token)
    throw err
  }
}
