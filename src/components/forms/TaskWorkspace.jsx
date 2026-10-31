/**
 * The tasks module of the members area (React island, "Aufgaben & Events"): view switch between the project board and
 * "Meine Aufgaben", search, the "Neu erstellen" menu, figures that filter, the events calendar, the kanban board and
 * the project panel. Posts { action, … } to /api/members/tasks; each answer carries the full state of everyone's
 * projects, which replaces the local one. Changes that the UI shows at once (moving, checking off, assigning) are
 * applied optimistically and rolled back when the server refuses them.
 * The open project is the URL hash (#<id>), pushed as a history entry like the CRM; ?ansicht=meine opens "Meine
 * Aufgaben" (link of the digest mail), otherwise the view of this browser session is restored.
 * Props: copy (memberArea.tasks.workspace), initialState ({ projects, templates, members }), events (calendar events
 * with `day`), eventsComplete, me (member id), named (has entered a name), admin, locale, today (YYYY-MM-DD, Berlin).
 * Styles: ./forms.css plus Tailwind utilities.
 */
import React, { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { boardFigures, filterProjects, myFigures, myTasks, NAME_MAX, PROJECT_TYPES } from '../../lib/tasks'
import { Chip, fill, Menu, MENU_ITEM, PRIMARY_BUTTON, SearchField } from './memberUi'
import CompleteDialog from './tasks/CompleteDialog'
import CreateDialog from './tasks/CreateDialog'
import EventCalendar from './tasks/EventCalendar'
import MyTasks from './tasks/MyTasks'
import ProjectBoard from './tasks/ProjectBoard'
import ProjectPanel from './tasks/ProjectPanel'
import { INPUT, LABEL, SELECT, SURFACE } from './tasks/taskUi'
import './forms.css'

const VIEW_KEY = 'ignite-tasks-view'
const NOTICE_MS = 6000
const NO_FILTERS = { type: '', mine: false, overdue: false, member: '', archived: false }

function Figure({ value, label, pressed, onClick, alert = false }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`${SURFACE} flex flex-col items-start gap-0.5 p-4 text-left transition-colors hover:border-border-strong ${
        pressed ? 'border-fg' : ''
      }`}
    >
      <span className={`text-2xl font-semibold tabular-nums ${alert && value > 0 ? 'text-danger' : ''}`}>{value}</span>
      <span className="text-sm text-fg-muted">{label}</span>
    </button>
  )
}

function NamePrompt({ copy, current, run, onSaved }) {
  const [form, setForm] = useState({ firstName: '', lastName: '' })
  const save = async (e) => {
    e.preventDefault()
    if (await run({ action: 'name', ...form })) onSaved()
  }
  return (
    <form onSubmit={save} className={`${SURFACE} flex flex-wrap items-end gap-3 p-4`}>
      <div className="basis-full">
        <h2 className="text-lg font-semibold">{copy.heading}</h2>
        <p className="text-sm text-fg-muted">{fill(copy.text, { name: current })}</p>
      </div>
      {['firstName', 'lastName'].map((key) => (
        <label key={key} className="min-w-0 flex-1 basis-40">
          <span className={LABEL}>{copy[key]}</span>
          <input
            className={INPUT}
            required={key === 'firstName'}
            maxLength={NAME_MAX}
            autoComplete={key === 'firstName' ? 'given-name' : 'family-name'}
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          />
        </label>
      ))}
      <button type="submit" className={PRIMARY_BUTTON}>
        {copy.save}
      </button>
    </form>
  )
}

export default function TaskWorkspace({ copy, initialState, events, eventsComplete, me, named, admin, locale, today }) {
  const [state, setState] = useState(initialState)
  const latest = useRef(state)
  latest.current = state
  const [view, setView] = useState('board')
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState(NO_FILTERS)
  const [myStatus, setMyStatus] = useState('all')
  const [openId, setOpenId] = useState(null)
  const [createRequest, setCreateRequest] = useState(null)
  const [completing, setCompleting] = useState(null)
  const [notice, setNotice] = useState(null)
  const [hasName, setHasName] = useState(named)
  const toast = useRef(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    let stored = null
    try {
      stored = sessionStorage.getItem(VIEW_KEY)
    } catch {
      // Without storage the board is the start view.
    }
    if (params.get('ansicht') === 'meine' || stored === 'mine') setView('mine')
    const read = () => setOpenId(decodeURIComponent(window.location.hash.slice(1)) || null)
    read()
    window.addEventListener('popstate', read)
    return () => window.removeEventListener('popstate', read)
  }, [])

  // The toast is a manual popover, so it shows above open dialogs (top layer) as well.
  useEffect(() => {
    const element = toast.current
    if (!notice) return
    if (element.matches(':popover-open')) element.hidePopover()
    element.showPopover()
    const timer = setTimeout(() => {
      element.hidePopover()
      setNotice(null)
    }, NOTICE_MS)
    return () => clearTimeout(timer)
  }, [notice])

  const switchView = (next) => {
    setView(next)
    try {
      sessionStorage.setItem(VIEW_KEY, next)
    } catch {
      // Not remembering the view is harmless.
    }
    const url = new URL(window.location.href)
    url.searchParams.delete('ansicht')
    window.history.replaceState(null, '', url)
  }

  // Astro's router takes over hash links without a hashchange event, so the island pushes the entry itself.
  const open = (id) => {
    window.history.pushState(null, '', `#${encodeURIComponent(id)}`)
    setOpenId(id)
  }
  const closePanel = () => {
    if (window.location.hash) window.history.pushState(null, '', window.location.pathname + window.location.search)
    setOpenId(null)
  }

  const run = async (body, optimistic) => {
    const before = latest.current
    if (optimistic) setState((current) => ({ ...current, projects: optimistic(current.projects) }))
    try {
      const res = await fetch('/api/members/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      // A refused change comes back with the server's state, which is the rollback; without one, restore ours.
      if (data.state) setState(data.state)
      else if (optimistic) setState(before)
      if (res.ok) return data
      if (res.status >= 500) console.error(data.message)
      setNotice({ code: data.code in copy.results ? data.code : 'error', error: true, at: Date.now() })
      return null
    } catch (err) {
      console.error(err)
      if (optimistic) setState(before)
      setNotice({ code: 'error', error: true, at: Date.now() })
      return null
    }
  }

  const { projects, templates, members } = state
  const membersById = new Map(members.map((member) => [member.id, member]))
  const projectsByEvent = new Map(projects.filter((project) => project.event).map((project) => [project.event.id, project]))
  const openProject = openId ? projects.find((project) => project.id === openId) : null

  const move = (id, status) => {
    const project = projects.find((item) => item.id === id)
    if (!project || project.status === status) return
    if (status === 'done') return setCompleting(project)
    run({ action: 'status', id, status }, (list) => list.map((item) => (item.id === id ? { ...item, status } : item)))
  }
  const created = (id) => {
    setNotice({ code: 'created', at: Date.now() })
    open(id)
  }

  const board = boardFigures(projects, me, today)
  const mineFigures = myFigures(myTasks(projects, me, today))
  const shown = filterProjects(projects, { ...filters, query }, me, today)
  const filtered = Object.keys(NO_FILTERS).some((key) => filters[key] !== NO_FILTERS[key]) || query.trim()
  const toggleStatus = (status) => setMyStatus(myStatus === status ? 'all' : status)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label={copy.views.label} className="inline-flex w-full rounded-lg border border-border-strong bg-bg p-1 sm:w-auto">
          {['board', 'mine'].map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={view === key}
              onClick={() => switchView(key)}
              className={`h-8 flex-1 whitespace-nowrap rounded-md border-0 px-4 text-sm font-medium sm:flex-none ${
                view === key ? 'bg-fg text-bg' : 'bg-transparent text-fg-muted hover:text-fg'
              }`}
            >
              {copy.views[key]}
            </button>
          ))}
        </div>
        <SearchField label={copy.search} value={query} onChange={setQuery} />
        <Menu
          label={
            <>
              <Plus aria-hidden="true" className="h-4 w-4" />
              {copy.create}
            </>
          }
          className={PRIMARY_BUTTON}
        >
          {(close) =>
            ['internal', 'event', 'task'].map((kind) => (
              <button
                key={kind}
                type="button"
                className={`${MENU_ITEM} whitespace-normal`}
                onClick={() => {
                  close()
                  setCreateRequest({ kind })
                }}
              >
                <span className="block font-medium">{copy.createKinds[kind].label}</span>
                <span className="block text-xs text-fg-muted">{copy.createKinds[kind].text}</span>
              </button>
            ))
          }
        </Menu>
      </div>

      {!hasName && (
        <NamePrompt copy={copy.name} current={membersById.get(me)?.name ?? ''} run={run} onSaved={() => setHasName(true)} />
      )}

      {view === 'board' ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Figure value={board.active} label={copy.figures.active} pressed={!filtered} onClick={() => setFilters(NO_FILTERS)} />
            <Figure value={board.open} label={copy.figures.open} pressed={false} onClick={() => setFilters(NO_FILTERS)} />
            <Figure
              value={board.mine}
              label={copy.figures.mine}
              pressed={false}
              onClick={() => {
                setMyStatus('open')
                switchView('mine')
              }}
            />
            <Figure
              value={board.overdue}
              label={copy.figures.overdue}
              alert
              pressed={filters.overdue}
              onClick={() => setFilters({ ...filters, overdue: !filters.overdue, archived: false })}
            />
          </div>

          <EventCalendar
            events={events}
            projectsByEvent={projectsByEvent}
            complete={eventsComplete}
            today={today}
            copy={copy}
            locale={locale}
            membersById={membersById}
            onStart={(event) => setCreateRequest({ kind: 'event', event })}
            onOpen={open}
          />

          <section aria-labelledby="board-heading" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="board-heading" className="mr-2 text-lg font-semibold">
                {filters.archived ? copy.filters.archive : copy.board.heading}
              </h2>
              <div role="group" aria-label={copy.filters.label} className="flex flex-wrap items-center gap-2">
                <Chip pressed={!filters.type} onClick={() => setFilters({ ...filters, type: '' })}>
                  {copy.filters.all}
                </Chip>
                {PROJECT_TYPES.map((type) => (
                  <Chip key={type} pressed={filters.type === type} onClick={() => setFilters({ ...filters, type: filters.type === type ? '' : type })}>
                    {copy.types[type]}
                  </Chip>
                ))}
                <Chip pressed={filters.mine} onClick={() => setFilters({ ...filters, mine: !filters.mine })}>
                  {copy.filters.mine}
                </Chip>
                <Chip pressed={filters.overdue} onClick={() => setFilters({ ...filters, overdue: !filters.overdue })}>
                  {copy.filters.overdue}
                </Chip>
                <label>
                  <span className="sr-only">{copy.filters.member}</span>
                  <select className={`${SELECT} h-8 rounded-full`} value={filters.member} onChange={(e) => setFilters({ ...filters, member: e.target.value })}>
                    <option value="">{copy.filters.anyMember}</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </label>
                <Chip pressed={filters.archived} onClick={() => setFilters({ ...filters, archived: !filters.archived })}>
                  {copy.filters.archive}
                </Chip>
                {filtered && (
                  <button
                    type="button"
                    className="border-0 bg-transparent px-1 text-sm text-accent underline"
                    onClick={() => {
                      setFilters(NO_FILTERS)
                      setQuery('')
                    }}
                  >
                    {copy.filters.reset}
                  </button>
                )}
              </div>
            </div>
            {!projects.length ? (
              <div className={`${SURFACE} flex flex-col items-start gap-3 p-6`}>
                <p className="text-sm text-fg-muted">{copy.board.empty}</p>
                <button type="button" className={PRIMARY_BUTTON} onClick={() => setCreateRequest({ kind: 'internal' })}>
                  <Plus aria-hidden="true" className="h-4 w-4" />
                  {copy.createKinds.internal.label}
                </button>
              </div>
            ) : filters.archived && !shown.length ? (
              <p className={`${SURFACE} p-6 text-sm text-fg-muted`}>{copy.board.noResults}</p>
            ) : (
              <>
                {filtered && !shown.length && <p className="text-sm text-fg-muted">{copy.board.noResults}</p>}
                <ProjectBoard
                  projects={shown}
                  archived={filters.archived}
                  copy={copy}
                  locale={locale}
                  today={today}
                  membersById={membersById}
                  onOpen={open}
                  onMove={move}
                />
              </>
            )}
          </section>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {['open', 'week', 'overdue', 'done'].map((key) => (
              <Figure
                key={key}
                value={mineFigures[key]}
                label={copy.myFigures[key]}
                alert={key === 'overdue'}
                pressed={myStatus === key}
                onClick={() => toggleStatus(key)}
              />
            ))}
          </div>
          <MyTasks
            projects={projects}
            copy={copy}
            locale={locale}
            today={today}
            me={me}
            membersById={membersById}
            query={query}
            status={myStatus}
            onStatus={setMyStatus}
            run={run}
            onOpen={open}
          />
        </>
      )}

      <ProjectPanel
        project={openProject}
        copy={copy}
        locale={locale}
        today={today}
        me={me}
        members={members}
        membersById={membersById}
        run={run}
        onClose={closePanel}
        onStatus={(project, status) => move(project.id, status)}
      />
      <CreateDialog
        request={createRequest}
        copy={copy}
        locale={locale}
        me={me}
        members={members}
        membersById={membersById}
        templates={templates}
        projects={projects}
        admin={admin}
        run={run}
        onCreated={created}
      />
      <CompleteDialog project={completing} copy={copy} run={run} onClose={() => setCompleting(null)} />

      <div
        ref={toast}
        popover="manual"
        role="status"
        className={`fixed inset-auto bottom-4 left-1/2 m-0 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-lg border bg-bg px-4 py-3 text-sm shadow-lg ${
          notice?.error ? 'border-danger text-danger' : 'border-border text-fg'
        }`}
      >
        {notice && copy.results[notice.code]}
      </div>
    </div>
  )
}
