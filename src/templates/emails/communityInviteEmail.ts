// Community Invite Email Template
// Sent right after someone enters their address on the Community page or in the footer.
// The WhatsApp group is the newsletter, so this mail carries the invite link and nothing to confirm.

import { INSTAGRAM_URL, LINKEDIN_URL, WHATSAPP_INVITE_URL } from './links';
import { button, link, list, note, paragraph, renderEmail } from './layout';

export function getCommunityInviteSubject(): string {
  return 'Dein Link zur IGNITE WhatsApp-Community';
}

export function getCommunityInviteEmailHTML(): string {
  return renderEmail({
    title: 'Willkommen bei IGNITE!',
    preheader: 'Hier ist dein Link zur WhatsApp-Community.',
    audience: 'visitor',
    contentHtml: [
      paragraph('Schön, dass du dabei sein willst. Unseren Newsletter gibt es bei WhatsApp. In der Community erfährst du als Erste:r von:'),
      list([
        '<strong>Events und Workshops</strong> rund ums Gründen in Lüneburg und Hamburg',
        '<strong>Startup-Insights</strong> und Einblicken in reale Projekte',
        '<strong>Community-News</strong> und Karrierechancen im Startup-Umfeld',
      ]),
      button('WhatsApp-Gruppe beitreten', WHATSAPP_INVITE_URL),
      paragraph(
        `Folge uns auch auf ${link('Instagram', INSTAGRAM_URL)} und ${link('LinkedIn', LINKEDIN_URL)}.`,
      ),
      note('Du hast dich nicht angemeldet? Dann ignoriere diese Mail einfach, es passiert nichts weiter.'),
    ].join(''),
  });
}
