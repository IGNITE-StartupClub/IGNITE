export const prerender = false

import type { APIRoute } from 'astro'
import { Resend } from 'resend'
import { MongoClient } from 'mongodb'
import crypto from 'crypto'
import 'dotenv/config'
import { getRequiredFields, getQuestionLabels } from '../../data/questionnaireParser.js'
import { getApplicationEmailHTML, getApplicationEmailSubject, type ApplicationEmailData } from '../../templates/emails/applicationEmail'
import { getApplicationConfirmationEmailHTML, getApplicationConfirmationSubject } from '../../templates/emails/applicationConfirmationEmail'
import { getErrorReportEmailHTML, getErrorReportSubject } from '../../templates/emails/errorReportEmail'

const resend = new Resend(process.env.RESEND_API_KEY!)


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
          message: 'Server configuration error: No email recipients configured'
        }),
        { status: 500 }
      )
    }

    const data = await request.json()
    console.log('📑 Parsed JSON:', data)

    // Required fields validation - dynamically get fields from questionnaire config
    const requiredFields = getRequiredFields()
    for (const field of requiredFields) {
      if (!data[field]) {
        console.warn(`⚠️ Missing field ${field}`)
        return new Response(JSON.stringify({ status: 'error', message: `Feld ${field} fehlt` }), { status: 400 })
      }
    }

    // Encrypt & store
    const payload: Record<string, any> = {}
    for (const field of requiredFields) {
      const safeValue = toSafeString(data[field])
      payload[field] = encrypt(safeValue)
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
        message: 'Ein Fehler ist aufgetreten. Das Team wurde benachrichtigt.'
      }),
      { status: 500 }
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
