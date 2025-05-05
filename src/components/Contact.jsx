import React, { useState } from 'react';

export default function ContactForm() {
  const [data, setData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null); // To capture error messages

  const handleChange = e => {
    const { name, value } = e.target;
    setData(d => ({ ...d, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null); // Reset errors before submitting

    try {
      const response = await fetch('/api/submit', {  // Make sure you are calling the correct route
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
        .error-message {
          color: red;
          font-size: 0.875rem;
        }
      `}</style>
    </form>
  );
}