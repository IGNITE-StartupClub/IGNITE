// Member Invite Email Template
// Sent when an admin adds a member or sends the invitation again (/api/members/admin). It carries no token: the
// member requests a code on the login page, so a forwarded or scanned invitation grants nothing. It names the admin who
// sent it and closes with their stored signature (/api/members/signature).

import { escapeHtml } from './escapeHtml';
import { button, note, paragraph, renderEmail } from './layout';

/** The admin who sent the invitation: their name and signature once they stored one, otherwise their address. */
export interface Inviter {
  label: string;
  signatureHtml: string | null;
}

export function getMemberInviteSubject(): string {
  return 'Deine Einladung in den IGNITE-Mitgliederbereich';
}

export function getMemberInviteEmailHTML(loginUrl: string, inviter: Inviter): string {
  const invitedBy = `${inviter.label} hat dich in den IGNITE-Mitgliederbereich eingeladen.`;
  return renderEmail({
    title: 'Willkommen im Mitgliederbereich',
    preheader: invitedBy,
    // A signature already carries badge and links, so the mail then closes with the contact line only.
    audience: inviter.signatureHtml ? 'visitor' : 'member',
    contentHtml: [
      paragraph(
        `${escapeHtml(inviter.label)} hat dich in den Mitgliederbereich der IGNITE-Website eingeladen. Öffne die Anmeldeseite, klick unter „Neu im Team?“ auf „Code anfordern“ und gib diese E-Mail-Adresse ein. Wir schicken dir dann einen Code, mit dem du dein Passwort festlegst.`,
      ),
      button('Zur Anmeldung', loginUrl),
      inviter.signatureHtml ? `${paragraph('Bis bald')}${inviter.signatureHtml}` : '',
      note('Du kennst IGNITE nicht? Dann ignoriere diese Mail einfach. Ohne dich passiert nichts.'),
    ].join(''),
  });
}
