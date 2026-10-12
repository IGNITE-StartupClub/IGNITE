// Contact Form Email Template
// Sent to admin when a contact form is submitted

import { escapeHtml } from './escapeHtml';
import { field, fieldHtml, link, paragraph, renderEmail } from './layout';

export interface ContactFormData {
  topic: string;
  name: string;
  lastname: string;
  email: string;
  message: string;
  organization?: string;
  position?: string;
  phone?: string;
  linkedin?: string;
  expertise?: string;
}

export function getContactFormSubject(isAdvisoryBoard: boolean): string {
  return isAdvisoryBoard
    ? 'Neue Advisory-Board-Anfrage'
    : 'Neue Kontaktanfrage über das Formular';
}

// Only http(s) URLs become links; anything else (e.g. javascript:) is shown as plain text.
const linkedinHTML = (url: string) => (/^https?:\/\//i.test(url) ? link(url, url) : escapeHtml(url));

export function getContactFormEmailHTML(data: ContactFormData): string {
  const isAdvisoryBoard = data.topic === 'advisory';

  const advisoryFields = isAdvisoryBoard
    ? [
        data.organization ? field('Organisation', data.organization) : '',
        data.position ? field('Position', data.position) : '',
        data.phone ? field('Telefon', data.phone) : '',
        data.linkedin ? fieldHtml('LinkedIn', linkedinHTML(data.linkedin)) : '',
        data.expertise ? field('Fachgebiet', data.expertise) : '',
      ].join('')
    : '';

  return renderEmail({
    title: isAdvisoryBoard ? 'Neue Advisory-Board-Anfrage' : 'Neue Kontaktanfrage',
    preheader: `${data.name} ${data.lastname}: ${data.message}`.slice(0, 120),
    audience: 'team',
    contentHtml: [
      isAdvisoryBoard ? paragraph('<strong>Priorität:</strong> Advisory-Board-Interessent. Bitte zeitnah persönlich antworten.') : '',
      field('Anliegen', data.topic),
      field('Name', `${data.name} ${data.lastname}`),
      fieldHtml('E-Mail', link(data.email, `mailto:${data.email}`)),
      advisoryFields,
      field('Nachricht', data.message),
    ].join(''),
  });
}
