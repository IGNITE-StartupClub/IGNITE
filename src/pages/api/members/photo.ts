export const prerender = false

import type { APIRoute } from 'astro'
import { photoPath } from '../../../lib/emailSignature'
import { decodePhoto, isJsonRequest } from '../../../lib/memberAuth'
import { deletePhotos, savePhoto } from '../../../lib/members'
import { currentMember, reply } from '../../../lib/memberSession'

// A 192 px JPEG as base64 needs about a quarter of this; larger bodies are refused before parsing.
const MAX_BODY_CHARS = 200_000

/**
 * Signature photo of the signed-in member (PhotoCropper island). POST { image: JPEG data URL } stores the photo,
 * already cut square in the browser, and answers { path }; DELETE removes it. The middleware requires a session.
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isJsonRequest(request.headers.get('content-type'))) {
    return reply(415, { message: 'Erwartet JSON.' })
  }
  try {
    const body = await request.text()
    if (body.length > MAX_BODY_CHARS) {
      return reply(413, { code: 'size', message: 'Das Foto ist zu groß.' })
    }
    const member = await currentMember(cookies)
    if (!member) {
      return reply(401, { code: 'session', message: 'Nicht angemeldet.' })
    }
    let image: Buffer | null = null
    try {
      image = decodePhoto(JSON.parse(body).image)
    } catch {
      // Unparsable JSON is the same invalid request as a missing or broken image.
    }
    if (!image) {
      return reply(400, { code: 'invalid', message: 'Das Foto konnte nicht gelesen werden.' })
    }
    return reply(200, { path: photoPath(await savePhoto(member.email, image)) })
  } catch (err) {
    console.error('Saving signature photo failed:', err)
    return reply(500, { message: 'Fehler beim Speichern des Fotos' })
  }
}

export const DELETE: APIRoute = async ({ cookies }) => {
  try {
    const member = await currentMember(cookies)
    if (!member) {
      return reply(401, { code: 'session', message: 'Nicht angemeldet.' })
    }
    await deletePhotos(member.email)
    return reply(200, { path: '' })
  } catch (err) {
    console.error('Deleting signature photo failed:', err)
    return reply(500, { message: 'Fehler beim Löschen des Fotos' })
  }
}
