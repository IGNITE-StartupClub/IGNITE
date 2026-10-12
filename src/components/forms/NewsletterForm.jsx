/**
 * Compact newsletter signup (React island), used in the footer. Posts { email } to /api/newsletter.
 * Props: copy (newsletterForm in the page language). Styles: ./forms.css.
 */
import React, { useState } from 'react'
import './forms.css'

export default function NewsletterForm({ copy }) {
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
        <h3 className="fieldset-legend">{copy.heading}</h3>
        <label htmlFor="newsletter-email" className="form-note">
          {copy.note}
        </label>
        <input
          id="newsletter-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder={copy.emailPlaceholder}
          className="input"
          disabled={loading}
          autoComplete="email"
        />
      </div>

      <button type="submit" className="form-submit" disabled={loading}>
        {loading ? copy.submitting : copy.submit}
      </button>

      <p className="form-note">{copy.consent}</p>

      <div aria-live="polite">
        {status === 'success' && <p className="form-success">{copy.success}</p>}
        {status === 'error' && <p className="form-error">{copy.error}</p>}
      </div>
    </form>
  )
}
