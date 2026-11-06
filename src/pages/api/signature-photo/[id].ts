export const prerender = false

import type { APIRoute } from 'astro'
import { isPhotoId } from '../../../lib/emailSignature'
import { photoType } from '../../../lib/memberAuth'
import { findPhoto } from '../../../lib/members'

/**
 * Signature photos of members, public on purpose: recipients' mail clients load them without a session. Each upload
 * gets a new random id (savePhoto), and the ids it replaces answer with the new image, because pasted signatures and
 * sent mails keep their URLs. The image comes directly, not as a redirect, since mail clients need not follow one. A URL
 * can therefore change its content, so it is cached for a day only; a removed photo answers 404.
 */
export const GET: APIRoute = async ({ params }) => {
  const id = params.id ?? ''
  const image = isPhotoId(id) ? await findPhoto(id) : null
  if (!image) {
    return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain' } })
  }
  return new Response(new Uint8Array(image), {
    headers: {
      'Content-Type': photoType(image),
      'Cache-Control': 'public, max-age=86400',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
    },
  })
}
