// Contact Confirmation Email Template
// Sent to user after they submit a contact form

export function getContactConfirmationSubject(isAdvisoryBoard: boolean): string {
  return isAdvisoryBoard
    ? 'Vielen Dank für Ihr Interesse am Advisory Board – IGNITE Startup Club'
    : 'Danke für deine Kontaktanfrage – IGNITE Startup Club';
}

export function getContactConfirmationEmailHTML(name?: string, isAdvisoryBoard: boolean = false): string {
  if (isAdvisoryBoard) {
    return `
      <div style="font-family: Inter, sans-serif; background-color: #ffffff; padding: 2rem; border-radius: 8px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee;">
        <div style="text-align: center; margin-bottom: 2rem;">
          <h2 style="color: #8C3974; margin-bottom: 0.5rem;">Vielen Dank für Ihr Interesse! 🌟</h2>
        </div>
        <p>Sehr geehrte${name ? 'r ' + name : ' Damen und Herren'},</p>
        <p>vielen Dank für Ihr Interesse am Advisory Board des IGNITE Startup Club Lüneburg.</p>
        <p>Wir freuen uns sehr über Ihre Bereitschaft, unsere studentische Initiative mit Ihrer Expertise zu unterstützen und unseren Mitgliedern wertvolle Einblicke in die Praxis zu ermöglichen.</p>
        <hr style="margin: 2rem 0; border: none; border-top: 1px solid #ddd;" />
        <p style="font-size: 0.85rem; color: #aaa; margin-top: 1.5rem;">Diese E-Mail wurde automatisch versendet.</p>
      </div>
    `;
  }

  return `
    <div style="font-family: Inter, sans-serif; background-color: #f9f9f9; padding: 2rem; border-radius: 8px; color: #333;">
      <h2 style="color: #8C3974;">Danke für deine Nachricht 🙌</h2>
      <p>Hallo${name ? ` ${name}` : ''},</p>
      <p>vielen Dank für deine Kontaktanfrage. Wir kümmern uns um dein Anliegen und antworten dir so schnell wie möglich.</p>
      <hr style="margin: 2rem 0; border: none; border-top: 1px solid #ddd;" />
      <p style="font-size: 0.85rem; color: #aaa;">Diese E-Mail wurde automatisch versendet.</p>
    </div>
  `;
}
