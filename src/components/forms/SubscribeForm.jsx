/**
 * Newsletter subscribe / confirm / unsubscribe form (React island on /subscribe).
 * Reads ?token= (double opt-in confirmation) and ?cancel= (unsubscribe) from the URL.
 * Posts to /api/newsletter, /api/confirm and /api/unsubscribe. Styles: ./forms.css.
 */
import React, { useState, useEffect } from 'react';
import './forms.css';

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

  if (showEndScreen) {
    return (
      <div className="form-success-box" role="status">
        <h2>Willkommen im IGNITE Newsletter!</h2>
        <p>
          Deine Anmeldung ist jetzt bestätigt. Du erhältst ab sofort Updates zu Events, Workshops und Neuigkeiten aus
          der Startup-Szene.
        </p>
        <p>
          Wir haben dir eine Willkommens-E-Mail an <strong>{email}</strong> geschickt.
        </p>
        <a href="/" className="form-secondary">
          Zurück zur Startseite
        </a>
      </div>
    );
  }

  if (isCancelled) {
    return (
      <div className="form-success-box" role="status">
        <h2>Du hast dich erfolgreich abgemeldet</h2>
        <p>Schade, dass du dich vom Newsletter abgemeldet hast!</p>
        {status === 'error' && <p className="form-error" role="alert">Fehler beim Abmelden. Bitte versuche es später erneut.</p>}
      </div>
    );
  }

  const textField = (id, label, value, setValue, extra = {}) => (
    <label className="field" htmlFor={id}>
      <span className="field-label">{label}</span>
      <input
        id={id}
        type="text"
        name={id}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        required
        disabled={loading}
        className="input"
        {...extra}
      />
    </label>
  );

  const emailField = (
    <label className="field" htmlFor="email">
      <span className="field-label">E-Mail</span>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        readOnly={isConfirming}
        required
        placeholder="dein@email.de"
        disabled={loading}
        className="input"
        autoComplete="email"
      />
    </label>
  );

  return (
    <form onSubmit={handleSubmit} className="form">
      <h2 className="fieldset-legend">{isConfirming ? 'Bestätige dein Newsletter-Abonnement' : 'Werde Teil der Community'}</h2>

      {isConfirming && emailField}
      {textField('firstName', 'Vorname', firstName, setFirstName, { autoComplete: 'given-name' })}
      {textField('lastName', 'Nachname', lastName, setLastName, { autoComplete: 'family-name' })}
      {!isConfirming && emailField}

      <button type="submit" className="form-submit" disabled={loading}>
        {loading ? 'Wird gesendet...' : isConfirming ? 'Bestätigen' : 'Jetzt beitreten'}
      </button>

      <p className="form-note">
        {isConfirming
          ? 'Mit dem Absenden stimmst du unserer Datenschutzvereinbarung zu und bestätigst deine E-Mail-Adresse für unseren Newsletter.'
          : 'Mit dem Absenden deiner E-Mail-Adresse stimmst du unserer Datenschutzvereinbarung zu.'}
      </p>

      <div aria-live="polite">
        {status === 'success' && <p className="form-success">Danke für deine Anmeldung!</p>}
        {status === 'error' && <p className="form-error">Da ging etwas schief. Bitte versuch es später erneut.</p>}
      </div>
    </form>
  );
}
