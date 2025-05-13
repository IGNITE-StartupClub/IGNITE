import { APIRoute } from 'astro';
import { Resend } from 'resend';
import 'dotenv/config';

const resend = new Resend(process.env.RESEND_API_KEY);

const sendContactFormEmail = async (data: any) => {
  const recipients = [process.env.EMAIL_RECIPIENT_1, process.env.EMAIL_RECIPIENT_2]
  .filter(Boolean) as string[];

  if (!recipients || recipients.length === 0) {
    throw new Error('Keine gültigen Empfängeradressen definiert.');
  }

  await resend.emails.send({
    from: 'IGNITE Startup Club <kontakt@ignite-startupclub.de>',
    to: recipients,
    subject: 'Neue Kontaktanfrage über das Formular',
    html: `
      <div style="font-family: Inter, sans-serif; background-color: #ffffff; padding: 2rem; border-radius: 8px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee;">
        <h2 style="color: #8C3974; margin-bottom: 1rem;">📩 Neue Kontaktanfrage</h2>
        <table style="width: 100%; line-height: 1.6;">
          <tr><td><strong>Anliegen:</strong></td><td>${data.topic}</td></tr>
          <tr><td><strong>Vorname:</strong></td><td>${data.name}</td></tr>
          <tr><td><strong>Nachname:</strong></td><td>${data.lastname}</td></tr>
          <tr><td><strong>E-Mail:</strong></td><td>${data.email}</td></tr>
        </table>

        <div style="margin-top: 1.5rem;">
          <p style="margin: 0 0 0.5rem 0;"><strong>Nachricht:</strong></p>
          <p style="background-color: #f5f5f5; padding: 1rem; border-radius: 6px; white-space: pre-wrap;">${data.message}</p>
        </div>

        <hr style="margin: 2rem 0; border: none; border-top: 1px solid #ddd;" />
        <p style="font-size: 0.85rem; color: #888;">Diese Nachricht wurde automatisch über das Kontaktformular auf der Website gesendet.</p>
      </div>
    `,
  });
};

const sendConfirmationEmail = async (email: string, name?: string) => {
  await resend.emails.send({
    from: 'kontakt@ignite-startupclub.de',
    to: email,
    subject: 'Danke für deine Kontaktanfrage – IGNITE Startup Club',
    html: `
      <div style="font-family: Inter, sans-serif; background-color: #f9f9f9; padding: 2rem; border-radius: 8px; color: #333;">
        <h2 style="color: #8C3974;">Danke für deine Nachricht 🙌</h2>
        <p>Hallo${name ?` ${name}` : ''},</p>
        <p>vielen Dank für deine Kontaktanfrage. Wir kümmern uns um dein Anliegen und antworten dir so schnell wie möglich.</p>

        <p style="margin-top: 2rem;">In der Zwischenzeit kannst du unserer WhatsApp-Community beitreten:</p>

        <p style="text-align: center; margin: 2rem 0;">
          <a href="https://chat.whatsapp.com/HtvynOI8sY125MmBZR4C1n"
            style="display: inline-block; background-color: #8C3974; color: #fff; padding: 0.75rem 1.5rem; border-radius: 6px; text-decoration: none; font-weight: bold;">
            👉 Jetzt WhatsApp-Gruppe beitreten
          </a>
        </p>

        <hr style="margin: 2rem 0; border: none; border-top: 1px solid #ddd;" />

        <p style="text-align: center; margin-bottom: 1rem;">
          <a href="https://www.instagram.com/ignite.lueneburg/" style="margin: 0 0.5rem;">
            <img src="https://cdn-icons-png.flaticon.com/24/2111/2111463.png" alt="Instagram" width="24" height="24" style="vertical-align: middle;" />
          </a>
          <a href="https://www.linkedin.com/company/ignite-leuphana/" style="margin: 0 0.5rem;">
            <img src="https://cdn-icons-png.flaticon.com/24/174/174857.png" alt="LinkedIn" width="24" height="24" style="vertical-align: middle;" />
          </a>
        </p>

        <p style="font-size: 0.9rem;">
          Bei Fragen kannst du jederzeit an uns schreiben:
          <br /><strong>IGNITE Startup Club Lüneburg</strong>
          <br /><a href="mailto:ignite-startupclub@gmail.com">E-Mail schreiben</a>
        </p>

        <p style="font-size: 0.85rem; color: #aaa;">Diese E-Mail wurde automatisch versendet.</p>
      </div>
    `,
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    await sendContactFormEmail(data);
    await sendConfirmationEmail(data.email, data.name);

    return new Response(JSON.stringify({ status: 'ok' }), { status: 200 });
  } catch (error: any) {
    console.error('Fehler:', error);
    return new Response(JSON.stringify({ status: 'error', message: error.message }), { status: 500 });
  }
};



// // src/pages/api/contact.ts
// import type { APIRoute } from 'astro';
// import { enqueueConfirmation } from '../../lib/confirm';

// export const POST: APIRoute = async ({ request }) => {
//   const data = await request.json();
//   // validate name, lastname, email, message, topic …
//   await enqueueConfirmation('contact', data);
//   return new Response(JSON.stringify({ status: 'pending' }), { status: 202 });
// };