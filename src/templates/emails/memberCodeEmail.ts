// Member Code Email Template
// Sent with the one-time code to set the members area password, on request for a first password or a reset
// (/api/members/code).

import { CODE_TTL_SECONDS } from '../../lib/memberAuth';
import { closingNote, codeBox, finePrint, renderMemberEmail, text } from './memberLayout';

export function getMemberCodeSubject(code: string): string {
  // The code in the subject lets members read it from the notification without opening the mail.
  return `${code} ist dein Code für den IGNITE-Mitgliederbereich`;
}

export function getMemberCodeEmailHTML(code: string): string {
  return renderMemberEmail({
    title: 'Dein Code für den Mitgliederbereich',
    preheader: `${code} ist dein Code für den IGNITE-Mitgliederbereich.`,
    contentHtml: [
      text('Gib ihn auf der Anmeldeseite ein. Danach legst du dein Passwort fest.'),
      codeBox(code),
      finePrint(`Gültig für ${CODE_TTL_SECONDS / 60} Minuten.`),
      closingNote('Du hast keinen Code angefordert? Dann kannst du diese Mail ignorieren. Dein Passwort bleibt, wie es ist.'),
    ].join(''),
  });
}
