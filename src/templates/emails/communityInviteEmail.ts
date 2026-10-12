// Community Invite Email Template
// Sent right after someone enters their address on the Community page or in the footer.
// The WhatsApp group is the newsletter, so this mail carries the invite link and nothing else to confirm.

import { WHATSAPP_INVITE_URL } from './links';

export function getCommunityInviteSubject(): string {
  return 'Dein Link zur IGNITE WhatsApp-Community';
}

export function getCommunityInviteEmailHTML(): string {
  return `
    <div style="font-family: Inter, sans-serif; background-color: #f9f9f9; padding: 2rem; border-radius: 8px; color: #333; max-width: 600px; margin: auto;">
      <h1 style="color: #8C3974; margin: 0 0 1rem 0; font-size: 1.75rem; text-align: center;">Willkommen bei IGNITE!</h1>
      <p>Schön, dass du dabei sein willst. Unseren Newsletter gibt es bei WhatsApp: In der Community erfährst du als Erste:r von:</p>
      <ul style="line-height: 1.8; padding-left: 1.5rem;">
        <li><strong>Events &amp; Workshops</strong> rund ums Gründen in Lüneburg und Hamburg</li>
        <li><strong>Startup-Insights</strong> und Einblicke in reale Projekte</li>
        <li><strong>Community-News</strong> und Karrierechancen im Startup-Umfeld</li>
      </ul>
      <p style="text-align: center; margin: 2rem 0;">
        <a href="${WHATSAPP_INVITE_URL}"
           style="display: inline-block; background-color: #8C3974; color: #fff; padding: 0.75rem 1.5rem; border-radius: 6px; text-decoration: none; font-weight: bold;">
          WhatsApp-Gruppe beitreten
        </a>
      </p>
      <p style="font-size: 0.9rem; color: #666;">Folge uns auch auf
        <a href="https://www.instagram.com/ignite_leuphana/" style="color: #8C3974; text-decoration: none; font-weight: 500;">Instagram</a> und
        <a href="https://www.linkedin.com/company/ignite-startup-club/" style="color: #8C3974; text-decoration: none; font-weight: 500;">LinkedIn</a>.
      </p>
      <hr style="margin: 2rem 0; border: none; border-top: 1px solid #ddd;" />
      <p style="font-size: 0.8rem; color: #aaa; margin: 0;">
        Du hast dich nicht angemeldet? Dann ignoriere diese Mail einfach, es passiert nichts weiter.
      </p>
    </div>
  `;
}
