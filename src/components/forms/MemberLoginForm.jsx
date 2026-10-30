/**
 * Members area login (React island). Posts { email, locale } to /api/members/login, which mails a login link
 * if the address is on the allowlist. The API answers the same either way, so the form shows one neutral message.
 * Props: copy (memberArea.form in the page language), locale ('de' | 'en', picks the language of the link target).
 * Styles: ./forms.css.
 */
import React, { useState } from 'react'
import './forms.css'

export default function MemberLoginForm({ copy, locale }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null) // 'sent' | 'tooMany' | 'error' | null
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)

    try {
      const res = await fetch('/api/members/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale }),
      })

      if (res.ok) {
        setStatus('sent')
      } else {
        const data = await res.json()
        console.error(data.message)
        setStatus(res.status === 429 ? 'tooMany' : 'error')
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
        <label htmlFor="member-email" className="field-label">
          {copy.emailLabel}
        </label>
        <input
          id="member-email"
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

      <div aria-live="polite">
        {status === 'sent' && <p className="form-success">{copy.sent}</p>}
        {status === 'tooMany' && <p className="form-error">{copy.tooMany}</p>}
        {status === 'error' && <p className="form-error">{copy.error}</p>}
      </div>
    </form>
  )
}
