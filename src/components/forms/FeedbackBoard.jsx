/**
 * The admin page "Feedback zur Website" (MemberFeedbackPage.astro, React island): status chips with counts, filters for
 * kind and area, and per entry a status select, "Als Aufgabe anlegen" and, for named entries, "Nachfragen" by mail.
 * Changes post to /api/members/feedback. The list is the server's, newest day first (feedbackList in feedbackStore.ts).
 * Props: copy (memberArea.feedbackAdmin.board), labels ({ kinds, areas } of memberArea.feedback), entries (FeedbackRow
 * plus dayLabel, formatted on the server), tasksUrl.
 */
import React, { useId, useState } from 'react'
import { FEEDBACK_AREAS, FEEDBACK_KINDS, FEEDBACK_STATUSES } from '../../lib/feedback'
import { BADGE, Chip, fill, TOOL_BUTTON } from './memberUi'

const KIND_BADGE = {
  missing: 'border-transparent bg-[color-mix(in_srgb,var(--color-accent-text)_18%,transparent)]',
  annoying: 'border-border-strong',
  bug: 'border-transparent bg-[color-mix(in_srgb,var(--color-danger)_18%,transparent)]',
  idea: 'border-transparent bg-[color-mix(in_srgb,var(--color-success)_18%,transparent)]',
}
const SELECT = 'h-10 rounded-lg border border-border-strong bg-bg-subtle px-2.5 text-sm text-fg'
// Mail clients cut long mailto links, so the quote in "Nachfragen" stays short.
const QUOTE_MAX = 500

async function post(body) {
  const res = await fetch('/api/members/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw Object.assign(new Error(`Feedback action failed: ${res.status}`), { status: res.status })
  return res.json()
}

function askUrl(entry, copy) {
  const chars = Array.from(entry.text)
  const text = chars.length > QUOTE_MAX ? `${chars.slice(0, QUOTE_MAX - 1).join('')}…` : entry.text
  const body = fill(copy.askBody, { name: entry.author.name, text })
  return `mailto:${entry.author.email}?subject=${encodeURIComponent(copy.askSubject)}&body=${encodeURIComponent(body)}`
}

function Entry({ entry, copy, labels, tasksUrl, busy, onStatus, onTask }) {
  const statusId = useId()
  return (
    <li className="rounded-card border border-border bg-bg p-5">
      <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-2xs text-fg-muted">
        <span className={`${BADGE} font-semibold text-fg ${KIND_BADGE[entry.kind]}`}>{labels.kinds[entry.kind]}</span>
        <span>{labels.areas[entry.area]}</span>
        <span aria-hidden="true">·</span>
        <span>{entry.dayLabel}</span>
        <span aria-hidden="true">·</span>
        <span>{entry.author ? entry.author.name : copy.anonymous}</span>
      </p>
      <p className="mt-2.5 whitespace-pre-line break-words">{entry.text}</p>
      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        <label htmlFor={statusId} className="sr-only">
          {copy.statusLabel}
        </label>
        <select
          id={statusId}
          value={entry.status}
          disabled={!!busy}
          onChange={(e) => onStatus(entry, e.target.value)}
          className={SELECT}
        >
          {FEEDBACK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {copy.statuses[status]}
            </option>
          ))}
        </select>
        {entry.taskId ? (
          <a href={`${tasksUrl}#${encodeURIComponent(entry.taskId)}`} className={`${TOOL_BUTTON} no-underline`}>
            {copy.openTask}
          </a>
        ) : (
          <button type="button" disabled={!!busy} onClick={() => onTask(entry)} className={`${TOOL_BUTTON} bg-transparent`}>
            {busy === 'task' ? copy.making : copy.makeTask}
          </button>
        )}
        {entry.author && (
          <a href={askUrl(entry, copy)} className={`${TOOL_BUTTON} no-underline`}>
            {copy.ask}
          </a>
        )}
      </div>
    </li>
  )
}

export default function FeedbackBoard({ copy, labels, entries: serverEntries, tasksUrl }) {
  const id = useId()
  const [entries, setEntries] = useState(serverEntries)
  const [status, setStatus] = useState('new')
  const [kind, setKind] = useState('')
  const [area, setArea] = useState('')
  const [busy, setBusy] = useState({})
  const [message, setMessage] = useState(null)

  const matching = entries.filter((entry) => (!kind || entry.kind === kind) && (!area || entry.area === area))
  const shown = status === 'all' ? matching : matching.filter((entry) => entry.status === status)
  const counted = (value) => matching.filter((entry) => entry.status === value).length
  const change = (entryId, patch) =>
    setEntries((list) => list.map((entry) => (entry.id === entryId ? { ...entry, ...patch } : entry)))

  const run = async (entry, what, action, undo) => {
    setBusy((all) => ({ ...all, [entry.id]: what }))
    setMessage(null)
    try {
      setMessage({ ok: true, text: await action() })
    } catch (err) {
      console.error(err)
      undo?.()
      setMessage({ ok: false, text: err.status === 404 ? copy.gone : copy.failed })
    }
    setBusy(({ [entry.id]: _done, ...rest }) => rest)
  }

  // The select moves at once and moves back when the save fails.
  const onStatus = (entry, next) => {
    change(entry.id, { status: next })
    return run(
      entry,
      'status',
      async () => {
        await post({ action: 'status', id: entry.id, status: next })
        return copy.saved
      },
      () => change(entry.id, { status: entry.status }),
    )
  }

  const onTask = (entry) =>
    run(entry, 'task', async () => {
      const { taskId } = await post({ action: 'task', id: entry.id })
      change(entry.id, { taskId })
      return copy.created
    })

  return (
    <div className="mx-auto max-w-[56rem]">
      <div className="flex flex-wrap items-center gap-2.5">
        <div role="group" aria-label={copy.statusLabel} className="flex flex-wrap gap-1.5">
          {FEEDBACK_STATUSES.map((value) => (
            <Chip key={value} pressed={status === value} onClick={() => setStatus(value)}>
              {fill(copy.counted, { label: copy.statuses[value], count: counted(value) })}
            </Chip>
          ))}
          <Chip pressed={status === 'all'} onClick={() => setStatus('all')}>
            {copy.all}
          </Chip>
        </div>
        <span className="flex-1" />
        <label htmlFor={`${id}-kind`} className="sr-only">
          {copy.kindLabel}
        </label>
        <select id={`${id}-kind`} value={kind} onChange={(e) => setKind(e.target.value)} className={SELECT}>
          <option value="">{copy.allKinds}</option>
          {FEEDBACK_KINDS.map((value) => (
            <option key={value} value={value}>
              {labels.kinds[value]}
            </option>
          ))}
        </select>
        <label htmlFor={`${id}-area`} className="sr-only">
          {copy.areaLabel}
        </label>
        <select id={`${id}-area`} value={area} onChange={(e) => setArea(e.target.value)} className={SELECT}>
          <option value="">{copy.allAreas}</option>
          {FEEDBACK_AREAS.map((value) => (
            <option key={value} value={value}>
              {labels.areas[value]}
            </option>
          ))}
        </select>
      </div>

      <p aria-live="polite" className={`mt-3 min-h-6 text-sm ${message && !message.ok ? 'text-danger' : 'text-fg-muted'}`}>
        {message?.text}
      </p>

      {shown.length ? (
        <ul className="mt-1 flex flex-col gap-3">
          {shown.map((entry) => (
            <Entry
              key={entry.id}
              entry={entry}
              copy={copy}
              labels={labels}
              tasksUrl={tasksUrl}
              busy={busy[entry.id]}
              onStatus={onStatus}
              onTask={onTask}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-1 rounded-card border border-border bg-bg p-5 text-fg-muted">
          {entries.length ? copy.emptyFilter : copy.empty}
        </p>
      )}

      <p className="mt-6 text-sm text-fg-muted">{copy.footer}</p>
      <p className="mt-1 text-sm text-fg-muted">{copy.taskNote}</p>
    </div>
  )
}
