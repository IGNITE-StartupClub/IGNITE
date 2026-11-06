export const prerender = false

import type { APIRoute } from 'astro'
import { protectedResourceMetadata } from '../../../lib/connections'

/** RFC 9728. Clients ask at the path of the MCP endpoint or at the root, so both answer. */
export const GET: APIRoute = ({ url }) => Response.json(protectedResourceMetadata(url.origin))
