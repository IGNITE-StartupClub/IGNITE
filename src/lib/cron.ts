/**
 * Guard for the scheduled jobs under /api/cron/ (vercel.json). Vercel sends `Authorization: Bearer <CRON_SECRET>`
 * with every cron call once CRON_SECRET is set in the project. Without the variable every request is refused, so a
 * missing secret stops the jobs instead of opening them to anyone.
 * No imports besides node:crypto, so the module can be tested with node --test.
 */
import { createHash, timingSafeEqual } from 'node:crypto'

/** True when `authorization` is exactly `Bearer <secret>`. Compares digests, so the answer time reveals nothing. */
export function isCronAuthorized(authorization: string | null, secret: string | undefined): boolean {
  if (!secret) return false
  const digest = (value: string) => createHash('sha256').update(value).digest()
  return timingSafeEqual(digest(authorization ?? ''), digest(`Bearer ${secret}`))
}

/** The 401 answer for a request without the cron secret, or null when the job may run. */
export function rejectCron(request: Request): Response | null {
  const secret = process.env.CRON_SECRET
  if (!secret) console.error('CRON_SECRET is not set, so every cron request is refused.')
  if (isCronAuthorized(request.headers.get('authorization'), secret)) return null
  return new Response(JSON.stringify({ message: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })
}
