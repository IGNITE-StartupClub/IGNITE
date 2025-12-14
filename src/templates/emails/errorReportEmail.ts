// Error Report Email Template
// Sent to admin when an error occurs in the application

export function getErrorReportSubject(): string {
  return '⚠️ Fehler bei der Datenbankanfrage';
}

export function getErrorReportEmailHTML(errorMessage: string, context?: string): string {
  const timestamp = new Date().toISOString();
  const contextInfo = context ? `<p><strong>Context:</strong> ${context}</p>` : '';

  return `
    <div style="font-family:Inter,sans-serif;padding:2rem;border:1px solid #f5c6cb;border-radius:8px;background:#f8d7da;color:#721c24;max-width:600px;margin:auto;">
      <h2>Fehler bei der DB-Anfrage</h2>
      <p><strong>Fehler:</strong> ${errorMessage}</p>
      ${contextInfo}
      <p><strong>Zeitstempel:</strong> ${timestamp}</p>
      <p><em>Dies ist eine automatisch generierte Nachricht.</em></p>
    </div>
  `;
}
