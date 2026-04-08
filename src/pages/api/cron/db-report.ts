export const prerender = false

import type { APIRoute } from 'astro'
import { MongoClient } from 'mongodb'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

interface CollectionStat {
  name: string
  count: number
  recentCount: number // last 14 days
}

interface ReportData {
  timestamp: string
  server: {
    nodeVersion: string
    platform: string
    arch: string
    memoryUsedMB: number
    memoryTotalMB: number
    uptimeSeconds: number
    environment: string
    siteUrl: string
  }
  database: {
    status: 'connected' | 'error'
    pingLatencyMs: number
    collections: CollectionStat[]
    error?: string
  }
}

async function collectReport(): Promise<ReportData> {
  const mem = process.memoryUsage()
  const server = {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    memoryUsedMB: Math.round(mem.rss / 1024 / 1024),
    memoryTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
    uptimeSeconds: Math.round(process.uptime()),
    environment: process.env.NODE_ENV ?? 'unknown',
    siteUrl: process.env.SITE_URL ?? 'unknown',
  }

  const client = new MongoClient(process.env.MONGODB_URI!)
  const since14Days = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

  try {
    const start = Date.now()
    await client.connect()
    await client.db(process.env.MONGODB_DB!).command({ ping: 1 })
    const pingLatencyMs = Date.now() - start

    const db = client.db(process.env.MONGODB_DB!)
    const collectionNames = ['applicant', 'feedbacks', 'pending_confirmations', 'pending_subscribers']

    const collections: CollectionStat[] = await Promise.all(
      collectionNames.map(async (name) => {
        const col = db.collection(name)
        const [count, recentCount] = await Promise.all([
          col.countDocuments(),
          col.countDocuments({ createdAt: { $gte: since14Days } }),
        ])
        return { name, count, recentCount }
      }),
    )

    return {
      timestamp: new Date().toISOString(),
      server,
      database: { status: 'connected', pingLatencyMs, collections },
    }
  } catch (err: any) {
    return {
      timestamp: new Date().toISOString(),
      server,
      database: {
        status: 'error',
        pingLatencyMs: -1,
        collections: [],
        error: err.message,
      },
    }
  } finally {
    await client.close()
  }
}

function buildEmailHtml(report: ReportData): string {
  const dbOk = report.database.status === 'connected'
  const statusColor = dbOk ? '#22c55e' : '#ef4444'
  const statusLabel = dbOk ? '✅ Verbunden' : '❌ Fehler'

  const collectionRows = report.database.collections
    .map(
      (c) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a3a;">${c.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a3a;text-align:right;">${c.count}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a3a;text-align:right;color:#a78bfa;">${c.recentCount}</td>
      </tr>`,
    )
    .join('')

  const errorBlock = report.database.error
    ? `<div style="margin-top:16px;padding:12px 16px;background:#3f0f0f;border-left:4px solid #ef4444;border-radius:4px;font-family:monospace;font-size:13px;color:#fca5a5;word-break:break-all;">
        ${report.database.error}
      </div>`
    : ''

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#0f0f17;font-family:Inter,sans-serif;color:#e2e8f0;">
  <div style="max-width:620px;margin:40px auto;padding:0 16px;">

    <div style="background:#16161f;border-radius:12px;overflow:hidden;border:1px solid #2a2a3a;">

      <!-- Header -->
      <div style="background:#1e1e2e;padding:24px 28px;border-bottom:1px solid #2a2a3a;">
        <p style="margin:0 0 4px;font-size:12px;color:#6b7280;letter-spacing:0.08em;text-transform:uppercase;">IGNITE Startup Club</p>
        <h1 style="margin:0;font-size:20px;font-weight:700;color:#f1f5f9;">14-Tages Datenbankbericht</h1>
        <p style="margin:6px 0 0;font-size:13px;color:#94a3b8;">${new Date(report.timestamp).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}</p>
      </div>

      <!-- DB Status -->
      <div style="padding:20px 28px;border-bottom:1px solid #2a2a3a;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;">Datenbank</p>
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:15px;font-weight:600;color:${statusColor};">${statusLabel}</span>
          ${dbOk ? `<span style="font-size:13px;color:#64748b;">Ping: ${report.database.pingLatencyMs} ms</span>` : ''}
        </div>
        ${errorBlock}
      </div>

      <!-- Collections -->
      ${
        dbOk
          ? `
      <div style="padding:20px 28px;border-bottom:1px solid #2a2a3a;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;">Collections</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="color:#64748b;font-size:12px;">
              <th style="padding:6px 12px;text-align:left;font-weight:500;">Collection</th>
              <th style="padding:6px 12px;text-align:right;font-weight:500;">Gesamt</th>
              <th style="padding:6px 12px;text-align:right;font-weight:500;color:#a78bfa;">Letzte 14 Tage</th>
            </tr>
          </thead>
          <tbody>
            ${collectionRows}
          </tbody>
        </table>
      </div>`
          : ''
      }

      <!-- Server -->
      <div style="padding:20px 28px;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;">Server</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;color:#94a3b8;">
          ${[
            ['Node.js', report.server.nodeVersion],
            ['Plattform', `${report.server.platform} (${report.server.arch})`],
            [
              'Arbeitsspeicher',
              `${report.server.memoryUsedMB} MB verwendet / ${report.server.memoryTotalMB} MB gesamt`,
            ],
            ['Uptime', `${Math.round(report.server.uptimeSeconds / 60)} Minuten`],
            ['Umgebung', report.server.environment],
            ['Site URL', report.server.siteUrl],
          ]
            .map(
              ([k, v]) => `
            <tr>
              <td style="padding:5px 12px;color:#64748b;width:40%;">${k}</td>
              <td style="padding:5px 12px;color:#e2e8f0;">${v}</td>
            </tr>`,
            )
            .join('')}
        </table>
      </div>

    </div>

    <p style="text-align:center;margin-top:20px;font-size:12px;color:#374151;">
      Automatisch generiert · IGNITE Startup Club · ${report.server.siteUrl}
    </p>
  </div>
</body>
</html>`
}

export const GET: APIRoute = async ({ request }) => {
  // Verify Vercel cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 })
  }

  const recipients = [process.env.EMAIL_RECIPIENT_1, process.env.EMAIL_RECIPIENT_2].filter(Boolean) as string[]
  if (recipients.length === 0) {
    return new Response(JSON.stringify({ message: 'No recipients configured' }), { status: 500 })
  }

  const report = await collectReport()
  const html = buildEmailHtml(report)

  const dbStatus = report.database.status === 'connected' ? '✅ OK' : '❌ Fehler'
  const subject = `IGNITE Datenbankbericht – ${dbStatus} – ${new Date(report.timestamp).toLocaleDateString('de-DE')}`

  const { error } = await resend.emails.send({
    from: 'team@info.ignite-startupclub.de',
    to: recipients,
    subject,
    html,
  })

  if (error) {
    return new Response(JSON.stringify({ status: 'error', message: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ status: 'ok', recipients, dbStatus: report.database.status }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
