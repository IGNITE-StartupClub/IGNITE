/**
 * One-time script: Liest alle Bewerbungen aus MongoDB, entschlüsselt sie
 * und sendet eine Übersicht per E-Mail an die konfigurierten Admin-Empfänger.
 *
 * Ausführen: node scripts/export-applicants.mjs
 */

import { MongoClient } from 'mongodb'
import { Resend } from 'resend'
import crypto from 'crypto'
import { config } from 'dotenv'

config()

// --- ENV-Validierung ---
const required = ['RESEND_API_KEY', 'MONGODB_URI', 'MONGODB_DB', 'ENCRYPTION_SECRET', 'EMAIL_RECIPIENT_1']
for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ Fehlende Umgebungsvariable: ${key}`)
    process.exit(1)
  }
}

const adminRecipients = [process.env.EMAIL_RECIPIENT_1, process.env.EMAIL_RECIPIENT_2].filter(Boolean)
const resend = new Resend(process.env.RESEND_API_KEY)

// --- Entschlüsselung (Umkehrung der encrypt()-Funktion aus submit.ts) ---
function decrypt(encrypted) {
  try {
    const [ivHex, encHex, tagHex] = encrypted.split(':')
    if (!ivHex || !encHex || !tagHex) return '[Ungültiges Format]'

    const iv = Buffer.from(ivHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(process.env.ENCRYPTION_SECRET, 'hex'),
      iv,
    )
    decipher.setAuthTag(tag)
    let dec = decipher.update(encHex, 'hex', 'utf8')
    dec += decipher.final('utf8')
    return dec
  } catch {
    return '[Entschlüsselungsfehler]'
  }
}

// --- Alle Felder eines Dokuments entschlüsseln ---
function decryptDocument(doc) {
  const result = {}
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

const OPEN_QUESTION_KEYS = new Set(['selectedCustomQuestion', 'customAnswer'])

const labelMap = {
  name: 'Vorname',
  lastname: 'Nachname',
  email: 'E-Mail',
  teams: 'Teams',
  startupInterest: 'Startup-Interesse',
  subscribeNewsletter: 'Newsletter',
  q1: 'Motivationsfrage',
  q4: 'Stärken & Fähigkeiten',
  q5: 'Zeitinvestment',
  selectedCustomQuestion: 'Gewählte Frage',
  customAnswer: 'Antwort',
}

// --- HTML für einen Bewerber ---
function applicantToRows(doc, index) {
  const skip = new Set(['_id', 'createdAt'])

  const formatValue = (value) => {
    if (value === null || value === undefined || value === '') return '<em>–</em>'
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.join(', ')
    } catch { /* not JSON */ }
    return String(value)
  }

  // Separate open-question fields from regular fields
  const regularEntries = Object.entries(doc).filter(([key]) => !skip.has(key) && !OPEN_QUESTION_KEYS.has(key))
  const hasOpenQuestion = doc.selectedCustomQuestion

  const regularRows = regularEntries
    .map(([key, value]) => `
        <tr style="border-bottom:1px solid #f0f0f0;">
          <td style="padding:10px 8px;font-weight:bold;vertical-align:top;width:35%;color:#555;">${labelMap[key] ?? key}</td>
          <td style="padding:10px 8px;vertical-align:top;word-break:break-word;">${formatValue(value)}</td>
        </tr>`)
    .join('')

  const openQuestionBlock = hasOpenQuestion ? `
    <tr>
      <td colspan="2" style="padding:0;">
        <div style="margin:8px;padding:12px 14px;background:#faf5f8;border-left:3px solid #8C3974;border-radius:4px;">
          <div style="font-weight:bold;color:#555;margin-bottom:6px;font-size:0.85em;text-transform:uppercase;letter-spacing:0.04em;">
            Gewählte Frage
          </div>
          <div style="color:#333;margin-bottom:12px;line-height:1.5;">
            ${formatValue(doc.selectedCustomQuestion)}
          </div>
          <div style="font-weight:bold;color:#555;margin-bottom:6px;font-size:0.85em;text-transform:uppercase;letter-spacing:0.04em;">
            Antwort
          </div>
          <div style="color:#333;white-space:pre-wrap;line-height:1.6;">
            ${formatValue(doc.customAnswer)}
          </div>
        </div>
      </td>
    </tr>` : ''

  const date = doc.createdAt
    ? new Date(doc.createdAt).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })
    : '–'

  return `
    <div style="margin-bottom:2rem;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
      <div style="background:#8C3974;color:#fff;padding:10px 16px;font-weight:bold;">
        Bewerbung #${index + 1} &nbsp;·&nbsp; <span style="font-weight:normal;font-size:0.9em;">${date}</span>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        ${regularRows}
        ${openQuestionBlock}
      </table>
    </div>`
}

// --- Gesamt-HTML ---
function buildEmailHTML(docs, since) {
  const applicantBlocks = docs.map((doc, i) => applicantToRows(doc, i)).join('')
  const sinceStr = since.toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' })
  return `
    <div style="font-family:Inter,sans-serif;max-width:700px;margin:auto;padding:2rem;">
      <h2 style="color:#8C3974;">📋 Bewerbungsübersicht – letzte 30 Tage</h2>
      <p style="color:#555;">Insgesamt <strong>${docs.length}</strong> Bewerbung(en) seit dem ${sinceStr}.</p>
      ${applicantBlocks}
      <p style="font-size:0.8rem;color:#aaa;margin-top:2rem;">
        Exportiert am ${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })} via export-applicants.mjs
      </p>
    </div>`
}

// --- Hauptlogik ---
async function main() {
  let client = null

  try {
    console.log('🔌 Verbinde mit MongoDB...')
    client = new MongoClient(process.env.MONGODB_URI)
    await client.connect()

    const since = new Date()
    since.setDate(since.getDate() - 30)

    const db = client.db(process.env.MONGODB_DB)
    const rawDocs = await db
      .collection('applicant')
      .find({ createdAt: { $gte: since } })
      .sort({ createdAt: 1 })
      .toArray()
    console.log(`📦 ${rawDocs.length} Bewerbung(en) der letzten 30 Tage gefunden.`)

    if (rawDocs.length === 0) {
      console.log('ℹ️  Keine Bewerbungen im Zeitraum. Kein E-Mail wird gesendet.')
      return
    }

    const decrypted = rawDocs.map(decryptDocument)
    const html = buildEmailHTML(decrypted, since)

    console.log(`✉️  Sende E-Mail an: ${adminRecipients.join(', ')}`)
    const result = await resend.emails.send({
      from: 'team@info.ignite-startupclub.de',
      to: adminRecipients,
      subject: `📋 Bewerbungsübersicht – ${rawDocs.length} Bewerbung(en) letzte 30 Tage`,
      html,
    })

    if (result.error) {
      console.error('❌ Resend-Fehler:', result.error)
      process.exit(1)
    }

    console.log(`✅ E-Mail gesendet. ID: ${result.data?.id}`)
  } catch (err) {
    console.error('🔥 Fehler:', err)
    process.exit(1)
  } finally {
    if (client) await client.close()
  }
}

main()
