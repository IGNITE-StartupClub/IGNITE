export const prerender = false

import type { APIRoute } from 'astro'
import { rejectCron } from '../../../lib/cron'
import { logError } from '../../../lib/errorLog'
import { sendErrorReport } from '../../../lib/errorReportMail'

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

/**
 * Daily report of new server errors to the admins who want it (errorReportMail.ts). vercel.json calls it at 06:00 UTC,
 * so the mail is there in the morning; on Hobby the call comes anywhere within that hour.
 */
export const GET: APIRoute = async ({ request }) => {
  const rejected = rejectCron(request)
  if (rejected) return rejected
  try {
    // Production links always point to the configured site, never to the Host header of the request.
    const origin = import.meta.env.DEV ? new URL(request.url).origin : import.meta.env.SITE
    return json(200, { status: 'ok', ...(await sendErrorReport(new Date(), origin)) })
  } catch (err) {
    // Lands in the next report, if the database is reachable by then.
    await logError('Error report run failed', err)
    return json(500, { status: 'error', message: 'Fehlerbericht fehlgeschlagen' })
  }
}
