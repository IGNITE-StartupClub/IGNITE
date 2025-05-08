import { APIRoute } from 'astro';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import 'dotenv/config';

const resend = new Resend(process.env.RESEND_API_KEY);

const sendContactFormEmail = async (data: any) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: process.env.EMAIL_RECIPIENT,
    subject: 'Neue Kontaktanfrage',
    html: `
      <h2>Neue Kontaktanfrage:</h2>
      <p><strong>Anliegen:</strong> ${data.topic}</p>
      <p><strong>Vorname:</strong> ${data.name}</p>
      <p><strong>Nachname:</strong> ${data.lastname}</p>
      <p><strong>E-Mail:</strong> ${data.email}</p>
      <p><strong>Nachricht:</strong> ${data.message}</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendConfirmationEmail = async (email: string, name?: string) => {
  await resend.emails.send({
    from: 'kontakt@ignite-startupclub.de',
    to: email,
    subject: 'Danke für deine Kontaktanfrage – IGNITE Startup Club',
    html: `
      <div style="font-family: Inter, sans-serif; background-color: #f9f9f9; padding: 2rem; border-radius: 8px; color: #333;">
        <h2 style="color: #8C3974;">Danke für deine Nachricht 🙌</h2>
        <p>Hallo${name ? ` ${name}` : ''},</p>
        <p>vielen Dank für deine Kontaktanfrage. Wir kümmert uns um dein Anliegen und antworten dir so schnell wie möglich.</p>

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
          <br /><strong>Silas Kruckenberg</strong>
          <br /><a href="mailto:silas.kruckenberg@stud.leuphana.de">silas.kruckenberg@stud.leuphana.de</a>
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