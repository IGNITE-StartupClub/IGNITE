/**
 * Guards the members area (/mitglieder/*, /en/members/*) and its endpoints (/api/members/*). Pages without a valid
 * session cookie go to the login page, endpoints answer 401; valid requests get `locals.member`. Admin pages send
 * members without the admin role to the members home. Every response of the area gets SECURITY_HEADERS.
 * Every other path passes through untouched, which keeps the prerendered pages free of cookie access at build time.
 */
import { defineMiddleware } from 'astro:middleware'
import { refusedRequestUrl } from './lib/connectionsStore'
import {
  isAdminPath,
  isConnectionPath,
  isCrossSiteForm,
  isProtectedApiPath,
  isProtectedPath,
  loginPath,
  memberAreaLocale,
  memberHomePath,
  SESSION_COOKIE,
} from './lib/memberAuth'
import { findSession, mayConnect } from './lib/members'

const SECURITY_HEADERS = {
  // Member pages and answers must never land in a shared cache.
  'Cache-Control': 'private, no-store',
  // No framing, so no other site can lay the admin page under its own buttons (clickjacking).
  'Content-Security-Policy': "frame-ancestors 'none'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname, search, origin } = context.url
  if (isCrossSiteForm(context.request, pathname, origin)) {
    return new Response('Cross-site form submissions are forbidden', { status: 403 })
  }

  const locale = memberAreaLocale(pathname)
  const isApi = pathname.startsWith('/api/members/')
  if (!locale && !isApi) {
    return next()
  }

  if (isProtectedPath(pathname) || isProtectedApiPath(pathname)) {
    const token = context.cookies.get(SESSION_COOKIE)?.value
    const member = token ? await findSession(token) : null
    if (!member) {
      return secure(
        isApi
          ? new Response(JSON.stringify({ code: 'session', message: 'Nicht angemeldet.' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            })
          : context.redirect(loginPath(pathname, search, locale!), 303),
      )
    }
    if (isAdminPath(pathname) && member.role !== 'admin') {
      return secure(context.redirect(memberHomePath(locale!), 303))
    }
    if (isConnectionPath(pathname) && !mayConnect(member.email)) {
      return secure(context.redirect(refusedRequestUrl(context.url) ?? memberHomePath(locale!), 303))
    }
    context.locals.member = member
  }

  return secure(await next())
})

function secure(response: Response): Response {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(name, value)
  }
  return response
}
