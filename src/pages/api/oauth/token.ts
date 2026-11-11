export const prerender = false

import type { APIRoute } from 'astro'
import { isClientId } from '../../../lib/connections'
import { clientKey, redeemAuthCode, refreshConnection } from '../../../lib/connectionsStore'
import { logError } from '../../../lib/errorLog'

const answer = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })

/**
 * Token endpoint of the OAuth flow, called by the apps' servers as a form post without Origin (isCrossSiteForm lets it
 * through). The client proves itself with the PKCE verifier or the refresh token. Claude registers again after 401
 * `invalid_client`, which is why an unknown client id gets that answer instead of 400.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const form = new URLSearchParams(await request.text())
    const clientId = form.get('client_id')
    if (!clientId || !isClientId(clientId, clientKey())) return answer(401, { error: 'invalid_client' })

    const tokens = await tokensFor(form, clientId)
    if (tokens === 'unsupported') return answer(400, { error: 'unsupported_grant_type' })
    return tokens ? answer(200, tokens) : answer(400, { error: 'invalid_grant' })
  } catch (err) {
    await logError('OAuth token request failed', err)
    return answer(500, { error: 'server_error' })
  }
}

async function tokensFor(form: URLSearchParams, clientId: string) {
  switch (form.get('grant_type')) {
    case 'authorization_code': {
      const code = form.get('code')
      const redirectUri = form.get('redirect_uri')
      const verifier = form.get('code_verifier')
      if (!code || !redirectUri || !verifier) return null
      return redeemAuthCode({ code, clientId, redirectUri, verifier, resource: form.get('resource') })
    }
    case 'refresh_token': {
      const refreshToken = form.get('refresh_token')
      return refreshToken ? refreshConnection(refreshToken, clientId) : null
    }
    default:
      return 'unsupported'
  }
}
