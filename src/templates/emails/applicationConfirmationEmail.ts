// Application Confirmation Email Template
// Sent to user after they submit a team application

import { escapeHtml } from './escapeHtml';
import { WHATSAPP_INVITE_URL } from './links';

export function getApplicationConfirmationSubject(): string {
  return 'Danke für deine Bewerbung – IGNITE Startup Club';
}

export function getApplicationConfirmationEmailHTML(name: string): string {
  return `
    <div style="font-family: Inter, sans-serif; background-color: #f9f9f9; padding: 2rem; border-radius: 8px; color: #333; max-width: 600px; margin:auto;">
      <h2 style="color: #8C3974;">Vielen Dank für deine Bewerbung 🙏</h2>
      <p>Hallo${name ? ` ${escapeHtml(name)}` : ''},</p>
      <p>wir haben deine Bewerbung erhalten und werden uns so schnell wie möglich bei dir melden.</p>
      <p>Bis dahin kannst du schon unserer WhatsApp-Community beitreten. Dort läuft auch unser Newsletter:</p>
      <p style="text-align: center; margin: 1.5rem 0;">
        <a href="${WHATSAPP_INVITE_URL}"
           style="display: inline-block; background-color: #8C3974; color: #fff; padding: 0.75rem 1.5rem; border-radius: 6px; text-decoration: none; font-weight: bold;">
          WhatsApp-Gruppe beitreten
        </a>
      </p>
      <p style="margin-top: 1.5rem;">Solltest du in der Zwischenzeit Fragen haben, kontaktiere uns einfach unter <a href="mailto:stud.initiative.ignite@leuphana.de">stud.initiative.ignite@leuphana.de</a>.</p>
      <hr style="margin: 2rem 0; border: none; border-top: 1px solid #ddd;" />
      <p style="font-size: 0.85rem; color: #888;">Diese E-Mail wurde automatisch generiert. Bitte nicht antworten.</p>
    </div>
  `;
}
