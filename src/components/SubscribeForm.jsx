import { useState } from 'react';

export default function SubscribeForm({ prefill }) {
  const { firstName, lastName, email, confirmed } = prefill;
  const [form, setForm]   = useState({ firstName, lastName, email });
  const [status, setStatus] = useState(
    confirmed ? 'confirmed' : 'idle'
  );

   // If they just arrived with confirmed=newsletter, show that message:
  if (status === 'confirmed') {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-2xl font-bold">E-Mail bestätigt 🎉</h2>
        <p>
          {confirmed === 'newsletter'
            ? 'Danke! Dein Newsletter-Abo ist aktiviert.'
            : confirmed === 'application'
            ? 'Deine Bewerbung wurde bestätigt und abgeschickt.'
            : 'Danke für dein Interesse!'}
        </p>
      </div>
    );
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setStatus('sent');
    } else {
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return <p className="text-green-600">Danke! Bitte bestätige deine E-Mail in deinem Postfach.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        Vorname
        <input
          type="text"
          name="firstName"
          value={form.firstName}
          onChange={handleChange}
          required
          className="mt-1 w-full border rounded px-3 py-2"
        />
      </label>
      <label className="block">
        Nachname
        <input
          type="text"
          name="lastName"
          value={form.lastName}
          onChange={handleChange}
          required
          className="mt-1 w-full border rounded px-3 py-2"
        />
      </label>
      <label className="block">
        E-Mail
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
          className="mt-1 w-full border rounded px-3 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={status === 'sending'}
        className="button primary"
      >
        {status === 'sending' ? 'Sende...' : 'Anmeldung abschicken'}
      </button>
      {status === 'error' && (
        <p className="text-red-600">Da ist leider etwas schiefgelaufen. Versuch es nochmal.</p>
      )}
    </form>
  );
}