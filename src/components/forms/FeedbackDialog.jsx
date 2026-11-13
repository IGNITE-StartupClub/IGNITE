/**
 * The website feedback dialog: kind, area, text and whether the admins see the name, then a sent state with "Noch etwas
 * senden". Posts { action: 'send', kind, area, text, named } to /api/members/feedback (rules in src/lib/feedback.ts).
 * HelpDialogs mounts it per opening and drops it on close, so every opening starts fresh.
 * Props: copy (memberArea.feedback), area (preselected), here (area of the current page, listed first, or null),
 * text (prefill, from the search), onClose.
 */
import React, { useEffect, useId, useRef, useState } from 'react'
import { Check, X } from 'lucide-react'
import { FEEDBACK_AREAS, FEEDBACK_KINDS, FEEDBACK_TEXT_MAX } from '../../lib/feedback'
import { Chip, fill, PRIMARY_BUTTON, TOOL_BUTTON } from './memberUi'
import './forms.css'

export default function FeedbackDialog({ copy, area: firstArea, here, text: firstText, onClose }) {
  const dialog = useRef(null)
  const field = useRef(null)
  const heading = useRef(null)
  const id = useId()
  const [kind, setKind] = useState('missing')
  const [area, setArea] = useState(firstArea)
  const [text, setText] = useState(firstText)
  const [named, setNamed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  useEffect(() => dialog.current.showModal(), [])
  // showModal focuses the close button; the text is what the member came for, and after sending the answer is.
  useEffect(() => (sent ? heading : field).current.focus(), [sent])

  const close = () => dialog.current.close()
  const areas = here ? [here, ...FEEDBACK_AREAS.filter((option) => option !== here)] : FEEDBACK_AREAS

  const submit = async (e) => {
    e.preventDefault()
    if (busy || !text.trim()) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/members/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', kind, area, text, named }),
      })
      if (res.status === 429) setError(copy.limited)
      else if (!res.ok) throw new Error(`Feedback not sent: ${res.status}`)
      else setSent(true)
    } catch (err) {
      console.error(err)
      setError(copy.failed)
    }
    setBusy(false)
  }

  const again = () => {
    setText('')
    setSent(false)
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby={`${id}-title`}
      onClose={onClose}
      // A click on the backdrop lands on the dialog element itself.
      onClick={(e) => e.target === e.currentTarget && close()}
      className="max-h-[calc(100dvh-2rem)] w-[min(35rem,calc(100vw-2rem))] overflow-y-auto rounded-card border border-border bg-card p-0 text-fg shadow-[var(--shadow-card)] backdrop:bg-black/60"
    >
      {sent ? (
        <div className="flex flex-col items-start gap-3 p-6">
          <span
            aria-hidden="true"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-success)_16%,transparent)] text-success"
          >
            <Check className="h-6 w-6" />
          </span>
          <h2 ref={heading} id={`${id}-title`} tabIndex={-1} className="text-[22px] font-bold leading-tight outline-none">
            {copy.sent.title}
          </h2>
          <p className="text-xs text-fg-muted">{named ? copy.sent.named : copy.sent.anonymous}</p>
          <div className="mt-2 flex flex-wrap gap-2 self-end">
            <button type="button" onClick={again} className={TOOL_BUTTON}>
              {copy.sent.again}
            </button>
            <button type="button" onClick={close} className={PRIMARY_BUTTON}>
              {copy.sent.close}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="form p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id={`${id}-title`} className="text-[22px] font-bold leading-tight">
                {copy.title}
              </h2>
              <p className="mt-1.5 text-xs text-fg-muted">{copy.lead}</p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label={copy.close}
              className="-mr-2 -mt-1 shrink-0 rounded-md border-0 bg-transparent p-2 text-fg-muted hover:text-fg"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>

          <fieldset className="m-0 min-w-0 border-0 p-0">
            <legend className="field-label mb-2 p-0">{copy.kindLegend}</legend>
            <div className="flex flex-wrap gap-2">
              {FEEDBACK_KINDS.map((option) => (
                <Chip key={option} pressed={kind === option} onClick={() => setKind(option)}>
                  {copy.kinds[option]}
                </Chip>
              ))}
            </div>
          </fieldset>

          <div className="field">
            <label htmlFor={`${id}-area`} className="field-label">
              {copy.areaLabel}
            </label>
            <select id={`${id}-area`} value={area} onChange={(e) => setArea(e.target.value)} className="input">
              {areas.map((option) => (
                <option key={option} value={option}>
                  {option === here ? fill(copy.thisPage, { area: copy.areas[option] }) : copy.areas[option]}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor={`${id}-text`} className="field-label">
                {copy.textLabel}
              </label>
              <span id={`${id}-count`} className="text-2xs text-fg-muted">
                {fill(copy.count, { count: text.length, max: FEEDBACK_TEXT_MAX })}
              </span>
            </div>
            <textarea
              ref={field}
              id={`${id}-text`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={FEEDBACK_TEXT_MAX}
              required
              aria-describedby={`${id}-count`}
              placeholder={copy.placeholder}
              className="input"
            />
          </div>

          <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
            <legend className="field-label mb-1 p-0">{copy.sendLegend}</legend>
            {[
              [false, copy.anonymous],
              [true, copy.named],
            ].map(([value, option]) => (
              <label key={option.label} className="choice">
                <input type="radio" name={`${id}-named`} checked={named === value} onChange={() => setNamed(value)} />
                <span>
                  <span className="block font-medium">{option.label}</span>
                  <span className="block text-xs text-fg-muted">{option.text}</span>
                </span>
              </label>
            ))}
            <p className="text-xs text-fg-muted">{copy.note}</p>
          </fieldset>

          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={close} className={TOOL_BUTTON}>
              {copy.cancel}
            </button>
            <button type="submit" disabled={busy || !text.trim()} className={`${PRIMARY_BUTTON} disabled:opacity-50`}>
              {busy ? copy.sending : copy.send}
            </button>
          </div>
        </form>
      )}
    </dialog>
  )
}
