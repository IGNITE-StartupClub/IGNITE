// Member Invite Email Template
// Sent when an admin adds a member or sends the invitation again (/api/members/admin). It carries no token: the
// member requests a code on the login page, so a forwarded or scanned invitation grants nothing. It names the admin who
// sent it and closes with their stored signature (/api/members/signature).

import { escapeHtml } from './escapeHtml';
import { button, closingNote, renderMemberEmail, steps, text } from './memberLayout';

/** The admin who sent the invitation: their name and signature once they stored one, otherwise their address. */
export interface Inviter {
  label: string;
  signatureHtml: string | null;
}

export function getMemberInviteSubject(): string {
  return 'Deine Einladung in den IGNITE-Mitgliederbereich';
}

export function getMemberInviteEmailHTML(loginUrl: string, inviter: Inviter): string {
  return renderMemberEmail({
    title: 'Du bist eingeladen',
    preheader: `${inviter.label} hat dich in den IGNITE-Mitgliederbereich eingeladen.`,
    contentHtml: [
      text(`${escapeHtml(inviter.label)} hat dich in den Mitgliederbereich der IGNITE-Website eingeladen. So richtest du deinen Zugang ein:`),
      steps([
        'Öffne die Anmeldeseite.',
        'Klick unter „Neu im Team?“ auf „Code anfordern“ und gib die E-Mail-Adresse ein, unter der du diese Einladung erhalten hast.',
        'Gib den Code aus der nächsten Mail ein und leg dein Passwort fest.',
      ]),
      button('Zur Anmeldung', loginUrl),
      inviter.signatureHtml ? `<div style="padding-top: 24px;">${text('Bis bald')}<div style="padding-top: 12px;">${inviter.signatureHtml}</div></div>` : '',
      closingNote('Du kennst IGNITE nicht? Dann kannst du diese Mail ignorieren.'),
    ].join(''),
  });
}
