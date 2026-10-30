/**
 * Members area sign-in card (React island) on the login page. Steps:
 * - login: email and password, posts to /api/members/login and follows the returned redirect.
 * - request: email only, posts to /api/members/code, which mails a one-time code. Its answer is the same for every
 *   address, so the card always moves on to the code step.
 * - code: six digit boxes (paste and one-time-code autofill fill all of them), then set.
 * - set: new password, posts { email, code, password } to /api/members/password. A wrong or expired code sends the
 *   member back to the code step; the server checks the code only here, so a wrong code costs one of its attempts.
 * - done: shown while the members home loads.
 * Props: copy (memberArea.login.card), locale ('de' | 'en'), initialStep ('login' | 'request', default 'login').
 * Styles: ./forms.css, ./memberLoginCard.css plus Tailwind utilities.
 */
import React, { useEffect, useRef, useState } from 'react'
import './forms.css'
import './memberLoginCard.css'

const CODE_LENGTH = 6
// createCode allows one code per address and minute; an earlier resend would silently send nothing.
const RESEND_SECONDS = 60
const PASSWORD_MIN_LENGTH = 10
const PASSWORD_MAX_LENGTH = 128
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const postJson = (url, body) =>
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

// Titles may carry <em> for the serif accent word. The copy is static text from src/data, never user input.
const Title = ({ html, className = '' }) => (
  <h2 tabIndex={-1} className={`member-card-title ${className}`} dangerouslySetInnerHTML={{ __html: html }} />
)

const ArrowIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

export default function MemberLoginCard({ copy, locale, initialStep = 'login' }) {
  const [step, setStep] = useState(initialStep)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null) // { tone: 'error' | 'success', text }
  const [resendIn, setResendIn] = useState(0)
  const body = useRef(null)
  const digits = useRef([])
  const moved = useRef(false)

  // Move focus into each new step, but not on the first render, so the page does not jump on load.
  useEffect(() => {
    if (!moved.current) return
    const target = step === 'code' ? digits.current[0] : body.current?.querySelector('input:not([hidden]), h2')
    target?.focus()
  }, [step])

  useEffect(() => {
    if (step !== 'code' || resendIn <= 0) return
    const timer = window.setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [step, resendIn])

  const goTo = (next, nextMessage = null) => {
    moved.current = true
    setMessage(nextMessage)
    setStep(next)
  }
  const fail = (text) => setMessage({ tone: 'error', text })

  const run = async (action) => {
    setBusy(true)
    setMessage(null)
    try {
      await action()
    } catch (err) {
      console.error(err)
      fail(copy.error)
    }
    setBusy(false)
  }

  const finish = (redirect) => {
    goTo('done')
    window.location.assign(redirect)
  }

  const signIn = (e) => {
    e.preventDefault()
    run(async () => {
      const res = await postJson('/api/members/login', { email, password, locale })
      const data = await res.json()
      if (res.ok) return finish(data.redirect)
      if (res.status !== 401) console.error(data.message)
      fail(res.status === 401 ? copy.login.rejected : copy.error)
    })
  }

  const requestCode = (resend = false) => {
    if (!EMAIL_PATTERN.test(email.trim())) {
      // From the sign-in form the request step asks for the address; only there a missing one is an error.
      if (step === 'login') return goTo('request')
      return fail(copy.emailMissing)
    }
    run(async () => {
      const res = await postJson('/api/members/code', { email })
      if (!res.ok) {
        console.error((await res.json()).message)
        return fail(res.status === 429 ? copy.tooMany : res.status === 400 ? copy.emailMissing : copy.error)
      }
      setCode('')
      setResendIn(RESEND_SECONDS)
      if (resend) setMessage({ tone: 'success', text: copy.code.resent })
      else goTo('code')
    })
  }

  const changeCode = (next) => {
    const clean = next.replace(/\D/g, '').slice(0, CODE_LENGTH)
    setCode(clean)
    setMessage(null)
    if (clean.length === CODE_LENGTH) goTo('set')
  }

  const putDigits = (index, text) => {
    const clean = text.replace(/\D/g, '')
    if (!clean) return
    // A full paste or one-time-code autofill replaces the whole code from any box.
    const start = clean.length >= CODE_LENGTH ? 0 : Math.min(index, code.length)
    changeCode(code.slice(0, start) + clean + code.slice(start + clean.length))
    digits.current[Math.min(start + clean.length, CODE_LENGTH - 1)]?.focus()
  }

  const codeKey = (e, index) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const target = code[index] ? index : Math.max(0, index - 1)
      changeCode(code.slice(0, target) + code.slice(target + 1))
      digits.current[target]?.focus()
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      digits.current[Math.max(0, Math.min(CODE_LENGTH - 1, index + (e.key === 'ArrowLeft' ? -1 : 1)))]?.focus()
    }
  }

  const savePassword = (e) => {
    e.preventDefault()
    const length = [...newPassword].length
    if (length < PASSWORD_MIN_LENGTH) return fail(copy.set.tooShort)
    if (length > PASSWORD_MAX_LENGTH) return fail(copy.set.tooLong)
    if (newPassword !== repeat) return fail(copy.set.mismatch)
    run(async () => {
      const res = await postJson('/api/members/password', { email, code, password: newPassword, locale })
      const data = await res.json()
      if (res.ok) return finish(data.redirect)
      if (data.code === 'code') {
        setCode('')
        return goTo('code', { tone: 'error', text: copy.code.wrong })
      }
      if (data.code === 'tooShort' || data.code === 'tooLong') return fail(copy.set[data.code])
      console.error(data.message)
      fail(copy.error)
    })
  }

  const feedback = message && (
    <p role={message.tone === 'error' ? 'alert' : 'status'} className={message.tone === 'error' ? 'form-error' : 'form-success'}>
      {message.text}
    </p>
  )

  return (
    <div className="member-card w-full max-w-[24rem] text-fg">
      <div ref={body} key={step} className="member-card-step">
        {step === 'login' && (
          <form onSubmit={signIn} className="form" aria-busy={busy}>
            <div className="member-card-head">
              <Title html={copy.login.title} />
              <p className="form-note">{copy.login.lead}</p>
            </div>
            <div className="field">
              <label htmlFor="member-email" className="field-label">{copy.login.emailLabel}</label>
              <input
                id="member-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={copy.login.emailPlaceholder}
                className="input"
                disabled={busy}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
              />
            </div>
            <div className="field">
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor="member-password" className="field-label">{copy.login.passwordLabel}</label>
                <button type="button" className="member-card-link" disabled={busy} onClick={() => requestCode()}>
                  {copy.login.forgot}
                </button>
              </div>
              <input
                id="member-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={copy.login.passwordPlaceholder}
                className="input"
                disabled={busy}
                autoComplete="current-password"
              />
            </div>
            {feedback}
            <button type="submit" className="form-submit member-card-submit" disabled={busy}>
              {busy ? copy.login.submitting : copy.login.submit}
              {!busy && <ArrowIcon />}
            </button>
            <div className="member-card-new">
              <p className="m-0 text-sm font-semibold">{copy.login.newHeading}</p>
              <p className="form-note m-0">
                {copy.login.newText}{' '}
                <button type="button" className="member-card-link member-card-link-accent" disabled={busy} onClick={() => requestCode()}>
                  {copy.login.newAction}
                </button>
              </p>
            </div>
          </form>
        )}

        {step === 'request' && (
          <form onSubmit={(e) => (e.preventDefault(), requestCode())} className="form" aria-busy={busy}>
            <div className="member-card-head">
              <Title html={copy.request.title} />
              <p className="form-note">{copy.request.lead}</p>
            </div>
            <div className="field">
              <label htmlFor="member-request-email" className="field-label">{copy.login.emailLabel}</label>
              <input
                id="member-request-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={copy.login.emailPlaceholder}
                className="input"
                disabled={busy}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
              />
            </div>
            {feedback}
            <button type="submit" className="form-submit member-card-submit" disabled={busy}>
              {busy ? copy.request.submitting : copy.request.submit}
            </button>
            <button type="button" className="member-card-link self-center" disabled={busy} onClick={() => goTo('login')}>
              {copy.request.back}
            </button>
          </form>
        )}

        {step === 'code' && (
          <div className="flex flex-col gap-6" aria-busy={busy}>
            <div className="member-card-head">
              <span aria-hidden="true" className="member-card-icon mb-2 self-start">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
              </span>
              <Title html={copy.code.title} />
              <div>
                <p className="form-note">{copy.code.lead}</p>
                <p className="m-0 break-all text-sm font-medium">{email}</p>
              </div>
            </div>
            <div role="group" aria-label={copy.code.title} className="grid grid-cols-6 gap-2">
              {Array.from({ length: CODE_LENGTH }, (_, index) => (
                <input
                  key={index}
                  ref={(node) => (digits.current[index] = node)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  aria-label={copy.code.digitLabel.replace('{n}', index + 1).replace('{total}', CODE_LENGTH)}
                  aria-invalid={message?.tone === 'error' || undefined}
                  value={code[index] ?? ''}
                  disabled={busy}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => codeKey(e, index)}
                  onChange={(e) => putDigits(index, e.target.value)}
                  onPaste={(e) => {
                    e.preventDefault()
                    putDigits(index, e.clipboardData.getData('text'))
                  }}
                  className="input member-card-digit"
                />
              ))}
            </div>
            {feedback ?? <p className="form-note">{copy.code.hint}</p>}
            <div className="flex items-center justify-between gap-3">
              <button type="button" className="member-card-link" disabled={busy} onClick={() => goTo('request')}>
                {copy.code.changeEmail}
              </button>
              <button
                type="button"
                className="member-card-link tabular-nums"
                disabled={busy || resendIn > 0}
                onClick={() => requestCode(true)}
              >
                {resendIn > 0 ? copy.code.resendIn.replace('{s}', resendIn) : copy.code.resend}
              </button>
            </div>
          </div>
        )}

        {step === 'set' && (
          <form onSubmit={savePassword} className="form" aria-busy={busy}>
            <div className="member-card-head">
              <Title html={copy.set.title} />
              <p className="form-note">{copy.set.lead}</p>
            </div>
            {/* Lets password managers store the new password under the right address. */}
            <input type="email" value={email} autoComplete="username" readOnly hidden />
            <div className="field">
              <label htmlFor="member-new-password" className="field-label">{copy.set.passwordLabel}</label>
              <input
                id="member-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="input"
                disabled={busy}
                autoComplete="new-password"
              />
            </div>
            <div className="field">
              <label htmlFor="member-repeat-password" className="field-label">{copy.set.repeatLabel}</label>
              <input
                id="member-repeat-password"
                type="password"
                value={repeat}
                onChange={(e) => setRepeat(e.target.value)}
                required
                className="input"
                disabled={busy}
                autoComplete="new-password"
              />
            </div>
            {feedback}
            <button type="submit" className="form-submit member-card-submit" disabled={busy}>
              {busy ? copy.set.submitting : copy.set.submit}
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="flex min-h-[16rem] flex-col items-center justify-center text-center" role="status">
            <span aria-hidden="true" className="member-card-icon member-card-icon-done">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12 5 5L20 7" />
              </svg>
            </span>
            <Title html={copy.done.title} className="mt-4" />
            <p className="form-note mt-2">{copy.done.lead}</p>
          </div>
        )}
      </div>
    </div>
  )
}
