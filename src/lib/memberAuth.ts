/**
 * Pure helpers for the members area (password login). No imports besides node:crypto, so
 * memberAuth.test.ts can run under `node --test` without a bundler.
 * Database access lives in members.ts, the request handling in middleware.ts and pages/api/members/.
 */
import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'

export const SESSION_COOKIE = 'ignite_member'
export const SESSION_TTL_SECONDS = 30 * 24 * 3600
/** Validity of a "set your password" link requested by the member (first password or reset). */
export const PASSWORD_LINK_TTL_SECONDS = 60 * 60
/** Validity of the invitation an admin sends when adding a member. */
export const INVITE_TTL_SECONDS = 7 * 24 * 3600
export const LOGIN_MAX_FAILURES = 5
export const LOGIN_LOCK_SECONDS = 15 * 60
export const PASSWORD_MIN_LENGTH = 10
export const PASSWORD_MAX_LENGTH = 128

export const MEMBER_ROLES = ['member', 'admin'] as const
export type MemberRole = (typeof MEMBER_ROLES)[number]
export const isMemberRole = (value: unknown): value is MemberRole => MEMBER_ROLES.includes(value as MemberRole)

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Lowercased, trimmed address, or null when it is not a plausible email address. */
export function normalizeEmail(value: unknown): string | null {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return email.length <= 254 && EMAIL_PATTERN.test(email) ? email : null
}

/** Random token for a password link or a session cookie. Only its hash is stored. */
export const newToken = (): string => randomBytes(32).toString('base64url')

// A leaked database must not yield usable links or sessions, so tokens are stored as SHA-256 hashes.
// The tokens carry 256 random bits, so a fast unsalted hash is enough.
export const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex')

/** Why a new password is rejected, or null when it is acceptable. Length only: composition rules do not add strength. */
export function passwordProblem(password: unknown): 'tooShort' | 'tooLong' | null {
  if (typeof password !== 'string' || [...password].length < PASSWORD_MIN_LENGTH) return 'tooShort'
  return [...password].length > PASSWORD_MAX_LENGTH ? 'tooLong' : null
}

// Passwords are guessable, unlike tokens, so they get a slow, salted hash. N = 2^15, r = 8 costs 32 MiB
// (128 * N * r bytes) and roughly 50-100 ms per hash; maxmem must exceed Node's 32 MiB default.
const SCRYPT = { N: 2 ** 15, r: 8, p: 1, keyLength: 32, maxmem: 64 * 1024 * 1024 }

function derive(password: string, salt: Buffer, N: number, r: number, p: number, keyLength: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // NFC so the same password typed on different systems yields the same bytes.
    scrypt(password.normalize('NFC'), salt, keyLength, { N, r, p, maxmem: SCRYPT.maxmem }, (err, key) =>
      err ? reject(err) : resolve(key),
    )
  })
}

/** Stored form: scrypt$N$r$p$salt$hash (salt and hash base64url), so the cost can be raised later. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const { N, r, p, keyLength } = SCRYPT
  const key = await derive(password, salt, N, r, p, keyLength)
  return ['scrypt', N, r, p, salt.toString('base64url'), key.toString('base64url')].join('$')
}

let dummyHash: Promise<string> | null = null

/**
 * Checks `password` against a stored hash. Without a stored hash (unknown address, no password yet) it still hashes
 * once against a dummy, so the response time does not reveal whether an address has an account.
 */
export async function verifyPassword(password: string, stored: string | undefined): Promise<boolean> {
  if (!stored) {
    dummyHash ??= hashPassword(newToken())
    await verifyPassword(password, await dummyHash)
    return false
  }
  const [scheme, N, r, p, salt, hash] = stored.split('$')
  if (scheme !== 'scrypt' || !salt || !hash) return false
  const expected = Buffer.from(hash, 'base64url')
  const actual = await derive(password, Buffer.from(salt, 'base64url'), Number(N), Number(r), Number(p), expected.length)
  return timingSafeEqual(actual, expected)
}

const AREAS = [
  { prefix: '/mitglieder', locale: 'de' },
  { prefix: '/en/members', locale: 'en' },
] as const

export type MemberLocale = (typeof AREAS)[number]['locale']

// Sub pages of the members area with their slug per language (pages/mitglieder/*, pages/en/members/*).
const PAGES = {
  login: { de: 'login', en: 'login' },
  password: { de: 'passwort', en: 'password' },
  signature: { de: 'signatur', en: 'signature' },
  admin: { de: 'verwaltung', en: 'admin' },
} as const
export type MemberPage = keyof typeof PAGES

/** Reachable without a session. */
const PUBLIC_PAGES: MemberPage[] = ['login', 'password']

const areaOf = (pathname: string) =>
  AREAS.find(({ prefix }) => pathname === prefix || pathname.startsWith(prefix + '/'))

export const memberHomePath = (locale: MemberLocale): string =>
  AREAS.find((area) => area.locale === locale)!.prefix + '/'

export const memberPagePath = (page: MemberPage, locale: MemberLocale): string => memberHomePath(locale) + PAGES[page][locale]

/** Locale of the members area that `pathname` belongs to, or null outside of it. */
export const memberAreaLocale = (pathname: string): MemberLocale | null => areaOf(pathname)?.locale ?? null

function isPage(pathname: string, pages: MemberPage[]): boolean {
  const area = areaOf(pathname)
  const path = pathname.replace(/\/$/, '')
  return !!area && pages.some((page) => path === memberPagePath(page, area.locale))
}

/** True for every page of the members area except the login and password pages. */
export const isProtectedPath = (pathname: string): boolean => !!areaOf(pathname) && !isPage(pathname, PUBLIC_PAGES)

/** Pages only admins may open. */
export const isAdminPath = (pathname: string): boolean => isPage(pathname, ['admin'])

/**
 * The JSON endpoints read the body regardless of its type, so they insist on application/json: a cross-site page can
 * only send that after a CORS preflight, which these endpoints never answer.
 */
export const isJsonRequest = (contentType: string | null): boolean => /^application\/json\b/i.test(contentType ?? '')
