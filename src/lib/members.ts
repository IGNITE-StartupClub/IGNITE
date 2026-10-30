/**
 * MongoDB access for the members area. Three collections:
 * - `members`: the allowlist ({ email, addedAt }), maintained with scripts/members.mjs, never from the website.
 * - `member_login_tokens`: hashed one-time login links, removed by a TTL index once expired.
 * - `member_sessions`: hashed session tokens behind the login cookie, removed by a TTL index once expired.
 */
import { MongoClient } from 'mongodb'
import 'dotenv/config'
import { hashToken, LOGIN_TOKEN_TTL_SECONDS, newToken, SESSION_TTL_SECONDS } from './memberAuth'

interface Member {
  email: string
  addedAt: Date
}

interface LoginToken {
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

let connecting: Promise<MongoClient> | null = null

async function connect(): Promise<MongoClient> {
  const client = new MongoClient(process.env.MONGODB_URI!)
  await client.connect()
  const db = client.db(process.env.MONGODB_DB!)
  await Promise.all([
    db.collection('members').createIndex({ email: 1 }, { unique: true }),
    db.collection('member_login_tokens').createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection('member_login_tokens').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection('member_sessions').createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection('member_sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
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
    tokens: db.collection<LoginToken>('member_login_tokens'),
    sessions: db.collection<Session>('member_sessions'),
  }
}

export async function isAllowed(email: string): Promise<boolean> {
  const { members } = await collections()
  return (await members.countDocuments({ email }, { limit: 1 })) > 0
}

/** Login links created since `since`, across all addresses or for one. Used as rate limit. */
export async function countLoginTokens(since: Date, email?: string): Promise<number> {
  const { tokens } = await collections()
  return tokens.countDocuments({ createdAt: { $gte: since }, ...(email && { email }) })
}

/** Stores a new login link for `email` and returns its token. */
export async function createLoginToken(email: string): Promise<string> {
  const { tokens } = await collections()
  const token = newToken()
  const now = new Date()
  await tokens.insertOne({
    tokenHash: hashToken(token),
    email,
    createdAt: now,
    expiresAt: new Date(now.getTime() + LOGIN_TOKEN_TTL_SECONDS * 1000),
  })
  return token
}

export async function deleteLoginToken(token: string): Promise<void> {
  const { tokens } = await collections()
  await tokens.deleteOne({ tokenHash: hashToken(token) })
}

/**
 * Redeems a login link: deletes it and returns its address if it was valid, unexpired and the address is still
 * on the allowlist. The TTL monitor runs only once a minute, hence the explicit expiry check.
 */
export async function consumeLoginToken(token: string): Promise<string | null> {
  const { tokens } = await collections()
  const entry = await tokens.findOneAndDelete({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() } })
  return entry && (await isAllowed(entry.email)) ? entry.email : null
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

/** Address of the session behind `token`, or null when it is unknown or expired. */
export async function findSession(token: string): Promise<string | null> {
  const { sessions } = await collections()
  const session = await sessions.findOne({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() } })
  return session?.email ?? null
}

export async function deleteSession(token: string): Promise<void> {
  const { sessions } = await collections()
  await sessions.deleteOne({ tokenHash: hashToken(token) })
}
