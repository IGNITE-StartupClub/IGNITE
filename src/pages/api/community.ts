export const prerender = false

import type { APIRoute } from 'astro'
import { Resend } from 'resend'
import { MongoClient } from 'mongodb'
import 'dotenv/config'
import { assertSent } from '../../lib/resend'
import { globalConfig } from '../../data/staticContent'
import { getCommunityInviteEmailHTML, getCommunityInviteSubject } from '../../templates/emails/communityInviteEmail'

const resend = new Resend(process.env.RESEND_API_KEY!)
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

let client: MongoClient | null = null

const getInvites = async () => {
  if (!client) {
    const connecting = new MongoClient(process.env.MONGODB_URI!)
    await connecting.connect()
    await connecting
      .db(process.env.MONGODB_DB!)
      .collection('community_invites')
      .createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 })
    client = connecting
  }
  return client.db(process.env.MONGODB_DB!).collection('community_invites')
}

const reply = (status: number, message: string) =>
  new Response(JSON.stringify({ message }), { status, headers: { 'Content-Type': 'application/json' } })

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email: rawEmail } = await request.json()
    const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : ''
    if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
      return reply(400, 'Ungültige E-Mail-Adresse.')
    }

    // One invite per address and 24 hours: repeated submits must not mail the same inbox again and again.
    const invites = await getInvites()
    const { upsertedCount } = await invites.updateOne(
      { email },
      { $setOnInsert: { createdAt: new Date() } },
      { upsert: true },
    )
    if (upsertedCount === 0) {
      return reply(409, 'Der Einladungslink wurde bereits gesendet. Bitte prüfe dein Postfach.')
    }

    try {
      assertSent(
        await resend.emails.send({
          from: 'IGNITE Startup Club <community@info.ignite-startupclub.de>',
          to: email,
          replyTo: globalConfig.contactEmail,
          subject: getCommunityInviteSubject(),
          html: getCommunityInviteEmailHTML(),
        }),
      )
    } catch (err) {
      // Without the mail the entry would block a retry for 24 hours.
      await invites.deleteOne({ email })
      throw err
    }

    return reply(200, 'Einladungslink gesendet')
  } catch (err) {
    console.error('Community invite failed:', err)
    return reply(500, 'Fehler beim E-Mail-Versand')
  }
}
