import React, { useState } from 'react';
import { events, getEventDisplayName } from '../data/eventsData';

export default function FeedbackForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    event: '',
    customEvent: '',
    feedback: '',
    eventSuggestion: '',
    subscribeNewsletter: false,
    consentToPublish: false,
    email: '' // Only needed if subscribing to newsletter
  });
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      // Determine the actual event name
      const eventName = formData.event === 'other'
        ? formData.customEvent
        : formData.event;

      const submitData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        event: eventName,
        feedback: formData.feedback,
        eventSuggestion: formData.eventSuggestion || undefined,
        consentToPublish: formData.consentToPublish,
        subscribeNewsletter: formData.subscribeNewsletter,
        email: formData.subscribeNewsletter ? formData.email : undefined
      };

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (res.ok) {
        setStatus('success');
        setShowSuccess(true);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Error response:', errorData);
        setStatus('error');
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="feedback-success">
        <div className="success-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <h2>Vielen Dank für dein Feedback!</h2>
        <p>Deine Rückmeldung hilft uns, unsere Veranstaltungen noch besser zu machen.</p>
        {formData.subscribeNewsletter && (
          <p className="newsletter-note">
            Du erhältst in Kürze eine Bestätigungsmail für den Newsletter.
          </p>
        )}
        <a href="/" className="button color-secondary">
          Zurück zur Startseite
        </a>

        <style>{`
          .feedback-success {
            text-align: center;
            padding: 2rem;
          }
          .success-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #8C3974 0%, #a8457d 100%);
            border-radius: 50%;
            margin-bottom: 1.5rem;
            color: white;
          }
          .feedback-success h2 {
            color: #8C3974;
            margin-bottom: 1rem;
          }
          .feedback-success p {
            margin-bottom: 1rem;
            color: var(--font-color, #333);
          }
          .newsletter-note {
            font-size: 0.9rem;
            color: var(--neutral-400, #666);
            font-style: italic;
          }
        `}</style>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="feedback-form">
      <div className="form-row">
        <label className="form-field">
          <span className="label-text">Vorname *</span>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="Max"
          />
        </label>

        <label className="form-field">
          <span className="label-text">
            Nachname *
            <span className="label-hint">(bleibt privat)</span>
          </span>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="Mustermann"
          />
        </label>
      </div>

      <label className="form-field">
        <span className="label-text">Veranstaltung *</span>
        <select
          name="event"
          value={formData.event}
          onChange={handleChange}
          required
          disabled={loading}
        >
          <option value="">Bitte wählen...</option>
          {events.map((event) => (
            <option key={event.id} value={event.name}>
              {getEventDisplayName(event)}
            </option>
          ))}
          <option value="other">Andere Veranstaltung...</option>
        </select>
      </label>

      {formData.event === 'other' && (
        <label className="form-field">
          <span className="label-text">Name der Veranstaltung *</span>
          <input
            type="text"
            name="customEvent"
            value={formData.customEvent}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="z.B. Startup Weekend 2024"
          />
        </label>
      )}

      <label className="form-field">
        <span className="label-text">Dein Feedback *</span>
        <textarea
          name="feedback"
          value={formData.feedback}
          onChange={handleChange}
          required
          disabled={loading}
          rows={5}
          placeholder="Was hat dir gefallen? Was können wir verbessern?"
        />
      </label>

      <label className="form-field">
        <span className="label-text">
          Event-Vorschlag
          <span className="label-hint">(optional)</span>
        </span>
        <textarea
          name="eventSuggestion"
          value={formData.eventSuggestion}
          onChange={handleChange}
          disabled={loading}
          rows={3}
          placeholder="Welche Events wünschst du dir? z.B. Workshop zu KI, Networking-Abend, Gründer-Stammtisch..."
        />
      </label>

      <div className="checkbox-group">
        <label className="checkbox-field">
          <input
            type="checkbox"
            name="consentToPublish"
            checked={formData.consentToPublish}
            onChange={handleChange}
            disabled={loading}
          />
          <span className="checkbox-text">
            Ich bin damit einverstanden, dass mein Feedback (mit Vorname) auf der Website veröffentlicht werden darf.
          </span>
        </label>

        <label className="checkbox-field">
          <input
            type="checkbox"
            name="subscribeNewsletter"
            checked={formData.subscribeNewsletter}
            onChange={handleChange}
            disabled={loading}
          />
          <span className="checkbox-text">
            Ich möchte den IGNITE Newsletter abonnieren und über Events informiert werden.
          </span>
        </label>
      </div>

      {formData.subscribeNewsletter && (
        <label className="form-field email-field">
          <span className="label-text">E-Mail Adresse *</span>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="deine@email.de"
          />
        </label>
      )}

      <button
        type="submit"
        className="button color-secondary submit-button"
        disabled={loading}
      >
        {loading ? 'Wird gesendet...' : 'Feedback absenden'}
      </button>

      {status === 'error' && (
        <p className="error-message">
          Da ist leider etwas schiefgelaufen. Bitte versuche es später erneut.
        </p>
      )}

      <p className="privacy-note">
        * Pflichtfelder. Dein Nachname wird nicht veröffentlicht und dient nur der internen Zuordnung.
      </p>

      <style>{`
        .feedback-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          width: 100%;
          margin: 0;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        @media (max-width: 640px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .label-text {
          font-weight: 500;
          color: var(--font-color, #333);
        }

        .label-hint {
          font-weight: 400;
          font-size: 0.85rem;
          color: var(--neutral-400, #666);
          margin-left: 0.5rem;
        }

        input:not([type="checkbox"]), select, textarea {
          width: 100%;
          box-sizing: border-box;
          padding: 0.75rem;
          border-radius: 6px;
          border: 1px solid #ccc;
          font-size: 1rem;
          font-family: inherit;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: #8C3974;
          box-shadow: 0 0 0 3px rgba(140, 57, 116, 0.1);
        }

        textarea {
          resize: vertical;
          min-height: 120px;
        }

        .checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(140, 57, 116, 0.05);
          border-radius: 8px;
        }

        .checkbox-field {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          cursor: pointer;
        }

        .checkbox-field input[type="checkbox"] {
          width: 20px;
          height: 20px;
          margin-top: 2px;
          cursor: pointer;
          accent-color: #8C3974;
        }

        .checkbox-text {
          font-size: 0.95rem;
          color: var(--font-color, #333);
          line-height: 1.4;
        }

        .email-field {
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .submit-button {
          margin-top: 0.5rem;
          padding: 0.875rem 2rem;
          font-size: 1rem;
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-message {
          color: #d32f2f;
          font-size: 0.9rem;
          padding: 0.75rem;
          background: #ffebee;
          border-radius: 6px;
        }

        .privacy-note {
          font-size: 0.85rem;
          color: var(--neutral-400, #666);
          text-align: center;
          margin-top: 0.5rem;
        }

        /* Light mode adjustments */
        @media (prefers-color-scheme: light) {
          input, select, textarea {
            background: white;
            color: #333;
          }
        }

        /* Dark mode adjustments */
        .darkmode input,
        .darkmode select,
        .darkmode textarea {
          background: var(--dark-100, #1a1a1a);
          border-color: var(--neutral-700, #444);
          color: var(--font-color, #fff);
        }

        .darkmode .checkbox-group {
          background: rgba(140, 57, 116, 0.1);
        }

        .darkmode .error-message {
          background: rgba(211, 47, 47, 0.2);
        }
      `}</style>
    </form>
  );
}
