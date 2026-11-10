/**
 * MongoDB access for the connections of a member's account. Collections:
 * - `member_connection_codes`: authorization codes between consent page and token endpoint, single use.
 * - `member_connections`: one document per connected app with its current access and refresh token. An unused connection
 *   ends with its refresh token, removed by a TTL index.
 * - `member_calendar_feeds`: the secret link of each member's calendar subscription.
 * Like sessions, every secret is stored only as a SHA-256 hash, so a database dump holds nothing usable. removeMember and
 * setPassword (members.ts) delete a member's connections and feed. Rules live in connections.ts.
 */
import { randomUUID } from 'node:crypto'
import { database, findMember, mayConnect, setUpInBackground, type SessionMember } from './members'
import { settingEnabled } from './settingsStore'
import { connectionKey, hashToken, newToken } from './memberAuth'
import {
  ACCESS_TTL_SECONDS,
  AUTH_CODE_TTL_SECONDS,
  OAUTH_SCOPE,
  REFRESH_TTL_SECONDS,
  authResponseUrl,
  parseAuthRequest,
  renewTokens,
  verifyPkce,
  type AuthRequest,
  type ConnectionApp,
} from './connections'

interface AuthCode {
  /** Hash of the code. */
  _id: string
  email: string
  clientId: string
  app: ConnectionApp
  redirectUri: string
  codeChallenge: string
  resource: string
  expiresAt: Date
}

interface Connection {
  _id: string
  email: string
  clientId: string
  app: ConnectionApp
  resource: string
  accessHash: string
  accessExpiresAt: Date
  refreshHash: string
  /** The refresh token replaced last. Seeing it again after the grace period ends the connection (renewTokens). */
  previousRefreshHash: string | null
  rotatedAt: Date | null
  expiresAt: Date
  createdAt: Date
  lastUsedAt: Date
}

interface CalendarFeed {
  /** The member's address: one link each, a new one replaces the old. */
  _id: string
  tokenHash: string
  createdAt: Date
}

let signingKey: Buffer | null = null
/** Signs the client ids (connections.ts). */
export const clientKey = () => (signingKey ??= connectionKey(process.env.ENCRYPTION_SECRET!))

let indexed = false

async function collections() {
  const db = await database()
  const codes = db.collection<AuthCode>('member_connection_codes')
  const connections = db.collection<Connection>('member_connections')
  const feeds = db.collection<CalendarFeed>('member_calendar_feeds')
  if (!indexed) {
    indexed = true
    setUpInBackground('connections', () =>
      Promise.all([
        codes.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
        connections.createIndex({ accessHash: 1 }),
        connections.createIndex({ refreshHash: 1 }),
        connections.createIndex({ previousRefreshHash: 1 }),
        connections.createIndex({ email: 1 }),
        connections.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
        feeds.createIndex({ tokenHash: 1 }, { unique: true }),
      ]),
    )
  }
  return { codes, connections, feeds }
}

/** For a member who may not connect: the way back to the app that sent them, with the refusal; null without a valid request. */
export function refusedRequestUrl(url: URL): string | null {
  const request = parseAuthRequest(url.searchParams, clientKey(), url.origin)
  return request && authResponseUrl(request, url.origin, { error: 'access_denied' })
}

/** What the MCP endpoint and the calendar feed need of the member: who acts on the tasks (sessionActor) and their team. */
export type ConnectedMember = Pick<SessionMember, 'id' | 'email' | 'role' | 'firstName' | 'lastName' | 'team'>

/**
 * The member behind an access right, or null when they were removed or may not connect (any more, see mayConnect). It carries all
 * the routes need, so they read the member only this once.
 */
async function allowedMember(email: string): Promise<ConnectedMember | null> {
  const [found, open] = await Promise.all([findMember(email), settingEnabled('connections')])
  const member = found && mayConnect(email, open) ? found : null
  return (
    member && {
      id: member._id.toHexString(),
      email: member.email,
      role: member.role,
      firstName: member.firstName,
      lastName: member.lastName,
      team: member.team,
    }
  )
}

/** A fresh token pair, as the database stores it and as the client gets it. */
function newTokens() {
  const accessToken = newToken()
  const refreshToken = newToken()
  const now = Date.now()
  return {
    stored: {
      accessHash: hashToken(accessToken),
      accessExpiresAt: new Date(now + ACCESS_TTL_SECONDS * 1000),
      refreshHash: hashToken(refreshToken),
      expiresAt: new Date(now + REFRESH_TTL_SECONDS * 1000),
    },
    answer: {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: ACCESS_TTL_SECONDS,
      refresh_token: refreshToken,
      scope: OAUTH_SCOPE,
    },
  }
}
export type TokenAnswer = ReturnType<typeof newTokens>['answer']

/** Stores the code for an approved request and returns it for the redirect. */
export async function createAuthCode(email: string, request: AuthRequest): Promise<string> {
  const { codes } = await collections()
  const code = newToken()
  await codes.insertOne({
    _id: hashToken(code),
    email,
    clientId: request.clientId,
    app: request.app,
    redirectUri: request.redirectUri,
    codeChallenge: request.codeChallenge,
    resource: request.resource,
    expiresAt: new Date(Date.now() + AUTH_CODE_TTL_SECONDS * 1000),
  })
  return code
}

/**
 * Trades a code for tokens, or null when anything does not match. The code is gone either way, so a stolen one cannot
 * be tried twice. A new approval replaces the earlier connection of the same app.
 */
export async function redeemAuthCode(input: {
  code: string
  clientId: string
  redirectUri: string
  verifier: string
  resource: string | null
}): Promise<TokenAnswer | null> {
  const { codes, connections } = await collections()
  // The TTL monitor runs only once a minute, hence the explicit expiry check.
  const entry = await codes.findOneAndDelete({ _id: hashToken(input.code), expiresAt: { $gt: new Date() } })
  const matches =
    !!entry &&
    entry.clientId === input.clientId &&
    entry.redirectUri === input.redirectUri &&
    (input.resource === null || entry.resource === input.resource) &&
    verifyPkce(input.verifier, entry.codeChallenge)
  if (!matches || !(await allowedMember(entry.email))) return null
  const { stored, answer } = newTokens()
  const now = new Date()
  await connections.deleteMany({ email: entry.email, clientId: entry.clientId })
  await connections.insertOne({
    _id: randomUUID(),
    email: entry.email,
    clientId: entry.clientId,
    app: entry.app,
    resource: entry.resource,
    ...stored,
    previousRefreshHash: null,
    rotatedAt: null,
    createdAt: now,
    lastUsedAt: now,
  })
  return answer
}

/**
 * Replaces both tokens of a connection, atomically on the refresh token. A token replaced within the grace period gets
 * a new pair, which voids the pair it lost or raced against. A token replaced earlier ends the connection, as OAuth 2.1
 * asks for public clients.
 */
export async function refreshConnection(refreshToken: string, clientId: string): Promise<TokenAnswer | null> {
  const { connections } = await collections()
  const hash = hashToken(refreshToken)
  const { stored, answer } = newTokens()
  const now = new Date()
  const usable = { clientId, expiresAt: { $gt: now } }
  const connection = await renewTokens(
    {
      rotate: () =>
        connections.findOneAndUpdate(
          { ...usable, refreshHash: hash },
          { $set: { ...stored, previousRefreshHash: hash, rotatedAt: now } },
        ),
      // Leaves rotatedAt alone, so retries cannot stretch the grace period.
      retry: (since) =>
        connections.findOneAndUpdate(
          { ...usable, previousRefreshHash: hash, rotatedAt: { $gt: since } },
          { $set: stored },
        ),
      revoke: async () => {
        await connections.deleteOne({ previousRefreshHash: hash, clientId })
      },
    },
    now.getTime(),
  )
  return connection && (await allowedMember(connection.email)) ? answer : null
}

/** The member behind an access token for `resource`, with the role as it is now. */
export async function connectedMember(accessToken: string, resource: string) {
  const { connections } = await collections()
  const now = new Date()
  const connection = await connections.findOneAndUpdate(
    { accessHash: hashToken(accessToken), resource, accessExpiresAt: { $gt: now } },
    { $set: { lastUsedAt: now } },
  )
  return connection && allowedMember(connection.email)
}

/** What the connections page shows of a member's apps: never a token. */
export async function connectionList(email: string) {
  const { connections } = await collections()
  const list = await connections.find({ email }, { sort: { createdAt: -1 } }).toArray()
  return list.map(({ _id, app, createdAt, lastUsedAt }) => ({
    id: _id,
    app,
    createdAt: createdAt.toISOString(),
    lastUsedAt: lastUsedAt.toISOString(),
  }))
}
export type ConnectionSummary = Awaited<ReturnType<typeof connectionList>>[number]

/** Ends a connection of this member; another member's id changes nothing. */
export async function removeConnection(email: string, id: string): Promise<void> {
  const { connections } = await collections()
  await connections.deleteOne({ _id: id, email })
}

/** When the member's current calendar link was made, '' without one. */
export async function calendarFeedSince(email: string): Promise<string> {
  const { feeds } = await collections()
  const feed = await feeds.findOne({ _id: email })
  return feed?.createdAt.toISOString() ?? ''
}

/** Makes a new calendar link and returns its token; the previous link stops working. */
export async function renewCalendarFeed(email: string): Promise<string> {
  const { feeds } = await collections()
  const token = newToken()
  await feeds.updateOne(
    { _id: email },
    { $set: { tokenHash: hashToken(token), createdAt: new Date() } },
    { upsert: true },
  )
  return token
}

export async function removeCalendarFeed(email: string): Promise<void> {
  const { feeds } = await collections()
  await feeds.deleteOne({ _id: email })
}

/** The member behind a calendar link, or null. */
export async function calendarFeedMember(token: string) {
  const { feeds } = await collections()
  const feed = await feeds.findOne({ tokenHash: hashToken(token) })
  return feed && allowedMember(feed._id)
}
