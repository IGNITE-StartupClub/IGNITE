export const prerender = false

import type { APIRoute } from 'astro'
import { isPhotoId } from '../../../lib/emailSignature'
import { findPhoto } from '../../../lib/members'

/**
 * Signature photos of members, public on purpose: recipients' mail clients load them without a session. Each upload
 * gets a new random id (savePhoto), so a URL never changes its content and may be cached for a year; a replaced or
 * deleted photo answers 404.
 */
export const GET: APIRoute = async ({ params }) => {
  const id = params.id ?? ''
  const image = isPhotoId(id) ? await findPhoto(id) : null
  if (!image) {
    return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain' } })
  }
  return new Response(new Uint8Array(image), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
    },
  })
}
