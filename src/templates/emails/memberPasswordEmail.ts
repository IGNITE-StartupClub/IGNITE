// Member Password Email Template
// Sent with a one-time link to set the members area password: as invitation when an admin adds a member
// (/api/members/admin), or on request for a first password or a reset (/api/members/password-link).

import { INVITE_TTL_SECONDS, PASSWORD_LINK_TTL_SECONDS } from '../../lib/memberAuth';
import { button, note, paragraph, renderEmail } from './layout';

export type MemberPasswordMailKind = 'invite' | 'reset';

export function getMemberPasswordSubject(kind: MemberPasswordMailKind): string {
  return kind === 'invite'
    ? 'Deine Einladung in den IGNITE-Mitgliederbereich'
    : 'Dein Link zum Passwort für den IGNITE-Mitgliederbereich';
}

export function getMemberPasswordEmailHTML(kind: MemberPasswordMailKind, passwordUrl: string): string {
  const validity =
    kind === 'invite' ? `${INVITE_TTL_SECONDS / 86400} Tage` : `${PASSWORD_LINK_TTL_SECONDS / 60} Minuten`;
  return renderEmail({
    title: kind === 'invite' ? 'Willkommen im Mitgliederbereich' : 'Passwort festlegen',
    preheader: 'Leg dein Passwort für den IGNITE-Mitgliederbereich fest.',
    audience: 'visitor',
    contentHtml: [
      paragraph(
        kind === 'invite'
          ? 'Du wurdest in den Mitgliederbereich der IGNITE-Website eingeladen. Leg mit dem Button dein Passwort fest. Danach meldest du dich mit dieser E-Mail-Adresse und deinem Passwort an.'
          : 'Mit dem Button legst du ein neues Passwort für den Mitgliederbereich der IGNITE-Website fest. Danach meldest du dich mit dieser E-Mail-Adresse und dem neuen Passwort an.',
      ),
      button('Passwort festlegen', passwordUrl),
      paragraph(`Der Link gilt ${validity} und funktioniert nur einmal.`),
      note(
        kind === 'invite'
          ? 'Du kennst IGNITE nicht? Dann ignoriere diese Mail einfach. Ohne Klick auf den Link passiert nichts.'
          : 'Du hast keinen Link angefordert? Dann ignoriere diese Mail einfach. Dein bisheriges Passwort bleibt gültig.',
      ),
    ].join(''),
  });
}
