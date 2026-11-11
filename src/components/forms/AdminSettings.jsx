/**
 * Settings of the members area on the member management page (React island): one switch per entry of settings.ts
 * (daily task digest, connections), each for everyone. A switch posts { [id]: boolean } to /api/members/settings and
 * shows the saved state of all switches.
 * Props: copy (memberArea.admin.settings), initialSettings ({ taskDigest, connections }).
 */
import React, { useId, useState } from 'react'
import { Switch } from './memberUi'

export default function AdminSettings({ copy, initialSettings }) {
  const [settings, setSettings] = useState(initialSettings)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null) // { id, ok } of the last change
  const id = useId()

  const toggle = async (key) => {
    setBusy(true)
    setResult(null)
    try {
      const res = await fetch('/api/members/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: !settings[key] }),
      })
      const data = await res.json()
      if (data.settings) setSettings(data.settings)
      if (!res.ok) console.error(data.message)
      setResult({ id: key, ok: res.ok })
    } catch (err) {
      console.error(err)
      setResult({ id: key, ok: false })
    } finally {
      setBusy(false)
    }
  }

  const switches = Object.keys(copy.switches).filter((key) => key in settings)
  const saved = result && copy.switches[result.id]

  return (
    <section aria-labelledby={`${id}-heading`} className="rounded-card border border-border bg-bg p-5">
      <h2 id={`${id}-heading`} className="text-xs font-medium uppercase tracking-wider text-fg-muted">
        {copy.heading}
      </h2>
      <div className="mt-3 space-y-5">
        {switches.map((key) => (
          <Switch
            key={key}
            id={`${id}-${key}`}
            copy={copy.switches[key]}
            on={settings[key]}
            busy={busy}
            onToggle={() => toggle(key)}
          />
        ))}
      </div>
      <p aria-live="polite" className={`mt-2 text-sm ${result && !result.ok ? 'text-danger' : 'text-fg-muted'}`}>
        {result && (result.ok ? (settings[result.id] ? saved.savedOn : saved.savedOff) : copy.error)}
      </p>
    </section>
  )
}
