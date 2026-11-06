export const prerender = false

import type { APIRoute } from 'astro'
import { authorizationServerMetadata } from '../../lib/connections'
import { memberPagePath } from '../../lib/memberAuth'

/** RFC 8414. The authorization endpoint is the consent page itself, so nothing is stored before the member agrees. */
export const GET: APIRoute = ({ url }) => Response.json(authorizationServerMetadata(url.origin, memberPagePath('connect', 'de')))
