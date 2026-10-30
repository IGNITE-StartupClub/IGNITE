/**
 * Guards the members area (/mitglieder/*, /en/members/*). Requests without a valid session cookie go to the
 * login page; valid ones get `locals.member`. Admin pages send members without the admin role to the members home.
 * Every other path passes through untouched, which keeps the prerendered pages free of cookie access at build time.
 */
import { defineMiddleware } from 'astro:middleware'
import { isAdminPath, isProtectedPath, memberAreaLocale, memberHomePath, memberPagePath, SESSION_COOKIE } from './lib/memberAuth'
import { findSession } from './lib/members'

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url
  if (!isProtectedPath(pathname)) {
    return next()
  }

  const locale = memberAreaLocale(pathname)!
  const token = context.cookies.get(SESSION_COOKIE)?.value
  const member = token ? await findSession(token) : null
  if (!member) {
    return context.redirect(memberPagePath('login', locale), 303)
  }
  if (isAdminPath(pathname) && member.role !== 'admin') {
    return context.redirect(memberHomePath(locale), 303)
  }

  context.locals.member = member
  const response = await next()
  // Member pages must never land in a shared cache.
  response.headers.set('Cache-Control', 'private, no-store')
  return response
})
