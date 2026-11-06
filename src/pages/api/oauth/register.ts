export const prerender = false

import type { APIRoute } from 'astro'
import { registerClient } from '../../../lib/connections'
import { clientKey } from '../../../lib/connectionsStore'
import { isJsonRequest } from '../../../lib/memberAuth'
import { reply } from '../../../lib/memberSession'

/**
 * Dynamic client registration (RFC 7591), public as the protocol needs it. It writes nothing: the client id is signed
 * and carries the redirect addresses, so this endpoint cannot be used to fill the database.
 */
export const POST: APIRoute = async ({ request }) => {
  if (!isJsonRequest(request.headers.get('content-type'))) {
    return reply(415, { error: 'invalid_client_metadata' })
  }
  let metadata: unknown = null
  try {
    metadata = await request.json()
  } catch {
    // Unparsable JSON ends as the refusal below.
  }
  const client = registerClient(metadata, clientKey())
  return client
    ? reply(201, client)
    : reply(400, {
        error: 'invalid_redirect_uri',
        error_description: 'Only the redirect addresses of Claude and ChatGPT are allowed.',
      })
}
