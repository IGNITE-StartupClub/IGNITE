// Subscription Confirmation Email Template
// Sent to user when they need to confirm their newsletter subscription

export function getSubscriptionConfirmationSubject(): string {
  return 'Bitte bestätige deine Anmeldung';
}

export function getSubscriptionConfirmationEmailHTML(firstName: string, confirmUrl: string): string {
  return `
    <p>Hi ${firstName},</p>
    <p>bitte bestätige deine E-Mail-Adresse, indem du auf den Link klickst:</p>
    <p><a href="${confirmUrl}">Anmeldung bestätigen</a></p>
    <p>Wenn du das nicht angefordert hast, ignoriere diese Mail.</p>
  `;
}
