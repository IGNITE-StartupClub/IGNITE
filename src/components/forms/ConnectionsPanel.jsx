/**
 * Connected apps and calendar subscription of a member (MemberConnectionsPage.astro), posting to
 * /api/members/connections. The server keeps only a hash of the calendar link, so its address exists in this island's
 * state for the moment after it was made and never again.
 * Props: copy (memberArea.connections.panel), appNames (memberArea.connections.apps), locale, mcpUrl, initialConnections,
 * initialCalendarSince (date of the current link, '' without one).
 */
import React, { useId, useState } from 'react'
import { formatDateTime } from '../../lib/memberTable'
import { DANGER_BUTTON, fill, PRIMARY_BUTTON, TOOL_BUTTON } from './memberUi'

const CARD = 'rounded-card border border-border bg-bg p-5 sm:p-6'

function CopyField({ label, value, copy }) {
  const id = useId()
  const [copied, setCopied] = useState(false)

  const copyValue = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
  }

  return (
    <div className="mt-4">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="mt-1.5 flex gap-2">
        <input
          id={id}
          type="text"
          readOnly
          value={value}
          onFocus={(e) => e.target.select()}
          className="h-10 min-w-0 flex-1 rounded-lg border border-border-strong bg-bg-subtle px-3 text-sm text-fg"
        />
        <button type="button" className={TOOL_BUTTON} onClick={copyValue}>
          {copied ? copy.copied : copy.copy}
        </button>
      </div>
    </div>
  )
}

export default function ConnectionsPanel({ copy, appNames, locale, mcpUrl, initialConnections, initialCalendarSince }) {
  const [connections, setConnections] = useState(initialConnections)
  const [calendarSince, setCalendarSince] = useState(initialCalendarSince)
  const [feedUrl, setFeedUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const { assistant, calendar } = copy
  const date = (iso) => formatDateTime(iso, locale)

  const post = async (body) => {
    setBusy(true)
    setFailed(false)
    try {
      const res = await fetch('/api/members/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        setConnections(data.connections)
        setCalendarSince(data.calendarSince)
        setFeedUrl(data.feedUrl ?? '')
      } else {
        console.error(data.message)
        setFailed(true)
      }
    } catch (err) {
      console.error(err)
      setFailed(true)
    }
    setBusy(false)
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      {failed && (
        <p role="alert" className="m-0 text-sm text-danger lg:col-span-2">
          {copy.failed}
        </p>
      )}
      <section className={CARD} aria-labelledby="connections-assistant">
        <h2 id="connections-assistant" className="m-0 text-xl">
          {assistant.title}
        </h2>
        <p className="m-0 mt-2 text-sm text-fg-muted">{assistant.text}</p>
        <CopyField label={assistant.address} value={mcpUrl} copy={copy} />
        <h3 className="m-0 mt-6 text-base">{assistant.connected}</h3>
        {connections.length === 0 ? (
          <p className="m-0 mt-2 text-sm text-fg-muted">{assistant.none}</p>
        ) : (
          <ul className="m-0 mt-2 flex list-none flex-col gap-3 p-0">
            {connections.map((connection) => (
              <li
                key={connection.id}
                className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3"
              >
                <div className="min-w-0">
                  <p className="m-0 text-sm font-medium">{appNames[connection.app]}</p>
                  <p className="m-0 text-xs text-fg-muted">
                    {fill(assistant.since, { date: date(connection.createdAt) })}
                  </p>
                  <p className="m-0 text-xs text-fg-muted">
                    {fill(assistant.used, { date: date(connection.lastUsedAt) })}
                  </p>
                </div>
                <button
                  type="button"
                  className={DANGER_BUTTON}
                  disabled={busy}
                  onClick={() => post({ action: 'disconnect', id: connection.id })}
                >
                  {assistant.disconnect}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={CARD} aria-labelledby="connections-calendar">
        <h2 id="connections-calendar" className="m-0 text-xl">
          {calendar.title}
        </h2>
        <p className="m-0 mt-2 text-sm text-fg-muted">{calendar.text}</p>
        {feedUrl && (
          <>
            <p className="m-0 mt-4 text-sm font-medium">{calendar.once}</p>
            <CopyField label={calendar.address} value={feedUrl} copy={copy} />
            <p className="m-0 mt-3">
              <a className={`${PRIMARY_BUTTON} no-underline`} href={feedUrl.replace(/^https?:/, 'webcal:')}>
                {calendar.open}
              </a>
            </p>
          </>
        )}
        {calendarSince ? (
          <>
            <p className="m-0 mt-4 text-sm">{fill(calendar.active, { date: date(calendarSince) })}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className={TOOL_BUTTON}
                disabled={busy}
                onClick={() => post({ action: 'calendar' })}
              >
                {calendar.renew}
              </button>
              <button
                type="button"
                className={DANGER_BUTTON}
                disabled={busy}
                onClick={() => post({ action: 'calendarOff' })}
              >
                {calendar.off}
              </button>
            </div>
            <p className="m-0 mt-2 text-xs text-fg-muted">{calendar.renewNote}</p>
          </>
        ) : (
          <p className="m-0 mt-4">
            <button
              type="button"
              className={PRIMARY_BUTTON}
              disabled={busy}
              onClick={() => post({ action: 'calendar' })}
            >
              {calendar.create}
            </button>
          </p>
        )}
      </section>
    </div>
  )
}
