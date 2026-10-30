// Member Code Email Template
// Sent with the one-time code to set the members area password, on request for a first password or a reset
// (/api/members/code).

import { CODE_TTL_SECONDS } from '../../lib/memberAuth';
import { note, paragraph, renderEmail } from './layout';

export function getMemberCodeSubject(code: string): string {
  // The code in the subject lets members read it from the notification without opening the mail.
  return `${code} ist dein Code für den IGNITE-Mitgliederbereich`;
}

export function getMemberCodeEmailHTML(code: string): string {
  return renderEmail({
    title: 'Dein Code',
    preheader: `${code} ist dein Code für den IGNITE-Mitgliederbereich.`,
    audience: 'member',
    contentHtml: [
      paragraph('Gib diesen Code auf der Anmeldeseite des Mitgliederbereichs ein und leg dann dein Passwort fest.'),
      `<p style="margin: 24px 0; text-align: center; font: 600 32px/1.2 'SFMono-Regular', Menlo, Consolas, monospace; letter-spacing: 0.3em; color: #1a1a1a;">${code}</p>`,
      paragraph(`Der Code gilt ${CODE_TTL_SECONDS / 60} Minuten und funktioniert nur einmal.`),
      note('Du hast keinen Code angefordert? Dann ignoriere diese Mail einfach. Dein bisheriges Passwort bleibt gültig.'),
    ].join(''),
  });
}
