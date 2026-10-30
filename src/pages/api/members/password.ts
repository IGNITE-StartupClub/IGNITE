export const prerender = false

import type { APIRoute } from 'astro'
import { hashPassword, isJsonRequest, memberHomePath, normalizeCode, normalizeEmail, passwordProblem } from '../../../lib/memberAuth'
import { passwordPepper, redeemCode, setPassword } from '../../../lib/members'
import { reply, startSession } from '../../../lib/memberSession'

// Sets a password with the code from /api/members/code: stores the new password, ends all other sessions and signs
// the member in. Unknown address, wrong, used up and expired code all get the same answer.
export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isJsonRequest(request.headers.get('content-type'))) {
    return reply(415, { message: 'Erwartet JSON.' })
  }
  try {
    const { email: rawEmail, code: rawCode, password, locale } = await request.json()
    const email = normalizeEmail(rawEmail)
    const code = normalizeCode(rawCode)
    if (!email || !code) {
      return reply(400, { code: 'code', message: 'Der Code stimmt nicht oder ist abgelaufen.' })
    }
    // Checked before the code is used up, so a too short password does not cost the member their code.
    const problem = passwordProblem(password)
    if (problem) {
      return reply(400, { code: problem, message: 'Das Passwort erfüllt die Vorgaben nicht.' })
    }

    if (!(await redeemCode(email, code))) {
      return reply(400, { code: 'code', message: 'Der Code stimmt nicht oder ist abgelaufen.' })
    }

    await setPassword(email, await hashPassword(password, passwordPepper()))
    await startSession(cookies, email)
    return reply(200, { redirect: memberHomePath(locale === 'en' ? 'en' : 'de') })
  } catch (err) {
    console.error('Setting member password failed:', err)
    return reply(500, { message: 'Fehler beim Speichern des Passworts' })
  }
}
