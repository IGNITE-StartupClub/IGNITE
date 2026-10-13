/**
 * Community signup (React island) for the footer and the Community page. Posts { email } to /api/community,
 * which mails the WhatsApp invite link. Props: copy (communityForm in the page language), compact (input and button only,
 * no heading or note; the Community page sets it). Styles: ./forms.css.
 */
import React, { useState } from 'react'
import './forms.css'

export default function CommunityForm({ copy, compact = false }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null) // 'success' | 'pending' | 'error' | null
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)

    try {
      const res = await fetch('/api/community', {
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
        setStatus(res.status === 409 ? 'pending' : 'error')
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
        {!compact && (
          <>
            <h3 className="fieldset-legend">{copy.heading}</h3>
            <label htmlFor="community-email" className="form-note">
              {copy.note}
            </label>
          </>
        )}
        <input
          id="community-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder={copy.emailPlaceholder}
          className="input"
          disabled={loading}
          autoComplete="email"
          aria-label={compact ? copy.heading : undefined}
        />
      </div>

      <button type="submit" className="form-submit" disabled={loading}>
        {loading ? copy.submitting : copy.submit}
      </button>

      <p className="form-note">{copy.consent}</p>

      <div aria-live="polite">
        {status === 'success' && <p className="form-success">{copy.success}</p>}
        {status === 'pending' && <p className="form-note">{copy.pending}</p>}
        {status === 'error' && <p className="form-error">{copy.error}</p>}
      </div>
    </form>
  )
}
