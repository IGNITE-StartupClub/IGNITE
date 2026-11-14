export const prerender = false

import type { APIRoute } from 'astro'
import { isFormRequest, memberPagePath, SESSION_COOKIE } from '../../../lib/memberAuth'
import { deleteSession } from '../../../lib/members'

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  // The header's form names the locale of its page. Any other post, from a script for example, ends the session too and
  // lands on the German login page: formData() would throw before the session ends.
  const form = isFormRequest(request.headers.get('content-type')) ? await request.formData() : null
  const token = cookies.get(SESSION_COOKIE)?.value
  if (token) {
    await deleteSession(token)
  }
  cookies.delete(SESSION_COOKIE, { path: '/' })
  return redirect(memberPagePath('login', form?.get('locale') === 'en' ? 'en' : 'de'), 303)
}
