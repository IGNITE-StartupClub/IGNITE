export const prerender = false

import type { APIRoute } from 'astro'
import { isJsonRequest, isMemberRole, normalizeEmail } from '../../../lib/memberAuth'
import { addMember, findMember, isOwner, listMembers, logAdminAction, memberSummary, removeMember, setRole } from '../../../lib/members'
import { sendInvite } from '../../../lib/memberMail'
import { currentMember, reply } from '../../../lib/memberSession'

const ACTIONS = ['add', 'remove', 'role', 'invite'] as const
type Action = (typeof ACTIONS)[number]

/**
 * Member management for admins (MemberAdmin island). Body: { action, email, role?, locale }.
 * Answers with { code, members } so the island can show the current list; `code` names the outcome.
 * Admins cannot remove themselves or change their own role, so at least one admin always remains. Nobody can demote or
 * remove an owner (isOwner).
 */
export const POST: APIRoute = async ({ request, cookies, url }) => {
  if (!isJsonRequest(request.headers.get('content-type'))) {
    return reply(415, { message: 'Erwartet JSON.' })
  }
  try {
    const admin = await currentMember(cookies)
    if (admin?.role !== 'admin') {
      return reply(403, { code: 'forbidden', message: 'Nur für Admins.' })
    }

    const { action, email: rawEmail, role, locale } = await request.json()
    const email = normalizeEmail(rawEmail)
    if (!ACTIONS.includes(action) || !email || (['add', 'role'].includes(action) && !isMemberRole(role))) {
      return reply(400, { code: 'invalid', message: 'Ungültige Anfrage.' })
    }
    if (['remove', 'role'].includes(action) && email === admin.email) {
      return reply(409, { code: 'self', message: 'Die eigene Rolle und das eigene Konto lassen sich nicht ändern.' })
    }
    if (['remove', 'role'].includes(action) && isOwner(email)) {
      return reply(409, { code: 'owner', message: 'Hauptadmins lassen sich nicht ändern oder entfernen.' })
    }

    const code = await perform(action as Action, email, role, admin.email, locale === 'en' ? 'en' : 'de', url.origin)
    const members = (await listMembers()).map(memberSummary)
    return reply(code === 'unknown' || code === 'exists' ? 409 : 200, { code, members })
  } catch (err) {
    console.error('Member admin action failed:', err)
    return reply(500, { code: 'error', message: 'Fehler in der Mitgliederverwaltung' })
  }
}

async function perform(action: Action, email: string, role: unknown, actor: string, locale: 'de' | 'en', origin: string) {
  if (action === 'add') {
    if (!(await addMember(email, role as 'member' | 'admin'))) return 'exists'
    await logAdminAction({ actor, action, email, role: role as 'member' | 'admin' })
    return (await invite(email, actor, locale, origin)) ? 'added' : 'addedMailFailed'
  }
  if (!(await findMember(email))) return 'unknown'
  if (action === 'invite') {
    await logAdminAction({ actor, action, email })
    return (await invite(email, actor, locale, origin)) ? 'invited' : 'mailFailed'
  }
  if (action === 'role') {
    await setRole(email, role as 'member' | 'admin')
    await logAdminAction({ actor, action, email, role: role as 'member' | 'admin' })
    return 'roleChanged'
  }
  await removeMember(email)
  await logAdminAction({ actor, action, email })
  return 'removed'
}

/**
 * Sends the invitation in the name of `actor`, the signed-in admin. False when the mail could not be sent; the member
 * stays added and the admin can send the invitation again.
 */
async function invite(email: string, actor: string, locale: 'de' | 'en', origin: string): Promise<boolean> {
  try {
    await sendInvite(email, locale, origin, actor)
    return true
  } catch (err) {
    console.error('Member invitation mail failed:', err)
    return false
  }
}
