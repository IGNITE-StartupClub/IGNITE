import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { test } from 'node:test'
import {
  appOfRedirect,
  authResponseUrl,
  bearerChallenge,
  isClientId,
  parseAuthRequest,
  protectedResourceMetadata,
  registerClient,
  renewTokens,
  verifyPkce,
  type AuthRequest,
} from './connections.ts'

const key = Buffer.alloc(32, 7)
const origin = 'https://www.ignite-startupclub.de'
const claude = 'https://claude.ai/api/mcp/auth_callback'
const verifier = 'a'.repeat(50)
const challenge = createHash('sha256').update(verifier).digest('base64url')

const clientId = (uris = [claude]) => registerClient({ redirect_uris: uris }, key)!.client_id

const params = (overrides: Record<string, string | null> = {}) => {
  const all: Record<string, string | null> = {
    response_type: 'code',
    client_id: clientId(),
    redirect_uri: claude,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state: 'abc',
    resource: `${origin}/api/mcp`,
    ...overrides,
  }
  return new URLSearchParams(Object.entries(all).filter((entry): entry is [string, string] => entry[1] !== null))
}

test('knows the redirect addresses of the apps and no others', () => {
  assert.equal(appOfRedirect(claude), 'claude')
  assert.equal(appOfRedirect('https://claude.com/api/mcp/auth_callback'), 'claude')
  assert.equal(appOfRedirect('https://chatgpt.com/connector_platform_oauth_redirect'), 'chatgpt')
  assert.equal(appOfRedirect('https://chatgpt.com/connector/oauth/abc_123-X'), 'chatgpt')
  assert.equal(appOfRedirect('http://localhost:53124/callback'), 'local')
  assert.equal(appOfRedirect('http://127.0.0.1:8080/oauth/callback'), 'local')
  for (const uri of [
    'https://evil.example/callback',
    'https://claude.ai.evil.example/api/mcp/auth_callback',
    'https://claude.ai/api/mcp/auth_callback/../../steal',
    'https://claude.ai/api/mcp/auth_callback?next=https://evil.example',
    'http://claude.ai/api/mcp/auth_callback',
    'https://chatgpt.com/connector/oauth/a/b',
    'http://localhost.evil.example/callback',
    'http://localhost@evil.example/callback',
    'https://localhost/callback',
    '',
    null,
  ]) {
    assert.equal(appOfRedirect(uri), null, String(uri))
  }
})

test('registers a client for allowed addresses only', () => {
  const client = registerClient({ redirect_uris: [claude, 'https://claude.com/api/mcp/auth_callback'] }, key)
  assert.equal(client?.token_endpoint_auth_method, 'none')
  assert.equal('client_secret' in client!, false)
  assert.equal(registerClient({ redirect_uris: ['https://evil.example/cb'] }, key), null)
  assert.equal(registerClient({ redirect_uris: [claude, 'https://evil.example/cb'] }, key), null)
  assert.equal(
    registerClient({ redirect_uris: [claude, 'http://localhost:1/cb'] }, key),
    null,
    'two apps in one client',
  )
  assert.equal(registerClient({ redirect_uris: [] }, key), null)
  assert.equal(registerClient({ redirect_uris: claude }, key), null)
  assert.equal(registerClient({ redirect_uris: Array(6).fill(claude) }, key), null)
  assert.equal(registerClient(null, key), null)
})

test('the same client id comes out for the same addresses, so a client stays valid', () => {
  assert.equal(clientId(), clientId())
  assert.ok(isClientId(clientId(), key))
})

test('refuses client ids we did not sign', () => {
  const id = clientId()
  const [payload, signature] = id.split('.')
  const forged = Buffer.from(JSON.stringify(['https://evil.example/cb'])).toString('base64url')
  assert.equal(isClientId(`${forged}.${signature}`, key), false)
  assert.equal(isClientId(`${payload}.${'0'.repeat(64)}`, key), false)
  assert.equal(isClientId(`${payload}.abc`, key), false)
  assert.equal(isClientId(payload, key), false)
  assert.equal(isClientId(`${id}.extra`, key), false)
  assert.equal(isClientId(id, Buffer.alloc(32, 8)), false)
  assert.equal(isClientId(undefined, key), false)
})

test('accepts a complete authorization request', () => {
  assert.deepEqual(parseAuthRequest(params(), key, origin), {
    clientId: clientId(),
    redirectUri: claude,
    app: 'claude',
    codeChallenge: challenge,
    state: 'abc',
    resource: `${origin}/api/mcp`,
  })
})

test('defaults the resource and allows a missing state', () => {
  const request = parseAuthRequest(params({ resource: null, state: null }), key, origin)
  assert.equal(request?.resource, `${origin}/api/mcp`)
  assert.equal(request?.state, '')
})

test('refuses authorization requests with a missing or foreign part', () => {
  const other = 'https://claude.com/api/mcp/auth_callback'
  const cases: Record<string, string | null>[] = [
    { response_type: 'token' },
    { client_id: null },
    { client_id: 'unknown' },
    { redirect_uri: null },
    { redirect_uri: other },
    { redirect_uri: 'https://evil.example/cb' },
    { code_challenge: null },
    { code_challenge: 'short' },
    { code_challenge_method: null },
    { code_challenge_method: 'plain' },
    { resource: 'https://evil.example/api/mcp' },
    { state: 's'.repeat(1025) },
  ]
  for (const overrides of cases) {
    assert.equal(parseAuthRequest(params(overrides), key, origin), null, JSON.stringify(overrides))
  }
})

test('answers with code, state and issuer on the registered address', () => {
  const request = parseAuthRequest(params(), key, origin) as AuthRequest
  const url = new URL(authResponseUrl(request, origin, { code: 'xyz' }))
  assert.equal(url.origin + url.pathname, claude)
  assert.equal(url.searchParams.get('code'), 'xyz')
  assert.equal(url.searchParams.get('state'), 'abc')
  assert.equal(url.searchParams.get('iss'), origin)
})

test('carries the issuer on errors and leaves out an empty state', () => {
  const request = { ...(parseAuthRequest(params(), key, origin) as AuthRequest), state: '' }
  const url = new URL(authResponseUrl(request, origin, { error: 'access_denied' }))
  assert.equal(url.searchParams.get('error'), 'access_denied')
  assert.equal(url.searchParams.get('iss'), origin)
  assert.equal(url.searchParams.has('state'), false)
})

test('checks the PKCE verifier', () => {
  assert.equal(verifyPkce(verifier, challenge), true)
  assert.equal(verifyPkce('b'.repeat(50), challenge), false)
  assert.equal(verifyPkce('short', challenge), false)
  assert.equal(verifyPkce(undefined, challenge), false)
  assert.equal(verifyPkce(verifier, 'AAAA'), false)
})

test('the RFC 7636 example verifier matches its challenge', () => {
  assert.equal(
    verifyPkce('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk', 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'),
    true,
  )
})

test('points clients from the challenge to the metadata of the MCP endpoint', () => {
  assert.equal(
    bearerChallenge(origin, false),
    `Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource/api/mcp", scope="tasks"`,
  )
  assert.ok(bearerChallenge(origin, true).endsWith('error="invalid_token"'))
  assert.deepEqual(protectedResourceMetadata(origin).authorization_servers, [origin])
})

function refreshSteps(rotated: string | null, retried: string | null) {
  const calls: string[] = []
  return {
    calls,
    rotate: async () => {
      calls.push('rotate')
      return rotated
    },
    retry: async (since: Date) => {
      calls.push(`retry since ${since.toISOString()}`)
      return retried
    },
    revoke: async () => {
      calls.push('revoke')
    },
  }
}

const refreshTime = Date.parse('2026-11-06T12:00:00.000Z')

test('a current refresh token renews the connection and stops there', async () => {
  const steps = refreshSteps('connection', null)
  assert.equal(await renewTokens(steps, refreshTime), 'connection')
  assert.deepEqual(steps.calls, ['rotate'])
})

test('a token replaced within the last minute renews too, because a lost answer or a parallel refresh is no theft', async () => {
  const steps = refreshSteps(null, 'connection')
  assert.equal(await renewTokens(steps, refreshTime), 'connection')
  assert.deepEqual(steps.calls, ['rotate', 'retry since 2026-11-06T11:59:00.000Z'])
})

test('a token replaced earlier than that ends the connection', async () => {
  const steps = refreshSteps(null, null)
  assert.equal(await renewTokens(steps, refreshTime), null)
  assert.equal(steps.calls.at(-1), 'revoke')
})
