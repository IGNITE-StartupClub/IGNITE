/**
 * Pure helpers for the members area (password login). No imports besides node:crypto, so
 * memberAuth.test.ts can run under `node --test` without a bundler.
 * Database access lives in members.ts, the request handling in middleware.ts and pages/api/members/.
 */
import { createHash, createHmac, hkdfSync, randomBytes, randomInt, scrypt, timingSafeEqual } from 'node:crypto'

export const SESSION_COOKIE = 'ignite_member'
export const SESSION_TTL_SECONDS = 30 * 24 * 3600
/** One-time code to set a password (first password or reset): length, validity and wrong entries per code. */
export const CODE_LENGTH = 6
export const CODE_TTL_SECONDS = 10 * 60
export const CODE_MAX_ATTEMPTS = 5
export const LOGIN_MAX_FAILURES = 5
export const LOGIN_LOCK_SECONDS = 15 * 60
/**
 * Failed logins per client address within LOGIN_LOCK_SECONDS, across all accounts, against guessing common passwords
 * for many members. Generous, because a university network puts many members behind one address.
 */
export const LOGIN_MAX_FAILURES_PER_CLIENT = 30
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

/** Random token for a session cookie. Only its hash is stored. */
export const newToken = (): string => randomBytes(32).toString('base64url')

// A leaked database must not yield usable sessions, so tokens are stored as SHA-256 hashes.
// The tokens carry 256 random bits, so a fast unsalted hash is enough.
export const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex')

/** Whether `email` (normalized) is on the list of possible first admins, given as SHA-256 hashes (initialAdmins.ts). */
export const isListedAddress = (email: string, hashes: readonly string[]): boolean =>
  hashes.includes(createHash('sha256').update(email).digest('hex'))

/** Upper limit for a signature photo; the cropper's 192 px JPEGs stay far below it. */
export const PHOTO_MAX_BYTES = 100_000
const JPEG_DATA_URL = 'data:image/jpeg;base64,'

/** The JPEG behind a data URL from the photo cropper, or null when it is no JPEG or larger than PHOTO_MAX_BYTES. */
export function decodePhoto(dataUrl: unknown): Buffer | null {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith(JPEG_DATA_URL)) return null
  const image = Buffer.from(dataUrl.slice(JPEG_DATA_URL.length), 'base64')
  // Start and end markers of a JPEG file (SOI, EOI).
  const isJpeg = image.length > 4 && image[0] === 0xff && image[1] === 0xd8 && image.at(-2) === 0xff && image.at(-1) === 0xd9
  return isJpeg && image.length <= PHOTO_MAX_BYTES ? image : null
}

/** Random numeric code with leading zeros, e.g. "042917". */
export const newCode = (): string => String(randomInt(10 ** CODE_LENGTH)).padStart(CODE_LENGTH, '0')

/** Digits only and exactly CODE_LENGTH of them, or null. */
export function normalizeCode(value: unknown): string | null {
  const code = typeof value === 'string' ? value.replace(/\s/g, '') : ''
  return code.length === CODE_LENGTH && /^\d+$/.test(code) ? code : null
}

const deriveKey = (secret: string, purpose: string): Buffer =>
  Buffer.from(hkdfSync('sha256', Buffer.from(secret, 'hex'), Buffer.alloc(0), purpose, 32))

/** Key for hashCode, derived from ENCRYPTION_SECRET so the applicant data key is never used directly. */
export const codeKey = (secret: string): Buffer => deriveKey(secret, 'ignite-member-code')

/** Pepper for hashPassword, derived from ENCRYPTION_SECRET like codeKey but for this purpose only. */
export const passwordKey = (secret: string): Buffer => deriveKey(secret, 'ignite-member-password')

// A code has only a million values, so a plain hash would fall to brute force once the database leaks. The keyed
// HMAC needs the server secret as well, and binding the address keeps a code from working for another member.
export const hashCode = (code: string, email: string, key: Buffer): string =>
  createHmac('sha256', key).update(`${email}\n${code}`).digest('hex')

/** Pseudonym of a client address for the login limit, so the database holds no plain IP addresses. */
export const hashClientAddress = (address: string, key: Buffer): string =>
  createHmac('sha256', key).update(`client\n${address}`).digest('hex')

/** Constant-time comparison of two hex digests. */
export const sameDigest = (a: string, b: string): boolean =>
  a.length === b.length && timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'))

/** Why a new password is rejected, or null when it is acceptable. Length only: composition rules do not add strength. */
export function passwordProblem(password: unknown): 'tooShort' | 'tooLong' | null {
  if (typeof password !== 'string' || [...password].length < PASSWORD_MIN_LENGTH) return 'tooShort'
  return [...password].length > PASSWORD_MAX_LENGTH ? 'tooLong' : null
}

// Passwords are guessable, unlike tokens, so they get a slow, salted hash. N = 2^15, r = 8 costs 32 MiB
// (128 * N * r bytes) and roughly 50-100 ms per hash; maxmem must exceed Node's 32 MiB default.
const SCRYPT = { N: 2 ** 15, r: 8, p: 1, keyLength: 32, maxmem: 64 * 1024 * 1024 }
// The password goes through an HMAC with the pepper before scrypt, so a leaked database alone is not enough to try
// passwords offline: that also needs ENCRYPTION_SECRET, which lives only in the server environment.
// A new pepper needs a new scheme name, because existing hashes can only be checked with the old one.
const SCHEME = 'scrypt-hmac'

function derive(
  password: string,
  pepper: Buffer,
  salt: Buffer,
  N: number,
  r: number,
  p: number,
  keyLength: number,
): Promise<Buffer> {
  // NFC so the same password typed on different systems yields the same bytes.
  const peppered = createHmac('sha256', pepper).update(password.normalize('NFC')).digest()
  return new Promise((resolve, reject) => {
    scrypt(peppered, salt, keyLength, { N, r, p, maxmem: SCRYPT.maxmem }, (err, key) => (err ? reject(err) : resolve(key)))
  })
}

/** Stored form: scrypt-hmac$N$r$p$salt$hash (salt and hash base64url), so the cost can be raised later. */
export async function hashPassword(password: string, pepper: Buffer): Promise<string> {
  const salt = randomBytes(16)
  const { N, r, p, keyLength } = SCRYPT
  const key = await derive(password, pepper, salt, N, r, p, keyLength)
  return [SCHEME, N, r, p, salt.toString('base64url'), key.toString('base64url')].join('$')
}

let dummyHash: Promise<string> | null = null

/**
 * Checks `password` against a stored hash. Without a usable hash (unknown address, no password yet, another scheme or
 * a malformed value) it still hashes once against a dummy, so the response time does not reveal whether an address
 * has an account, nor what kind of hash it holds.
 */
export async function verifyPassword(password: string, stored: string | undefined, pepper: Buffer): Promise<boolean> {
  const [scheme, N, r, p, salt, hash] = stored?.split('$') ?? []
  if (scheme !== SCHEME || !salt || !hash) {
    dummyHash ??= hashPassword(newToken(), pepper)
    await verifyPassword(password, await dummyHash, pepper)
    return false
  }
  const expected = Buffer.from(hash, 'base64url')
  const actual = await derive(password, pepper, Buffer.from(salt, 'base64url'), Number(N), Number(r), Number(p), expected.length)
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
  signature: { de: 'signatur', en: 'signature' },
  admin: { de: 'verwaltung', en: 'admin' },
  crm: { de: 'crm', en: 'crm' },
  alumni: { de: 'alumni', en: 'alumni' },
  team: { de: 'team', en: 'team' },
  guide: { de: 'guide', en: 'guide' },
  benefits: { de: 'vorteile', en: 'benefits' },
} as const
export type MemberPage = keyof typeof PAGES

/** Reachable without a session. */
const PUBLIC_PAGES: MemberPage[] = ['login']

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

/** True for every page of the members area except the login page. */
export const isProtectedPath = (pathname: string): boolean => !!areaOf(pathname) && !isPage(pathname, PUBLIC_PAGES)

// Endpoints under /api/members/ that work without a session. Every other one requires it (src/middleware.ts),
// so a new endpoint, for example for internal contacts, is closed until it is listed here.
const PUBLIC_API = ['login', 'code', 'password', 'logout']

/** True for every endpoint under /api/members/ that needs a session. */
export function isProtectedApiPath(pathname: string): boolean {
  if (!pathname.startsWith('/api/members/')) return false
  return !PUBLIC_API.includes(pathname.slice('/api/members/'.length).replace(/\/$/, ''))
}

/** Pages only admins may open. */
export const isAdminPath = (pathname: string): boolean => isPage(pathname, ['admin'])

/**
 * The JSON endpoints read the body regardless of its type, so they insist on application/json: a cross-site page can
 * only send that after a CORS preflight, which these endpoints never answer.
 */
export const isJsonRequest = (contentType: string | null): boolean => /^application\/json\b/i.test(contentType ?? '')
