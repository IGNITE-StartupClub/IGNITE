import React, { useState, useEffect } from 'react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [loading, setLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false); // True if it's a confirmation form

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      // Token is present, so it's a confirmation page
      setIsConfirming(true);
      // Fetch the pre-filled data from the backend (email, first name, last name)
      fetch(`/api/confirm?token=${token}`)
        .then(res => res.json())
        .then(data => {
          setEmail(data.email);
          setFirstName(data.firstName);
          setLastName(data.lastName);
        })
        .catch(err => console.error('Error fetching confirmation data:', err));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName, lastName }),
      });

      if (res.ok) {
        setStatus('success');
        setEmail('');
        setFirstName('');
        setLastName('');
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
      <h3>{isConfirming ? 'Bestätige deinen Newsletter-Abonnement' : 'Werde Teil der Community'}</h3>
      {isConfirming ? (
        <>
          <label>
            Vorname
            <input
              type="text"
              name="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              disabled={loading}
              className="w-full my-4 border-radius-4px border-1px-solid-#ccc"
            />
          </label>
          <label>
            Nachname
            <input
              type="text"
              name="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              disabled={loading}
              className="w-full my-4 border-radius-4px border-1px-solid-#ccc"
            />
          </label>
        </>
      ) : (
        <>
          <label>
            E-Mail
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
        </>
      )}

      <button
        type="submit"
        className="button color-secondary"
        disabled={loading}
      >
        {loading ? 'Wird gesendet...' : isConfirming ? 'Bestätigen' : 'Jetzt beitreten'}
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
      `}</style>
    </form>
  );
}