import { APIRoute } from 'astro';
import { MongoClient } from 'mongodb';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Sicherstellen, dass .env geladen ist (nur lokal nötig)
import 'dotenv/config';

// === Environment-Vars sicher abrufen ===
const uri = process.env.MONGODB_URI;
const secret = process.env.ENCRYPTION_SECRET;
const dbName = process.env.MONGODB_DB || 'ignite';
const gmailUser = process.env.GMAIL_USER;
const gmailPass = process.env.GMAIL_APP_PASSWORD;

function encrypt(text: string) {
  if (!secret) throw new Error('ENCRYPTION_SECRET is missing');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(secret, 'hex'), iv);
  let enc = cipher.update(text, 'utf8', 'hex');
  enc += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${enc}:${tag.toString('hex')}`;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email } = await request.json();

    // === 1. Validierung ===
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(JSON.stringify({ message: 'Ungültige E-Mail-Adresse.' }), { status: 400 });
    }

    // === 2. Mongo speichern ===
    if (!uri || !secret) {
      console.error('❌ MongoDB URI oder ENCRYPTION_SECRET fehlt in .env');
      return new Response(JSON.stringify({ message: 'Server-Konfiguration unvollständig.' }), { status: 500 });
    }

    const encryptedEmail = encrypt(email);
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    await db.collection('newsletter').insertOne({
      email: encryptedEmail,
      createdAt: new Date(),
    });
    await client.close();

    // === 3. E-Mail senden ===
    if (!gmailUser || !gmailPass) {
      console.error('❌ GMAIL Zugangsdaten fehlen in .env');
      return new Response(JSON.stringify({ message: 'E-Mail-Versand nicht konfiguriert.' }), { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    const mailOptions = {
      from: gmailUser,
      to: email,
      subject: 'Willkommen beim IGNITE Startup Club!',
      html: `
      <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 2rem; border-radius: 8px; color: #333;">
        <h2 style="color: #8C3974;">Willkommen beim IGNITE Startup Club 🎉</h2>
        <p>Schön, dass du dich für unsere Initiative interessierst!</p>
        <p>Du möchtest nichts verpassen? Dann tritt direkt unserer WhatsApp-Community bei:</p>
        
        <p style="text-align: center; margin: 2rem 0;">
          <a href="https://chat.whatsapp.com/HtvynOI8sY125MmBZR4C1n" 
             style="display: inline-block; background-color: #8C3974; color: #fff; padding: 0.75rem 1.5rem; border-radius: 6px; text-decoration: none; font-weight: bold;">
             👉 Jetzt WhatsApp-Gruppe beitreten
          </a>
        </p>

        <p>In Zukunft möchten wir dir auch unseren Newsletter zusenden. Damit halten wir dich über Folgende Themen auf dem Laufenden:</p>
        <ul style="line-height: 1.6;">
          <li>Events und Workshops rund ums Gründen</li>
          <li>Einblicke in reale Startup-Projekte</li>
          <li>Austausch mit Gleichgesinnten</li>
        </ul>
        <p>Wenn du das nicht möchtest, kannst du dich jederzeit mit einer formlosen Antwortmail abmelden.</p>
    
        <p style="font-size: 0.95rem; color: #555;">
          Falls du dich nicht selbst angemeldet hast, kannst du diese E-Mail einfach ignorieren oder dich bei uns melden.
        </p>
    
        <hr style="margin: 2rem 0; border: none; border-top: 1px solid #ddd;" />
    
        <p style="font-size: 0.9rem;">
          Bei Fragen oder Anregungen kannst du dich jederzeit an uns wenden:
          <br /><strong>Silas Kruckenberg</strong>
          <br /><a href="mailto:silas.kruckenberg@stud.leuphana.de">silas.kruckenberg@stud.leuphana.de</a>
        </p>
    
        <p style="font-size: 0.85rem; color: #aaa;">Diese E-Mail wurde automatisch versendet.</p>
      </div>
    `,
    };

    await transporter.sendMail(mailOptions);

    return new Response(JSON.stringify({ status: 'ok' }), { status: 200 });

  } catch (error: any) {
    console.error('❌ Newsletter Fehler:', error);
    return new Response(
      JSON.stringify({ message: 'Interner Fehler beim Speichern oder Senden.' }),
      { status: 500 }
    );
  }
};