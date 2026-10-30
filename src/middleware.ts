/**
 * Guards the members area (/mitglieder/*, /en/members/*). Requests without a valid session cookie go to the
 * login page; valid ones get `locals.member`. Every other path passes through untouched, which keeps the
 * prerendered pages free of cookie access at build time.
 */
import { defineMiddleware } from 'astro:middleware'
import { isProtectedPath, memberAreaLocale, memberLoginPath, SESSION_COOKIE } from './lib/memberAuth'
import { findSession } from './lib/members'

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url
  if (!isProtectedPath(pathname)) {
    return next()
  }

  const token = context.cookies.get(SESSION_COOKIE)?.value
  const email = token ? await findSession(token) : null
  if (!email) {
    return context.redirect(memberLoginPath(memberAreaLocale(pathname)!), 303)
  }

  context.locals.member = { email }
  const response = await next()
  // Member pages must never land in a shared cache.
  response.headers.set('Cache-Control', 'private, no-store')
  return response
})
