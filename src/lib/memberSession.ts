/**
 * Session cookie handling for the members API routes. The middleware only covers pages under /mitglieder and
 * /en/members, so endpoints that need the signed-in member resolve the cookie here.
 */
import type { AstroCookies } from 'astro'
import { SESSION_COOKIE, SESSION_TTL_SECONDS } from './memberAuth'
import { createSession, findSession } from './members'

export async function startSession(cookies: AstroCookies, email: string): Promise<void> {
  cookies.set(SESSION_COOKIE, await createSession(email), {
    httpOnly: true,
    secure: !import.meta.env.DEV,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
}

export async function currentMember(cookies: AstroCookies) {
  const token = cookies.get(SESSION_COOKIE)?.value
  return token ? findSession(token) : null
}

/** JSON response with a fixed German message, like the other API routes. */
export const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
