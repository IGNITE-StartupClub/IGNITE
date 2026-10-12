export const prerender = false

import { Resend } from 'resend'
import { MongoClient } from 'mongodb'
import 'dotenv/config'
import { assertSent } from '../../lib/resend'
import { startDoubleOptIn } from '../../lib/newsletterSignup'
import {
  getSubscriptionConfirmedEmailHTML,
  getSubscriptionConfirmedSubject,
} from '../../templates/emails/subscriptionConfirmedEmail'

const resend = new Resend(process.env.RESEND_HOLY_GRAIL!)
const MONGO_URI = process.env.MONGODB_URI!
const MONGO_DB = process.env.MONGODB_DB!
const AUDIENCE_ID = process.env.AUDIENCE_ID!

let client: MongoClient | null = null

// Initialize MongoDB client connection
const getDb = async () => {
  if (!client) {
    try {
      console.log('Connecting to MongoDB...')

      // Logging more details before attempting to connect
      const url = new URL(MONGO_URI)
      console.log(`MongoDB URI parsed: ${url.hostname}, ${url.pathname}`)

      // Attempting to create a new MongoDB client and connect
      client = new MongoClient(MONGO_URI)
      console.log('Attempting to connect to MongoDB...')
      await client.connect()
      console.log('MongoDB connected successfully.')

      // Create TTL index for automatic deletion after 24 hours
      const db = client.db(MONGO_DB)
      await db.collection('pending_confirmations').createIndex(
        { createdAt: 1 },
        { expireAfterSeconds: 86400 }, // 24 hours = 86400 seconds
      )
      console.log('TTL index created/verified for pending_confirmations')
    } catch (err) {
      // Enhanced error logging with stack trace
      console.error('MongoDB connection error:', err)
      if (err instanceof Error) {
        console.error('Error stack trace:', err.stack)
      }
      throw new Error('MongoDB connection failed')
    }
  }

  // Log the database connection confirmation
  console.log(`Returning connected database: ${MONGO_DB}`)
  return client.db(MONGO_DB)
}

export const POST = async ({ request }) => {
  try {
    console.log('Received request to newsletter API')

    // Parse the request body
    const { email, firstName, lastName, isConfirming, token } = await request.json()
    console.log('Request data:', { email, firstName, lastName, isConfirming })

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      console.log('Invalid email address:', email)
      return new Response(JSON.stringify({ message: 'Ungültige E-Mail-Adresse.' }), { status: 400 })
    }

    const db = await getDb()

    if (isConfirming) {
      // This is a confirmation request - add contact to Resend with full details
      console.log('Processing confirmation for:', email)

      try {
        // The token from the confirmation link proves control of the mailbox. Matching on the
        // email alone would let anyone confirm another person's address.
        const pendingConfirmation =
          typeof token === 'string' ? await db.collection('pending_confirmations').findOne({ email, token }) : null

        if (!pendingConfirmation) {
          console.log('No pending confirmation found for email:', email)
          return new Response(
            JSON.stringify({
              message: 'Keine ausstehende Bestätigung gefunden.',
            }),
            { status: 404 },
          )
        }

        // Create contact in Resend
        console.log('Creating contact in Resend with data:', {
          email,
          firstName,
          lastName,
          audienceId: AUDIENCE_ID,
        })

        const resendResponse = assertSent(
          await resend.contacts.create({
            email: email,
            firstName: firstName || pendingConfirmation.firstName || '',
            lastName: lastName || pendingConfirmation.lastName || '',
            unsubscribed: false,
            audienceId: AUDIENCE_ID,
          }),
        )

        console.log('Contact added to Resend successfully:', resendResponse)

        // Remove from pending confirmations immediately after successful confirmation
        await db.collection('pending_confirmations').deleteOne({ email })
        console.log('Removed from pending confirmations')

        // Send the short confirmation to the confirmed subscriber
        const confirmedFirstName = firstName || pendingConfirmation.firstName || ''
        console.log('Sending confirmed email to:', email)
        // The contact is already confirmed and the pending entry is gone, so a failed
        // confirmed-mail failure must not turn the confirmation into an error the user would retry.
        try {
          assertSent(
            await resend.emails.send({
              from: 'IGNITE Startup Club <news@info.ignite-startupclub.de>',
              to: email,
              subject: getSubscriptionConfirmedSubject(),
              html: getSubscriptionConfirmedEmailHTML(confirmedFirstName),
            }),
          )
          console.log('Confirmed email sent successfully')
        } catch (err) {
          console.error('Confirmed email failed for confirmed subscriber:', err)
        }

        return new Response(
          JSON.stringify({
            message: 'Newsletter-Anmeldung bestätigt! Willkommen beim IGNITE Startup Club!',
          }),
          { status: 200 },
        )
      } catch (error) {
        console.error('Error processing confirmation:', error)

        // Check if it's a duplicate email error from Resend
        if (error instanceof Error && error.message.includes('already exists')) {
          console.log('Email already exists in Resend, removing from pending...')
          await db.collection('pending_confirmations').deleteOne({ email })
          return new Response(
            JSON.stringify({
              message: 'E-Mail bereits bestätigt!',
            }),
            { status: 200 },
          )
        }

        return new Response(
          JSON.stringify({
            message: 'Fehler bei der Bestätigung. Bitte versuche es erneut.',
          }),
          { status: 500 },
        )
      }
    } else {
      // This is an initial subscription - send confirmation email
      console.log('Processing initial subscription for:', email)

      const result = await startDoubleOptIn(db, resend, { email, firstName, lastName })

      if (result === 'pending') {
        console.log('Email already has pending confirmation:', email)
        return new Response(
          JSON.stringify({
            message: 'Eine Bestätigungsmail wurde bereits gesendet. Bitte prüfe dein Postfach.',
          }),
          { status: 409 },
        )
      }
      console.log('Confirmation email sent successfully')

      return new Response(JSON.stringify({ message: 'Bestätigungsmail gesendet' }), { status: 200 })
    }
  } catch (err) {
    console.error('Error occurred:', err)
    return new Response(JSON.stringify({ message: 'Fehler beim E-Mail-Versand' }), { status: 500 })
  }
}
