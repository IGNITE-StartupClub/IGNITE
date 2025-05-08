import { APIRoute } from 'astro';
import { Resend } from 'resend';
import { MongoClient } from 'mongodb';
import crypto from 'crypto';
import 'dotenv/config';

const resend = new Resend(process.env.RESEND_API_KEY);
const uri = process.env.MONGODB_URI!;
const secret = process.env.ENCRYPTION_SECRET!;

// function encrypt(text: string) {
//   const iv = crypto.randomBytes(16);
//   const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(secret, 'hex'), iv);
//   let enc = cipher.update(text, 'utf8', 'hex');
//   enc += cipher.final('hex');
//   const tag = cipher.getAuthTag();
//   return iv.toString('hex') + ':' + enc + ':' + tag.toString('hex');
// }

export const POST: APIRoute = async ({ request }) => {
  const { email } = await request.json();

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return new Response(JSON.stringify({ message: 'Ungültige E-Mail-Adresse.' }), { status: 400 });
  }

  const { error } = await resend.emails.send({
    from: 'news@ignite-startupclub.de',
    to: email,
    subject: 'Willkommen beim IGNITE Startup Club!',
    html: `
    <div style="font-family: Inter, sans-serif; background-color: #f9f9f9; padding: 2rem; border-radius: 8px; color: #333;">
      <h2 style="color: #8C3974;">Willkommen beim IGNITE Startup Club 🎉</h2>
      <p>Schön, dass du dich für unsere Initiative interessierst!</p>
      <p>Du möchtest nichts verpassen? Dann tritt direkt unserer WhatsApp-Community bei:</p>

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
      <p>Wenn du das nicht möchtest, kannst du dich jederzeit mit einer formlosen Antwortmail abmelden.</p>

      <p style="font-size: 0.95rem; color: #555;">
        Falls du dich nicht selbst angemeldet hast, kannst du diese E-Mail einfach ignorieren oder dich bei uns melden.
      </p>

      <hr style="margin: 2rem 0; border: none; border-top: 1px solid #ddd;" />

      <!-- Social Media Links -->
      <p style="text-align: center; margin-bottom: 1rem;">
        <a href="https://www.instagram.com/ignite.lueneburg/" style="margin: 0 0.5rem;">
          <img src="https://cdn-icons-png.flaticon.com/24/2111/2111463.png" alt="Instagram" width="24" height="24" style="vertical-align: middle;" />
        </a>
        <a href="https://www.linkedin.com/company/ignite-leuphana/" style="margin: 0 0.5rem;">
          <img src="https://cdn-icons-png.flaticon.com/24/174/174857.png" alt="LinkedIn" width="24" height="24" style="vertical-align: middle;" />
        </a>
      </p>

      <!-- Weitere Aktionen -->
      <p style="text-align: center; margin: 2rem 0;">
        <a href="https://ignite-startupclub.de/mitmachen"
          style="display: inline-block; background-color: #8C3974; color: #fff; padding: 0.75rem 1.5rem; border-radius: 6px; text-decoration: none; font-weight: bold; margin-bottom: 1rem;">
          🚀 Jetzt bewerben
        </a><br />
        <a href="https://ignite-startupclub.de/kontakt"
          style="display: inline-block; background-color: #333; color: #fff; padding: 0.75rem 1.5rem; border-radius: 6px; text-decoration: none; font-weight: bold;">
          🤝 Partner werden
        </a>
      </p>

      <p style="font-size: 0.9rem;">
        Bei Fragen oder Anregungen kannst du dich jederzeit an uns wenden:
        <br /><strong>Silas Kruckenberg</strong>
        <br /><a href="mailto:silas.kruckenberg@stud.leuphana.de">silas.kruckenberg@stud.leuphana.de</a>
      </p>

      <p style="font-size: 0.85rem; color: #aaa;">Diese E-Mail wurde automatisch versendet.</p>
    </div>
  `,
  });



  if (error) {
    return new Response(JSON.stringify({ message: 'Fehler beim E-Mail-Versand.' }), { status: 500 });
  }
  return new Response(JSON.stringify({ status: 'ok' }), { status: 200 });
};