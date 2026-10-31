/**
 * Settings of the members area on the member management page (React island). For now one switch: the daily task
 * digest mail, on or off for everyone. Posts { taskDigest } to /api/members/settings and shows the saved state.
 * Props: copy (memberArea.admin.settings), initialSettings ({ taskDigest }).
 */
import React, { useId, useState } from 'react'

export default function AdminSettings({ copy, initialSettings }) {
  const [settings, setSettings] = useState(initialSettings)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null) // result code from the API
  const id = useId()
  const on = settings.taskDigest

  const toggle = async () => {
    setBusy(true)
    setResult(null)
    try {
      const res = await fetch('/api/members/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskDigest: !on }),
      })
      const data = await res.json()
      if (data.settings) setSettings(data.settings)
      if (!res.ok) console.error(data.message)
      setResult(res.ok ? 'saved' : 'error')
    } catch (err) {
      console.error(err)
      setResult('error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-labelledby={`${id}-heading`} className="rounded-card border border-border bg-bg p-5">
      <h2 id={`${id}-heading`} className="text-xs font-medium uppercase tracking-wider text-fg-muted">
        {copy.heading}
      </h2>
      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <p id={`${id}-digest`} className="font-medium">
            {copy.taskDigest}
          </p>
          <p id={`${id}-digest-text`} className="mt-0.5 max-w-text text-sm text-fg-muted">
            {copy.taskDigestText}
          </p>
        </div>
        {/* border-0 and p-0: the site's base styles give every button a border and padding. */}
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-labelledby={`${id}-digest`}
          aria-describedby={`${id}-digest-text`}
          disabled={busy}
          onClick={toggle}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border-0 p-0 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60 ${
            on ? 'bg-brand-bright' : 'bg-border-strong'
          }`}
        >
          <span aria-hidden="true" className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>
      <p aria-live="polite" className={`mt-2 text-sm ${result === 'error' ? 'text-danger' : 'text-fg-muted'}`}>
        {result && (result === 'saved' ? (on ? copy.savedOn : copy.savedOff) : copy.error)}
      </p>
    </section>
  )
}
