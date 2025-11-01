export const prerender = false

import type { APIRoute } from 'astro'
import { Resend } from 'resend'
import { MongoClient } from 'mongodb'
import crypto from 'crypto'
import 'dotenv/config'

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

async function sendApplicationEmail(data: any) {
  try {
    console.log('✉️  Sending application notification to team...')
    await resend.emails.send({
      from: 'team@ignite-startupclub.de',
      to: adminRecipients,
      subject: 'Neue Bewerbung eingegangen',
      html: `
        <div style="font-family: Inter, sans-serif; padding:2rem; border:1px solid #eee; border-radius:8px; max-width:600px; margin:auto;">
          <h2 style="color:#8C3974;">📬 Neue Bewerbung</h2>
          <table style="width:100%; line-height:1.6; border-collapse: separate; border-spacing: 0;">
            <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 12px 8px; font-weight: bold; vertical-align: top; width: 35%; min-width: 120px;"><strong>Position:</strong></td><td style="padding: 12px 8px; vertical-align: top;">${data.position}</td></tr>
            <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 12px 8px; font-weight: bold; vertical-align: top;"><strong>Was reizt dich an der Position?</strong></td><td style="padding: 12px 8px; vertical-align: top; word-wrap: break-word;">${data.q1}</td></tr>
            <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 12px 8px; font-weight: bold; vertical-align: top;"><strong>Welche Erfahrungen hast du?</strong></td><td style="padding: 12px 8px; vertical-align: top; word-wrap: break-word;">${data.q2}</td></tr>
            <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 12px 8px; font-weight: bold; vertical-align: top;"><strong>Welche Stärken kannst du einbringen?</strong></td><td style="padding: 12px 8px; vertical-align: top; word-wrap: break-word;">${data.q3}</td></tr>
            <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 12px 8px; font-weight: bold; vertical-align: top;"><strong>Wie viel Zeit kannst du investieren?</strong></td><td style="padding: 12px 8px; vertical-align: top;">${data.q4}</td></tr>
            <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 12px 8px; font-weight: bold; vertical-align: top;"><strong>Wie gehst du mit Struktur-Unsicherheit um?</strong></td><td style="padding: 12px 8px; vertical-align: top; word-wrap: break-word;">${data.q5}</td></tr>
            <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 12px 8px; font-weight: bold; vertical-align: top;"><strong>Vorname:</strong></td><td style="padding: 12px 8px; vertical-align: top;">${data.name}</td></tr>
            <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 12px 8px; font-weight: bold; vertical-align: top;"><strong>Nachname:</strong></td><td style="padding: 12px 8px; vertical-align: top;">${data.lastname}</td></tr>
            <tr><td style="padding: 12px 8px; font-weight: bold; vertical-align: top;"><strong>E-Mail:</strong></td><td style="padding: 12px 8px; vertical-align: top; word-break: break-all;">${data.email}</td></tr>
          </table>
          <p style="font-size:0.85rem; color:#888; margin-top:1.5rem;">
            Diese Nachricht wurde automatisch über das Bewerbungsformular gesendet.
          </p>
        </div>
        <style>
        @media (max-width: 600px) {
          table {
            font-size: 14px;
          }
          td {
            display: block !important;
            width: 100% !important;
            padding: 8px 12px !important;
          }
          td:first-child {
            padding-bottom: 4px !important;
            border-bottom: none !important;
          }
          td:last-child {
            padding-top: 4px !important;
            padding-bottom: 16px !important;
            margin-bottom: 8px;
            border-bottom: 1px solid #e0e0e0 !important;
          }
        }
        </style>
      `,
    })
    console.log('✅ Team notification sent')
  } catch (err) {
    console.error('❌ Error sending team email:', err)
    throw err
  }
}

async function sendConfirmationEmail(email: string, name: string) {
  try {
    await resend.emails.send({
      from: 'join@ignite-startupclub.de',
      to: email,
      subject: 'Danke für deine Bewerbung – IGNITE Startup Club',
      html: `
        <div style="font-family: Inter, sans-serif; background-color: #f9f9f9; padding: 2rem; border-radius: 8px; color: #333; max-width: 600px; margin:auto;">
          <h2 style="color: #8C3974;">Vielen Dank für deine Bewerbung 🙏</h2>
          <p>Hallo${name ? ` ${name}` : ''},</p>
          <p>wir haben deine Unterlagen erhalten und werden uns so schnell wie möglich bei dir melden.</p>
          <p style="margin-top: 1.5rem;">Solltest du in der Zwischenzeit Fragen haben, antworte einfach auf diese Mail oder kontaktiere uns unter <a href="mailto:ignite.startupclub@gmail.com">ignite.startupclub@gmail.com</a>.</p>
          <hr style="margin: 2rem 0; border: none; border-top: 1px solid #ddd;" />
          <p style="font-size: 0.85rem; color: #888;">Diese E-Mail wurde automatisch generiert. Bitte nicht antworten.</p>
        </div>
      `,
    })
    console.log('✅ Confirmation email sent')
  } catch (err) {
    console.error('❌ Error sending confirmation email:', err)
    // do not re-throw: we still want to report DB errors
  }
}

async function sendErrorEmail(errorMessage: string) {
  try {
    console.log('✉️  Sending error report to team...')
    await resend.emails.send({
      from: 'team@ignite-startupclub.de',
      to: adminRecipients,
      subject: '⚠️ Fehler bei der Datenbankanfrage',
      html: `
        <div style="font-family:Inter,sans-serif;padding:2rem;border:1px solid #f5c6cb;border-radius:8px;background:#f8d7da;color:#721c24;max-width:600px;margin:auto;">
          <h2>Fehler bei der DB-Anfrage</h2>
          <p>${errorMessage}</p>
          <p><em>Dies ist eine automatisch generierte Nachricht.</em></p>
        </div>
      `,
    })
    console.log('✅ Error report sent')
  } catch (err) {
    console.error('❌ Could not send error report:', err)
  }
}

export const POST: APIRoute = async ({ request }) => {
  let client: MongoClient | null = null

  try {
    console.log('📥 Incoming request to /api/submit')
    const data = await request.json()
    console.log('📑 Parsed JSON:', data)

    // Required fields validation
    const requiredFields = ['position', 'q1', 'q2', 'q3', 'q4', 'q5', 'name', 'lastname', 'email'] as const
    for (const field of requiredFields) {
      if (!data[field]) {
        console.warn(`⚠️ Missing field ${field}`)
        return new Response(JSON.stringify({ status: 'error', message: `Feld ${field} fehlt` }), { status: 400 })
      }
    }

    // Encrypt & store
    const payload: Record<string, any> = {}
    for (const field of requiredFields) {
      payload[field] = encrypt(data[field])
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
    await sendErrorEmail(error.message)
    return new Response(JSON.stringify({ status: 'error', message: error.message }), { status: 500 })
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
