export const prerender = false

import type { APIRoute } from 'astro'
import { isJsonRequest } from '../../../lib/memberAuth'
import { reply } from '../../../lib/memberSession'
import { saveOnboardingMark } from '../../../lib/members'
import { isOnboardingMark } from '../../../lib/onboarding'
import { logError } from '../../../lib/errorLog'

/**
 * The onboarding of the signed-in member (rules in onboarding.ts). The middleware has read the session already
 * (locals.member), whose aggregation brings the onboarding state, so neither method costs a query of its own.
 * GET answers { calendar, apps }: the dialog asks again when the member comes back to the tab, because an app connects in
 * another tab.
 */
export const GET: APIRoute = ({ locals }) => {
  const { calendar, apps } = locals.member!.onboarding
  return reply(200, { calendar, apps })
}

/** Body: { mark } (ONBOARDING_MARKS). Stores the first time of the mark on the member document. */
export const POST: APIRoute = async ({ request, locals }) => {
  if (!isJsonRequest(request.headers.get('content-type'))) {
    return reply(415, { message: 'Erwartet JSON.' })
  }

  try {
    // Unparsable JSON is a malformed request like any other, not a server error.
    const body = await request.json().catch(() => null)
    if (!isOnboardingMark(body?.mark)) return reply(400, { code: 'invalid', message: 'Ungültige Anfrage.' })
    await saveOnboardingMark(locals.member!.email, body.mark)
    return reply(200, { code: 'saved' })
  } catch (err) {
    await logError('Onboarding request failed', err)
    return reply(500, { code: 'error', message: 'Fehler beim Speichern' })
  }
}
