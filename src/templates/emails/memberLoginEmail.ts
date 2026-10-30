// Member Login Email Template
// Sent by /api/members/login to an address on the members allowlist. The button opens the login page,
// where one more click redeems the link (see MemberLoginPage.astro for why).

import { LOGIN_TOKEN_TTL_SECONDS } from '../../lib/memberAuth';
import { button, note, paragraph, renderEmail } from './layout';

export function getMemberLoginSubject(): string {
  return 'Dein Login-Link für den IGNITE-Mitgliederbereich';
}

export function getMemberLoginEmailHTML(loginUrl: string): string {
  return renderEmail({
    title: 'Dein Login-Link',
    preheader: 'Melde dich mit einem Klick im Mitgliederbereich an.',
    audience: 'visitor',
    contentHtml: [
      paragraph('Mit dem Button meldest du dich im Mitgliederbereich der IGNITE-Website an. Ein Passwort brauchst du nicht.'),
      button('Im Mitgliederbereich anmelden', loginUrl),
      paragraph(`Der Link gilt ${LOGIN_TOKEN_TTL_SECONDS / 60} Minuten und funktioniert nur einmal.`),
      note('Du hast keinen Login angefordert? Dann ignoriere diese Mail einfach. Ohne Klick auf den Link passiert nichts.'),
    ].join(''),
  });
}
