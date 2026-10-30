export const prerender = false

import type { APIRoute } from 'astro'
import { memberHomePath, memberLoginPath, SESSION_COOKIE, SESSION_TTL_SECONDS } from '../../../lib/memberAuth'
import { consumeLoginToken, createSession } from '../../../lib/members'

// Form post from the confirm button on the login page. Astro's checkOrigin rejects cross-site form posts.
export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData()
  const locale = form.get('locale') === 'en' ? 'en' : 'de'
  const token = form.get('token')

  const email = typeof token === 'string' && token ? await consumeLoginToken(token) : null
  if (!email) {
    return redirect(memberLoginPath(locale) + '?error=link', 303)
  }

  cookies.set(SESSION_COOKIE, await createSession(email), {
    httpOnly: true,
    secure: !import.meta.env.DEV,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
  return redirect(memberHomePath(locale), 303)
}
