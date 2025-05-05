import { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

const sendContactFormEmail = async (data: any) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,  // Dein Gmail-Benutzername
      pass: process.env.GMAIL_APP_PASSWORD,  // Dein Gmail-App-Passwort
    },
  });

  const mailOptions = {
    from: process.env.GMAIL_USER,  // Der Absender der E-Mail
    to: process.env.EMAIL_RECIPIENT,  // Die Empfänger-Adresse für das Kontaktformular
    subject: 'Neue Kontaktanfrage',
    html: `
      <h2>Neue Kontaktanfrage:</h2>
      <p><strong>Vorname:</strong> ${data.name}</p>
      <p><strong>Nachname:</strong> ${data.lastname}</p>
      <p><strong>E-Mail:</strong> ${data.email}</p>
      <p><strong>Nachricht:</strong> ${data.message}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Kontaktformular-E-Mail gesendet.');
  } catch (err) {
    console.error('Fehler beim Senden der Kontaktformular-E-Mail:', err);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    await sendContactFormEmail(data);

    return new Response(JSON.stringify({ status: 'ok' }), { status: 200 });
  } catch (error) {
    console.error('Fehler:', error);
    return new Response(JSON.stringify({ status: 'error', message: error.message }), { status: 500 });
  }
};