export const prerender = false

import type { APIRoute } from 'astro'
import { createHash } from 'node:crypto'
import { Resend } from 'resend'
import { MongoClient } from 'mongodb'
import 'dotenv/config'
import { assertSent } from '../../lib/resend'
import { logError } from '../../lib/errorLog'
import { parseGuideRequest } from '../../lib/guideRequest'
import { globalConfig } from '../../data/staticContent'
import { guidePackages } from '../../data/guidePackages'
import {
  getGuideConfirmationEmailHTML,
  getGuideConfirmationSubject,
  getGuideRequestEmailHTML,
  getGuideRequestSubject,
} from '../../templates/emails/guideRequestEmail'

const resend = new Resend(process.env.RESEND_API_KEY!)
const PACKAGE_IDS = guidePackages.map((item) => item.id)
// Each request sends two mails, one to an address anyone can type in. Resend's free plan allows 100 a day,
// so a cap keeps a script from using them up and blocking the application and contact mails.
const MAX_REQUESTS_PER_HOUR = 15
const MAX_REQUESTS_PER_ADDRESS = 3

let client: MongoClient | null = null

// Only a hash of the address and the time are kept, for 24 hours, to count requests.
const getRequests = async () => {
  if (!client) {
    const connecting = new MongoClient(process.env.MONGODB_URI!)
    await connecting.connect()
    await connecting
      .db(process.env.MONGODB_DB!)
      .collection('guide_requests')
      .createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 })
    client = connecting
  }
  return client.db(process.env.MONGODB_DB!).collection('guide_requests')
}

const reply = (status: number, message: string) =>
  new Response(JSON.stringify({ message }), { status, headers: { 'Content-Type': 'application/json' } })

export const POST: APIRoute = async ({ request }) => {
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return reply(400, 'Ungültige Anfrage.')
    }

    const parsed = parseGuideRequest(body, PACKAGE_IDS)
    if (!parsed.ok) {
      // Bots get the same answer as people, so they do not learn about the hidden field.
      if (parsed.problem === 'honeypot') return reply(200, 'Anfrage gesendet')
      return reply(400, 'Bitte prüfe deine Angaben.')
    }
    const guide = parsed.request

    const requests = await getRequests()
    const emailHash = createHash('sha256').update(guide.email).digest('hex')
    // Not atomic with the insert below, so a burst can overshoot by a few. Good enough for a cap on abuse.
    const [lastHour, sameAddress] = await Promise.all([
      requests.countDocuments({ createdAt: { $gte: new Date(Date.now() - 3600 * 1000) } }),
      requests.countDocuments({ emailHash }),
    ])
    if (lastHour >= MAX_REQUESTS_PER_HOUR) {
      return reply(429, 'Gerade sind zu viele Anfragen eingegangen. Bitte versuche es später erneut.')
    }
    if (sameAddress >= MAX_REQUESTS_PER_ADDRESS) {
      return reply(409, 'Für diese Adresse sind heute schon Anfragen eingegangen. Wir melden uns bei dir.')
    }

    const recipients = [process.env.EMAIL_RECIPIENT_1, process.env.EMAIL_RECIPIENT_2].filter(Boolean) as string[]
    if (recipients.length === 0) throw new Error('Keine gültigen Empfängeradressen definiert.')

    // The team works in German, so the mails name the packages with their German titles.
    const titles = guidePackages.filter((item) => guide.packages.includes(item.id)).map((item) => item.title)

    const { insertedId } = await requests.insertOne({ emailHash, createdAt: new Date() })
    try {
      assertSent(
        await resend.emails.send({
          from: 'IGNITE Guide <guide@info.ignite-startupclub.de>',
          to: recipients,
          replyTo: guide.email,
          subject: getGuideRequestSubject(guide),
          html: getGuideRequestEmailHTML(guide, titles),
        }),
      )
    } catch (err) {
      // Without the team mail nothing happened, so the request must not count against the person.
      await requests.deleteOne({ _id: insertedId })
      throw err
    }

    try {
      assertSent(
        await resend.emails.send({
          from: 'IGNITE Startup Club <guide@info.ignite-startupclub.de>',
          to: guide.email,
          replyTo: globalConfig.contactEmail,
          subject: getGuideConfirmationSubject(),
          html: getGuideConfirmationEmailHTML(guide, titles),
        }),
      )
    } catch (err) {
      // The team has the request and will answer, so the person still gets a success message.
      await logError('Guide confirmation failed', err)
    }

    return reply(200, 'Anfrage gesendet')
  } catch (err) {
    await logError('Guide request failed', err)
    return reply(500, 'Fehler beim E-Mail-Versand')
  }
}
