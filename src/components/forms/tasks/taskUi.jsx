/**
 * Small building blocks of the tasks module (TaskWorkspace and its parts): member avatars and stacks, the line of a
 * project's leads, the member picker popover, the team select, the marks of private tasks, the progress bar, the filter
 * menu, the menu of a task, keyboard focus around changing lists, status and type styles and date formatting. Members are
 * { id, name, photo, team }.
 */
import React, { useEffect, useId, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Check, ChevronDown, ListFilter, Lock, Search, UserPlus } from 'lucide-react'
import { initials } from '../../../lib/contacts'
import { ALL_TEAMS, TASK_STATUSES, TEAM_IDS } from '../../../lib/tasks'
import { fill, Menu, MENU_ITEM, TOOL_BUTTON } from '../memberUi'

/** Dot and progress colour per board column of projects and tasks. */
export const STATUS_TONE = {
  planned: 'bg-fg-subtle',
  backlog: 'bg-fg-subtle',
  active: 'bg-brand-bright',
  doing: 'bg-brand-bright',
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

/** One part of a YYYY-MM-DD day, for layouts that set weekday, number and month apart. */
export const dayPart = (day, locale, options) => dateFormat(locale, options).format(new Date(`${day}T00:00:00Z`))

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

/** The leads of a project by name, set apart from the avatars of its assignees. Nothing without leads. */
export function LeadLine({ project, membersById, copy, className = '' }) {
  const names = project.leads.map((id) => membersById.get(id)?.name).filter(Boolean)
  if (!names.length) return null
  return (
    <span className={`block truncate text-caption text-fg-muted ${className}`}>
      {copy.panel.leads}: {names.join(', ')}
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
 * The popover is placed under its button and closes on Escape and outside clicks (browser popover API). Members of
 * `team`, the team the work belongs to, come right after the member themselves. The list exists only while it is open:
 * every card and row has a picker, and their closed lists made up most of the page's elements.
 */
export function MemberPicker({ members, selected, onChange, copy, me, label, membersById, team = '', compact = false }) {
  const id = useId()
  const button = useRef(null)
  const panel = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const matches = open ? members.filter((member) => member.name.toLowerCase().includes(query.trim().toLowerCase())) : []
  // Me first, so assigning yourself is one click.
  const rank = (member) => (member.id === me ? 0 : team && member.team === team ? 1 : 2)
  const ordered = [...matches].sort((a, b) => rank(a) - rank(b))

  const place = (event) => {
    if (event.newState !== 'open') return
    const anchor = button.current.getBoundingClientRect()
    const width = 256
    panel.current.style.left = `${Math.max(8, Math.min(anchor.left, document.documentElement.clientWidth - width - 8))}px`
    const below = anchor.bottom + 4
    panel.current.style.top = `${below + 320 > window.innerHeight ? Math.max(8, anchor.top - 324) : below}px`
    // Drawn before the popover shows, so it never opens empty.
    flushSync(() => {
      setQuery('')
      setOpen(true)
    })
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
        onToggle={(e) => e.newState === 'closed' && setOpen(false)}
        className="fixed inset-auto m-0 w-64 rounded-lg border border-border bg-bg p-2 text-fg shadow-lg"
      >
        {open && (
          <>
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
          </>
        )}
      </div>
    </>
  )
}

/** Marks a task only its member sees. */
export function PrivateBadge({ label }) {
  return (
    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--color-brand-bright)_16%,transparent)] px-2 py-px text-xs text-fg">
      <Lock aria-hidden="true" className="h-3 w-3" />
      {label}
    </span>
  )
}

/** Switches a new task to private. The press keeps the focus in the title field, so forms closing on its blur stay open. */
export function PrivateToggle({ pressed, onChange, label }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onChange(!pressed)}
      className={`inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border px-3 py-0 text-sm ${
        pressed ? 'border-fg bg-fg text-bg' : 'border-border-strong bg-transparent text-fg hover:bg-bg-subtle'
      }`}
    >
      <Lock aria-hidden="true" className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}

/** The name of a team; a project of all teams (ALL_TEAMS) reads as the tab that shows them all. */
export const teamName = (copy, team) => (team === ALL_TEAMS ? copy.teamTabs.all : copy.teams[team])

/**
 * A select of all teams; `empty` names the option for no team, and `all`, given only for projects, the option for a
 * project of every team. Other props go to the select.
 */
export function TeamSelect({ teams, empty, all, ...props }) {
  return (
    <select {...props}>
      <option value="">{empty}</option>
      {all && <option value={ALL_TEAMS}>{all}</option>}
      {TEAM_IDS.map((team) => (
        <option key={team} value={team}>
          {teams[team]}
        </option>
      ))}
    </select>
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

/** A small switch between display modes. `options` maps each key to its label. */
export function Segmented({ label, options, value, onChange }) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg border border-border-strong p-0.5">
      {Object.entries(options).map(([key, text]) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={`h-8 rounded-md border-0 px-3 py-0 text-sm ${value === key ? 'bg-fg text-bg' : 'bg-transparent text-fg hover:bg-bg-subtle'}`}
        >
          {text}
        </button>
      ))}
    </div>
  )
}

/** One button that names the current choice and opens the others. `options` are { value, label }. */
export function FilterMenu({ label, value, options, onChange }) {
  const current = options.find((option) => option.value === value) ?? options[0]
  return (
    <Menu
      label={
        <>
          <ListFilter aria-hidden="true" className="h-4 w-4 shrink-0" />
          <span className="truncate">{current.label}</span>
          <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-fg-muted" />
        </>
      }
      ariaLabel={`${label}: ${current.label}`}
      className={`${TOOL_BUTTON} max-w-full`}
    >
      {(close) =>
        options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={option.value === current.value}
            className={`${MENU_ITEM} flex items-center justify-between gap-6`}
            onClick={() => {
              close()
              onChange(option.value)
            }}
          >
            {option.label}
            {option.value === current.value && <Check aria-hidden="true" className="h-4 w-4" />}
          </button>
        ))
      }
    </Menu>
  )
}

const MENU_MARGIN = 8
const visible = (element) => !!element && (element.checkVisibility ? element.checkVisibility() : true)

/**
 * Keeps keyboard focus on board, list or panel when the focused task changes place, hides in the done section or goes
 * (each task's row or card carries data-task-item, its controls data-control, the list around them data-focus-scope).
 * Call it before the change with the focused element and the kind of control to land on; call what it returns after the
 * change. That focuses, once React has drawn it, this control of the same task where it is visible, else of the next
 * task in the scope, else of the one before. Without focus inside a task nothing happens, so pointer use stays as it is.
 */
export function keepFocus(element, control) {
  const scope = element?.closest?.('[data-focus-scope]')
  const item = element?.closest?.('[data-task-item]')
  if (!scope || !item || element !== document.activeElement) return () => {}
  const ids = [...scope.querySelectorAll('[data-task-item]')].map((node) => node.getAttribute('data-task-item'))
  const index = ids.indexOf(item.getAttribute('data-task-item'))
  const order = [ids[index], ...ids.slice(index + 1), ...ids.slice(0, index).reverse()]
  return () =>
    setTimeout(() => {
      for (const id of order) {
        const target = scope.querySelector(`[data-task-item="${CSS.escape(id)}"] [data-control="${control}"]`)
        if (visible(target)) return target.focus()
      }
    })
}

/**
 * Focuses the first control of a task that came back with an undo, once React has drawn it. A copy behind an open modal
 * dialog cannot take focus, so the one inside the dialog wins there.
 */
export function focusTask(taskId, tries = 10) {
  setTimeout(() => {
    const controls = [...document.querySelectorAll(`[data-task-item="${CSS.escape(taskId)}"] [data-control]`)].filter(visible)
    for (const control of controls) {
      control.focus()
      if (document.activeElement === control) return
    }
    if (tries > 1) focusTask(taskId, tries - 1)
  }, 50)
}

/**
 * Shows the rest of a list cut short. Its button goes away, so focus moves on to the first entry it brought, which
 * `firstNew` finds once the rest is drawn.
 */
export function showRest(show, firstNew) {
  flushSync(show)
  firstNew()?.focus()
}

/**
 * The menu of a task on board and list, at the pointer after a right click or below the card's own button. One for the
 * whole page, because a popover per card would put hundreds of them into the document. Deleting needs no question, the
 * toast offers to undo it. `menu` is { task, x, y } or null. The popover is manual: on a Mac the right click opens it
 * while the button is still down, and the browser's own dismissal would close it again on release. So it closes itself
 * on outside clicks, Escape, scrolling and focus moving elsewhere; Escape and every action give keyboard focus back to
 * the card it came from (keepFocus).
 */
export function TaskContextMenu({ menu, copy, onClose, onOpen, onPatch, onRemove }) {
  const panel = useRef(null)
  const invoker = useRef(null)
  const restore = useRef(() => {})
  useEffect(() => {
    if (!menu) return
    const popover = panel.current
    invoker.current = document.activeElement
    restore.current = keepFocus(invoker.current, 'menu')
    popover.showPopover()
    const { width, height } = popover.getBoundingClientRect()
    popover.style.left = `${Math.max(MENU_MARGIN, Math.min(menu.x, document.documentElement.clientWidth - width - MENU_MARGIN))}px`
    popover.style.top = `${Math.max(MENU_MARGIN, Math.min(menu.y, window.innerHeight - height - MENU_MARGIN))}px`
    popover.querySelector('button').focus()
    const outside = (event) => !popover.contains(event.target) && onClose()
    const escape = (event) => {
      if (event.key !== 'Escape') return
      onClose()
      invoker.current?.focus()
    }
    // Safari moves focus to the body on a click into the menu (relatedTarget null); outside clicks have their own handler.
    const away = (event) => event.relatedTarget && !popover.contains(event.relatedTarget) && onClose()
    window.addEventListener('pointerdown', outside, { capture: true })
    window.addEventListener('keydown', escape)
    window.addEventListener('scroll', onClose, { capture: true, passive: true })
    popover.addEventListener('focusout', away)
    return () => {
      window.removeEventListener('pointerdown', outside, { capture: true })
      window.removeEventListener('keydown', escape)
      window.removeEventListener('scroll', onClose, { capture: true })
      popover.removeEventListener('focusout', away)
      popover.hidePopover()
    }
  }, [menu])

  const task = menu?.task
  // Focus goes back first, so a panel opened from here returns it to the card when it closes.
  const item = (action) => () => {
    onClose()
    invoker.current?.focus()
    action()
    restore.current()
  }
  return (
    <div
      ref={panel}
      popover="manual"
      role="group"
      aria-label={task ? fill(copy.board.cardMenu, { title: task.title }) : undefined}
      className="fixed inset-auto m-0 min-w-44 rounded-lg border border-border bg-bg p-1 text-fg shadow-lg"
    >
      {task && (
        <>
          <button type="button" className={MENU_ITEM} onClick={item(() => onOpen(task))}>
            {copy.board.open}
          </button>
          <p className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wider text-fg-muted">{copy.board.moveTo}</p>
          {TASK_STATUSES.filter((status) => status !== task.status).map((status) => (
            <button key={status} type="button" className={`${MENU_ITEM} flex items-center gap-2`} onClick={item(() => onPatch(task, { status }))}>
              <span aria-hidden="true" className={`h-2 w-2 rounded-full ${STATUS_TONE[status]}`} />
              {copy.taskStatuses[status]}
            </button>
          ))}
          {(task.private || task.mayRemove) && (
            <button type="button" className={`${MENU_ITEM} mt-1 text-danger`} onClick={item(() => onRemove(task))}>
              {copy.taskBoard.delete}
            </button>
          )}
        </>
      )}
    </div>
  )
}

/**
 * A round checkbox for task rows; the native input stays for keyboard and screen readers. A row that leaves its list
 * when ticked takes the focus along to its neighbour (keepFocus), instead of dropping it to the start of the page.
 */
export function TaskCheck({ checked, onChange, label }) {
  const change = (e) => {
    const refocus = keepFocus(e.target, 'check')
    onChange(e.target.checked)
    refocus()
  }
  return (
    <label className="relative flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center">
      <input type="checkbox" data-control="check" checked={checked} onChange={change} className="peer sr-only" aria-label={label} />
      <span
        aria-hidden="true"
        className={`flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus ${
          checked ? 'border-fg bg-fg text-bg' : 'border-fg-subtle hover:border-fg'
        }`}
      >
        {checked && <Check className="h-4 w-4" strokeWidth={3} />}
      </span>
    </label>
  )
}
