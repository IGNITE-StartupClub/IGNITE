import React, { useState, useEffect } from 'react';

export default function SubscribeForm() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [loading, setLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false); // True if it's a confirmation form
  const [isCancelled, setIsCancelled] = useState(false); // Track cancellation status
  const [showEndScreen, setShowEndScreen] = useState(false); // Show end screen after successful confirmation

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const cancel = urlParams.get('cancel');

      if (token) {
        setIsConfirming(true);

        fetch(`/api/confirm?token=${token}`)
          .then(res => {
            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
          })
          .then(data => {
            if (data.email) setEmail(data.email);
            if (data.firstName) setFirstName(data.firstName);
            if (data.lastName) setLastName(data.lastName);
          })
          .catch(err => {
            console.error('Error fetching confirmation data:', err);
            setStatus('error');
          });
      }

      if (cancel) {
        setIsCancelled(true);
        unsubscribeUser(cancel);
      }
    }
  }, []);

  const unsubscribeUser = async (emailToCancel) => {
    try {
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToCancel }),
      });

      if (response.ok) {
        setStatus('unsubscribed');
      } else {
        throw new Error('Failed to unsubscribe');
      }
    } catch (err) {
      console.error('Error unsubscribing user:', err);
      setStatus('error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setStatus(null);

    try {
      const submitData = { email, firstName, lastName };

      // Add confirmation flag for confirmation submissions
      if (isConfirming) {
        submitData.isConfirming = true;
      }

      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (res.ok) {
        setStatus('success');

        // Show end screen after successful confirmation
        if (isConfirming) {
          setShowEndScreen(true);
        } else {
          // Only clear form if not confirming
          setEmail('');
          setFirstName('');
          setLastName('');
        }
      } else {
        console.error('Error response from API');
        setStatus('error');
      }
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {showEndScreen ? (
        <div className="end-screen">
          <div className="end-screen-content">
            <div className="end-screen-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h2 className="end-screen-title">Willkommen im IGNITE Newsletter!</h2>
            <p className="end-screen-message">
              Deine Anmeldung ist jetzt bestätigt. Du erhältst ab sofort Updates zu Events, Workshops und Neuigkeiten aus der Startup-Szene.
            </p>
            <p className="end-screen-email">
              Wir haben dir eine Willkommens-E-Mail an <strong>{email}</strong> geschickt.
            </p>
            <a href="/" className="button color-secondary end-screen-button">
              Zurück zur Startseite
            </a>
          </div>
          <style>{`
            .end-screen {
              text-align: center;
              padding: 2rem 0;
            }
            .end-screen-content {
              max-width: 400px;
              margin: 0 auto;
            }
            .end-screen-icon {
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
            .end-screen-title {
              font-size: 1.75rem;
              font-weight: 700;
              color: #8C3974;
              margin-bottom: 1rem;
            }
            .end-screen-message {
              font-size: 1.1rem;
              color: var(--font-color, #333);
              margin-bottom: 1rem;
              line-height: 1.6;
            }
            .end-screen-email {
              font-size: 0.95rem;
              color: var(--neutral-400, #666);
              margin-bottom: 2rem;
            }
            .end-screen-button {
              display: inline-block;
              text-decoration: none;
            }
          `}</style>
        </div>
      ) : isCancelled ? (
        <div className="text-center">
          <h2 className="text-2xl font-bold">Du hast dich erfolgreich abgemeldet</h2>
          <p>Schade, dass du dich vom Newsletter abgemeldet hast!</p>
          {status === 'error' && <p className="error">Fehler beim Abmelden. Bitte versuche es später erneut.</p>}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="newsletter-form width-full">
          <h3>{isConfirming ? 'Bestätige deinen Newsletter-Abonnement' : 'Werde Teil der Community'}</h3>

          {isConfirming ? (
            <>
              {/* Prefilled email, disabled for confirmation */}
              <label>
                E-Mail
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full my-4 border-radius-4px border-1px-solid-#ccc"
                />
              </label>
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
              {/* Initial newsletter form */}
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
            {isConfirming
              ? 'Mit dem Absenden stimmst du unserer Datenschutzvereinbarung zu und bestätigst deine E-Mail Adresse für unseren Newsletter!'
              : 'Mit dem Absenden deiner Email-Adresse stimmst du unserer Datenschutzvereinbarung zu.'}
          </p>

          {status === 'success' && <p className="success">Danke für deine Anmeldung!</p>}
          {status === 'error' && <p className="error">Da ging etwas schief. Bitte versuch's später erneut.</p>}

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
      )}
    </div>
  );
}
