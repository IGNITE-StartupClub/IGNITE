export const prerender = false

import type { APIRoute } from 'astro'
import { rejectCron } from '../../../lib/cron'
import { sendDigests } from '../../../lib/taskDigest'
import { logError } from '../../../lib/errorLog'

/**
 * Daily digest of new task assignments (taskDigest.ts). vercel.json calls it at 17:00, 18:00 and 19:00 UTC; on Hobby
 * each call comes anywhere within its hour. In summer (CEST) the first call is 19:00 in Berlin and the two after it
 * retry failed digests. In winter (CET) the first call comes before 19:00 and does nothing, the second sends and the
 * third retries. Sent digests are never sent twice.
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
    await logError('Task digest run failed', err)
    return new Response(JSON.stringify({ status: 'error', message: 'Digest fehlgeschlagen' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
