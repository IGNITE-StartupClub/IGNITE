/**
 * Members area sign-in (React island). Mode "login" posts { email, password, locale } to /api/members/login and follows
 * the returned redirect. Mode "link" ("forgot password or have none yet") posts { email, locale } to
 * /api/members/password-link, which mails a link to set a password; its answer is the same for every address.
 * Props: copy (memberArea.form), linkCopy (memberArea.linkForm), locale ('de' | 'en'),
 * initialMode ('login' | 'link', default 'login').
 * Styles: ./forms.css.
 */
import React, { useState } from 'react'
import './forms.css'

const postJson = (url, body) =>
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

export default function MemberLoginForm({ copy, linkCopy, locale, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState(null) // 'rejected' | 'sent' | 'tooMany' | 'error' | null
  const [loading, setLoading] = useState(false)

  const switchMode = (next) => {
    setMode(next)
    setStatus(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)

    try {
      if (mode === 'login') {
        const res = await postJson('/api/members/login', { email, password, locale })
        const data = await res.json()
        if (res.ok) {
          window.location.assign(data.redirect)
          return
        }
        if (res.status !== 401) console.error(data.message)
        setStatus(res.status === 401 ? 'rejected' : 'error')
      } else {
        const res = await postJson('/api/members/password-link', { email, locale })
        if (!res.ok) console.error((await res.json()).message)
        setStatus(res.ok ? 'sent' : res.status === 429 ? 'tooMany' : 'error')
      }
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      {mode === 'link' && <p className="form-note">{linkCopy.lead}</p>}

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
          autoComplete="username"
        />
      </div>

      {mode === 'login' && (
        <div className="field">
          <label htmlFor="member-password" className="field-label">
            {copy.passwordLabel}
          </label>
          <input
            id="member-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input"
            disabled={loading}
            autoComplete="current-password"
          />
        </div>
      )}

      <div className="form-actions items-center">
        <button type="submit" className="form-submit" disabled={loading}>
          {mode === 'login' ? (loading ? copy.submitting : copy.submit) : loading ? linkCopy.submitting : linkCopy.submit}
        </button>
        <button type="button" className="form-secondary" onClick={() => switchMode(mode === 'login' ? 'link' : 'login')}>
          {mode === 'login' ? copy.forgot : linkCopy.back}
        </button>
      </div>

      <div aria-live="polite">
        {status === 'rejected' && <p className="form-error">{copy.rejected}</p>}
        {status === 'sent' && <p className="form-success">{linkCopy.sent}</p>}
        {status === 'tooMany' && <p className="form-error">{linkCopy.tooMany}</p>}
        {status === 'error' && <p className="form-error">{copy.error}</p>}
      </div>
    </form>
  )
}
