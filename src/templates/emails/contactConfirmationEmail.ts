// Contact Confirmation Email Template
// Sent to user after they submit a contact form

import { escapeHtml } from './escapeHtml';
import { paragraph, renderEmail } from './layout';

export function getContactConfirmationSubject(isAdvisoryBoard: boolean): string {
  return isAdvisoryBoard
    ? 'Vielen Dank für Ihr Interesse am Advisory Board – IGNITE Startup Club'
    : 'Danke für deine Kontaktanfrage – IGNITE Startup Club';
}

export function getContactConfirmationEmailHTML(name?: string, isAdvisoryBoard: boolean = false): string {
  if (isAdvisoryBoard) {
    return renderEmail({
      title: 'Vielen Dank für Ihr Interesse',
      preheader: 'Wir haben Ihre Anfrage zum Advisory Board erhalten.',
      audience: 'visitor',
      contentHtml: [
        paragraph(`Sehr geehrte${name ? 'r ' + escapeHtml(name) : ' Damen und Herren'},`),
        paragraph('vielen Dank für Ihr Interesse am Advisory Board des IGNITE Startup Club Lüneburg.'),
        paragraph(
          'Wir freuen uns sehr über Ihre Bereitschaft, unsere studentische Initiative mit Ihrer Expertise zu unterstützen und unseren Mitgliedern wertvolle Einblicke in die Praxis zu ermöglichen. Wir melden uns zeitnah persönlich bei Ihnen.',
        ),
      ].join(''),
    });
  }

  return renderEmail({
    title: 'Danke für deine Nachricht',
    preheader: 'Wir haben deine Kontaktanfrage erhalten.',
    audience: 'visitor',
    contentHtml: [
      paragraph(`Hallo${name ? ` ${escapeHtml(name)}` : ''},`),
      paragraph('vielen Dank für deine Kontaktanfrage. Wir kümmern uns um dein Anliegen und antworten dir so schnell wie möglich.'),
    ].join(''),
  });
}
