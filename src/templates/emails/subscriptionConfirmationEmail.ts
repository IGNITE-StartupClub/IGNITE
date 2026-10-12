// Subscription Confirmation Email Template
// Sent to user when they need to confirm their email address. Shared by the newsletter form
// and the application form (see lib/newsletterSignup.ts). Carries the WhatsApp invite link.

import { escapeHtml } from './escapeHtml';
import { WHATSAPP_INVITE_URL } from './links';

export function getSubscriptionConfirmationSubject(): string {
  return 'Willkommen beim IGNITE Startup Club!';
}

export function getSubscriptionConfirmationEmailHTML(confirmUrl: string, cancelUrl: string): string {
  return `
    <div style="font-family: Inter, sans-serif; background-color: #f9f9f9; padding: 2rem; border-radius: 8px; color: #333;">
      <h2 style="color: #8C3974;">Willkommen beim IGNITE Startup Club 🎉</h2>
      <p>Schön, dass du dich für unsere Initiative interessierst!</p>

      <p>Unseren Newsletter gibt es bei WhatsApp. Bestätige deine E-Mail-Adresse und tritt der Community bei!</p>

      <p style="text-align: center; margin: 2rem 0;">
        <a href="${escapeHtml(confirmUrl)}"
          style="display: inline-block; background-color: #8C3974; color: #fff; padding: 0.75rem 1.5rem; border-radius: 6px; text-decoration: none; font-weight: bold;">
          📧 E-Mail bestätigen
        </a>
      </p>

      <p>In der WhatsApp-Community bleibst du immer auf dem Laufenden über folgende Themen:</p>
      <ul style="line-height: 1.6;">
        <li>Events und Workshops rund ums Gründen in Lüneburg und Hamburg</li>
        <li>Einblicke in reale Startup-Projekte</li>
        <li>Austausch mit Gleichgesinnten</li>
      </ul>

      <p>Du kannst auch direkt beitreten:</p>

      <p style="text-align: center; margin: 2rem 0;">
        <a href="${escapeHtml(WHATSAPP_INVITE_URL)}"
          style="display: inline-block; background-color: #8C3974; color: #fff; padding: 0.75rem 1.5rem; border-radius: 6px; text-decoration: none; font-weight: bold;">
          👉 Jetzt WhatsApp-Gruppe beitreten
        </a>
      </p>

      <p style="font-size: 0.95rem; color: #555;">
        Falls du dich nicht selbst angemeldet hast, kannst du diese E-Mail einfach ignorieren oder dich jederzeit abmelden. Klicke dazu einfach auf den folgenden Link:
        <a href="${escapeHtml(cancelUrl)}" style="text-decoration: none; color: #8C3974; font-weight: bold;">
          E-Mail-Adresse austragen
        </a>
      </p>
    </div>
  `;
}
