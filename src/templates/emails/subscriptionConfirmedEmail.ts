// Subscription Confirmed Email Template
// Sent to user right after they confirm their email address. The WhatsApp invite link
// is already part of the confirmation mail, so this one only acknowledges.

import { escapeHtml } from './escapeHtml';

export function getSubscriptionConfirmedSubject(): string {
  return 'Anmeldung bestätigt';
}

export function getSubscriptionConfirmedEmailHTML(firstName?: string): string {
  const greeting = firstName ? `Hallo ${escapeHtml(firstName)}` : 'Hallo';

  return `
    <div style="font-family: Inter, sans-serif; background-color: #f9f9f9; padding: 2rem; border-radius: 8px; color: #333; max-width: 600px; margin: auto;">
      <h1 style="color: #8C3974; margin: 0 0 1rem 0; font-size: 1.75rem; text-align: center;">Anmeldung bestätigt</h1>
      <p style="font-size: 1.1rem;">${greeting},</p>
      <p>deine E-Mail-Adresse ist bestätigt. Danke für deine Anmeldung!</p>
      <p style="font-size: 0.9rem; color: #666; margin-bottom: 0;">Dein IGNITE Team</p>
    </div>
  `;
}
