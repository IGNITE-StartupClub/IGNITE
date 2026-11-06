/**
 * Rules for connecting an AI assistant to a member's account, without database access so node --test can load it.
 * The site is its own OAuth 2.1 authorization server (authorization code with PKCE, public clients) and the MCP
 * endpoint its only resource. Members sign in with their normal account on the consent page.
 *
 * Clients need no database: only the redirect addresses of known apps are accepted, and the client id carries them
 * signed. So the public registration endpoint stores nothing, and the name on the consent page comes from the address,
 * never from what a client says about itself.
 * Mongo access lives in connectionsStore.ts, the routes in pages/.well-known/, pages/api/oauth/ and pages/api/mcp.ts.
 */
import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { sameDigest } from './memberAuth.ts'

export const MCP_PATH = '/api/mcp'
export const OAUTH_SCOPE = 'tasks'
export const AUTH_CODE_TTL_SECONDS = 5 * 60
export const ACCESS_TTL_SECONDS = 3600
/** Renewed on every refresh, so a connection in use stays and an unused one ends after this time. */
export const REFRESH_TTL_SECONDS = 30 * 24 * 3600
/** A replaced refresh token still works this long, because a lost answer or a parallel refresh is no theft. */
export const REFRESH_GRACE_SECONDS = 60

const CLIENT_REDIRECTS_MAX = 5
const STATE_MAX = 1024

const APPS = {
  claude: /^https:\/\/claude\.(?:ai|com)\/api\/mcp\/auth_callback$/,
  // ChatGPT uses the first form because the server sends `iss`; the docs keep the second for other servers.
  chatgpt: /^https:\/\/chatgpt\.com\/(?:connector_platform_oauth_redirect|connector\/oauth\/[\w-]+)$/,
  // Claude Code and other apps on the member's own computer listen on a port of their choice (RFC 8252).
  local: /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d{1,5})?\/[\w./-]*$/,
}
export type ConnectionApp = keyof typeof APPS

/** The app a redirect address belongs to, or null when it is none we allow. */
export function appOfRedirect(uri: unknown): ConnectionApp | null {
  if (typeof uri !== 'string') return null
  const entry = Object.entries(APPS).find(([, pattern]) => pattern.test(uri))
  return entry ? (entry[0] as ConnectionApp) : null
}

const sign = (payload: string, key: Buffer): string => createHmac('sha256', key).update(payload).digest('hex')

function issueClientId(redirectUris: string[], key: Buffer): string {
  const payload = Buffer.from(JSON.stringify(redirectUris)).toString('base64url')
  return `${payload}.${sign(payload, key)}`
}

/** The redirect addresses inside a client id, or null when we did not sign it. */
function clientRedirects(clientId: unknown, key: Buffer): string[] | null {
  if (typeof clientId !== 'string') return null
  const [payload, signature, ...rest] = clientId.split('.')
  if (!payload || !signature || rest.length || !/^[0-9a-f]{64}$/.test(signature)) return null
  if (!sameDigest(signature, sign(payload, key))) return null
  return JSON.parse(Buffer.from(payload, 'base64url').toString()) as string[]
}

export const isClientId = (clientId: unknown, key: Buffer): boolean => clientRedirects(clientId, key) !== null

/** The database steps of a refresh, each atomic on the token it looks for (connectionsStore.ts). */
interface RefreshSteps<T> {
  rotate(): Promise<T | null>
  /** Like rotate, for the token replaced last, if that happened after `since`. */
  retry(since: Date): Promise<T | null>
  /** Ends the connection that replaced this token: seen this late, someone else holds a copy. */
  revoke(): Promise<void>
}

/** Renews the tokens of the connection behind a refresh token, or null when the token gets none. */
export async function renewTokens<T>(steps: RefreshSteps<T>, now: number): Promise<T | null> {
  const connection = (await steps.rotate()) ?? (await steps.retry(new Date(now - REFRESH_GRACE_SECONDS * 1000)))
  if (!connection) await steps.revoke()
  return connection
}

/** Dynamic client registration (RFC 7591). Null unless every redirect address belongs to the same allowed app. */
export function registerClient(input: unknown, key: Buffer) {
  const uris = (input as { redirect_uris?: unknown } | null)?.redirect_uris
  if (!Array.isArray(uris) || !uris.length || uris.length > CLIENT_REDIRECTS_MAX) return null
  const apps = new Set(uris.map(appOfRedirect))
  if (apps.size !== 1 || apps.has(null)) return null
  return {
    client_id: issueClientId(uris, key),
    redirect_uris: uris as string[],
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    // Public clients: PKCE proves who redeems a code, so a secret would add nothing.
    token_endpoint_auth_method: 'none',
  }
}

export interface AuthRequest {
  clientId: string
  redirectUri: string
  app: ConnectionApp
  codeChallenge: string
  state: string
  resource: string
}

export const mcpResource = (origin: string): string => origin + MCP_PATH

/** The parameters of an authorization request, or null when any of them is missing or not allowed. */
export function parseAuthRequest(params: URLSearchParams, key: Buffer, origin: string): AuthRequest | null {
  const clientId = params.get('client_id')
  const redirectUri = params.get('redirect_uri')
  const codeChallenge = params.get('code_challenge') ?? ''
  const state = params.get('state') ?? ''
  const resource = params.get('resource') ?? mcpResource(origin)
  const app = appOfRedirect(redirectUri)
  const redirects = clientRedirects(clientId, key)
  const valid =
    params.get('response_type') === 'code' &&
    params.get('code_challenge_method') === 'S256' &&
    /^[\w-]{43}$/.test(codeChallenge) &&
    state.length <= STATE_MAX &&
    resource === mcpResource(origin) &&
    !!app &&
    !!redirects?.includes(redirectUri!)
  return valid ? { clientId: clientId!, redirectUri: redirectUri!, app: app!, codeChallenge, state, resource } : null
}

/** Where the browser goes after the consent page. `iss` is on every answer, as the metadata promises (RFC 9207). */
export function authResponseUrl(
  request: AuthRequest,
  origin: string,
  result: { code: string } | { error: string },
): string {
  const url = new URL(request.redirectUri)
  for (const [name, value] of Object.entries(result)) url.searchParams.set(name, value)
  if (request.state) url.searchParams.set('state', request.state)
  url.searchParams.set('iss', origin)
  return url.href
}

/** Whether `verifier` belongs to the challenge of the authorization request (PKCE, S256). */
export function verifyPkce(verifier: unknown, challenge: string): boolean {
  if (typeof verifier !== 'string' || !/^[\w.~-]{43,128}$/.test(verifier)) return false
  const actual = createHash('sha256').update(verifier).digest()
  const expected = Buffer.from(challenge, 'base64url')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export const protectedResourceMetadata = (origin: string) => ({
  resource: mcpResource(origin),
  authorization_servers: [origin],
  scopes_supported: [OAUTH_SCOPE],
  bearer_methods_supported: ['header'],
})

export const authorizationServerMetadata = (origin: string, authorizationPath: string) => ({
  issuer: origin,
  authorization_endpoint: origin + authorizationPath,
  token_endpoint: `${origin}/api/oauth/token`,
  registration_endpoint: `${origin}/api/oauth/register`,
  scopes_supported: [OAUTH_SCOPE],
  response_types_supported: ['code'],
  grant_types_supported: ['authorization_code', 'refresh_token'],
  code_challenge_methods_supported: ['S256'],
  token_endpoint_auth_methods_supported: ['none'],
  authorization_response_iss_parameter_supported: true,
})

/** The 401 challenge of the MCP endpoint. Clients find the sign-in through `resource_metadata`. */
export const bearerChallenge = (origin: string, tokenSent: boolean): string =>
  [
    `Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource${MCP_PATH}"`,
    `scope="${OAUTH_SCOPE}"`,
    ...(tokenSent ? ['error="invalid_token"'] : []),
  ].join(', ')
