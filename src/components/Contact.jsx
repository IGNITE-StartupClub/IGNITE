import React, { useState, useEffect } from 'react';

export default function ContactForm({ initialIntent = '' }) {
  const [data, setData] = useState({
    name: '',
    lastname: '',
    email: '',
    message: '',
    topic: '', // hinzugefügt für das Anliegen
    // Additional fields for Advisory Board
    organization: '',
    position: '',
    linkedin: '',
    phone: '',
    expertise: '',
  });
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  // Map URL intent parameter to topic value
  useEffect(() => {
    if (initialIntent) {
      setData(d => ({ ...d, topic: initialIntent }));
    }
  }, [initialIntent]);

  const handleChange = e => {
    const { name, value } = e.target;
    setData(d => ({ ...d, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setDone(true);
      } else {
        setError(result.message || 'Ein Fehler ist aufgetreten');
      }
    } catch (err) {
      setError('Fehler beim Absenden der Nachricht');
    }
  };

  if (done) {
    return (
      <div className="success-message">
        {data.topic === 'advisory' ? (
          <>
            <h3>Vielen Dank für Ihr Interesse!</h3>
            <p>
              Wir haben Ihre Anfrage zum Advisory Board erhalten und freuen uns sehr über Ihr Interesse,
              den IGNITE Startup Club Lüneburg zu unterstützen. Unser Team wird sich zeitnah bei Ihnen melden,
              um die nächsten Schritte zu besprechen.
            </p>
            <p className="contact-info">
              Bei dringenden Fragen erreichen Sie uns auch direkt unter{' '}
              <a href="mailto:info@ignite-startupclub.de">info@ignite-startupclub.de</a>
            </p>
          </>
        ) : (
          <>
            <h3>Danke für deine Nachricht!</h3>
            <p>Wir werden uns bald bei dir melden.</p>
          </>
        )}
        <style>{`
          .success-message {
            padding: 2rem;
            background: linear-gradient(135deg, rgba(255, 159, 252, 0.1), rgba(101, 186, 255, 0.1));
            border: 2px solid var(--primary-300);
            border-radius: 1rem;
            text-align: center;
          }
          .success-message h3 {
            color: var(--primary-300);
            margin-bottom: 1rem;
          }
          .success-message p {
            margin-bottom: 1rem;
            line-height: 1.6;
          }
          .contact-info {
            font-size: 0.9rem;
            color: var(--neutral-400);
          }
          .contact-info a {
            color: var(--primary-300);
            text-decoration: none;
          }
          .contact-info a:hover {
            text-decoration: underline;
          }
        `}</style>
      </div>
    );
  }

  return (
    <form
      id="contact-form"
      onSubmit={handleSubmit}
      className="contact-form"
    >
      {/* Anliegen Dropdown */}
      <label>
        Anliegen
        <select
          name="topic"
          value={data.topic}
          onChange={handleChange}
          required
        >
          <option value="">Bitte wählen</option>
          <option value="advisory">Advisory Board Interesse</option>
          <option value="partner">Partner werden</option>
          <option value="mitglied">Mitglied werden</option>
          <option value="workshop">Workshop veranstalten</option>
          <option value="sonstiges">Sonstiges</option>
        </select>
      </label>

      {/* Advisory Board specific info message */}
      {data.topic === 'advisory' && (
        <div className="advisory-info">
          <p>
            Vielen Dank für Ihr Interesse an unserem Advisory Board! Um Sie optimal unterstützen zu können,
            bitten wir Sie um einige zusätzliche Informationen zu Ihrer Person und Expertise.
          </p>
        </div>
      )}

      {/* Name and Email */}
      <div className="flex-row flex gap-4 width-full">
        <label className="flex-1">
          Vorname
          <input
            name="name"
            value={data.name}
            onChange={handleChange}
            required
            className="w-full"
          />
        </label>
        <label className="flex-1">
          Nachname
          <input
            name="lastname"
            value={data.lastname}
            onChange={handleChange}
            required
            className="w-full"
          />
        </label>
      </div>

      <label>
        E-Mail
        <input
          type="email"
          name="email"
          value={data.email}
          onChange={handleChange}
          required
        />
      </label>

      {/* Advisory Board specific fields */}
      {data.topic === 'advisory' && (
        <>
          <label>
            Organisation/Unternehmen
            <input
              name="organization"
              value={data.organization}
              onChange={handleChange}
              required
              placeholder="Name Ihrer Organisation"
            />
          </label>

          <label>
            Position/Rolle
            <input
              name="position"
              value={data.position}
              onChange={handleChange}
              required
              placeholder="Ihre aktuelle Position"
            />
          </label>

          <div className="flex-row flex gap-4 width-full">
            <label className="flex-1">
              Telefonnummer (optional)
              <input
                type="tel"
                name="phone"
                value={data.phone}
                onChange={handleChange}
                placeholder="+49 123 456789"
                className="w-full"
              />
            </label>
            <label className="flex-1">
              LinkedIn Profil (optional)
              <input
                type="url"
                name="linkedin"
                value={data.linkedin}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/..."
                className="w-full"
              />
            </label>
          </div>

          <label>
            Fachgebiet/Expertise
            <textarea
              name="expertise"
              value={data.expertise}
              onChange={handleChange}
              required
              rows="3"
              placeholder="Beschreiben Sie kurz Ihre Expertise und wie Sie das IGNITE Team unterstützen können..."
            />
          </label>
        </>
      )}

      {/* Message */}
      <label>
        Nachricht
        <textarea
          name="message"
          value={data.message}
          onChange={handleChange}
          required
        />
      </label>

      {/* Error message */}
      {error && <p className="error-message">{error}</p>}

      <button type="submit" className="button secondary">
        Absenden
      </button>

      <style>{`
        .contact-form {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md, 1rem);
        }
        label {
          display: flex;
          flex-direction: column;
          font-weight: 500;
        }
        input,
        textarea {
          margin-top: 0.25rem;
          padding: var(--spacing-sm, 0.5rem);
          border: 1px solid var(--neutral-400);
          border-radius: var(--radius-sm, 4px);
        }

        select {
        margin-top: 0.25rem;
        padding: var(--spacing-sm, 0.5rem) 2.5rem 0.5rem 0.75rem;
        border: 1px solid var(--neutral-400);
        border-radius: var(--radius-sm, 4px);
        background-color: white;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23666'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 0.75rem center;
        background-size: 1rem;
        font-size: 1rem;
        color: #333;
        cursor: pointer;

        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
      }

      select:focus {
        border-color: var(--primary-400);
        outline: none;
        box-shadow: 0 0 0 3px rgba(140, 57, 116, 0.2); /* leichter pink/lila Fokus */
      }

        .error-message {
          color: red;
          font-size: 0.875rem;
        }

        /* Advisory Board Info Box */
        .advisory-info {
          background: linear-gradient(135deg, rgba(255, 159, 252, 0.08), rgba(101, 186, 255, 0.08));
          border-left: 4px solid var(--primary-300);
          padding: 1.25rem;
          border-radius: 0.5rem;
          margin: 0.5rem 0;
        }

        .advisory-info p {
          margin: 0;
          line-height: 1.6;
          color: var(--neutral-300);
          font-size: 0.95rem;
        }

        /* Enhanced styling for advisory board fields */
        .contact-form input[placeholder],
        .contact-form textarea[placeholder] {
          font-style: italic;
        }

        .contact-form input:focus,
        .contact-form textarea:focus,
        .contact-form select:focus {
          border-color: var(--primary-400);
          outline: none;
          box-shadow: 0 0 0 3px rgba(140, 57, 116, 0.2);
          transition: all 0.2s ease-in-out;
        }

        /* Professional styling for required fields */
        .contact-form label::after {
          content: ' *';
          color: var(--primary-300);
          font-weight: bold;
        }

        /* Remove asterisk from optional fields */
        .contact-form label:has(input[type="tel"])::after,
        .contact-form label:has(input[type="url"][name="linkedin"])::after {
          content: ' (optional)';
          color: var(--neutral-500);
          font-weight: normal;
          font-size: 0.85rem;
          font-style: italic;
        }

        /* Light Mode Anpassungen */
        @media (prefers-color-scheme: light) {
          input, textarea {
            color: black; /* Schriftfarbe im Light Mode */
          }

          .advisory-info {
            background: linear-gradient(135deg, rgba(255, 159, 252, 0.15), rgba(101, 186, 255, 0.15));
          }

          .advisory-info p {
            color: #333;
          }
        }
      `}</style>
    </form>
  );
}