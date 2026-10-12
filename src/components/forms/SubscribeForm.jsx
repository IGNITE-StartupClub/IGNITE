/**
 * Newsletter subscribe / confirm / unsubscribe form (React island on /subscribe).
 * Reads ?token= (double opt-in confirmation) and ?cancel= (unsubscribe) from the URL.
 * Posts to /api/newsletter, /api/confirm and /api/unsubscribe.
 * Props: copy (subscribeForm in the page language). Styles: ./forms.css.
 */
import React, { useState, useEffect } from 'react';
import './forms.css';

export default function SubscribeForm({ copy }) {
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
        <h2>{copy.welcomeHeading}</h2>
        <p>{copy.welcomeText}</p>
        <p>
          {copy.welcomeMailBefore} <strong>{email}</strong>
          {copy.welcomeMailAfter}
        </p>
        <a href={copy.backToHomeUrl} className="form-secondary">
          {copy.backToHome}
        </a>
      </div>
    );
  }

  if (isCancelled) {
    return (
      <div className="form-success-box" role="status">
        <h2>{copy.cancelledHeading}</h2>
        <p>{copy.cancelledText}</p>
        {status === 'error' && <p className="form-error" role="alert">{copy.cancelError}</p>}
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
      <span className="field-label">{copy.emailLabel}</span>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        readOnly={isConfirming}
        required
        placeholder={copy.emailPlaceholder}
        disabled={loading}
        className="input"
        autoComplete="email"
      />
    </label>
  );

  return (
    <form onSubmit={handleSubmit} className="form">
      <h2 className="fieldset-legend">{isConfirming ? copy.confirmHeading : copy.heading}</h2>

      {isConfirming && emailField}
      {textField('firstName', copy.firstNameLabel, firstName, setFirstName, { autoComplete: 'given-name' })}
      {textField('lastName', copy.lastNameLabel, lastName, setLastName, { autoComplete: 'family-name' })}
      {!isConfirming && emailField}

      <button type="submit" className="form-submit" disabled={loading}>
        {loading ? copy.submitting : isConfirming ? copy.confirm : copy.submit}
      </button>

      <p className="form-note">
        {isConfirming ? copy.confirmConsent : copy.consent}
      </p>

      <div aria-live="polite">
        {status === 'success' && <p className="form-success">{copy.success}</p>}
        {status === 'error' && <p className="form-error">{copy.error}</p>}
      </div>
    </form>
  );
}
