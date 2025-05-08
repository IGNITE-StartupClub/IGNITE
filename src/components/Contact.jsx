import React, { useState } from 'react';

export default function ContactForm() {
  const [data, setData] = useState({
    name: '',
    lastname: '',
    email: '',
    message: '',
    topic: '', // hinzugefügt für das Anliegen
  });
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

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
    return <p>Danke für deine Nachricht! Wir werden uns bald bei dir melden.</p>;
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
          <option value="partner">Partner werden</option>
          <option value="mitglied">Mitglied werden</option>
          <option value="workshop">Workshop veranstalten</option>
          <option value="sonstiges">Sonstiges</option>
        </select>
      </label>

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

        /* Light Mode Anpassungen */
        @media (prefers-color-scheme: light) {
          input, textarea {
            color: black; /* Schriftfarbe im Light Mode */
          }
        }
      `}</style>
    </form>
  );
}