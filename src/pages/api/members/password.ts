export const prerender = false

import type { APIRoute } from 'astro'
import { hashPassword, isJsonRequest, memberHomePath, passwordProblem } from '../../../lib/memberAuth'
import { consumePasswordToken, setPassword } from '../../../lib/members'
import { reply, startSession } from '../../../lib/memberSession'

// Redeems a password link from the invitation or reset mail: stores the new password, ends all other sessions and
// signs the member in. Only this POST uses up the link, so mail scanners that open it cannot.
export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isJsonRequest(request.headers.get('content-type'))) {
    return reply(415, { message: 'Erwartet JSON.' })
  }
  try {
    const { token, password, locale } = await request.json()
    // Checked before the link is used up, so a too short password does not cost the member their link.
    const problem = passwordProblem(password)
    if (problem) {
      return reply(400, { code: problem, message: 'Das Passwort erfüllt die Vorgaben nicht.' })
    }

    const email = typeof token === 'string' && token ? await consumePasswordToken(token) : null
    if (!email) {
      return reply(410, { code: 'link', message: 'Der Link ist abgelaufen oder wurde schon benutzt.' })
    }

    await setPassword(email, await hashPassword(password))
    await startSession(cookies, email)
    return reply(200, { redirect: memberHomePath(locale === 'en' ? 'en' : 'de') })
  } catch (err) {
    console.error('Setting member password failed:', err)
    return reply(500, { message: 'Fehler beim Speichern des Passworts' })
  }
}
