export const prerender = false

import type { APIRoute } from 'astro'
import { MongoClient } from 'mongodb'
import { Resend } from 'resend'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY!)

// --- Helper: Decryption Logic ---
function decrypt(encrypted: string): string {
  try {
    const [ivHex, encHex, tagHex] = encrypted.split(':')
    if (!ivHex || !encHex || !tagHex) return '[Ungültiges Format]'

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(process.env.ENCRYPTION_SECRET!, 'hex'),
      Buffer.from(ivHex, 'hex'),
    )
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
    let dec = decipher.update(encHex, 'hex', 'utf8')
    dec += decipher.final('utf8')
    return dec
  } catch {
    return '[Entschlüsselungsfehler]'
  }
}

function decryptDocument(doc: any) {
  const result: any = {}
  for (const [key, value] of Object.entries(doc)) {
    if (key === '_id' || key === 'createdAt') {
      result[key] = value
      continue
    }
    if (typeof value === 'string' && value.includes(':')) {
      result[key] = decrypt(value)
    } else {
      result[key] = value
    }
  }
  return result
}

// --- Helper: HTML Template ---
function buildEmailHTML(docs: any[]) {
  const labelMap: Record<string, string> = {
    name: 'Vorname',
    lastname: 'Nachname',
    email: 'E-Mail',
    teams: 'Teams',
    startupInterest: 'Startup-Interesse',
    subscribeNewsletter: 'Newsletter',
  }

  const applicantBlocks = docs.map((doc, i) => {
    const date = new Date(doc.createdAt).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })
    const rows = Object.entries(doc)
      .filter(([key]) => !['_id', 'createdAt'].includes(key))
      .map(([key, value]) => {
        const label = labelMap[key] ?? key
        return `
          <tr style="border-bottom:1px solid #eee;">
            <td style="padding:10px; font-weight:bold; color:#555; width:35%;">${label}</td>
            <td style="padding:10px; word-break:break-word;">${value}</td>
          </tr>`
      }).join('')

    return `
      <div style="margin-bottom:2rem; border:1px solid #e0e0e0; border-radius:8px; overflow:hidden;">
        <div style="background:#8C3974; color:#fff; padding:10px 16px; font-weight:bold;">
          Bewerbung #${i + 1} &nbsp;·&nbsp; <span style="font-weight:normal; font-size:0.9em;">${date}</span>
        </div>
        <table style="width:100%; border-collapse:collapse; font-size:14px;">${rows}</table>
      </div>`
  }).join('')

  return `
    <div style="font-family:sans-serif; max-width:700px; margin:auto; padding:20px;">
      <h2 style="color:#8C3974;">📋 Monatliche Bewerberübersicht</h2>
      <p style="color:#555;">In den letzten 30 Tagen sind <strong>${docs.length}</strong> neue Bewerbung(en) eingegangen.</p>
      ${applicantBlocks}
      <hr style="border:none; border-top:1px solid #eee; margin:20px 0;" />
      <p style="font-size:11px; color:#aaa;">Automatisch generierter Export via Astro Cron.</p>
    </div>`
}

// --- Main API Route ---
export const GET: APIRoute = async ({ request }) => {
  // 1. Auth Check
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const client = new MongoClient(process.env.MONGODB_URI!)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  try {
    await client.connect()
    const db = client.db(process.env.MONGODB_DB)
    
    // Fetch only the last 30 days
    const rawDocs = await db.collection('applicant')
      .find({ createdAt: { $gte: thirtyDaysAgo } })
      .sort({ createdAt: -1 })
      .toArray()

    if (rawDocs.length === 0) {
      return new Response(JSON.stringify({ message: 'No new applicants this month.' }), { status: 200 })
    }

    const decrypted = rawDocs.map(decryptDocument)
    const html = buildEmailHTML(decrypted)
    const recipients = [process.env.EMAIL_RECIPIENT_1, process.env.EMAIL_RECIPIENT_2].filter(Boolean) as string[]

    const { error } = await resend.emails.send({
      from: 'team@info.ignite-startupclub.de',
      to: recipients,
      subject: `📋 Monatlicher Export: ${decrypted.length} neue Bewerbungen`,
      html,
    })

    if (error) throw error

    return new Response(JSON.stringify({ status: 'ok', count: decrypted.length }), { status: 200 })
  } catch (err: any) {
    return new Response(JSON.stringify({ status: 'error', message: err.message }), { status: 500 })
  } finally {
    await client.close()
  }
}