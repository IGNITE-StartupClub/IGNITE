export const prerender = false

import type { APIRoute } from 'astro'
import { Resend } from 'resend'
import { MongoClient } from 'mongodb'
import crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import 'dotenv/config'
import { getQuestionLabels } from '../../data/questionnaireParser.js'
import {
  getApplicationEmailHTML,
  getApplicationEmailSubject,
  type ApplicationEmailData,
} from '../../templates/emails/applicationEmail'
import {
  getApplicationConfirmationEmailHTML,
  getApplicationConfirmationSubject,
} from '../../templates/emails/applicationConfirmationEmail'
import { getErrorReportEmailHTML, getErrorReportSubject } from '../../templates/emails/errorReportEmail'

const resend = new Resend(process.env.RESEND_API_KEY!)
const resendHolyGrail = new Resend(process.env.RESEND_HOLY_GRAIL!)

// --- ENV-VALIDATION ---
const requiredEnvs = ['RESEND_API_KEY', 'MONGODB_URI', 'MONGODB_DB', 'ENCRYPTION_SECRET', 'EMAIL_RECIPIENT_1']
for (const key of requiredEnvs) {
  if (!process.env[key]) {
    console.error(`❌ Missing env var ${key}`)
    throw new Error(`Env var ${key} is required`)
  }
}

const adminRecipients = [process.env.EMAIL_RECIPIENT_1, process.env.EMAIL_RECIPIENT_2].filter(Boolean) as string[]

// Helper to safely convert any value to string for encryption
function toSafeString(value: any): string {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'string') {
    return value
  }
  if (Array.isArray(value)) {
    return JSON.stringify(value)
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

function encrypt(text: string) {
  try {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(process.env.ENCRYPTION_SECRET!, 'hex'), iv)
    let enc = cipher.update(text, 'utf8', 'hex')
    enc += cipher.final('hex')
    const tag = cipher.getAuthTag()
    return `${iv.toString('hex')}:${enc}:${tag.toString('hex')}`
  } catch (err) {
    console.error('❌ Encryption error:', err)
    throw err
  }
}

async function sendApplicationEmail(data: ApplicationEmailData) {
  try {
    console.log('✉️  Sending application notification to team...')

    if (adminRecipients.length === 0) {
      console.error('❌ No admin recipients configured! Skipping team notification.')
      throw new Error('No admin recipients configured')
    }

    // Get question labels dynamically from questionnaire config
    const questionLabels = getQuestionLabels()

    const subject = getApplicationEmailSubject()
    const html = getApplicationEmailHTML(data, questionLabels)

    const result = await resend.emails.send({
      from: 'team@ignite-startupclub.de',
      to: adminRecipients,
      subject: subject,
      html: html,
    })
    console.log('✅ Team notification sent successfully')
    console.log(`📧 Email ID: ${result.data?.id || 'unknown'}`)
  } catch (err) {
    console.error('❌ Error sending team email:', err)
    throw err
  }
}

async function sendConfirmationEmail(email: string, name: string) {
  try {
    if (!email || !email.includes('@')) {
      console.error(`❌ Invalid email address: ${email}`)
      throw new Error(`Invalid email address: ${email}`)
    }

    console.log(`✉️  Sending confirmation email to ${email}...`)

    const subject = getApplicationConfirmationSubject()
    const html = getApplicationConfirmationEmailHTML(name)

    const result = await resend.emails.send({
      from: 'join@ignite-startupclub.de',
      to: email,
      subject: subject,
      html: html,
    })
    console.log('✅ Confirmation email sent successfully')
    console.log(`📧 Email ID: ${result.data?.id || 'unknown'}`)
  } catch (err) {
    console.error('❌ Error sending confirmation email:', err)
    // do not re-throw: we still want to report DB errors and send team notification
    // but log this error for debugging
  }
}

async function sendErrorEmail(errorMessage: string, context?: string) {
  try {
    if (adminRecipients.length === 0) {
      console.error('❌ No admin recipients configured! Cannot send error report.')
      console.error('Please set EMAIL_RECIPIENT_1 and/or EMAIL_RECIPIENT_2 environment variables.')
      return
    }

    console.log('✉️  Sending error report to team...')
    console.log(`📧 Recipients: ${adminRecipients.join(', ')}`)

    const subject = getErrorReportSubject()
    const html = getErrorReportEmailHTML(errorMessage, context)

    await resend.emails.send({
      from: 'team@ignite-startupclub.de',
      to: adminRecipients,
      subject: subject,
      html: html,
    })
    console.log('✅ Error report sent successfully')
  } catch (err) {
    console.error('❌ Could not send error report:', err)
    console.error('Original error was:', errorMessage)
  }
}

async function handleNewsletterSubscription(db: any, email: string, firstName: string, lastName: string) {
  try {
    console.log('📧 Starting newsletter double opt-in process for:', email)

    // Check if email already exists in pending confirmations
    const existingPending = await db.collection('pending_confirmations').findOne({ email })
    if (existingPending) {
      console.log('📧 Email already has pending confirmation:', email)
      return // Don't send duplicate confirmation email
    }

    // Generate confirmation token
    const token = uuidv4()
    const SITE_URL = process.env.SITE_URL || 'https://ignite-startupclub.de'
    const confirmUrl = `${SITE_URL}/subscribe?token=${token}`
    const cancelUrl = `${SITE_URL}/subscribe?cancel=${email}`

    // Store in pending confirmations
    await db.collection('pending_confirmations').insertOne({
      email,
      firstName: firstName || '',
      lastName: lastName || '',
      token,
      createdAt: new Date(),
    })
    console.log('✅ Newsletter confirmation data stored in DB')

    // Send confirmation email
    await resendHolyGrail.emails.send({
      from: 'IGNITE Startup Club <news@ignite-startupclub.de>',
      to: email,
      subject: 'Willkommen beim IGNITE Startup Club!',
      html: `
        <div style="font-family: Inter, sans-serif; background-color: #f9f9f9; padding: 2rem; border-radius: 8px; color: #333;">
          <h2 style="color: #8C3974;">Willkommen beim IGNITE Startup Club 🎉</h2>
          <p>Schön, dass du dich für unsere Initiative interessierst!</p>

          <p>Du möchtest nichts verpassen? Dann bestätige deine E-Mail und erhalte News durch unseren Newsletter!</p>

          <p style="text-align: center; margin: 2rem 0;">
            <a href="${confirmUrl}"
              style="display: inline-block; background-color: #8C3974; color: #fff; padding: 0.75rem 1.5rem; border-radius: 6px; text-decoration: none; font-weight: bold;">
              📧 Newsletter abonnieren
            </a>
          </p>

          <p>Wenn du dich für unseren Newsletter anmeldest, bleibst du immer auf dem Laufenden über folgende Themen:</p>
          <ul style="line-height: 1.6;">
            <li>Events und Workshops rund ums Gründen in Lüneburg und Hamburg</li>
            <li>Einblicke in reale Startup-Projekte</li>
            <li>Austausch mit Gleichgesinnten</li>
          </ul>

          <p>Noch einfacher? Dann tritt direkt unserer WhatsApp-Community bei:</p>

          <p style="text-align: center; margin: 2rem 0;">
            <a href="https://chat.whatsapp.com/HtvynOI8sY125MmBZR4C1n"
              style="display: inline-block; background-color: #8C3974; color: #fff; padding: 0.75rem 1.5rem; border-radius: 6px; text-decoration: none; font-weight: bold;">
              👉 Jetzt WhatsApp-Gruppe beitreten
            </a>
          </p>

          <p style="font-size: 0.95rem; color: #555;">
            Falls du dich nicht selbst angemeldet hast, kannst du diese E-Mail einfach ignorieren oder dich jederzeit abmelden. Klicke dazu einfach auf den folgenden Link:
              <a href="${cancelUrl}"
              style="display: text-decoration: none; color: #8C3974; font-weight: bold;">
              Vom IGNITE Newsletter abmelden
            </a>
          </p>
        </div>
      `,
    })
    console.log('✅ Newsletter confirmation email sent')
  } catch (err) {
    console.error('❌ Error in newsletter subscription:', err)
    // Don't throw - we still want the main application to succeed
  }
}

async function addContactToMitmachenSegment(email: string, firstName: string, lastName: string) {
  try {
    console.log('👤 Adding contact to Resend with segment "Mitmachen":', email)

    const AUDIENCE_ID = process.env.AUDIENCE_ID
    if (!AUDIENCE_ID) {
      console.error('❌ AUDIENCE_ID not configured')
      return
    }

    // Create contact in Resend
    await resendHolyGrail.contacts.create({
      email: email,
      firstName: firstName || '',
      lastName: lastName || '',
      unsubscribed: false,
      audienceId: AUDIENCE_ID,
    })
    console.log('✅ Contact added to Resend audience')

    // TODO: Add to "Mitmachen" segment when Resend API supports it
    // For now, the contact is in the audience and can be manually segmented
  } catch (err: any) {
    console.error('❌ Error adding contact to Resend:', err)
    // Check if it's a duplicate error - that's ok
    if (err.message && err.message.includes('already exists')) {
      console.log('ℹ️  Contact already exists in Resend')
    }
    // Don't throw - we still want the main application to succeed
  }
}

export const POST: APIRoute = async ({ request }) => {
  let client: MongoClient | null = null

  try {
    console.log('📥 Incoming request to /api/submit')
    console.log(`📧 Configured recipients: ${adminRecipients.join(', ')}`)

    // Validate admin recipients
    if (adminRecipients.length === 0) {
      console.error('❌ No admin recipients configured!')
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Server configuration error: No email recipients configured',
        }),
        { status: 500 },
      )
    }

    const data = await request.json()
    console.log('📑 Parsed JSON:', data)

    // Only validate truly critical fields needed for functionality
    // Email is required for confirmation, name for personalization
    if (!data.email || !String(data.email).includes('@')) {
      console.warn('⚠️ Invalid or missing email')
      return new Response(JSON.stringify({ status: 'error', message: 'Gültige E-Mail-Adresse erforderlich' }), {
        status: 400,
      })
    }

    if (!data.name || String(data.name).trim() === '') {
      console.warn('⚠️ Missing name')
      return new Response(JSON.stringify({ status: 'error', message: 'Name erforderlich' }), { status: 400 })
    }

    // Encrypt & store ALL submitted fields dynamically (future-proof)
    const payload: Record<string, any> = {}
    for (const [field, value] of Object.entries(data)) {
      // Skip null/undefined, but keep everything else (including empty strings if submitted)
      if (value !== null && value !== undefined) {
        const safeValue = toSafeString(value)
        payload[field] = encrypt(safeValue)
      }
    }
    payload.createdAt = new Date()

    console.log('🔐 Payload encrypted, connecting to MongoDB...')
    client = new MongoClient(process.env.MONGODB_URI!)
    await client.connect()
    const db = client.db(process.env.MONGODB_DB)
    const res = await db.collection('applicant').insertOne(payload)
    console.log('✅ Inserted document with _id=', res.insertedId)

    // Notify team
    await sendApplicationEmail(data)

    // Confirm to applicant
    await sendConfirmationEmail(data.email, data.name)

    // Handle newsletter subscription or contact creation
    if (data.subscribeNewsletter === true || data.subscribeNewsletter === 'true') {
      console.log('📧 User wants newsletter - starting double opt-in')
      await handleNewsletterSubscription(db, data.email, data.name, data.lastname)
    } else {
      console.log('👤 User does not want newsletter - adding to Mitmachen segment')
      await addContactToMitmachenSegment(data.email, data.name, data.lastname)
    }

    return new Response(JSON.stringify({ status: 'ok' }), { status: 200 })
  } catch (error: any) {
    console.error('🔥 Unhandled error in POST handler:', error)
    console.error('Error stack:', error.stack)

    // Determine error context
    let errorContext = 'Unknown error during application submission'
    if (error.message?.includes('encrypt')) {
      errorContext = 'Encryption error - could not encrypt application data'
    } else if (error.message?.includes('MongoDB') || error.message?.includes('connect')) {
      errorContext = 'Database connection error'
    } else if (error.message?.includes('insertOne')) {
      errorContext = 'Database insert error'
    } else if (error.message?.includes('email') || error.message?.includes('resend')) {
      errorContext = 'Email sending error'
    }

    // Send error report with context
    await sendErrorEmail(`${error.message}\n\nStack: ${error.stack}`, errorContext)

    return new Response(
      JSON.stringify({
        status: 'error',
        message: 'Ein Fehler ist aufgetreten. Das Team wurde benachrichtigt.',
      }),
      { status: 500 },
    )
  } finally {
    if (client) {
      try {
        await client.close()
        console.log('🔒 MongoDB connection closed')
      } catch (err) {
        console.error('❌ Error closing MongoDB connection:', err)
      }
    }
  }
}
