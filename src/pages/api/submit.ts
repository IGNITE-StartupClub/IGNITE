import { APIRoute } from 'astro';
import { Resend } from 'resend';
import { MongoClient } from 'mongodb';
import crypto from 'crypto';
import 'dotenv/config';

const resend = new Resend(process.env.RESEND_API_KEY!);
const adminRecipients = [
  process.env.EMAIL_RECIPIENT_1,
  process.env.EMAIL_RECIPIENT_2,
].filter(Boolean) as string[];

if (adminRecipients.length === 0) {
  throw new Error('Keine gültigen Empfängeradressen für das Team definiert.');
}

function encrypt(text: string) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    Buffer.from(process.env.ENCRYPTION_SECRET!, 'hex'),
    iv
  );
  let enc = cipher.update(text, 'utf8', 'hex');
  enc += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${enc}:${tag.toString('hex')}`;
}

async function sendApplicationEmail(data: any) {
  await resend.emails.send({
    from: 'team@ignite-startupclub.de',
    to: adminRecipients,
    subject: 'Neue Bewerbung eingegangen',
    html: `
      <div style="font-family: Inter, sans-serif; padding:2rem; border:1px solid #eee; border-radius:8px; max-width:600px; margin:auto;">
        <h2 style="color:#8C3974;">📬 Neue Bewerbung</h2>
        <table style="width:100%; line-height:1.6;">
          <tr><td><strong>Position:</strong></td><td>${data.position}</td></tr>
          <tr><td><strong>Was reizt dich an der Position?</strong></td><td>${data.q1}</td></tr>
          <tr><td><strong>Welche Erfahrungen hast du?</strong></td><td>${data.q2}</td></tr>
          <tr><td><strong>Welche Stärken kannst du einbringen?</strong></td><td>${data.q3}</td></tr>
          <tr><td><strong>Wie viel Zeit kannst du investieren?</strong></td><td>${data.q4}</td></tr>
          <tr><td><strong>Wie gehst du mit Struktur-Unsicherheit um?</strong></td><td>${data.q5}</td></tr>
          <tr><td><strong>Vorname:</strong></td><td>${data.name}</td></tr>
          <tr><td><strong>Nachname:</strong></td><td>${data.lastname}</td></tr>
          <tr><td><strong>E-Mail:</strong></td><td>${data.email}</td></tr>
        </table>
        <p style="font-size:0.85rem; color:#888; margin-top:1.5rem;">
          Diese Nachricht wurde automatisch über das Bewerbungsformular gesendet.
        </p>
      </div>
    `,
  });
}

console.log('Admin-E-Mail-Empfänger:', adminRecipients);

async function sendConfirmationEmail(email: string, name: string) {
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
  });
}

async function sendErrorEmail(errorMessage: string) {
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
  });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    if (!data) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Keine Daten übermittelt' }),
        { status: 400 }
      );
    }

    // 1) Verschlüsseln & speichern
    const payload = {
      position: encrypt(data.position),
      q1: encrypt(data.q1),
      q2: encrypt(data.q2),
      q3: encrypt(data.q3),
      q4: encrypt(data.q4),
      q5: encrypt(data.q5),
      name: encrypt(data.name),
      lastname: encrypt(data.lastname),
      email: encrypt(data.email),
      createdAt: new Date(),
    };
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'ignite');
    await db.collection('applicant').insertOne(payload);
    await client.close();

    // 2) E-Mail ans Team
    await sendApplicationEmail(data);

    // 3) Bestätigung an Bewerber:in
    await sendConfirmationEmail(data.email, data.name);

    return new Response(JSON.stringify({ status: 'ok' }), { status: 200 });
  } catch (error: any) {
    console.error('Fehler bei der DB-Anfrage:', error);
    await sendErrorEmail(error.message);
    return new Response(
      JSON.stringify({ status: 'error', message: error.message }),
      { status: 500 }
    );
  }
};