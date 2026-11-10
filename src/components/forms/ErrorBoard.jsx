/**
 * The page "Systemzustand" for admins (MemberSystemPage.astro, React island): overview figures, the server errors of the
 * chosen period grouped by kind (errorLog.ts errorBoard), the server facts and the admin's own switch for the morning
 * report mail. "Als erledigt markieren" posts to /api/members/errors, the switch to /api/members/settings.
 * The period is the `?tage=` parameter, so a period link loads the page again with the server's data for it.
 * Props: copy (memberArea.system.board), locale, now (ms, the same in server render and hydration), period (1, 7 or 30),
 * groups (BoardGroup with ISO dates), counts ({ day, week, month }), lastAt, latency (ms), server ({ region, version,
 * versionUrl, lastReportAt }), errorMails.
 */
import React, { useId, useState } from 'react'
import { formatDateTime, relativeTime } from '../../lib/memberTable'
import { BADGE, Chip, fill, Switch, TOOL_BUTTON } from './memberUi'

const CARD = 'rounded-card border border-border bg-bg'
const LABEL = 'text-xs font-medium uppercase tracking-wider text-fg-muted'
const PERIODS = [1, 7, 30]

const STATUS_BADGE = {
  new: 'border-danger text-danger bg-[color-mix(in_srgb,var(--color-danger)_12%,transparent)]',
  again: 'border-danger text-danger bg-[color-mix(in_srgb,var(--color-danger)_12%,transparent)]',
  resolved: 'border-success text-success bg-[color-mix(in_srgb,var(--color-success)_12%,transparent)]',
}

// Same rule as groupStatus in errorReport.ts, which the browser cannot import (node:crypto).
const statusOf = (group) =>
  !group.resolvedAt ? 'new' : Date.parse(group.last) > Date.parse(group.resolvedAt) ? 'again' : 'resolved'

function Figure({ label, value, text, dot = false }) {
  return (
    <div className={`${CARD} p-4`}>
      <p className={`${LABEL} flex items-center gap-1.5`}>
        {dot && <span aria-hidden="true" className="h-2 w-2 rounded-full bg-success" />}
        {label}
      </p>
      <p className="mt-1 text-[24px] font-semibold leading-tight">{value}</p>
      <p className="mt-0.5 text-sm text-fg-muted">{text}</p>
    </div>
  )
}

/** The outcome of the last change, next to where it was made. */
function Status({ message, place }) {
  const shown = message?.place === place ? message : null
  return (
    <p aria-live="polite" className={`mt-2 text-sm ${shown && !shown.ok ? 'text-danger' : 'text-fg-muted'}`}>
      {shown?.text}
    </p>
  )
}

function ErrorRow({ group, copy, locale, now, busy, onStatus }) {
  const [copied, setCopied] = useState(false)
  const status = statusOf(group)

  const copyStack = async () => {
    await navigator.clipboard.writeText(`${group.context}\n${group.name}: ${group.message}\n${group.stack}`)
    setCopied(true)
  }

  return (
    <details className="group border-t border-border first:border-t-0">
      {/* On phones status and time go below the message, so the message keeps the width. */}
      <summary className="grid cursor-pointer list-none grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-x-3 gap-y-1.5 px-4 py-3 hover:bg-bg-subtle sm:grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:px-5 [&::-webkit-details-marker]:hidden">
        <span className="mt-0.5 font-mono text-sm font-semibold tabular-nums">{group.count}×</span>
        {/* minmax(0, 1fr) and break-words: messages and route patterns have no spaces to wrap at, and must not widen the page. */}
        <span className="break-words">
          <span className="block font-medium">{group.context}</span>
          <span className="block text-sm text-fg-muted">
            <b className="font-semibold text-fg">{group.name}:</b> {group.message}
          </span>
        </span>
        <span className="col-start-2 flex items-center gap-2 text-xs text-fg-muted sm:col-start-3 sm:flex-col sm:items-end sm:gap-1 sm:text-right">
          <span className={`${BADGE} ${STATUS_BADGE[status]}`}>{copy.status[status]}</span>
          {relativeTime(group.last, now, locale)}
        </span>
      </summary>
      <div className="pb-4 pl-[4.25rem] pr-4 sm:pl-[4.5rem] sm:pr-5">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-sm">
          <dt className="text-fg-muted">{copy.first}</dt>
          <dd>{formatDateTime(group.first, locale)}</dd>
          <dt className="text-fg-muted">{copy.last}</dt>
          <dd>{formatDateTime(group.last, locale)}</dd>
          {group.resolvedAt && (
            <>
              <dt className="text-fg-muted">{copy.resolvedAt}</dt>
              <dd>{formatDateTime(group.resolvedAt, locale)}</dd>
            </>
          )}
        </dl>
        {group.stack ? (
          <pre className="mt-3 overflow-x-auto rounded-lg bg-bg-subtle p-3 font-mono text-xs leading-relaxed">{group.stack}</pre>
        ) : (
          <p className="mt-3 text-sm text-fg-muted">{copy.noStack}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={TOOL_BUTTON} disabled={busy} onClick={() => onStatus(group, status === 'resolved' ? 'reopen' : 'resolve')}>
            {status === 'resolved' ? copy.reopen : copy.resolve}
          </button>
          {group.stack && (
            <button type="button" className={TOOL_BUTTON} onClick={copyStack}>
              {copied ? copy.copied : copy.copyStack}
            </button>
          )}
        </div>
      </div>
    </details>
  )
}

export default function ErrorBoard({ copy, locale, now, period, groups: initialGroups, counts, lastAt, latency, server, errorMails: initialErrorMails }) {
  const [groups, setGroups] = useState(initialGroups)
  const [showResolved, setShowResolved] = useState(false)
  const [errorMails, setErrorMails] = useState(initialErrorMails)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null) // { text, ok, place: 'list' | 'mails' } of the last change
  const id = useId()

  const post = async (url, body, place) => {
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      return data
    } catch (err) {
      console.error(err)
      setMessage({ text: copy.error, ok: false, place })
      return null
    } finally {
      setBusy(false)
    }
  }

  const changeStatus = async (group, action) => {
    const data = await post('/api/members/errors', { action, key: group.key }, 'list')
    if (data) setGroups((current) => current.map((g) => (g.key === data.key ? { ...g, resolvedAt: data.resolvedAt } : g)))
  }

  const toggleMails = async () => {
    const data = await post('/api/members/settings', { errorMails: !errorMails }, 'mails')
    if (!data) return
    setErrorMails(data.personal.errorMails)
    const saved = copy.personal.errorMails
    setMessage({ text: data.personal.errorMails ? saved.savedOn : saved.savedOff, ok: true, place: 'mails' })
  }

  const open = groups.filter((group) => statusOf(group) !== 'resolved')
  const shown = showResolved ? groups : open

  return (
    <div className="flex flex-col gap-6">
      <section aria-label={copy.overview} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Figure dot label={copy.database.label} value={`${latency} ms`} text={copy.database.text} />
        <Figure
          label={copy.open.label}
          value={open.length}
          text={fill(copy.open.text, { total: groups.length, period: copy.periodTexts[period] })}
        />
        <Figure label={copy.recent.label} value={counts.day} text={fill(copy.recent.text, counts)} />
        <Figure
          label={copy.latest.label}
          value={lastAt ? relativeTime(lastAt, now, locale) : copy.latest.none}
          text={lastAt ? formatDateTime(lastAt, locale) : copy.latest.noneText}
        />
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby={`${id}-errors`} className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 id={`${id}-errors`} className="text-[24px] font-semibold">
              {copy.heading}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <nav aria-label={copy.periodLabel} className="inline-flex rounded-full border border-border-strong p-0.5">
                {PERIODS.map((days) => (
                  <a
                    key={days}
                    href={`?tage=${days}`}
                    aria-current={days === period ? 'page' : undefined}
                    className={`rounded-full px-3 py-1 text-sm no-underline ${
                      days === period ? 'bg-fg text-bg' : 'text-fg hover:bg-bg-subtle'
                    }`}
                  >
                    {copy.periods[days]}
                  </a>
                ))}
              </nav>
              <Chip pressed={showResolved} onClick={() => setShowResolved((value) => !value)}>
                {copy.showResolved}
              </Chip>
            </div>
          </div>
          <div className={`${CARD} overflow-hidden`}>
            {shown.length ? (
              shown.map((group) => (
                <ErrorRow key={group.key} group={group} copy={copy} locale={locale} now={now} busy={busy} onStatus={changeStatus} />
              ))
            ) : (
              <p className="px-5 py-8 text-center text-sm text-fg-muted">{groups.length ? copy.emptyOpen : copy.empty}</p>
            )}
          </div>
          <p className="mt-2 text-sm text-fg-muted">{copy.hint}</p>
          <Status message={message} place="list" />
        </section>

        <aside className="flex flex-col gap-4">
          <section className={`${CARD} p-5`} aria-labelledby={`${id}-server`}>
            <h2 id={`${id}-server`} className={LABEL}>
              {copy.server.heading}
            </h2>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-fg-muted">{copy.server.region}</dt>
              <dd>{server.region || copy.server.unknown}</dd>
              <dt className="text-fg-muted">{copy.server.version}</dt>
              <dd>
                {server.version ? (
                  server.versionUrl ? (
                    <a href={server.versionUrl} className="font-mono">
                      {server.version}
                    </a>
                  ) : (
                    <code>{server.version}</code>
                  )
                ) : (
                  copy.server.unknown
                )}
              </dd>
              <dt className="text-fg-muted">{copy.server.report}</dt>
              <dd>{server.lastReportAt ? formatDateTime(server.lastReportAt, locale) : copy.server.reportNever}</dd>
            </dl>
          </section>
          <section className={`${CARD} p-5`} aria-labelledby={`${id}-personal`}>
            <h2 id={`${id}-personal`} className={`${LABEL} mb-3`}>
              {copy.personal.heading}
            </h2>
            <Switch id={`${id}-mails`} copy={copy.personal.errorMails} on={errorMails} busy={busy} onToggle={toggleMails} />
            <Status message={message} place="mails" />
          </section>
        </aside>
      </div>
    </div>
  )
}
