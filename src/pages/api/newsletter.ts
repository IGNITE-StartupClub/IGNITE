// src/api/newsletter.ts
import { Resend } from 'resend';
import { MongoClient } from 'mongodb';
import crypto from 'crypto';
import 'dotenv/config';

const resend = new Resend(process.env.RESEND_API_KEY);
const MONGO_URI = process.env.MONGODB_URI!;
const MONGO_DB = process.env.MONGODB_DB!;
const SITE_URL = process.env.SITE_URL!;

let client: MongoClient | null = null;

// Initialize MongoDB client connection
const getDb = async () => {
  if (!client) {
    client = new MongoClient(MONGO_URI);
    await client.connect();
  }
  return client.db(MONGO_DB);
};

export const POST = async ({ request }) => {
  const { email } = await request.json();

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return new Response(JSON.stringify({ message: 'Ungültige E-Mail-Adresse.' }), { status: 400 });
  }

  // Generate a token for confirming the subscription
  const token = crypto.randomBytes(24).toString('hex');
  const confirmUrl = `${SITE_URL}/subscribe?token=${token}`;

  // Store token and email in DB
  const db = await getDb();
  await db.collection('pending_confirmations').insertOne({
    email,
    token,
    createdAt: new Date(),
  });

  try {
    // Send confirmation email
    await resend.emails.send({
      from: 'IGNITE STartup Club<news@ignite-startupclub.de>',
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

          <p>Noch einfacher? Dann tritt direkt unserer WhatsApp-Community bei:</p>

          <p style="text-align: center; margin: 2rem 0;">
            <a href="https://chat.whatsapp.com/HtvynOI8sY125MmBZR4C1n"
              style="display: inline-block; background-color: #8C3974; color: #fff; padding: 0.75rem 1.5rem; border-radius: 6px; text-decoration: none; font-weight: bold;">
              👉 Jetzt WhatsApp-Gruppe beitreten
            </a>
          </p>

          <p>In Zukunft möchten wir dir auch unseren Newsletter zusenden. Damit halten wir dich über folgende Themen auf dem Laufenden:</p>
          <ul style="line-height: 1.6;">
            <li>Events und Workshops rund ums Gründen</li>
            <li>Einblicke in reale Startup-Projekte</li>
            <li>Austausch mit Gleichgesinnten</li>
          </ul>

          <p style="font-size: 0.95rem; color: #555;">
            Falls du dich nicht selbst angemeldet hast, kannst du diese E-Mail einfach ignorieren oder dich bei uns melden.
          </p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ message: 'Bestätigungsmail gesendet' }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ message: 'Fehler beim E-Mail-Versand' }), { status: 500 });
  }
};