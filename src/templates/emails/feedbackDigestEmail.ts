// Feedback Digest Email Template
// Sent daily at 23:00 to admin recipients if there are new feedbacks

export interface FeedbackItem {
  firstName: string;
  lastName: string;
  event: string;
  feedback: string;
  consentToPublish: boolean;
  createdAt: Date;
}

export function getFeedbackDigestSubject(count: number): string {
  return count === 1
    ? '1 neues Feedback eingegangen'
    : `${count} neue Feedbacks eingegangen`;
}

export function getFeedbackDigestEmailHTML(feedbacks: FeedbackItem[]): string {
  const feedbackRows = feedbacks.map((fb, index) => {
    const date = new Date(fb.createdAt).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const publishBadge = fb.consentToPublish
      ? '<span style="background: #4caf50; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">Veröffentlichung erlaubt</span>'
      : '<span style="background: #9e9e9e; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">Nur intern</span>';

    return `
      <div style="background: #f9f9f9; border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem; border-left: 4px solid #8C3974;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <strong style="color: #333; font-size: 1rem;">${fb.firstName} ${fb.lastName}</strong>
            <span style="color: #666; font-size: 0.9rem;"> zu "${fb.event}"</span>
          </div>
          ${publishBadge}
        </div>
        <p style="color: #333; margin: 0.75rem 0; line-height: 1.6; white-space: pre-wrap;">${fb.feedback}</p>
        <p style="color: #999; font-size: 0.8rem; margin: 0;">${date}</p>
      </div>
    `;
  }).join('');

  const publishableCount = feedbacks.filter(f => f.consentToPublish).length;

  return `
    <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; max-width: 700px; margin: 0 auto; padding: 2rem; background: white;">
      <div style="text-align: center; margin-bottom: 2rem;">
        <h1 style="color: #8C3974; margin-bottom: 0.5rem; font-size: 1.5rem;">Tägliche Feedback-Übersicht</h1>
        <p style="color: #666; margin: 0;">
          ${feedbacks.length} neue${feedbacks.length === 1 ? 's' : ''} Feedback${feedbacks.length === 1 ? '' : 's'} eingegangen
          ${publishableCount > 0 ? ` (${publishableCount} zur Veröffentlichung freigegeben)` : ''}
        </p>
      </div>

      <div style="margin-bottom: 2rem;">
        ${feedbackRows}
      </div>

      <hr style="border: none; border-top: 1px solid #eee; margin: 2rem 0;" />

      <div style="text-align: center; color: #999; font-size: 0.85rem;">
        <p style="margin: 0 0 0.5rem 0;">Diese E-Mail wurde automatisch um 23:00 Uhr versendet.</p>
        <p style="margin: 0;">
          <a href="https://ignite-startupclub.de" style="color: #8C3974; text-decoration: none;">IGNITE Startup Club</a>
        </p>
      </div>
    </div>
  `;
}
