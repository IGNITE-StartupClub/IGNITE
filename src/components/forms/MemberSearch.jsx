/**
 * The search field of the member header: an icon in the pill that opens a modal bar over the whole pill. Typing searches
 * everything the member may see, `@` only people and `+` captures a task (rules in src/lib/memberSearch.ts). The index
 * loads when the field opens and stays for a minute, so typing costs no requests. Cmd/Ctrl+K opens it on every page.
 * Lives in a persisted island: the header swaps on every navigation, this component does not.
 * Props: copy (memberArea.search), locale, me (the member's id), tasksUrl, homeUrl, logo (slot: the mark shown in the bar).
 */
import React, { useEffect, useId, useRef, useState } from 'react'
import { navigate } from 'astro:transitions/client'
import {
  BookOpen,
  Briefcase,
  CalendarDays,
  Check,
  Circle,
  CircleCheck,
  FolderKanban,
  GraduationCap,
  Search,
  X,
} from 'lucide-react'
import { dayLabel } from '../../lib/memberHome'
import {
  captureTask,
  completeToken,
  openToken,
  personHandle,
  searchGroups,
  searchMode,
  suggestions,
  tokenToComplete,
} from '../../lib/memberSearch'
import { berlinDay } from '../../lib/tasks'
import { fill, Initials } from './memberUi'

const INDEX_TTL_MS = 60_000
const KIND_ICONS = {
  project: FolderKanban,
  event: CalendarDays,
  guide: BookOpen,
  alumni: GraduationCap,
  contact: Briefcase,
}
const ROW =
  'flex min-h-[52px] w-full items-center gap-3 rounded-none border-0 px-5 py-1.5 text-left text-sm text-fg no-underline'
const ICON = 'flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-bg-subtle text-fg'

// Module scope, so the index survives closing the field.
let cachedIndex = null

async function loadIndex(locale) {
  if (cachedIndex && Date.now() - cachedIndex.at < INDEX_TTL_MS) return cachedIndex.data
  const res = await fetch(`/api/members/search?locale=${locale}`)
  if (!res.ok) throw new Error(`Search index failed with ${res.status}`)
  const data = await res.json()
  cachedIndex = { at: Date.now(), data }
  return data
}

/** Astro's router fetches nothing for a URL with a hash on the same page, so that case reloads. */
function refresh() {
  if (window.location.hash) window.location.reload()
  else navigate(window.location.href, { history: 'replace' })
}

/** Astro's router also handles such links without an event, so the page's islands get their popstate here. */
function go(url, stale) {
  const target = new URL(url, window.location.href)
  if (target.hash && target.pathname === window.location.pathname) {
    window.history.pushState(null, '', target.pathname + target.search + target.hash)
    if (stale) refresh()
    else window.dispatchEvent(new PopStateEvent('popstate'))
  } else {
    navigate(url)
  }
}

function ItemIcon({ item }) {
  if (item.kind === 'member') {
    return item.photo ? (
      <img src={item.photo} alt="" width="34" height="34" className="h-[34px] w-[34px] shrink-0 rounded-full" />
    ) : (
      <Initials name={item.title} />
    )
  }
  const Icon = item.kind === 'task' ? (item.done ? CircleCheck : Circle) : KIND_ICONS[item.kind]
  return (
    <span aria-hidden="true" className={ICON}>
      <Icon className="h-[18px] w-[18px]" />
    </span>
  )
}

function Option({ id, active, url, onPick, onHover, children }) {
  const className = `${ROW} ${active ? 'bg-bg-subtle' : 'bg-transparent'}`
  if (!url) {
    return (
      <button
        type="button"
        id={id}
        role="option"
        aria-selected={active}
        onClick={onPick}
        onPointerMove={onHover}
        className={className}
      >
        {children}
      </button>
    )
  }
  return (
    <a
      href={url}
      id={id}
      role="option"
      aria-selected={active}
      onPointerMove={onHover}
      // A modified click opens a new tab as usual.
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return
        e.preventDefault()
        onPick()
      }}
      className={className}
    >
      {children}
    </a>
  )
}

function Lines({ title, meta, done }) {
  return (
    <span className="min-w-0 flex-1">
      <span className={`block truncate font-medium ${done ? 'text-fg-muted line-through' : ''}`}>{title}</span>
      {meta && <span className="block truncate text-caption text-fg-muted">{meta}</span>}
    </span>
  )
}

function Chip({ label, value, set }) {
  return (
    <span
      className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-button px-3 text-sm ${set ? 'surface-brand' : 'bg-bg-subtle text-fg'}`}
    >
      <span className="text-fg-muted">{label}</span>
      <strong className="font-semibold">{value}</strong>
    </span>
  )
}

export default function MemberSearch({ copy, locale, me, tasksUrl, homeUrl, logo }) {
  const dialog = useRef(null)
  const input = useRef(null)
  const created = useRef(false)
  const uid = useId()
  const [text, setText] = useState('')
  const [index, setIndex] = useState(null)
  const [failed, setFailed] = useState(false)
  const [active, setActive] = useState(0)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(null)
  const [saveFailed, setSaveFailed] = useState(false)
  const [shortcut, setShortcut] = useState('')

  const load = () => {
    setFailed(false)
    loadIndex(locale).then(setIndex, (err) => {
      console.error(err)
      setFailed(true)
    })
  }
  const open = () => {
    if (dialog.current.open) return
    dialog.current.showModal()
    input.current.focus()
    load()
  }

  useEffect(() => {
    setShortcut(/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘K' : copy.shortcut)
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        open()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const change = (value) => {
    setText(value)
    setActive(0)
    setSaveFailed(false)
    if (value) setSaved(null)
    input.current.focus()
  }

  const pagesWithTasks = [homeUrl, tasksUrl]

  const onClose = () => {
    setText('')
    setSaved(null)
    setSaveFailed(false)
    // The start page and the task page show tasks, so the new one has to reach them.
    if (created.current && pagesWithTasks.includes(window.location.pathname)) refresh()
    created.current = false
  }

  const leaveFor = (url) => {
    const stale = created.current && pagesWithTasks.includes(window.location.pathname)
    created.current = false
    dialog.current.close()
    go(url, stale)
  }

  const mode = searchMode(text)
  const items = index?.items ?? []
  const teams = index?.teams ?? []
  const members = items
    .filter(({ kind }) => kind === 'member')
    .map(({ id, title, team }) => ({ id, name: title, team }))
  const self = items.find(({ kind, id }) => kind === 'member' && id === me)
  const isTask = mode === 'task'
  const capture = isTask ? captureTask(text, { members, teams, me, today: berlinDay(Date.now()) }) : null
  const token = capture ? tokenToComplete(text, capture.problems, members, teams) : null
  const completions = suggestions(token, members, teams)
  const typing = isTask ? openToken(text) : null
  const problems = capture?.problems.filter(({ token: word }) => !(completions.length && word === typing?.word)) ?? []
  const groups = mode === 'search' || mode === 'people' ? searchGroups(items, text) : []
  const mayCreate = !!index && !!capture?.title && !capture.problems.length && !busy

  const create = async () => {
    if (!mayCreate) return
    const { title, due, assignees, team } = capture
    setBusy(true)
    setSaveFailed(false)
    try {
      const res = await fetch('/api/members/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          project: { title, description: '', type: 'task', due, leads: [me], team },
          task: { description: '', due, priority: 'normal', required: false, assignees: assignees.map(({ id }) => id) },
        }),
      })
      if (!res.ok) throw new Error(`Task not created: ${res.status}`)
      const { id } = await res.json()
      cachedIndex = null
      load()
      created.current = true
      setSaved({ title, url: `${tasksUrl}#${encodeURIComponent(id)}` })
      setText('')
      setActive(0)
    } catch (err) {
      console.error(err)
      setSaveFailed(true)
    }
    setBusy(false)
  }

  // Everything Enter and the arrow keys can reach, in the order of the list.
  const options =
    mode === 'empty'
      ? [{ run: () => change('+ ') }, { run: () => change('@') }]
      : isTask
        ? completions.map(({ handle }) => ({ run: () => change(completeToken(text, token, handle)) }))
        : [
            ...groups.flatMap((group) =>
              group.items.map((item) => ({
                item,
                run: () => (item.url ? leaveFor(item.url) : change(`+ ${personHandle(item.title)} `)),
              })),
            ),
            ...(index && !groups.length && mode === 'search' ? [{ run: () => change(`+ ${text.trim()}`) }] : []),
          ]
  const optionId = (position) => `${uid}-option-${position}`
  const selected = Math.min(active, options.length - 1)
  const optionProps = (position) => ({
    id: optionId(position),
    active: position === selected,
    onPick: options[position].run,
    onHover: () => setActive(position),
  })

  useEffect(() => {
    if (selected >= 0) document.getElementById(optionId(selected))?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (options.length) setActive((selected + (e.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (isTask && !completions.length) create()
      else options[selected]?.run()
    }
  }

  const teamName = capture && teams.find(({ id }) => id === capture.team)?.name
  const assigneeNames = capture?.assignees.map(({ id, name }) => (id === me ? copy.task.me : name)).join(', ')
  let position = -1

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label={copy.label}
        title={`${copy.open} ${shortcut}`.trim()}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-button border-0 bg-transparent p-0 text-fg transition-colors hover:bg-bg-subtle"
      >
        <Search aria-hidden="true" className="h-[22px] w-[22px]" />
      </button>

      <dialog
        ref={dialog}
        aria-label={copy.label}
        onClose={onClose}
        // A click on the backdrop lands on the dialog element itself.
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
        className="m-0 mx-auto mt-3 w-[min(var(--container-wide),calc(100vw-1.5rem))] max-w-none overflow-visible border-0 bg-transparent p-0 text-fg backdrop:bg-black/60"
      >
        <div className="flex min-h-[4.25rem] items-center gap-3 rounded-full border border-border-strong bg-card py-1 pl-5 pr-2 lg:pl-6">
          <span
            aria-hidden="true"
            className="shrink-0 [&_svg]:!h-auto [&_svg]:!w-9"
            style={{ color: 'var(--color-logo)' }}
          >
            {logo}
          </span>
          {mode !== 'empty' && (
            <span
              className={`hidden shrink-0 rounded-button px-2.5 py-0.5 text-caption font-semibold sm:block ${
                isTask ? 'bg-primary text-primary-fg' : mode === 'people' ? 'surface-brand' : 'bg-bg-subtle text-fg'
              }`}
            >
              {copy.modes[mode]}
            </span>
          )}
          <input
            ref={input}
            value={text}
            onChange={(e) => change(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={copy.placeholder}
            aria-label={copy.label}
            role="combobox"
            aria-expanded="true"
            aria-controls={`${uid}-list`}
            aria-autocomplete="list"
            aria-activedescendant={selected >= 0 ? optionId(selected) : undefined}
            autoComplete="off"
            spellCheck="false"
            className="min-h-11 min-w-0 flex-1 rounded-none border-0 bg-transparent p-0 text-[18px] font-medium text-fg shadow-none outline-none placeholder:text-fg-muted"
          />
          <button
            type="button"
            onClick={() => dialog.current.close()}
            aria-label={copy.close}
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border-0 bg-transparent p-0 text-sm text-fg-muted hover:text-fg sm:px-3.5"
          >
            <X aria-hidden="true" className="h-5 w-5 sm:hidden" />
            <span className="hidden sm:inline">{copy.close}</span>
          </button>
          {self && (
            <span className="hidden sm:block">
              <ItemIcon item={self} />
            </span>
          )}
        </div>

        <div className="mx-auto mt-2 max-w-[760px] overflow-hidden rounded-[20px] border border-border-strong bg-card text-sm shadow-card">
          {saved && (
            <p
              role="status"
              className="flex items-center justify-between gap-3 border-b border-border px-5 py-3 font-medium text-success"
            >
              <span className="inline-flex min-w-0 items-center gap-2">
                <Check aria-hidden="true" className="h-4 w-4 shrink-0" />
                <span className="truncate">{fill(copy.task.created, { title: saved.title })}</span>
              </span>
              <a
                href={saved.url}
                onClick={(e) => {
                  e.preventDefault()
                  leaveFor(saved.url)
                }}
                className="shrink-0 text-accent no-underline hover:underline"
              >
                {copy.task.show}
              </a>
            </p>
          )}

          {isTask && (
            <div className="flex flex-col gap-3.5 px-5 py-4">
              <p
                className={`truncate text-[20px] font-semibold tracking-tight ${capture.title ? '' : 'text-fg-muted'}`}
              >
                {capture.title || copy.task.titleEmpty}
              </p>
              <div className="flex flex-wrap gap-2">
                <Chip
                  label={copy.task.due}
                  value={capture.due ? dayLabel(capture.due, locale) : copy.task.dueNone}
                  set={!!capture.due}
                />
                <Chip
                  label={copy.task.assignee}
                  value={assigneeNames || copy.task.me}
                  set={capture.assignees.some(({ id }) => id !== me)}
                />
                <Chip label={copy.task.team} value={teamName || copy.task.teamNone} set={!!teamName} />
              </div>
              {problems.map(({ kind, token: word }) => (
                <p key={`${kind}-${word}`} className="text-danger">
                  {fill(copy.task.problems[kind], { token: word })}
                </p>
              ))}
              {saveFailed && (
                <p role="alert" className="text-danger">
                  {copy.task.failed}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-caption text-fg-muted">{copy.task.hint}</span>
                <button
                  type="button"
                  onClick={create}
                  disabled={!mayCreate}
                  className="min-h-11 rounded-button border-0 bg-primary px-5 font-semibold text-primary-fg disabled:opacity-50"
                >
                  {busy ? copy.task.creating : `${copy.task.create} ↵`}
                </button>
              </div>
            </div>
          )}

          <div
            id={`${uid}-list`}
            role="listbox"
            aria-label={copy.label}
            className="max-h-[min(60vh,calc(100dvh-12rem))] overflow-y-auto"
          >
            {mode === 'empty' && (
              <>
                <p className="px-5 pb-1 pt-3.5 text-fg-muted">{copy.hints.lead}</p>
                {[
                  ['+', copy.hints.task],
                  ['@', copy.hints.people],
                ].map(([key, hint]) => {
                  position += 1
                  return (
                    <Option key={key} {...optionProps(position)}>
                      <span
                        aria-hidden="true"
                        className="surface-brand flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] text-[18px] font-semibold"
                      >
                        {key}
                      </span>
                      <Lines title={hint.title} meta={hint.example} />
                    </Option>
                  )
                })}
              </>
            )}

            {completions.map(({ id, label }) => {
              position += 1
              return (
                <Option key={id} {...optionProps(position)}>
                  <Lines title={label} />
                </Option>
              )
            })}

            {groups.map(({ kind, items: hits }) => (
              <div key={kind} role="group" aria-labelledby={`${uid}-${kind}`} className="pb-1.5">
                <p id={`${uid}-${kind}`} className="px-5 pb-1 pt-3 text-caption font-semibold text-fg-muted">
                  {copy.groups[kind]}
                </p>
                {hits.map((item) => {
                  position += 1
                  return (
                    <Option key={`${item.kind}-${item.id}`} url={item.url} {...optionProps(position)}>
                      <ItemIcon item={item} />
                      <Lines title={item.title} meta={item.meta} done={item.kind === 'task' && item.done} />
                      {item.kind === 'member' && (
                        <span className="shrink-0 text-caption text-accent">{copy.assign}</span>
                      )}
                    </Option>
                  )
                })}
              </div>
            ))}

            {index && !groups.length && (mode === 'search' || mode === 'people') && (
              <>
                <p className="px-5 py-3.5 text-fg-muted">{copy.empty}</p>
                {mode === 'search' && (
                  <Option {...optionProps(++position)}>
                    <span
                      aria-hidden="true"
                      className="surface-brand flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] text-[18px] font-semibold"
                    >
                      +
                    </span>
                    <Lines title={fill(copy.makeTask, { text: text.trim() })} />
                  </Option>
                )}
              </>
            )}
          </div>

          {!index && mode !== 'empty' && !failed && <p className="px-5 py-3.5 text-fg-muted">{copy.loading}</p>}
          {failed && (
            <p role="alert" className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-danger">
              {copy.failed}
              <button
                type="button"
                onClick={load}
                className="min-h-11 rounded-button border border-border-strong bg-transparent px-4 font-semibold text-fg"
              >
                {copy.retry}
              </button>
            </p>
          )}
        </div>
      </dialog>
    </>
  )
}
