// Error Report Email Template
// Sent to admin when an error occurs in the application

import { field, renderEmail } from './layout';

export function getErrorReportSubject(): string {
  return 'Fehler bei der Datenbankanfrage';
}

export function getErrorReportEmailHTML(errorMessage: string, context?: string): string {
  return renderEmail({
    title: 'Fehler bei der DB-Anfrage',
    preheader: errorMessage.slice(0, 120),
    audience: 'team',
    contentHtml: [
      field('Fehler', errorMessage),
      context ? field('Kontext', context) : '',
      field('Zeitstempel', new Date().toISOString()),
    ].join(''),
  });
}
