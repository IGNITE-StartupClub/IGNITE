/**
 * Small building blocks of the tasks module (TaskWorkspace and its parts): member avatars and stacks, the member
 * picker popover, the progress bar, status and type styles and date formatting. Members are { id, name, photo }.
 */
import React, { useId, useRef, useState } from 'react'
import { Check, Search, UserPlus } from 'lucide-react'
import { initials } from '../../../lib/contacts'
import { fill } from '../memberUi'

/** Dot and progress colour per board column; the review amber has no site token. */
export const STATUS_TONE = {
  planned: 'bg-fg-subtle',
  active: 'bg-brand-bright',
  review: 'bg-[#f2b35a]',
  done: 'bg-success',
}
export const TYPE_TEXT = { event: 'text-accent', internal: 'text-fg-muted', task: 'text-[#f2b35a]' }

export const SURFACE = 'rounded-card border border-border bg-bg'
// border-0 and bg-transparent: the site's base styles give every button a border and padding.
export const ICON_BUTTON =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-0 bg-transparent p-0 text-fg-muted hover:bg-bg-subtle hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus'
export const SELECT =
  'h-9 rounded-lg border border-border-strong bg-bg-subtle px-2 text-sm text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'
export const INPUT =
  'h-10 w-full rounded-lg border border-border-strong bg-bg-subtle px-3 text-sm text-fg placeholder:text-fg-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'
export const LABEL = 'mb-1 block text-xs font-medium uppercase tracking-wider text-fg-muted'

const dateFormat = (locale, options) => new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'de', { timeZone: 'UTC', ...options })

/** "19. Nov." / "19 Nov" for a YYYY-MM-DD day. */
export const shortDay = (day, locale) => dateFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(`${day}T00:00:00Z`))

/** "19 NOV · DO" style label of an event card. */
export const eventDayLabel = (day, locale) => {
  const date = new Date(`${day}T00:00:00Z`)
  const weekday = dateFormat(locale, { weekday: 'short' }).format(date).replace('.', '')
  return `${dateFormat(locale, { day: 'numeric', month: 'short' }).format(date).replace('.', '')} · ${weekday}`
}

/** Time of an ISO instant in Berlin, "18:30". */
export const berlinTime = (iso, locale) =>
  new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'de', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))

export const longDay = (day, locale) =>
  dateFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${day}T00:00:00Z`))

export const dateTime = (iso, locale) =>
  new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'de', {
    timeZone: 'Europe/Berlin',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))

/** Everyone on a project: leads first, then the assignees of its tasks, each once. */
export const projectPeople = (project) => [...new Set([...project.leads, ...project.tasks.flatMap((task) => task.assignees)])]

const SIZES = { sm:'h-6 w-6 text-[0.625rem]', md: 'h-8 w-8 text-xs' }

/** A round photo or initials. Labelled with the name unless `decorative`, because stacks show no names. */
export function Avatar({ member, size = 'sm', decorative = false, className = '' }) {
  const label = decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': member.name }
  const base = `${SIZES[size]} shrink-0 rounded-full ring-2 ring-bg ${className}`
  if (member.photo) {
    return (
      <span {...label} title={member.name} className={`${base} overflow-hidden`}>
        <img src={member.photo} alt="" className="h-full w-full object-cover" loading="lazy" />
      </span>
    )
  }
  return (
    <span
      {...label}
      title={member.name}
      className={`${base} flex items-center justify-center bg-[color-mix(in_srgb,var(--color-brand-bright)_35%,var(--color-bg-subtle))] font-semibold uppercase text-fg`}
    >
      {initials(member.name)}
    </span>
  )
}

/** Up to `max` overlapping avatars and a "+N" for the rest. */
export function AvatarStack({ ids, membersById, copy, max = 3, size = 'sm' }) {
  const people = ids.map((id) => membersById.get(id)).filter(Boolean)
  if (!people.length) return null
  const rest = people.length - max
  return (
    <span className="flex items-center -space-x-1.5">
      {people.slice(0, rest > 0 ? max : people.length).map((member) => (
        <Avatar key={member.id} member={member} size={size} />
      ))}
      {rest > 0 && (
        <span
          title={people.slice(max).map((member) => member.name).join(', ')}
          className={`${SIZES[size]} flex items-center justify-center rounded-full bg-bg-subtle font-medium text-fg-muted ring-2 ring-bg`}
        >
          {fill(copy.more, { count: rest })}
        </span>
      )}
    </span>
  )
}

/**
 * A button that opens a searchable member list with checkboxes; every toggle calls onChange with the new id list.
 * The popover is placed under its button and closes on Escape and outside clicks (browser popover API).
 */
export function MemberPicker({ members, selected, onChange, copy, me, label, membersById, compact = false }) {
  const id = useId()
  const button = useRef(null)
  const panel = useRef(null)
  const [query, setQuery] = useState('')
  const matches = members.filter((member) => member.name.toLowerCase().includes(query.trim().toLowerCase()))
  // Me first, so assigning yourself is one click.
  const ordered = [...matches.filter((member) => member.id === me), ...matches.filter((member) => member.id !== me)]

  const place = (event) => {
    if (event.newState !== 'open') return
    const anchor = button.current.getBoundingClientRect()
    const width = 256
    panel.current.style.left = `${Math.max(8, Math.min(anchor.left, document.documentElement.clientWidth - width - 8))}px`
    const below = anchor.bottom + 4
    panel.current.style.top = `${below + 320 > window.innerHeight ? Math.max(8, anchor.top - 324) : below}px`
    setQuery('')
  }
  const toggle = (memberId) =>
    onChange(selected.includes(memberId) ? selected.filter((item) => item !== memberId) : [...selected, memberId])

  return (
    <>
      <button
        ref={button}
        type="button"
        popoverTarget={id}
        aria-label={`${label}: ${selected.map((memberId) => membersById.get(memberId)?.name).filter(Boolean).join(', ') || copy.nobody}`}
        className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border border-dashed border-border-strong bg-transparent px-1.5 py-0.5 text-xs text-fg-muted hover:border-fg-muted hover:text-fg ${
          selected.length ? 'border-solid border-transparent' : ''
        }`}
      >
        {selected.length ? (
          <AvatarStack ids={selected} membersById={membersById} copy={copy} max={compact ? 2 : 4} />
        ) : (
          <>
            <UserPlus aria-hidden="true" className="h-4 w-4" />
            {!compact && copy.assign}
          </>
        )}
      </button>
      <div
        ref={panel}
        id={id}
        popover="auto"
        onBeforeToggle={place}
        className="fixed inset-auto m-0 w-64 rounded-lg border border-border bg-bg p-2 text-fg shadow-lg"
      >
        <label className="relative block">
          <span className="sr-only">{copy.searchMembers}</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={copy.searchMembers}
            autoComplete="off"
            className="h-9 w-full rounded-md border border-border-strong bg-bg-subtle pl-8 pr-2 text-sm text-fg placeholder:text-fg-subtle"
          />
        </label>
        <ul className="mt-2 max-h-64 overflow-y-auto" role="list">
          {ordered.map((member) => {
            const checked = selected.includes(member.id)
            return (
              <li key={member.id}>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-bg-subtle">
                  <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggle(member.id)} />
                  <Avatar member={member} size="md" decorative />
                  <span className="min-w-0 flex-1 truncate">
                    {member.name}
                    {member.id === me && <span className="text-fg-muted"> · {copy.me}</span>}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                      checked ? 'border-brand-bright bg-brand-bright text-white' : 'border-border-strong'
                    }`}
                  >
                    {checked && <Check className="h-3.5 w-3.5" />}
                  </span>
                </label>
              </li>
            )
          })}
          {!ordered.length && <li className="px-2 py-3 text-sm text-fg-muted">{copy.noMatch}</li>}
        </ul>
      </div>
    </>
  )
}

/** A thin bar; nothing at all for a project without tasks, so it never shows a made-up value. Spans, so it fits in buttons. */
export function ProgressBar({ percent, tone = 'bg-brand-bright', label }) {
  if (percent === null) return null
  return (
    <span
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label={label}
      className="block h-1.5 w-full overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-fg)_10%,transparent)]"
    >
      <span className={`block h-full rounded-full transition-[width] duration-500 ${tone}`} style={{ width: `${percent}%` }} />
    </span>
  )
}

/** A round checkbox for task rows; the native input stays for keyboard and screen readers. */
export function TaskCheck({ checked, onChange, label }) {
  return (
    <label className="relative flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" aria-label={label} />
      <span
        aria-hidden="true"
        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus ${
          checked ? 'border-fg bg-fg text-bg' : 'border-fg-subtle hover:border-fg'
        }`}
      >
        {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
    </label>
  )
}
