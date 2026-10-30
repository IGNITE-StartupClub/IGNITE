export const prerender = false

import type { APIRoute } from 'astro'
import { isJsonRequest, memberHomePath, normalizeEmail, verifyPassword } from '../../../lib/memberAuth'
import {
  passwordPepper,
  recordLogin,
  releaseClientAttempt,
  reserveClientAttempt,
  reserveLoginAttempt,
} from '../../../lib/members'
import { reply, startSession } from '../../../lib/memberSession'

// One message for unknown address, wrong password and lock, so the form does not reveal who is a member.
const REJECTED = 'E-Mail-Adresse oder Passwort stimmt nicht, oder die Anmeldung ist nach mehreren Fehlversuchen kurz gesperrt.'

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  if (!isJsonRequest(request.headers.get('content-type'))) {
    return reply(415, { message: 'Erwartet JSON.' })
  }
  try {
    const { email: rawEmail, password, locale } = await request.json()
    const email = normalizeEmail(rawEmail)
    // The length cap keeps oversized input away from scrypt; real passwords are far shorter.
    if (!email || typeof password !== 'string' || password.length > 1024) {
      return reply(400, { message: 'Bitte E-Mail-Adresse und Passwort angeben.' })
    }

    // A client that failed too often gets the same answer as a wrong password, without a check.
    const clientAttempt = await reserveClientAttempt(clientAddress)
    if (!clientAttempt) {
      return reply(401, { message: REJECTED })
    }

    // Unknown address, no password yet and locked account all end in the same answer.
    const member = await reserveLoginAttempt(email)
    // Runs scrypt even without a member, so timing does not reveal one either.
    const correct = await verifyPassword(password, member?.passwordHash, passwordPepper())
    if (!member || !correct) {
      return reply(401, { message: REJECTED })
    }

    await Promise.all([recordLogin(email), releaseClientAttempt(clientAttempt)])
    await startSession(cookies, email)
    return reply(200, { redirect: memberHomePath(locale === 'en' ? 'en' : 'de') })
  } catch (err) {
    console.error('Member login failed:', err)
    return reply(500, { message: 'Fehler bei der Anmeldung' })
  }
}
