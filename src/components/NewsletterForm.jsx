import React, { useState } from 'react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus('success');
        setEmail('');
      } else {
        const data = await res.json();
        console.error(data.message);
        setStatus('error');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="newsletter-form width-full">
      <label>
        <h3>Werde Teil der Community</h3>
        <p>Du erhältst eine E-Mail mit einem Einladungslink</p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="dein@email.de"
          className="w-full my-4 border-radius-4px border-1px-solid-#ccc"
          disabled={loading}
        />
      </label>

      <button
        type="submit"
        className="button color-secondary"
        disabled={loading}
      >
        {loading ? 'Wird gesendet...' : 'Jetzt beitreten'}
      </button>

      <p className="text-neutral-500">
        Mit dem Absenden deiner Email-Adresse stimmst du unserer Datenschutzvereinbarung zu.
      </p>

      {status === 'success' && <p className="success">Danke für deine Anmeldung!</p>}
      {status === 'error' && <p className="error">Da ging etwas schief. Bitte versuch’s später erneut.</p>}

      <style>{`
        .newsletter-form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        label {
          font-weight: 500;
        }
        input {
          padding: 0.5rem;
          border-radius: 4px;
          border: 1px solid #ccc;
        }
        button[disabled] {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .success {
          color: green;
          font-size: 0.9rem;
        }
        .error {
          color: red;
          font-size: 0.9rem;
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