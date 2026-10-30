// Member Invite Email Template
// Sent when an admin adds a member or sends the invitation again (/api/members/admin). It carries no token: the
// member requests a code on the login page, so a forwarded or scanned invitation grants nothing.

import { button, note, paragraph, renderEmail } from './layout';

export function getMemberInviteSubject(): string {
  return 'Deine Einladung in den IGNITE-Mitgliederbereich';
}

export function getMemberInviteEmailHTML(loginUrl: string): string {
  return renderEmail({
    title: 'Willkommen im Mitgliederbereich',
    preheader: 'Du wurdest in den IGNITE-Mitgliederbereich eingeladen.',
    audience: 'visitor',
    contentHtml: [
      paragraph(
        'Du wurdest in den Mitgliederbereich der IGNITE-Website eingeladen. Öffne die Anmeldeseite, gib diese E-Mail-Adresse ein und wähle „Noch kein Passwort oder vergessen?“. Wir schicken dir dann einen Code, mit dem du dein Passwort festlegst.',
      ),
      button('Zur Anmeldung', loginUrl),
      note('Du kennst IGNITE nicht? Dann ignoriere diese Mail einfach. Ohne dich passiert nichts.'),
    ].join(''),
  });
}
