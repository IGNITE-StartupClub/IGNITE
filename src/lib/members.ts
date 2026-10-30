/**
 * MongoDB access for the members area. Four collections:
 * - `members`: one document per member ({ email, role, addedAt, passwordHash?, failedLogins?, lockedUntil? }).
 *   Admins maintain it on the admin page; the first admin comes from scripts/members.mjs.
 * - `member_password_tokens`: hashed one-time links to set a password (invitation or reset), removed by a TTL index.
 * - `member_sessions`: hashed session tokens behind the login cookie, removed by a TTL index once expired.
 * - `member_audit`: who changed which member when, kept for one year.
 */
import { MongoClient } from 'mongodb'
import 'dotenv/config'
import {
  hashToken,
  LOGIN_LOCK_SECONDS,
  LOGIN_MAX_FAILURES,
  type MemberRole,
  newToken,
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

interface PasswordToken {
  tokenHash: string
  email: string
  createdAt: Date
  expiresAt: Date
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

let connecting: Promise<MongoClient> | null = null

async function connect(): Promise<MongoClient> {
  const client = new MongoClient(process.env.MONGODB_URI!)
  await client.connect()
  const db = client.db(process.env.MONGODB_DB!)
  await Promise.all([
    db.collection('members').createIndex({ email: 1 }, { unique: true }),
    db.collection('member_password_tokens').createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection('member_password_tokens').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
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
    tokens: db.collection<PasswordToken>('member_password_tokens'),
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

/** Removes a member together with their sessions and open password links, so access ends at once. */
export async function removeMember(email: string): Promise<boolean> {
  const { members, sessions, tokens } = await collections()
  const { deletedCount } = await members.deleteOne({ email })
  await Promise.all([sessions.deleteMany({ email }), tokens.deleteMany({ email })])
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

/** Password links created since `since`, across all addresses or for one. Used as rate limit. */
export async function countPasswordTokens(since: Date, email?: string): Promise<number> {
  const { tokens } = await collections()
  return tokens.countDocuments({ createdAt: { $gte: since }, ...(email && { email }) })
}

/** Stores a new password link for `email`, valid for `ttlSeconds`, and returns its token. */
export async function createPasswordToken(email: string, ttlSeconds: number): Promise<string> {
  const { tokens } = await collections()
  const token = newToken()
  const now = new Date()
  await tokens.insertOne({
    tokenHash: hashToken(token),
    email,
    createdAt: now,
    expiresAt: new Date(now.getTime() + ttlSeconds * 1000),
  })
  return token
}

export async function deletePasswordToken(token: string): Promise<void> {
  const { tokens } = await collections()
  await tokens.deleteOne({ tokenHash: hashToken(token) })
}

/**
 * Redeems a password link: deletes it and returns its address if it was valid, unexpired and the address is still a
 * member. The TTL monitor runs only once a minute, hence the explicit expiry check.
 */
export async function consumePasswordToken(token: string): Promise<string | null> {
  const { tokens } = await collections()
  const entry = await tokens.findOneAndDelete({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() } })
  return entry && (await findMember(entry.email)) ? entry.email : null
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

/** Counts a wrong password; the LOGIN_MAX_FAILURES-th in a row locks the account for LOGIN_LOCK_SECONDS. */
export async function recordFailedLogin(email: string): Promise<void> {
  const { members } = await collections()
  const member = await members.findOneAndUpdate({ email }, { $inc: { failedLogins: 1 } }, { returnDocument: 'after' })
  if (member && (member.failedLogins ?? 0) >= LOGIN_MAX_FAILURES) {
    await members.updateOne(
      { email },
      { $set: { lockedUntil: new Date(Date.now() + LOGIN_LOCK_SECONDS * 1000) }, $unset: { failedLogins: '' } },
    )
  }
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
