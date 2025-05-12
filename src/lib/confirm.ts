// src/lib/confirm.ts
import { MongoClient } from 'mongodb';
import crypto from 'crypto';
import { Resend } from 'resend';
import 'dotenv/config';

const resend = new Resend(process.env.RESEND_API_KEY!);
const MONGO_URI     = process.env.MONGODB_URI!;
const MONGO_DB      = process.env.MONGODB_DB!;
const RESEND_AUD_ID = process.env.RESEND_AUDIENCE_ID!;  // <-- new

interface Pending {
  type: 'newsletter' | 'application';
  data: any;
  email: string;
  token: string;
  createdAt: Date;
}

async function withDb<T>(fn: (db: ReturnType<MongoClient['db']>) => Promise<T>) {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  try {
    return await fn(client.db(MONGO_DB));
  } finally {
    await client.close();
  }
}

function wrapHtml(inner: string) {
  return `
    <div style="
      font-family:Inter,sans-serif;
      background:#f9f9f9;
      padding:2rem;
      border-radius:8px;
      color:#333;
      max-width:600px;
      margin:auto;
    ">
      ${inner}
    </div>
  `;
}

async function handleNewsletter(email: string, firstName?: string, lastName?: string) {
  // use Resend contacts.create instead of Mongo
  await resend.contacts.create({
    email,
    firstName,
    lastName,
    unsubscribed: false,
    audienceId: RESEND_AUD_ID,
  });

  const html = wrapHtml(`
    <h2 style="color:#8C3974;margin-bottom:1rem;">Willkommen im IGNITE Newsletter! 🎉</h2>
    <p>Danke für deine Bestätigung! Du erhältst nun unsere Updates.</p>
  `);

  await resend.emails.send({
    from: 'news@ignite-startupclub.de',
    to: email,
    subject: 'Willkommen im IGNITE Newsletter!',
    html,
  });
}

async function handleApplication(db: ReturnType<MongoClient['db']>, data: any) {
  // encrypt & store in Mongo
  const iv     = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    Buffer.from(process.env.ENCRYPTION_SECRET!, 'hex'),
    iv
  );
  let enc = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  enc += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  await db.collection('applicant').insertOne({
    encrypted: `${iv.toString('hex')}:${enc}:${tag}`,
    createdAt: new Date(),
  });

  // notify team
  const teamHtml = wrapHtml(`
    <h2 style="color:#8C3974;margin-bottom:1rem;">📬 Neue bestätigte Bewerbung</h2>
    <p><strong>Position:</strong> ${data.position}</p>
    <p><strong>Name:</strong> ${data.name} ${data.lastname}</p>
    <p><strong>E-Mail:</strong> ${data.email}</p>
  `);
  await resend.emails.send({
    from: 'team@ignite-startupclub.de',
    to: [process.env.EMAIL_RECIPIENT_1!, process.env.EMAIL_RECIPIENT_2!].filter(Boolean),
    subject: '📬 Neue bestätigte Bewerbung',
    html: teamHtml,
  });

  // ack applicant
  const userHtml = wrapHtml(`
    <h2 style="color:#8C3974;margin-bottom:1rem;">Danke für deine Bewerbung 🙏</h2>
    <p>Hallo ${data.name},</p>
    <p>deine Bewerbung für <strong>${data.position}</strong> ist erfolgreich bestätigt und bei uns eingegangen.</p>
  `);
  await resend.emails.send({
    from: 'join@ignite-startupclub.de',
    to: data.email,
    subject: 'Danke für deine Bewerbung',
    html: userHtml,
  });
}

export async function processConfirmation(token: string): Promise<{ type: string; email: string }> {
  return withDb(async db => {
    const { value: pending } = await db
      .collection<Pending>('pending_confirmations')
      .findOneAndDelete({ token });

    if (!pending) {
      throw new Error('Ungültiger oder abgelaufener Token.');
    }

    const { type, data, email } = pending;

    if (type === 'newsletter') {
      // no DB write—just use Resend contacts API
      await handleNewsletter(email, data.firstName, data.lastName);

    } else {
      // application flow
      await handleApplication(db, data);
    }

    return { type, email };
  });
}