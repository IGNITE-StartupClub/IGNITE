/**
 * The daily report of server errors (cron /api/cron/error-report). Each run takes the entries of `error_log` that no
 * run has handled yet and sends one mail to the admins who switched the report on (`errorMails` on the member, set on
 * the page "Systemzustand", which also shows every entry). Without new entries no mail goes out. Without anyone who wants the mail the entries
 * count as handled anyway, so switching the report on later sends no backlog. A failed send leaves the entries for the
 * next run; Resend gets an idempotency key per run day, so a mail that went out although the run failed afterwards is
 * not sent twice that day.
 */
import { Resend } from 'resend'
import 'dotenv/config'
import { getErrorSummaryEmailHTML, getErrorSummarySubject } from '../templates/emails/errorSummaryEmail'
import { markReported, recordReportRun, unreportedErrors } from './errorLog'
import { errorGroups, REPORT_GROUPS_MAX } from './errorReport'
import { memberPagePath } from './memberAuth'
import { errorMailRecipients } from './members'
import { assertSent } from './resend'
import { berlinDay } from './tasks'

const resend = new Resend(process.env.RESEND_API_KEY!)

export interface ErrorReportRun {
  errors: number
  recipients: number
  sent: boolean
}

export async function sendErrorReport(now: Date, origin: string): Promise<ErrorReportRun> {
  await recordReportRun(now)
  const entries = await unreportedErrors()
  if (!entries.length) return { errors: 0, recipients: 0, sent: false }

  const recipients = await errorMailRecipients()
  const ids = entries.map((entry) => entry._id)
  if (!recipients.length) {
    await markReported(ids, now)
    return { errors: entries.length, recipients: 0, sent: false }
  }

  const groups = errorGroups(entries)
  const shown = groups.slice(0, REPORT_GROUPS_MAX)
  const pageUrl = new URL(memberPagePath('system', 'de'), origin).href
  assertSent(
    await resend.emails.send(
      {
        from: 'IGNITE-Website <team@info.ignite-startupclub.de>',
        to: recipients,
        subject: getErrorSummarySubject(entries.length),
        html: getErrorSummaryEmailHTML(shown, groups.length - shown.length, entries.length, pageUrl),
      },
      { idempotencyKey: `error-report/${berlinDay(now.getTime())}` },
    ),
  )
  await markReported(ids, now)
  return { errors: entries.length, recipients: recipients.length, sent: true }
}
