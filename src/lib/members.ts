/**
 * MongoDB access for the members area. Four collections:
 * - `members`: one document per member ({ email, role, addedAt, passwordHash?, failedLogins?, lockedUntil? }).
 *   Admins maintain it on the admin page; the first admin comes from scripts/members.mjs.
 * - `member_codes`: one-time codes to set a password (first password or reset), stored as keyed hashes. Each stays an
 *   hour after it was sent, so it still counts for the rate limit; it is valid for CODE_TTL_SECONDS only.
 * - `member_sessions`: hashed session tokens behind the login cookie, removed by a TTL index once expired.
 * - `member_audit`: who changed which member when, kept for one year.
 */
import { MongoClient } from 'mongodb'
import 'dotenv/config'
import {
  CODE_MAX_ATTEMPTS,
  CODE_TTL_SECONDS,
  codeKey,
  hashCode,
  hashToken,
  LOGIN_LOCK_SECONDS,
  LOGIN_MAX_FAILURES,
  type MemberRole,
  newCode,
  newToken,
  sameDigest,
  SESSION_TTL_SECONDS,
} from './memberAuth'

export interface Member {
  email: string
  role: MemberRole
  addedAt: Date
  passwordHash?: string
  passwordSetAt?: Date
  failedLogins?: number
  lockedUntil?: Date
}

interface PasswordCode {
  email: string
  codeHash: string
  createdAt: Date
  expiresAt: Date
  attempts: number
}

interface Session {
  tokenHash: string
  email: string
  expiresAt: Date
}

interface AuditEntry {
  at: Date
  actor: string
  action: 'add' | 'remove' | 'role' | 'invite'
  email: string
  role?: MemberRole
}

const AUDIT_TTL_SECONDS = 365 * 24 * 3600
/** How long a sent code is kept for the rate limits in /api/members/code. */
export const CODE_RETENTION_SECONDS = 3600

let connecting: Promise<MongoClient> | null = null

async function connect(): Promise<MongoClient> {
  const client = new MongoClient(process.env.MONGODB_URI!)
  await client.connect()
  const db = client.db(process.env.MONGODB_DB!)
  await Promise.all([
    db.collection('members').createIndex({ email: 1 }, { unique: true }),
    db.collection('member_codes').createIndex({ email: 1, createdAt: -1 }),
    db.collection('member_codes').createIndex({ createdAt: 1 }, { expireAfterSeconds: CODE_RETENTION_SECONDS }),
    db.collection('member_sessions').createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection('member_sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection('member_audit').createIndex({ at: 1 }, { expireAfterSeconds: AUDIT_TTL_SECONDS }),
  ])
  return client
}

async function collections() {
  connecting ??= connect().catch((err) => {
    // Let the next request try again instead of caching the failed connection forever.
    connecting = null
    throw err
  })
  const db = (await connecting).db(process.env.MONGODB_DB!)
  return {
    members: db.collection<Member>('members'),
    codes: db.collection<PasswordCode>('member_codes'),
    sessions: db.collection<Session>('member_sessions'),
    audit: db.collection<AuditEntry>('member_audit'),
  }
}

/** Members created before roles existed have no `role`; they count as plain members. */
const withRole = (member: Member): Member => ({ ...member, role: member.role ?? 'member' })

export async function findMember(email: string): Promise<Member | null> {
  const { members } = await collections()
  const member = await members.findOne({ email })
  return member && withRole(member)
}

export async function listMembers(): Promise<Member[]> {
  const { members } = await collections()
  return (await members.find({}, { sort: { email: 1 } }).toArray()).map(withRole)
}

/** What the admin page may see of a member: never the password hash. */
export const memberSummary = (member: Member) => ({
  email: member.email,
  role: member.role,
  addedAt: member.addedAt.toISOString(),
  hasPassword: !!member.passwordHash,
  locked: isLocked(member),
})
export type MemberSummary = ReturnType<typeof memberSummary>

/** Adds a member; false when the address is already on the list. */
export async function addMember(email: string, role: MemberRole): Promise<boolean> {
  const { members } = await collections()
  const { upsertedCount } = await members.updateOne(
    { email },
    { $setOnInsert: { email, role, addedAt: new Date() } },
    { upsert: true },
  )
  return upsertedCount === 1
}

/** Removes a member together with their sessions and open codes, so access ends at once. */
export async function removeMember(email: string): Promise<boolean> {
  const { members, sessions, codes } = await collections()
  const { deletedCount } = await members.deleteOne({ email })
  await Promise.all([sessions.deleteMany({ email }), codes.deleteMany({ email })])
  return deletedCount === 1
}

export async function setRole(email: string, role: MemberRole): Promise<boolean> {
  const { members } = await collections()
  const { matchedCount } = await members.updateOne({ email }, { $set: { role } })
  return matchedCount === 1
}

export async function logAdminAction(entry: Omit<AuditEntry, 'at'>): Promise<void> {
  const { audit } = await collections()
  await audit.insertOne({ at: new Date(), ...entry })
}

let key: Buffer | null = null
const secretKey = () => (key ??= codeKey(process.env.ENCRYPTION_SECRET!))

/** Codes sent since `since`, across all addresses or for one. Used as rate limit. */
export async function countCodes(since: Date, email?: string): Promise<number> {
  const { codes } = await collections()
  return codes.countDocuments({ createdAt: { $gte: since }, ...(email && { email }) })
}

/** Stores a new code for `email` and returns it for the mail. Older codes of the address stop working. */
export async function createCode(email: string): Promise<string> {
  const { codes } = await collections()
  const code = newCode()
  const now = new Date()
  // Spent codes stay for the rate limit, but only the newest one may be entered.
  await codes.updateMany({ email, expiresAt: { $gt: now } }, { $set: { expiresAt: now } })
  await codes.insertOne({
    email,
    codeHash: hashCode(code, email, secretKey()),
    createdAt: now,
    expiresAt: new Date(now.getTime() + CODE_TTL_SECONDS * 1000),
    attempts: 0,
  })
  return code
}

/** Withdraws a code whose mail could not be sent, so it holds back neither a retry nor the rate limit. */
export async function deleteCode(email: string): Promise<void> {
  const { codes } = await collections()
  await codes.deleteOne({ email }, { sort: { createdAt: -1 } })
}

/**
 * Checks a code for `email` and uses it up when it matches. Every entry first takes one of the code's
 * CODE_MAX_ATTEMPTS atomically, so parallel requests cannot try more than that. The TTL monitor runs only once a
 * minute and keeps codes for the rate limit anyway, hence the explicit expiry check.
 */
export async function redeemCode(email: string, code: string): Promise<boolean> {
  const { codes } = await collections()
  const entry = await codes.findOneAndUpdate(
    { email, expiresAt: { $gt: new Date() }, attempts: { $lt: CODE_MAX_ATTEMPTS } },
    { $inc: { attempts: 1 } },
    { sort: { createdAt: -1 }, returnDocument: 'after' },
  )
  if (!entry || !sameDigest(entry.codeHash, hashCode(code, email, secretKey()))) return false
  await codes.updateMany({ email, expiresAt: { $gt: new Date() } }, { $set: { expiresAt: new Date() } })
  return !!(await findMember(email))
}

/** Stores a new password hash, lifts a lock and ends every session, so a stolen session dies with the old password. */
export async function setPassword(email: string, passwordHash: string): Promise<void> {
  const { members, sessions } = await collections()
  await members.updateOne(
    { email },
    { $set: { passwordHash, passwordSetAt: new Date() }, $unset: { failedLogins: '', lockedUntil: '' } },
  )
  await sessions.deleteMany({ email })
}

export const isLocked = (member: Member): boolean => !!member.lockedUntil && member.lockedUntil > new Date()

/**
 * Takes one login attempt for `email` before the password is checked and returns the member, or null when the
 * address has no password or is locked. The counter goes up atomically, so parallel requests cannot run more than
 * LOGIN_MAX_FAILURES checks; a correct password resets it (clearFailedLogins), a wrong one keeps it.
 */
export async function reserveLoginAttempt(email: string): Promise<Member | null> {
  const { members } = await collections()
  const now = new Date()
  const member = await members.findOneAndUpdate(
    { email, passwordHash: { $exists: true }, $or: [{ lockedUntil: { $exists: false } }, { lockedUntil: { $lte: now } }] },
    { $inc: { failedLogins: 1 } },
    { returnDocument: 'after' },
  )
  if (member && (member.failedLogins ?? 0) >= LOGIN_MAX_FAILURES) await lock(email)
  if (member && (member.failedLogins ?? 0) > LOGIN_MAX_FAILURES) return null
  return member && withRole(member)
}

/** Locks the account for LOGIN_LOCK_SECONDS. The attempt that reaches the limit still gets its check. */
async function lock(email: string): Promise<void> {
  const { members } = await collections()
  await members.updateOne(
    { email },
    { $set: { lockedUntil: new Date(Date.now() + LOGIN_LOCK_SECONDS * 1000) }, $unset: { failedLogins: '' } },
  )
}

export async function clearFailedLogins(email: string): Promise<void> {
  const { members } = await collections()
  await members.updateOne({ email }, { $unset: { failedLogins: '', lockedUntil: '' } })
}

/** Starts a session for `email` and returns the token for the cookie. */
export async function createSession(email: string): Promise<string> {
  const { sessions } = await collections()
  const token = newToken()
  await sessions.insertOne({
    tokenHash: hashToken(token),
    email,
    expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
  })
  return token
}

/**
 * The member behind a session token, or null when the session is unknown, expired, or its member was removed.
 * The role is read fresh on every request, so a changed role applies at once.
 */
export async function findSession(token: string): Promise<{ email: string; role: MemberRole } | null> {
  const { sessions } = await collections()
  const session = await sessions.findOne({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() } })
  const member = session && (await findMember(session.email))
  return member ? { email: member.email, role: member.role } : null
}

export async function deleteSession(token: string): Promise<void> {
  const { sessions } = await collections()
  await sessions.deleteOne({ tokenHash: hashToken(token) })
}
