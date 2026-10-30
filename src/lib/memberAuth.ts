/**
 * Pure helpers for the members area (magic-link login). No imports besides node:crypto, so
 * memberAuth.test.ts can run under `node --test` without a bundler.
 * Database access lives in members.ts, the request handling in middleware.ts and pages/api/members/.
 */
import { createHash, randomBytes } from 'node:crypto'

export const SESSION_COOKIE = 'ignite_member'
export const LOGIN_TOKEN_TTL_SECONDS = 15 * 60
export const SESSION_TTL_SECONDS = 30 * 24 * 3600

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Lowercased, trimmed address, or null when it is not a plausible email address. */
export function normalizeEmail(value: unknown): string | null {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return email.length <= 254 && EMAIL_PATTERN.test(email) ? email : null
}

/** Random token for a login link or a session cookie. Only its hash is stored. */
export const newToken = (): string => randomBytes(32).toString('base64url')

// A leaked database must not yield usable links or sessions, so tokens are stored as SHA-256 hashes.
// The tokens carry 256 random bits, so a fast unsalted hash is enough.
export const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex')

const AREAS = [
  { prefix: '/mitglieder', locale: 'de' },
  { prefix: '/en/members', locale: 'en' },
] as const

export type MemberLocale = (typeof AREAS)[number]['locale']

const areaOf = (pathname: string) =>
  AREAS.find(({ prefix }) => pathname === prefix || pathname.startsWith(prefix + '/'))

export const memberHomePath = (locale: MemberLocale): string =>
  AREAS.find((area) => area.locale === locale)!.prefix + '/'

export const memberLoginPath = (locale: MemberLocale): string => memberHomePath(locale) + 'login'

/** Locale of the members area that `pathname` belongs to, or null outside of it. */
export const memberAreaLocale = (pathname: string): MemberLocale | null => areaOf(pathname)?.locale ?? null

/** True for every page of the members area except its login page. */
export function isProtectedPath(pathname: string): boolean {
  const area = areaOf(pathname)
  if (!area) return false
  const login = memberLoginPath(area.locale)
  return pathname !== login && pathname !== login + '/'
}
