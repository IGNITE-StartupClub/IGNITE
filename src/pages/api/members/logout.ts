export const prerender = false

import type { APIRoute } from 'astro'
import { memberLoginPath, SESSION_COOKIE } from '../../../lib/memberAuth'
import { deleteSession } from '../../../lib/members'

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData()
  const token = cookies.get(SESSION_COOKIE)?.value
  if (token) {
    await deleteSession(token)
  }
  cookies.delete(SESSION_COOKIE, { path: '/' })
  return redirect(memberLoginPath(form.get('locale') === 'en' ? 'en' : 'de'), 303)
}
