export const prerender = false

import type { APIRoute } from 'astro'
import { rejectCron } from '../../../lib/cron'
import { sendDigests } from '../../../lib/taskDigest'

/**
 * Daily digest of new task assignments (taskDigest.ts). vercel.json calls it at 17:00 and 18:00 UTC: in summer
 * (CEST) the first call is 19:00 in Berlin, in winter (CET) the second, and the call before 19:00 does nothing.
 * The call after the one that sent works as a retry for failed digests; sent ones are never sent twice.
 */
export const GET: APIRoute = async ({ request }) => {
  const rejected = rejectCron(request)
  if (rejected) return rejected
  try {
    // Production links always point to the configured site, never to the Host header of the request.
    const origin = import.meta.env.DEV ? new URL(request.url).origin : import.meta.env.SITE
    const run = await sendDigests(new Date(), origin)
    return new Response(JSON.stringify({ status: 'ok', ...run }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('Task digest run failed:', err)
    return new Response(JSON.stringify({ status: 'error', message: 'Digest fehlgeschlagen' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
