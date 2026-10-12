// Application Confirmation Email Template
// Sent to user after they submit a team application

import { escapeHtml } from './escapeHtml';
import { WHATSAPP_INVITE_URL } from './links';
import { button, paragraph, renderEmail } from './layout';

export function getApplicationConfirmationSubject(): string {
  return 'Danke für deine Bewerbung – IGNITE Startup Club';
}

export function getApplicationConfirmationEmailHTML(name: string): string {
  return renderEmail({
    title: 'Danke für deine Bewerbung',
    preheader: 'Wir haben deine Bewerbung erhalten und melden uns bald.',
    audience: 'visitor',
    contentHtml: [
      paragraph(`Hallo${name ? ` ${escapeHtml(name)}` : ''},`),
      paragraph('wir haben deine Bewerbung erhalten und melden uns so schnell wie möglich bei dir.'),
      paragraph('Bis dahin kannst du schon unserer WhatsApp-Community beitreten. Dort läuft auch unser Newsletter.'),
      button('WhatsApp-Gruppe beitreten', WHATSAPP_INVITE_URL),
    ].join(''),
  });
}
