/**
 * Compact newsletter signup (React island), used in the footer. Posts { email } to /api/newsletter.
 * Props: none. Styles: ./forms.css.
 */
import React, { useState } from 'react'
import './forms.css'

export default function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null) // 'success' | 'error' | null
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        setStatus('success')
        setEmail('')
      } else {
        const data = await res.json()
        console.error(data.message)
        setStatus('error')
      }
    } catch (err) {
      console.error(err)
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="field">
        <h3 className="fieldset-legend">Werde Teil der Community</h3>
        <label htmlFor="newsletter-email" className="form-note">
          Du erhältst eine E-Mail mit einem Einladungslink.
        </label>
        <input
          id="newsletter-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="dein@email.de"
          className="input"
          disabled={loading}
          autoComplete="email"
        />
      </div>

      <button type="submit" className="form-submit" disabled={loading}>
        {loading ? 'Wird gesendet...' : 'Jetzt beitreten'}
      </button>

      <p className="form-note">Mit dem Absenden deiner E-Mail-Adresse stimmst du unserer Datenschutzvereinbarung zu.</p>

      <div aria-live="polite">
        {status === 'success' && (
          <p className="form-success">Danke für deine Anmeldung! Schau in dein Postfach, um deine E-Mail-Adresse zu bestätigen.</p>
        )}
        {status === 'error' && <p className="form-error">Da ging etwas schief. Bitte versuch es später erneut.</p>}
      </div>
    </form>
  )
}
