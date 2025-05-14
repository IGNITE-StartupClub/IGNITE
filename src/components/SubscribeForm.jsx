import React, { useState, useEffect } from 'react';

console.log('Pre-Render');

export default function SubscribeForm() {
  console.log("NewsletterForm rendered");

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [loading, setLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false); // True if it's a confirmation form
  const [isCancelled, setIsCancelled] = useState(false); // Track cancellation status

  console.log('Component state:', { email, firstName, lastName, status, loading, isConfirming, isCancelled });

  useEffect(() => {
    console.log('useEffect is running');
    
    if (typeof window !== 'undefined') {
      console.log('useEffect is running in the browser');
      
      const urlParams = new URLSearchParams(window.location.search);
      console.log('URL Params:', urlParams.toString());
      
      const token = urlParams.get('token');
      console.log('Extracted Token:', token);
      
      const cancel = urlParams.get('cancel');
      console.log('Extracted Cancel:', cancel);

      if (token) {
        console.log('Token found:', token);
        setIsConfirming(true);
        
        fetch(`/api/confirm?token=${token}`)
          .then(res => {
            console.log('Response received:', res);
            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
          })
          .then(data => {
            console.log('Received confirmation data:', data);
            if (data.email) {
              setEmail(data.email);
              console.log('Setting email:', data.email);
            }
            if (data.firstName) {
              setFirstName(data.firstName);
              console.log('Setting firstName:', data.firstName);
            }
            if (data.lastName) {
              setLastName(data.lastName);
              console.log('Setting lastName:', data.lastName);
            }
          })
          .catch(err => {
            console.error('Error fetching confirmation data:', err);
            setStatus('error');
          });
      }

      if (cancel) {
        console.log('Cancel token found:', cancel);
        setIsCancelled(true);
        unsubscribeUser(cancel);
      }
    }
  }, []);

  const unsubscribeUser = async (emailToCancel) => {
    try {
      console.log('Attempting to unsubscribe user with email:', emailToCancel);
      
      // Make API call to handle unsubscription on the server side
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToCancel }),
      });
      
      if (response.ok) {
        console.log(`User with email ${emailToCancel} has been unsubscribed`);
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
    console.log('Form submitted with data:', { email, firstName, lastName });
    
    setLoading(true);
    setStatus(null);

    try {
      const submitData = { email, firstName, lastName };
      
      // Add confirmation flag for confirmation submissions
      if (isConfirming) {
        submitData.isConfirming = true;
      }
      
      console.log('Sending data to API:', submitData);
      
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      console.log('API response status:', res.status);
      
      if (res.ok) {
        console.log('Successfully submitted data');
        setStatus('success');
        
        // Only clear form if not confirming
        if (!isConfirming) {
          setEmail('');
          setFirstName('');
          setLastName('');
        }
      } else {
        const data = await res.json();
        console.error('Error response from backend:', data);
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
      {isCancelled ? (
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