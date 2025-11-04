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

  const isAdvisoryBoard = data.topic === 'advisory';
  const subject = isAdvisoryBoard
    ? '🌟 Neue Advisory Board Anfrage'
    : 'Neue Kontaktanfrage über das Formular';

  // Build advisory board specific fields HTML
  const advisoryFieldsHTML = isAdvisoryBoard ? `
    <div style="background-color: #f9f5ff; padding: 1rem; border-radius: 6px; margin-top: 1rem; border-left: 4px solid #8C3974;">
      <h3 style="color: #8C3974; margin: 0 0 0.75rem 0; font-size: 1.1rem;">📋 Advisory Board Details</h3>
      <table style="width: 100%; line-height: 1.6;">
        ${data.organization ? `<tr><td><strong>Organisation:</strong></td><td>${data.organization}</td></tr>` : ''}
        ${data.position ? `<tr><td><strong>Position:</strong></td><td>${data.position}</td></tr>` : ''}
        ${data.phone ? `<tr><td><strong>Telefon:</strong></td><td>${data.phone}</td></tr>` : ''}
        ${data.linkedin ? `<tr><td><strong>LinkedIn:</strong></td><td><a href="${data.linkedin}" style="color: #8C3974;">${data.linkedin}</a></td></tr>` : ''}
      </table>
      ${data.expertise ? `
        <div style="margin-top: 1rem;">
          <p style="margin: 0 0 0.5rem 0;"><strong>Fachgebiet/Expertise:</strong></p>
          <p style="background-color: #ffffff; padding: 0.75rem; border-radius: 4px; margin: 0; white-space: pre-wrap;">${data.expertise}</p>
        </div>
      ` : ''}
    </div>
  ` : '';

  await resend.emails.send({
    from: 'IGNITE Startup Club <kontakt@ignite-startupclub.de>',
    to: recipients,
    subject: subject,
    html: `
      <div style="font-family: Inter, sans-serif; background-color: #ffffff; padding: 2rem; border-radius: 8px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee;">
        <h2 style="color: #8C3974; margin-bottom: 1rem;">${isAdvisoryBoard ? '🌟 Neue Advisory Board Anfrage' : '📩 Neue Kontaktanfrage'}</h2>
        ${isAdvisoryBoard ? '<p style="background-color: #fff9e6; padding: 0.75rem; border-radius: 4px; color: #856404; border: 1px solid #ffeaa7;"><strong>⚡ Priorität:</strong> Advisory Board Interessent – Bitte zeitnah persönlich antworten!</p>' : ''}

        <table style="width: 100%; line-height: 1.6;">
          <tr><td><strong>Anliegen:</strong></td><td>${data.topic}</td></tr>
          <tr><td><strong>Vorname:</strong></td><td>${data.name}</td></tr>
          <tr><td><strong>Nachname:</strong></td><td>${data.lastname}</td></tr>
          <tr><td><strong>E-Mail:</strong></td><td><a href="mailto:${data.email}" style="color: #8C3974;">${data.email}</a></td></tr>
        </table>

        ${advisoryFieldsHTML}

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

const sendConfirmationEmail = async (email: string, name?: string, isAdvisoryBoard: boolean = false) => {
  const subject = isAdvisoryBoard
    ? 'Vielen Dank für Ihr Interesse am Advisory Board – IGNITE Startup Club'
    : 'Danke für deine Kontaktanfrage – IGNITE Startup Club';

  const advisoryBoardHTML = `
    <div style="font-family: Inter, sans-serif; background-color: #ffffff; padding: 2rem; border-radius: 8px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee;">
      <div style="text-align: center; margin-bottom: 2rem;">
        <h2 style="color: #8C3974; margin-bottom: 0.5rem;">Vielen Dank für Ihr Interesse! 🌟</h2>
      </div>

      <p>Sehr geehrte${name ? 'r ' + name : ' Damen und Herren'},</p>

      <p>vielen Dank für Ihr Interesse am Advisory Board des IGNITE Startup Club Lüneburg.</p>

      <p>Wir freuen uns sehr über Ihre Bereitschaft, unsere studentische Initiative mit Ihrer Expertise zu unterstützen und unseren Mitgliedern wertvolle Einblicke in die Praxis zu ermöglichen.</p>

      <div style="background-color: #f9f5ff; padding: 1.25rem; border-radius: 6px; border-left: 4px solid #8C3974; margin: 1.5rem 0;">
        <p style="margin: 0;"><strong>Was passiert als Nächstes?</strong></p>
        <p style="margin: 0.5rem 0 0 0;">
          Unser Team wird Ihre Anfrage zeitnah prüfen und sich persönlich bei Ihnen melden,
          um die Details einer möglichen Zusammenarbeit zu besprechen.
        </p>
      </div>

      <p>In der Zwischenzeit können Sie gerne mehr über unsere Aktivitäten erfahren:</p>

      <p style="text-align: center; margin: 2rem 0;">
        <a href="https://www.linkedin.com/company/ignite-leuphana/"
           style="display: inline-block; background-color: #8C3974; color: #fff; padding: 0.75rem 1.5rem; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 0.5rem;">
          LinkedIn Profil besuchen
        </a>
        <a href="https://www.instagram.com/ignite.lueneburg/"
           style="display: inline-block; background-color: #8C3974; color: #fff; padding: 0.75rem 1.5rem; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 0.5rem;">
          Instagram folgen
        </a>
      </p>

      <hr style="margin: 2rem 0; border: none; border-top: 1px solid #ddd;" />

      <p style="font-size: 0.9rem; color: #666;">
        <strong>IGNITE Startup Club Lüneburg</strong><br />
        Studentische Initiative an der Leuphana Universität<br />
        E-Mail: <a href="mailto:info@ignite-startupclub.de" style="color: #8C3974;">info@ignite-startupclub.de</a><br />
        Web: <a href="https://ignite-startupclub.de" style="color: #8C3974;">ignite-startupclub.de</a>
      </p>

      <p style="font-size: 0.85rem; color: #aaa; margin-top: 1.5rem;">Diese E-Mail wurde automatisch versendet. Bitte antworten Sie nicht direkt auf diese E-Mail.</p>
    </div>
  `;

  const standardHTML = `
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
  `;

  await resend.emails.send({
    from: 'kontakt@ignite-startupclub.de',
    to: email,
    subject: subject,
    html: isAdvisoryBoard ? advisoryBoardHTML : standardHTML,
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const isAdvisoryBoard = data.topic === 'advisory';

    await sendContactFormEmail(data);
    await sendConfirmationEmail(data.email, data.name, isAdvisoryBoard);

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