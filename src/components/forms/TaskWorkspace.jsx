/**
 * The tasks module of the members area (React island) with four views: the overview it starts on, the tasks (as a board
 * or a list, the member's choice is remembered in this browser), the project board and the events calendar. All but
 * the calendar show one team at a time. They start on the member's own team, which also lists what they are assigned to
 * elsewhere, and every other team is one click away. Members without a team choose it here; admins can set it on the
 * member management page. Posts { action, … } to /api/members/tasks; each answer carries the full state of everyone's
 * projects, which replaces the local one. Changes that the UI shows at once (moving, checking off, assigning) are
 * applied optimistically and rolled back when the server refuses them.
 * The open project is the URL hash (#<id>), pushed as a history entry like the CRM. ?ansicht=aufgaben or events opens
 * that view and ?ansicht=meine (link of the digest mail) the tasks with "Nur meine"; otherwise view and team of this
 * browser session are restored.
 * Props: copy (memberArea.tasks.workspace plus teams, team id → name), initialState ({ projects, templates, members }),
 * events (calendar events with `day`), eventsComplete, me (member id), named (has entered a name), admin, board (the
 * board works across teams, so it is not asked for one), locale, today (YYYY-MM-DD, Berlin).
 * Styles: ./forms.css plus Tailwind utilities.
 */
import React, { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { ALL_TEAMS, filterProjects, NAME_MAX, patchedTask, scopedTasks, TEAM_IDS } from '../../lib/tasks'
import { Chip, fill, Menu, MENU_ITEM, PRIMARY_BUTTON, SearchField } from './memberUi'
import CompleteDialog from './tasks/CompleteDialog'
import CreateDialog from './tasks/CreateDialog'
import EventCalendar from './tasks/EventCalendar'
import ProjectBoard from './tasks/ProjectBoard'
import ProjectPanel from './tasks/ProjectPanel'
import TaskBoard from './tasks/TaskBoard'
import TaskList from './tasks/TaskList'
import TaskOverview from './tasks/TaskOverview'
import { INPUT, LABEL, Segmented, SELECT, SURFACE } from './tasks/taskUi'
import './forms.css'

const SESSION_KEY = 'ignite-tasks-view'
const LAYOUT_KEY = 'ignite-tasks-layout'
const VIEWS = ['overview', 'tasks', 'projects', 'events']
const LINKED_VIEWS = { aufgaben: 'tasks', meine: 'tasks', events: 'events' }
const NOTICE_MS = 6000
const QUIET_LINK = 'border-0 bg-transparent p-0 text-sm text-fg-muted underline underline-offset-2 hover:text-fg'

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

function TeamPrompt({ copy, teams, onChoose, onLater }) {
  return (
    <section aria-labelledby="team-prompt" className={`${SURFACE} flex flex-col gap-3 p-4`}>
      <div>
        <h2 id="team-prompt" className="text-lg font-semibold">
          {copy.heading}
        </h2>
        <p className="text-sm text-fg-muted">{copy.text}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {TEAM_IDS.map((team) => (
          <button
            key={team}
            type="button"
            className="inline-flex h-9 items-center rounded-full border border-border-strong px-3.5 text-sm hover:bg-bg-subtle"
            onClick={() => onChoose(team)}
          >
            {teams[team]}
          </button>
        ))}
        <button type="button" className={`${QUIET_LINK} ml-1`} onClick={onLater}>
          {copy.later}
        </button>
      </div>
    </section>
  )
}

export default function TaskWorkspace({ copy, initialState, events, eventsComplete, me, named, admin, board, locale, today }) {
  const [state, setState] = useState(initialState)
  const latest = useRef(state)
  latest.current = state
  const { projects, templates, members } = state
  const membersById = new Map(members.map((member) => [member.id, member]))
  const myTeam = membersById.get(me)?.team ?? ''

  const [view, setView] = useState('overview')
  const [layout, setLayout] = useState('board')
  const [tab, setTab] = useState(myTeam || ALL_TEAMS)
  const [onlyMine, setOnlyMine] = useState(false)
  const [archived, setArchived] = useState(false)
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState(null)
  const [createRequest, setCreateRequest] = useState(null)
  const [completing, setCompleting] = useState(null)
  const [notice, setNotice] = useState(null)
  const [hasName, setHasName] = useState(named)
  const [teamLater, setTeamLater] = useState(false)
  const toast = useRef(null)

  useEffect(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem(SESSION_KEY))
      if (VIEWS.includes(stored?.view)) setView(stored.view)
      if (stored?.tab === ALL_TEAMS || TEAM_IDS.includes(stored?.tab)) setTab(stored.tab)
      if (localStorage.getItem(LAYOUT_KEY) === 'list') setLayout('list')
    } catch {
      // Without storage, or with the value of an older version, the page starts on the member's team.
    }
    const url = new URL(window.location.href)
    const linked = url.searchParams.get('ansicht')
    if (linked in LINKED_VIEWS) {
      setView(LINKED_VIEWS[linked])
      if (linked === 'meine') {
        setTab(myTeam || ALL_TEAMS)
        setOnlyMine(true)
      }
      url.searchParams.delete('ansicht')
      window.history.replaceState(null, '', url)
    }
    const read = () => setOpenId(decodeURIComponent(window.location.hash.slice(1)) || null)
    read()
    window.addEventListener('popstate', read)
    return () => window.removeEventListener('popstate', read)
  }, [])

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ view, tab }))
      localStorage.setItem(LAYOUT_KEY, layout)
    } catch {
      // Not remembering the view is harmless.
    }
  }, [view, tab, layout])

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
  const chooseTeam = async (team) => {
    if (await run({ action: 'team', team })) setTab(team)
  }
  // The overview's links sit at the end of a long page on phones.
  const goTo = (next) => {
    setView(next)
    window.scrollTo({ top: 0 })
  }

  const scope = { team: tab, myTeam, onlyMine, query }
  const tasks = scopedTasks(projects, scope, me, today)
  // Tasks without a team belong to nobody, so the hint has no place in a view of the member's own tasks.
  const unsorted = onlyMine
    ? 0
    : scopedTasks(projects, { ...scope, team: ALL_TEAMS, query: '' }, me, today).filter((task) => !task.team && !task.done).length
  const shown = filterProjects(projects, { ...scope, archived }, me)
  // New work lands in the open tab, or on "Alle Teams" in the member's own team.
  const newTeam = tab === ALL_TEAMS ? myTeam : tab
  const tabs = [...(myTeam ? [myTeam] : []), ...TEAM_IDS.filter((team) => team !== myTeam), ALL_TEAMS]
  const askTeam = hasName && !myTeam && !teamLater && !board
  const offerTeam = tab !== myTeam && !board
  const filtered = view === 'tasks' || view === 'projects'
  // The overview has no search or "Nur meine", so what is set in the other views must not narrow it.
  const overviewScope = { team: tab, myTeam, onlyMine: false, query: '' }

  const addTask = (title, status) =>
    run({
      action: 'create',
      project: { title, description: '', type: 'task', due: '', leads: [], team: newTeam },
      task: { description: '', due: '', priority: 'normal', required: false, assignees: onlyMine ? [me] : [], status },
    })
  const patchTask = (task, fields) =>
    run({ action: 'updateTask', id: task.projectId, taskId: task.id, patch: fields }, (list) =>
      list.map((project) =>
        project.id === task.projectId
          ? { ...project, tasks: project.tasks.map((item) => (item.id === task.id ? patchedTask(item, fields) : item)) }
          : project,
      ),
    )
  const taskProps = { tasks, tab, onlyMine, searching: !!query.trim(), copy, locale, me, members, membersById, onPatch: patchTask, onOpen: open }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border">
        <div role="group" aria-label={copy.views.label} className="flex gap-3 sm:gap-5">
          {VIEWS.map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={view === key}
              onClick={() => setView(key)}
              className={`-mb-px rounded-none border-0 border-b-2 border-solid bg-transparent px-0 py-3 text-sm font-medium sm:text-base ${
                view === key ? 'border-fg text-fg' : 'border-transparent text-fg-muted hover:text-fg'
              }`}
            >
              {copy.views[key]}
            </button>
          ))}
        </div>
        <div className="flex min-w-0 flex-1 basis-64 items-center justify-end gap-2 pb-2 sm:pb-0">
          {filtered && (
            <div className="flex min-w-0 max-w-72 flex-1">
              <SearchField label={copy.search} value={query} onChange={setQuery} />
            </div>
          )}
          {view === 'overview' && !askTeam && (
            <label className="flex min-w-0 items-center gap-2 text-sm text-fg-muted">
              {copy.teamTabs.label}
              <select className={`${SELECT} min-w-0 font-medium`} value={tab} onChange={(e) => setTab(e.target.value)}>
                {tabs.map((team) => (
                  <option key={team} value={team}>
                    {team === ALL_TEAMS ? copy.teamTabs.all : copy.teams[team]}
                  </option>
                ))}
              </select>
            </label>
          )}
          <Menu
            label={
              <>
                <Plus aria-hidden="true" className="h-4 w-4" />
                {copy.create}
              </>
            }
            className={`${PRIMARY_BUTTON} shrink-0`}
          >
            {(close) =>
              ['task', 'internal', 'event'].map((kind) => (
                <button
                  key={kind}
                  type="button"
                  className={`${MENU_ITEM} whitespace-normal`}
                  onClick={() => {
                    close()
                    setCreateRequest({ kind, team: newTeam })
                  }}
                >
                  <span className="block font-medium">{copy.createKinds[kind].label}</span>
                  <span className="block text-xs text-fg-muted">{copy.createKinds[kind].text}</span>
                </button>
              ))
            }
          </Menu>
        </div>
      </div>

      {!hasName && <NamePrompt copy={copy.name} current={membersById.get(me)?.name ?? ''} run={run} onSaved={() => setHasName(true)} />}
      {askTeam && <TeamPrompt copy={copy.teamPrompt} teams={copy.teams} onChoose={chooseTeam} onLater={() => setTeamLater(true)} />}

      {filtered && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {/* The prompt lists the same teams, two rows of them would only compete. */}
          {!askTeam && (
            // Phones scroll through the teams; a chip must not shrink or break inside the scrolling row.
            <div
              role="group"
              aria-label={copy.teamTabs.label}
              className="flex min-w-0 max-w-full gap-2 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&>*]:shrink-0"
            >
              {tabs.map((team) => (
                <Chip key={team} pressed={tab === team} onClick={() => setTab(team)}>
                  {team === myTeam && <span className="sr-only">{copy.teamTabs.yours}: </span>}
                  {team === ALL_TEAMS ? copy.teamTabs.all : copy.teams[team]}
                </Chip>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 sm:ml-auto">
            <Chip pressed={onlyMine} onClick={() => setOnlyMine(!onlyMine)}>
              {copy.onlyMine}
            </Chip>
            {view === 'projects' && (
              <Chip pressed={archived} onClick={() => setArchived(!archived)}>
                {copy.archive}
              </Chip>
            )}
            {view === 'tasks' && <Segmented label={copy.layouts.label} options={{ board: copy.layouts.board, list: copy.layouts.list }} value={layout} onChange={setLayout} />}
          </div>
        </div>
      )}

      {view === 'overview' && (
        <TaskOverview
          events={events}
          complete={eventsComplete}
          projectsByEvent={projectsByEvent}
          projects={filterProjects(projects, { ...overviewScope, archived: false }, me).filter((project) => project.status !== 'done')}
          tasks={scopedTasks(projects, overviewScope, me, today)}
          mine={scopedTasks(projects, { ...overviewScope, team: ALL_TEAMS, onlyMine: true }, me, today)}
          today={today}
          copy={copy}
          locale={locale}
          onView={goTo}
          onStart={(event) => setCreateRequest({ kind: 'event', event, team: newTeam })}
          onOpen={open}
          onPatch={patchTask}
        />
      )}

      {view === 'tasks' && layout === 'board' && <TaskBoard {...taskProps} onAdd={addTask} />}
      {view === 'tasks' && layout === 'list' && <TaskList {...taskProps} newTeam={newTeam} onAdd={(title) => addTask(title, 'backlog')} />}

      {view === 'projects' &&
        (shown.length ? (
          <ProjectBoard
            projects={shown}
            archived={archived}
            showTeam={tab === ALL_TEAMS}
            copy={copy}
            locale={locale}
            today={today}
            membersById={membersById}
            onOpen={open}
            onMove={move}
          />
        ) : (
          <p className="py-6 text-center text-sm text-fg-muted">{projects.length ? copy.board.noResults : copy.board.empty}</p>
        ))}

      {view === 'events' && (
        <EventCalendar
          events={events}
          projectsByEvent={projectsByEvent}
          complete={eventsComplete}
          today={today}
          copy={copy}
          locale={locale}
          membersById={membersById}
          onStart={(event) => setCreateRequest({ kind: 'event', event, team: newTeam })}
          onOpen={open}
        />
      )}

      {filtered && tab !== ALL_TEAMS && (unsorted > 0 || offerTeam) && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-fg-muted">
          {unsorted > 0 && (
            <p>
              {fill(copy.list.unsorted, { count: unsorted })}{' '}
              <button type="button" className={QUIET_LINK} onClick={() => setTab(ALL_TEAMS)}>
                {copy.list.showUnsorted}
              </button>
            </p>
          )}
          {offerTeam && (
            <button type="button" className={QUIET_LINK} onClick={() => chooseTeam(tab)}>
              {copy.teamTabs.setMine}
            </button>
          )}
        </div>
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
