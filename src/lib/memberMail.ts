/**
 * Mails of the members area: the one-time code to set a password (/api/members/code) and the invitation an admin
 * sends (/api/members/admin).
 */
import { Resend } from 'resend'
import 'dotenv/config'
import { assertSent } from './resend'
import { type MemberLocale, memberPagePath } from './memberAuth'
import { LIVE_ORIGIN, photoPath, signatureHtml } from './emailSignature'
import { createCode, deleteCode, findMember, photoIdOf } from './members'
import { globalConfig, memberArea } from '../data/staticContent'
import { INSTAGRAM_URL, LINKEDIN_URL } from '../templates/emails/links'
import { getMemberCodeEmailHTML, getMemberCodeSubject } from '../templates/emails/memberCodeEmail'
import { getMemberInviteEmailHTML, getMemberInviteSubject, type Inviter } from '../templates/emails/memberInviteEmail'

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

/** Mails a new code unless a rate limit forbids it (see createCode); false when nothing was sent. */
export async function sendCode(email: string, maxPerHour: number, maxPerAddressPerHour: number): Promise<boolean> {
  const reservation = await createCode(email, maxPerHour, maxPerAddressPerHour)
  if (reservation === 'limited') return false
  try {
    await send(email, getMemberCodeSubject(reservation.code), getMemberCodeEmailHTML(reservation.code))
    return true
  } catch (err) {
    // Without the mail the code is useless, and it would hold back a retry (rate limit).
    await deleteCode(reservation.id)
    throw err
  }
}

const SIGNATURE_LINKS = [
  { platform: 'Instagram', url: INSTAGRAM_URL },
  { platform: 'LinkedIn', url: LINKEDIN_URL },
]

/** The signed-in admin who sends the invitation, with the signature they stored on the signature page. */
async function inviter(email: string): Promise<Inviter> {
  const [admin, photoId] = await Promise.all([findMember(email), photoIdOf(email)])
  const signature = admin?.signature
  if (!signature) return { label: email, signatureHtml: null }
  const fields = { ...signature, photo: photoId ? photoPath(photoId) : '' }
  return { label: signature.name, signatureHtml: signatureHtml(fields, memberArea.signature.generator.signature, SIGNATURE_LINKS, LIVE_ORIGIN) }
}

export async function sendInvite(email: string, locale: MemberLocale, requestOrigin: string, inviterEmail: string) {
  // Production links always point to the configured site, never to the Host header of the request.
  const origin = import.meta.env.DEV ? requestOrigin : import.meta.env.SITE
  const url = new URL(memberPagePath('login', locale), origin)
  await send(email, getMemberInviteSubject(), getMemberInviteEmailHTML(url.href, await inviter(inviterEmail)))
}
