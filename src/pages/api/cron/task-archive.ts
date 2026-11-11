export const prerender = false

import type { APIRoute } from 'astro'
import { rejectCron } from '../../../lib/cron'
import { settleFinishedTasks } from '../../../lib/tasksStore'
import { logError } from '../../../lib/errorLog'

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

/**
 * Nightly (vercel.json, 03:00 UTC, when nobody works on the board): moves finished single tasks that nobody changed for
 * a while to the archive (settleFinishedTasks), so the tasks page does not grow with every finished task.
 */
export const GET: APIRoute = async ({ request }) => {
  const rejected = rejectCron(request)
  if (rejected) return rejected
  try {
    return json(200, { status: 'ok', archived: await settleFinishedTasks(new Date()) })
  } catch (err) {
    await logError('Task archive run failed', err)
    return json(500, { status: 'error', message: 'Archivieren fehlgeschlagen' })
  }
}
