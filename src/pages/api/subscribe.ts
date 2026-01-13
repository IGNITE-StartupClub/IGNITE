export const prerender = false

import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { MongoClient } from 'mongodb';
import crypto from 'crypto';
import 'dotenv/config';
import { getSubscriptionConfirmationEmailHTML, getSubscriptionConfirmationSubject } from '../../templates/emails/subscriptionConfirmationEmail';

const resend = new Resend(process.env.RESEND_HOLY_GRAIL!);
const MONGO_URI = process.env.MONGODB_URI!;
const MONGO_DB  = process.env.MONGODB_DB!;

export const POST: APIRoute = async ({ request }) => {
  const { firstName, lastName, email } = await request.json();
  if (!firstName || !lastName || !email) {
    return new Response('Missing fields', { status: 400 });
  }

  // 1) Generate token
  const token = crypto.randomBytes(24).toString('hex');
  const createdAt = new Date();

  // 2) Store pending subscriber
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(MONGO_DB);
  await db
    .collection('pending_subscribers')
    .insertOne({ firstName, lastName, email, token, createdAt });
  await client.close();

  // 3) Send confirmation email
  const confirmUrl = `${process.env.SITE_URL}/api/confirm?token=${token}`;
  const subject = getSubscriptionConfirmationSubject();
  const html = getSubscriptionConfirmationEmailHTML(firstName, confirmUrl);

  await resend.emails.send({
    from: 'noreply@yourdomain.com',
    to: email,
    subject: subject,
    html: html,
  });

  return new Response(null, { status: 204 });
};
