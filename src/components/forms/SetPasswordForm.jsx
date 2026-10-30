/**
 * Set a members area password from an invitation or reset link (React island). Posts { token, password, locale } to
 * /api/members/password, which stores the password, ends all other sessions and signs the member in.
 * Props: copy (memberArea.password.form), token (from the link), locale ('de' | 'en'),
 * requestUrl (password page without token, where a new link can be requested).
 * Styles: ./forms.css.
 */
import React, { useState } from 'react'
import './forms.css'

// Mirrors PASSWORD_MIN_LENGTH / PASSWORD_MAX_LENGTH in src/lib/memberAuth.ts; the API checks again.
const MIN_LENGTH = 10
const MAX_LENGTH = 128

export default function SetPasswordForm({ copy, token, locale, requestUrl }) {
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [status, setStatus] = useState(null) // 'tooShort' | 'tooLong' | 'mismatch' | 'link' | 'error' | null
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const length = [...password].length
    const problem = length < MIN_LENGTH ? 'tooShort' : length > MAX_LENGTH ? 'tooLong' : password !== repeat ? 'mismatch' : null
    setStatus(problem)
    if (problem) return

    setLoading(true)
    try {
      const res = await fetch('/api/members/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, locale }),
      })
      const data = await res.json()
      if (res.ok) {
        window.location.assign(data.redirect)
        return
      }
      if (res.status >= 500) console.error(data.message)
      setStatus(['tooShort', 'tooLong', 'link'].includes(data.code) ? data.code : 'error')
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="field">
        <label htmlFor="new-password" className="field-label">
          {copy.passwordLabel}
        </label>
        <input
          id="new-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={MIN_LENGTH}
          className="input"
          disabled={loading}
          autoComplete="new-password"
          aria-describedby="new-password-hint"
        />
        <p id="new-password-hint" className="field-hint">
          {copy.hint}
        </p>
      </div>
      <div className="field">
        <label htmlFor="repeat-password" className="field-label">
          {copy.repeatLabel}
        </label>
        <input
          id="repeat-password"
          type="password"
          value={repeat}
          onChange={(e) => setRepeat(e.target.value)}
          required
          className="input"
          disabled={loading}
          autoComplete="new-password"
        />
      </div>

      <button type="submit" className="form-submit" disabled={loading}>
        {loading ? copy.submitting : copy.submit}
      </button>

      <div aria-live="polite">
        {status === 'link' ? (
          <p className="form-note">
            {copy.linkInvalid} <a href={requestUrl}>{copy.requestNew}</a>
          </p>
        ) : (
          status && <p className="form-error">{copy[status]}</p>
        )}
      </div>
    </form>
  )
}
