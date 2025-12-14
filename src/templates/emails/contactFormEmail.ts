// Contact Form Email Template
// Sent to admin when a contact form is submitted

export interface ContactFormData {
  topic: string;
  name: string;
  lastname: string;
  email: string;
  message: string;
  organization?: string;
  position?: string;
  phone?: string;
  linkedin?: string;
  expertise?: string;
}

export function getContactFormSubject(isAdvisoryBoard: boolean): string {
  return isAdvisoryBoard
    ? '🌟 Neue Advisory Board Anfrage'
    : 'Neue Kontaktanfrage über das Formular';
}

export function getContactFormEmailHTML(data: ContactFormData): string {
  const isAdvisoryBoard = data.topic === 'advisory';

  // Build advisory board specific fields HTML
  const advisoryFieldsHTML = isAdvisoryBoard ? `
    <div style="background-color: #f9f5ff; padding: 1rem; border-radius: 6px; margin-top: 1rem; border-left: 4px solid #8C3974;">
      <h3 style="color: #8C3974; margin: 0 0 0.75rem 0; font-size: 1.1rem;">📋 Advisory Board Details</h3>
      <table style="width: 100%; line-height: 1.6;">
        ${data.organization ? `<tr><td><strong>Organisation:</strong></td><td>${data.organization}</td></tr>` : ''}
        ${data.position ? `<tr><td><strong>Position:</strong></td><td>${data.position}</td></tr>` : ''}
        ${data.phone ? `<tr><td><strong>Telefon:</strong></td><td>${data.phone}</td></tr>` : ''}
        ${data.linkedin ? `<tr><td><strong>LinkedIn:</strong></td><td><a href="${data.linkedin}" style="color: #8C3974;">${data.linkedin}</a></td></tr>` : ''}
      </table>
      ${data.expertise ? `
        <div style="margin-top: 1rem;">
          <p style="margin: 0 0 0.5rem 0;"><strong>Fachgebiet/Expertise:</strong></p>
          <p style="background-color: #ffffff; padding: 0.75rem; border-radius: 4px; margin: 0; white-space: pre-wrap;">${data.expertise}</p>
        </div>
      ` : ''}
    </div>
  ` : '';

  return `
    <div style="font-family: Inter, sans-serif; background-color: #ffffff; padding: 2rem; border-radius: 8px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee;">
      <h2 style="color: #8C3974; margin-bottom: 1rem;">${isAdvisoryBoard ? '🌟 Neue Advisory Board Anfrage' : '📩 Neue Kontaktanfrage'}</h2>
      ${isAdvisoryBoard ? '<p style="background-color: #fff9e6; padding: 0.75rem; border-radius: 4px; color: #856404; border: 1px solid #ffeaa7;"><strong>⚡ Priorität:</strong> Advisory Board Interessent – Bitte zeitnah persönlich antworten!</p>' : ''}

      <table style="width: 100%; line-height: 1.6;">
        <tr><td><strong>Anliegen:</strong></td><td>${data.topic}</td></tr>
        <tr><td><strong>Vorname:</strong></td><td>${data.name}</td></tr>
        <tr><td><strong>Nachname:</strong></td><td>${data.lastname}</td></tr>
        <tr><td><strong>E-Mail:</strong></td><td><a href="mailto:${data.email}" style="color: #8C3974;">${data.email}</a></td></tr>
      </table>

      ${advisoryFieldsHTML}

      <div style="margin-top: 1.5rem;">
        <p style="margin: 0 0 0.5rem 0;"><strong>Nachricht:</strong></p>
        <p style="background-color: #f5f5f5; padding: 1rem; border-radius: 6px; white-space: pre-wrap;">${data.message}</p>
      </div>

      <hr style="margin: 2rem 0; border: none; border-top: 1px solid #ddd;" />
      <p style="font-size: 0.85rem; color: #888;">Diese Nachricht wurde automatisch über das Kontaktformular auf der Website gesendet.</p>
    </div>
  `;
}
