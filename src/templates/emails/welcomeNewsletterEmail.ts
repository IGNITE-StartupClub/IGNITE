// Welcome Newsletter Email Template
// Sent to user immediately after they confirm their newsletter subscription

export function getWelcomeNewsletterSubject(): string {
  return 'Willkommen im IGNITE Newsletter!';
}

export function getWelcomeNewsletterEmailHTML(firstName?: string): string {
  const greeting = firstName ? `Hallo ${firstName}` : 'Hallo';

  return `
    <div style="font-family: Inter, sans-serif; background-color: #f9f9f9; padding: 2rem; border-radius: 8px; color: #333; max-width: 600px; margin: auto;">
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <h1 style="color: #8C3974; margin-bottom: 0.5rem; font-size: 1.75rem;">Willkommen im IGNITE Newsletter!</h1>
      </div>

      <p style="font-size: 1.1rem;">${greeting},</p>

      <p>deine Anmeldung zum IGNITE Newsletter ist jetzt bestätigt. Ab sofort erhältst du regelmäßig Updates zu:</p>

      <ul style="line-height: 1.8; padding-left: 1.5rem;">
        <li><strong>Events & Workshops</strong> – Erfahre als Erste:r von unseren Veranstaltungen</li>
        <li><strong>Startup-Insights</strong> – Exklusive Einblicke in die Gründerszene</li>
        <li><strong>Community-News</strong> – Was bei IGNITE passiert</li>
        <li><strong>Karrierechancen</strong> – Praktika und Jobs im Startup-Umfeld</li>
      </ul>

      <div style="background: linear-gradient(135deg, rgba(140, 57, 116, 0.1) 0%, rgba(140, 57, 116, 0.15) 100%); padding: 1.5rem; border-radius: 8px; margin: 2rem 0; text-align: center;">
        <p style="margin: 0 0 1rem 0; font-weight: 600;">Noch näher dran?</p>
        <p style="margin: 0 0 1rem 0;">Tritt unserer WhatsApp-Community bei und vernetze dich direkt mit Gleichgesinnten!</p>
        <a href="https://chat.whatsapp.com/HtvynOI8sY125MmBZR4C1n"
           style="display: inline-block; background-color: #8C3974; color: #fff; padding: 0.75rem 1.5rem; border-radius: 6px; text-decoration: none; font-weight: bold;">
          WhatsApp-Gruppe beitreten
        </a>
      </div>

      <p>Folge uns auch auf Social Media:</p>
      <p style="margin-bottom: 2rem;">
        <a href="https://www.instagram.com/ignite_leuphana/" style="color: #8C3974; text-decoration: none; font-weight: 500;">Instagram: @ignite_leuphana</a>
        &nbsp;|&nbsp;
        <a href="https://www.linkedin.com/company/ignite-startup-club/" style="color: #8C3974; text-decoration: none; font-weight: 500;">LinkedIn</a>
      </p>

      <hr style="margin: 2rem 0; border: none; border-top: 1px solid #ddd;" />

      <p style="font-size: 0.9rem; color: #666;">
        Wir freuen uns, dich in unserer Community zu haben!
      </p>
      <p style="font-size: 0.9rem; color: #666; margin-bottom: 0;">
        Dein IGNITE Team
      </p>

      <p style="font-size: 0.8rem; color: #aaa; margin-top: 2rem;">
        Du kannst dich jederzeit vom Newsletter abmelden, indem du auf den Abmelde-Link in unseren E-Mails klickst.
      </p>
    </div>
  `;
}
