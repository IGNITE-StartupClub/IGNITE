import { v4 as uuidv4 } from 'uuid'
import type { Db } from 'mongodb'
import type { Resend } from 'resend'
import { assertSent } from './resend'
import { globalConfig } from '../data/staticContent'
import {
  getSubscriptionConfirmationEmailHTML,
  getSubscriptionConfirmationSubject,
} from '../templates/emails/subscriptionConfirmationEmail'

interface Subscriber {
  email: string
  firstName?: string
  lastName?: string
}

/**
 * Starts the double opt-in: stores a pending entry and mails the confirmation link.
 * Returns 'pending' without sending when the address already has an open confirmation.
 * Throws when the mail cannot be sent, after removing the pending entry again.
 */
export async function startDoubleOptIn(
  db: Db,
  resend: Resend,
  { email, firstName, lastName }: Subscriber,
): Promise<'sent' | 'pending'> {
  const siteUrl = process.env.SITE_URL
  if (!siteUrl) {
    throw new Error('SITE_URL is required')
  }

  const pending = db.collection('pending_confirmations')
  if (await pending.findOne({ email })) {
    return 'pending'
  }

  const token = uuidv4()
  await pending.insertOne({
    email,
    firstName: firstName || '',
    lastName: lastName || '',
    token,
    createdAt: new Date(),
  })

  try {
    assertSent(
      await resend.emails.send({
        from: 'IGNITE Startup Club <news@info.ignite-startupclub.de>',
        to: email,
        replyTo: globalConfig.contactEmail,
        subject: getSubscriptionConfirmationSubject(),
        html: getSubscriptionConfirmationEmailHTML(
          `${siteUrl}/subscribe?token=${token}`,
          `${siteUrl}/subscribe?cancel=${encodeURIComponent(email)}`,
        ),
      }),
    )
  } catch (err) {
    // Without the mail the pending entry would block retries for 24 hours.
    await pending.deleteOne({ email, token })
    throw err
  }

  return 'sent'
}
