// Guide request: the team mail (who wants which knowledge packages) and the confirmation for the person.
// Sent by src/pages/api/guide.ts. Package titles come in already resolved (German), see guidePackages.ts.

import type { GuideRequest } from '../../lib/guideRequest';
import { escapeHtml } from './escapeHtml';
import { field, fieldHtml, link, list, note, paragraph, renderEmail } from './layout';
import { WHATSAPP_INVITE_URL } from './links';

const OCCUPATION_LABELS = { study: 'Studium', work: 'Beruf', other: 'Etwas anderes' } as const;

export const getGuideRequestSubject = (request: GuideRequest): string =>
  `Guide-Anfrage: ${request.packages.length} ${request.packages.length === 1 ? 'Paket' : 'Pakete'} für ${request.name}`;

export function getGuideRequestEmailHTML(request: GuideRequest, packageTitles: string[]): string {
  const occupation = request.occupation ? OCCUPATION_LABELS[request.occupation] : 'Keine Angabe';
  return renderEmail({
    title: 'Neue Anfrage für Wissens-Pakete',
    preheader: `${request.name} möchte: ${packageTitles.join(', ')}`.slice(0, 120),
    audience: 'team',
    contentHtml: [
      paragraph(
        'Bitte schickt der Person die folgenden Pakete. Antworten auf diese Mail gehen direkt an sie.',
      ),
      fieldHtml('Pakete', list(packageTitles.map(escapeHtml))),
      field('Name', request.name),
      fieldHtml('E-Mail', link(request.email, `mailto:${request.email}`)),
      field('Tätigkeit', occupation),
      request.company ? field('Unternehmen', request.company) : '',
      request.field ? field('Tätigkeitsbereich', request.field) : '',
      request.university ? field('Hochschule', request.university) : '',
      request.program ? field('Studiengang', request.program) : '',
      fieldHtml(
        'WhatsApp-Community',
        request.whatsapp
          ? `Ja, bitte den Einladungslink mitschicken: ${link(WHATSAPP_INVITE_URL, WHATSAPP_INVITE_URL)}`
          : 'Nein',
      ),
      field('Sprache der Seite', request.locale === 'en' ? 'Englisch (bitte auf Englisch antworten)' : 'Deutsch'),
    ].join(''),
  });
}

export const getGuideConfirmationSubject = (): string => 'Deine Wissens-Pakete sind angefragt – IGNITE Startup Club';

export function getGuideConfirmationEmailHTML(request: GuideRequest, packageTitles: string[]): string {
  return renderEmail({
    title: 'Danke für deine Anfrage',
    preheader: 'Wir schicken dir deine Wissens-Pakete in den nächsten Tagen.',
    audience: 'visitor',
    contentHtml: [
      paragraph(`Hallo ${escapeHtml(request.name)},`),
      paragraph('schön, dass du dich für unsere Wissens-Pakete interessierst. Du hast diese Pakete angefragt:'),
      list(packageTitles.map(escapeHtml)),
      paragraph('Unser Team schickt sie dir in den nächsten Tagen an diese Adresse.'),
      note('Du hast diese Mail bekommen, weil deine Adresse im Guide auf ignite-startupclub.de eingetragen wurde.'),
    ].join(''),
  });
}
