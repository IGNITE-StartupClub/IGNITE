// Application Email Template
// Sent to admin when a team application is submitted

export interface ApplicationEmailData {
  teams?: string[];
  startupInterest?: string;
  name: string;
  lastname: string;
  email: string;
  [key: string]: any; // For dynamic questionnaire fields
}

export function getApplicationEmailSubject(): string {
  return 'Neue Bewerbung eingegangen';
}

export function getApplicationEmailHTML(data: ApplicationEmailData, questionLabels: Record<string, string>): string {
  // Format teams as a readable list
  const teamsArray = Array.isArray(data.teams) ? data.teams : [];
  const teamsList = teamsArray.length > 0 ? teamsArray.join(', ') : 'Keine Teams ausgewählt';

  // Safely format all data fields
  const formatField = (value: any) => {
    if (value === null || value === undefined) return 'Nicht angegeben';
    if (Array.isArray(value)) return value.join(', ') || 'Keine Angabe';
    return String(value);
  };

  // Build table rows dynamically
  let tableRows = `
    <tr style="border-bottom: 1px solid #f0f0f0;">
      <td style="padding: 12px 8px; font-weight: bold; vertical-align: top; width: 35%; min-width: 120px;">
        <strong>Gewählte Teams:</strong>
      </td>
      <td style="padding: 12px 8px; vertical-align: top;">${teamsList}</td>
    </tr>
    <tr style="border-bottom: 1px solid #f0f0f0;">
      <td style="padding: 12px 8px; font-weight: bold; vertical-align: top;">
        <strong>Startup-Interesse:</strong>
      </td>
      <td style="padding: 12px 8px; vertical-align: top;">${formatField(data.startupInterest)}</td>
    </tr>
  `;

  // Add all questions dynamically
  Object.keys(questionLabels).forEach(qId => {
    if (data[qId]) {
      tableRows += `
        <tr style="border-bottom: 1px solid #f0f0f0;">
          <td style="padding: 12px 8px; font-weight: bold; vertical-align: top;">
            <strong>${questionLabels[qId]}:</strong>
          </td>
          <td style="padding: 12px 8px; vertical-align: top; word-wrap: break-word;">${formatField(data[qId])}</td>
        </tr>
      `;
    }
  });

  // Add personal data
  tableRows += `
    <tr style="border-bottom: 1px solid #f0f0f0;">
      <td style="padding: 12px 8px; font-weight: bold; vertical-align: top;"><strong>Vorname:</strong></td>
      <td style="padding: 12px 8px; vertical-align: top;">${formatField(data.name)}</td>
    </tr>
    <tr style="border-bottom: 1px solid #f0f0f0;">
      <td style="padding: 12px 8px; font-weight: bold; vertical-align: top;"><strong>Nachname:</strong></td>
      <td style="padding: 12px 8px; vertical-align: top;">${formatField(data.lastname)}</td>
    </tr>
    <tr>
      <td style="padding: 12px 8px; font-weight: bold; vertical-align: top;"><strong>E-Mail:</strong></td>
      <td style="padding: 12px 8px; vertical-align: top; word-break: break-all;">${formatField(data.email)}</td>
    </tr>
  `;

  return `
    <div style="font-family: Inter, sans-serif; padding:2rem; border:1px solid #eee; border-radius:8px; max-width:600px; margin:auto;">
      <h2 style="color:#8C3974;">📬 Neue Bewerbung</h2>
      <table style="width:100%; line-height:1.6; border-collapse: separate; border-spacing: 0;">
        ${tableRows}
      </table>
      <p style="font-size:0.85rem; color:#888; margin-top:1.5rem;">
        Diese Nachricht wurde automatisch über das Bewerbungsformular gesendet.
      </p>
    </div>
    <style>
    @media (max-width: 600px) {
      table {
        font-size: 14px;
      }
      td {
        display: block !important;
        width: 100% !important;
        padding: 8px 12px !important;
      }
      td:first-child {
        padding-bottom: 4px !important;
        border-bottom: none !important;
      }
      td:last-child {
        padding-top: 4px !important;
        padding-bottom: 16px !important;
        margin-bottom: 8px;
        border-bottom: 1px solid #e0e0e0 !important;
      }
    }
    </style>
  `;
}
