export const prerender = false

import { APIRoute } from 'astro';
import { Resend } from 'resend';
import 'dotenv/config';
import { getContactFormEmailHTML, getContactFormSubject, type ContactFormData } from '../../templates/emails/contactFormEmail';
import { getContactConfirmationEmailHTML, getContactConfirmationSubject } from '../../templates/emails/contactConfirmationEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

const sendContactFormEmail = async (data: ContactFormData) => {
  const recipients = [process.env.EMAIL_RECIPIENT_1, process.env.EMAIL_RECIPIENT_2]
  .filter(Boolean) as string[];

  if (!recipients || recipients.length === 0) {
    throw new Error('Keine gültigen Empfängeradressen definiert.');
  }

  const isAdvisoryBoard = data.topic === 'advisory';
  const subject = getContactFormSubject(isAdvisoryBoard);
  const html = getContactFormEmailHTML(data);

  await resend.emails.send({
    from: 'IGNITE Startup Club <kontakt@ignite-startupclub.de>',
    to: recipients,
    subject: subject,
    html: html,
  });
};

const sendConfirmationEmail = async (email: string, name?: string, isAdvisoryBoard: boolean = false) => {
  const subject = getContactConfirmationSubject(isAdvisoryBoard);
  const html = getContactConfirmationEmailHTML(name, isAdvisoryBoard);

  await resend.emails.send({
    from: 'kontakt@ignite-startupclub.de',
    to: email,
    subject: subject,
    html: html,
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