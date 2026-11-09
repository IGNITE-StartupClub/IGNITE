/**
 * The tasks module of the members area (React island). It opens on an overview with the next 14 days and one card each
 * for the member's tasks, the events and the projects; every card leads on to its page: the kanban board (or the same
 * tasks as a list, remembered in this browser), the projects and the events. The board always starts on the member's
 * own tasks and its filter leads on to their team and every other team, projects start on all teams, events show
 * everything. Members without a team choose it here; admins can set it on the member management page.
 * Posts { action, revision, … } to /api/members/tasks and gets back what changed since its revision, with the member's
 * own private tasks; useLiveRefresh asks for the same while the page is in use. Private tasks sit between the others on
 * board and list, only for their member. `base` holds what the server said last. Changes the UI shows at once (moving,
 * checking off, assigning, deleting) stay in `pending` until their answer and are laid over `base`, so they survive a
 * refresh in between and vanish by themselves when the server refuses them. Deleting tasks offers to undo them in the
 * toast, which sits inside the topmost modal dialog while one is open, because everything outside it is inert.
 * Archived projects stay on the server until the archive, an archived project or an earlier project to copy is asked for
 * (loadArchive). From then on every request asks for them too (`withArchive`), and an answer to a request sent before
 * keeps what was loaded.
 * Page and open project live in the URL hash (taskHash), as history entries with the state of Astro's router, which
 * needs it to bring the page back after leaving it. Moving between this page's own entries is the island's business, so
 * it takes those popstate events before the router, which would load the whole page again. ?ansicht=… from older links,
 * the digest mail and the search turns into that hash on load.
 * Props: copy (memberArea.tasks.workspace plus teams, team id → name, and problems of the quick add), initialState
 * ({ revision, projects, templates, members, privateTasks }), events (public events with `day`, `endDay`, `time`),
 * eventsComplete, me (member id), named (has entered a name), admin, board (the board works across teams, so it is not
 * asked for one), locale, today (YYYY-MM-DD, Berlin).
 * Styles: ./forms.css plus Tailwind utilities.
 */
import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Plus } from 'lucide-react'
import { captureTask } from '../../lib/memberSearch'
import {
  ALL_TEAMS,
  applyChanges,
  calendarEntries,
  filterProjects,
  filterScope,
  MINE,
  NAME_MAX,
  patchedProject,
  patchedTask,
  projectDay,
  scopedPrivateTasks,
  scopedTasks,
  taskHash,
  taskRoute,
  TEAM_IDS,
  withArchive,
} from '../../lib/tasks'
import { Chip, fill, Menu, MENU_ITEM, PRIMARY_BUTTON, SearchField } from './memberUi'
import { fetchNews, useLiveRefresh } from './useLiveRefresh'
import CompleteDialog from './tasks/CompleteDialog'
import CreateDialog from './tasks/CreateDialog'
import EventCalendar from './tasks/EventCalendar'
import EventCards from './tasks/EventCards'
import EventDialog from './tasks/EventDialog'
import PrivateTaskDialog from './tasks/PrivateTaskDialog'
import ProjectBoard from './tasks/ProjectBoard'
import ProjectPanel from './tasks/ProjectPanel'
import TaskBoard from './tasks/TaskBoard'
import TaskList from './tasks/TaskList'
import TaskOverview from './tasks/TaskOverview'
import { FilterMenu, focusTask, INPUT, LABEL, Segmented, SURFACE, TaskContextMenu } from './tasks/taskUi'
import './forms.css'

const LAYOUT_KEY = 'ignite-tasks-layout'
const LINKED_VIEWS = { aufgaben: 'tasks', meine: 'tasks', projekte: 'projects', events: 'events' }
const UNDO_OF = { removeTask: 'restoreTask', removePrivate: 'restorePrivate' }
const NOTICE_MS = 6000
const UNDO_MS = 10000
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
            required
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

function PageHead({ title, back, onBack, children }) {
  return (
    <header className="flex flex-col gap-1.5">
      {back && (
        <button type="button" className="w-fit border-0 bg-transparent p-0 text-sm text-fg-muted hover:text-fg" onClick={onBack}>
          <span aria-hidden="true">← </span>
          {back}
        </button>
      )}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <h1 id="page-title" className="text-display-sm hyphens-none">
          {title}
        </h1>
        <div className="flex min-w-0 flex-wrap items-center gap-2">{children}</div>
      </div>
    </header>
  )
}

export default function TaskWorkspace({ copy, initialState, events, eventsComplete, me, named, admin, board, locale, today }) {
  const [state, setState] = useState(initialState)
  const base = useRef(initialState)
  const pending = useRef([])
  const inFlight = useRef(0)
  const sent = useRef(0)
  const applied = useRef(0)
  // True once the archive is loaded: requests then ask for it, and answers keep it.
  const holding = useRef(false)
  const archiveLoad = useRef(null)
  const { projects, templates, members, privateTasks } = state
  const membersById = useMemo(() => new Map(members.map((member) => [member.id, member])), [members])
  const myTeam = membersById.get(me)?.team ?? ''

  const [route, setRoute] = useState({ view: 'overview', projectId: null })
  const [layout, setLayout] = useState('board')
  const [eventLayout, setEventLayout] = useState('cards')
  const [taskFilter, setTaskFilter] = useState(MINE)
  const [projectFilter, setProjectFilter] = useState(ALL_TEAMS)
  const [archived, setArchived] = useState(false)
  const [archive, setArchive] = useState('none') // none, loading, loaded or failed
  const [query, setQuery] = useState('')
  const [openPrivateId, setOpenPrivateId] = useState(null)
  const [createRequest, setCreateRequest] = useState(null)
  const [shownEvent, setShownEvent] = useState(null)
  const [completing, setCompleting] = useState(null)
  const [taskMenu, setTaskMenu] = useState(null)
  const [notice, setNotice] = useState(null)
  const [toastHost, setToastHost] = useState(null)
  const [hasName, setHasName] = useState(named)
  const [teamLater, setTeamLater] = useState(false)
  const toast = useRef(null)
  const { view, projectId } = route

  useEffect(() => {
    try {
      if (localStorage.getItem(LAYOUT_KEY) === 'list') setLayout('list')
    } catch {
      // Without storage the page shows the board, which is the default anyway.
    }
    const url = new URL(window.location.href)
    const linked = LINKED_VIEWS[url.searchParams.get('ansicht')]
    if (linked) {
      url.searchParams.delete('ansicht')
      url.hash = taskHash(linked, null)
      window.history.replaceState(window.history.state, '', url)
    }
    const page = `${window.location.pathname}${window.location.search}`
    const read = () => setRoute(taskRoute(window.location.hash))
    // Capture listeners on window run before the router's own. A traversal to another page stays the router's.
    const traverse = (event) => {
      if (`${window.location.pathname}${window.location.search}` !== page) return
      event.stopImmediatePropagation()
      read()
    }
    read()
    window.addEventListener('popstate', traverse, { capture: true })
    return () => window.removeEventListener('popstate', traverse, { capture: true })
  }, [])

  // Outside an open modal dialog the toast would be inert: seen, but its undo out of reach for pointer, keyboard and
  // screen readers. So while one is open, the toast is drawn inside the topmost one (the last in the document here).
  useEffect(() => {
    if (!notice) {
      setToastHost(null)
      return
    }
    const pick = () => {
      const modals = document.querySelectorAll('dialog:modal')
      setToastHost(modals[modals.length - 1] ?? null)
    }
    pick()
    const observer = new MutationObserver(pick)
    observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'] })
    return () => observer.disconnect()
  }, [notice])

  // The toast is a manual popover, so it shows above open dialogs (top layer). Moving it to another dialog draws it anew,
  // so it shows again for the rest of its time.
  useEffect(() => {
    const element = toast.current
    if (!notice) return
    if (element.matches(':popover-open')) element.hidePopover()
    element.showPopover()
    const timer = setTimeout(
      () => {
        element.hidePopover()
        setNotice(null)
      },
      Math.max(0, notice.at + (notice.undo ? UNDO_MS : NOTICE_MS) - Date.now()),
    )
    return () => clearTimeout(timer)
  }, [notice, toastHost])

  // Astro's router takes over hash links without a hashchange event, so the island writes the entry itself. `panel`
  // marks an entry that opened a project, so closing it goes back instead of piling up entries.
  const go = (nextView, nextProject, { replace = false } = {}) => {
    const url = `${window.location.pathname}${window.location.search}${taskHash(nextView, nextProject)}`
    const entry = { ...window.history.state, panel: !!nextProject }
    if (replace) window.history.replaceState(entry, '', url)
    else window.history.pushState(entry, '', url)
    setRoute({ view: nextView, projectId: nextProject })
  }
  const open = (id) => go(view, id, { replace: !!projectId })
  const closePanel = () => {
    if (!projectId) return
    if (window.history.state?.panel) window.history.back()
    else go(view, null, { replace: true })
  }
  // The overview's links sit at the end of a long page on phones.
  const goTo = (next) => {
    go(next, null)
    window.scrollTo({ top: 0 })
  }

  const show = () => setState(pending.current.reduce((current, change) => change(current), base.current))

  // An older answer must not undo a newer one. What it would have brought arrives with the next check at the latest.
  // An answer to a request sent before the archive arrived knows none of it, so the archived projects stay.
  const receive = (request, data, withArchived) => {
    if (request < applied.current) return
    applied.current = request
    const kept = holding.current && !withArchived ? base.current.projects.filter((project) => project.archived) : []
    if (data.state) base.current = data.state
    else if (data.changes) base.current = applyChanges(base.current, data.changes)
    if (kept.length) base.current = withArchive(base.current, kept)
  }

  const run = async (body, optimistic, key = 'projects') => {
    const request = ++sent.current
    // Archiving an open project loads the archive, but its own answer may come first and would take the project away.
    const withArchived = holding.current || (body.action === 'archive' && body.archived)
    inFlight.current += 1
    const change = optimistic && ((current) => ({ ...current, [key]: optimistic(current[key]) }))
    if (change) {
      pending.current.push(change)
      show()
    }
    try {
      const res = await fetch('/api/members/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, revision: base.current.revision, ...(withArchived && { withArchive: true }) }),
      })
      const data = await res.json()
      receive(request, data, withArchived)
      if (res.ok) {
        const undo = UNDO_OF[body.action]
        if (undo) {
          // Every deletion joins the toast, so a second one in a row does not leave the first beyond reach.
          const step = { action: undo, taskId: body.taskId }
          setNotice((current) => {
            const steps = [...(current?.undo ?? []), step]
            return { code: steps.length > 1 ? 'removedMany' : 'removed', count: steps.length, undo: steps, at: Date.now() }
          })
        }
        return data
      }
      if (res.status >= 500) console.error(data.message)
      setNotice({ code: data.code in copy.results ? data.code : 'error', error: true, at: Date.now() })
      return null
    } catch (err) {
      console.error(err)
      setNotice({ code: 'error', error: true, at: Date.now() })
      return null
    } finally {
      inFlight.current -= 1
      pending.current = pending.current.filter((item) => item !== change)
      show()
    }
  }

  useLiveRefresh(async () => {
    // A check sent after an action could overtake it and hide its answer as the older one.
    if (inFlight.current) return
    const request = ++sent.current
    const withArchived = holding.current
    const data = await fetchNews('/api/members/tasks', base.current.revision, withArchived ? { withArchive: '1' } : {})
    if (!data) return false
    if (!data.changes) return
    receive(request, data, withArchived)
    show()
  })

  const loadArchive = () => {
    if (holding.current || archiveLoad.current) return
    setArchive('loading')
    archiveLoad.current = fetch('/api/members/tasks?archive')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`Archive failed with ${res.status}`))))
      .then((data) => {
        holding.current = true
        base.current = withArchive(base.current, data.projects)
        show()
        setArchive('loaded')
      })
      .catch((err) => {
        console.error(err)
        setArchive('failed')
        setNotice({ code: 'error', error: true, at: Date.now() })
      })
      .finally(() => {
        archiveLoad.current = null
      })
  }

  // One after the other, so each answer builds on the one before.
  const undo = async () => {
    const steps = notice.undo
    const hadFocus = toast.current.contains(document.activeElement)
    toast.current.hidePopover()
    setNotice(null)
    let restored = 0
    for (const step of steps) if (await run(step)) restored += 1
    if (restored < steps.length) return
    setNotice({ code: 'restored', at: Date.now() })
    if (hadFocus) focusTask(steps[steps.length - 1].taskId)
  }

  const searchQuery = useDeferredValue(query)
  const projectsByEvent = new Map(projects.filter((project) => project.event).map((project) => [project.event.id, project]))
  const found = projectId ? projects.find((project) => project.id === projectId) : null
  // A folded project lacks its tasks, so the panel waits for the archive.
  const openProject = found && !found.folded ? found : null
  const openEventPlace = openProject?.event ? events.find((event) => event.id === openProject.event.id)?.location : undefined
  const { entries, twins } = useMemo(() => calendarEntries(events, projects), [events, projects])
  const planOf = (entry) => (entry.source === 'own' ? projects.find((project) => project.id === entry.id) : projectsByEvent.get(entry.id))
  const openEvent = (entry) => {
    const project = planOf(entry)
    if (project) open(project.id)
    else setShownEvent(entry)
  }

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
  const merge = async (project, event) => {
    if (await run({ action: 'linkEvent', id: project.id, eventId: event.id })) setNotice({ code: 'merged', at: Date.now() })
  }
  const keepApart = (project, event) =>
    run({ action: 'keepEventApart', id: project.id, eventId: event.id }, (list) =>
      list.map((item) => (item.id === project.id ? { ...item, distinctFrom: [...item.distinctFrom, event.id] } : item)),
    )
  const chooseLayout = (next) => {
    setLayout(next)
    try {
      localStorage.setItem(LAYOUT_KEY, next)
    } catch {
      // Not remembering the layout is harmless.
    }
  }

  // The archive loads for its view, for a project opened by link or from the calendar that sits in it, and for an open
  // project that is archived, which the next answer would otherwise take away. A project the panel showed and that left
  // the state was deleted, so the archive would not bring it back.
  const seen = useRef(new Set())
  useEffect(() => {
    if (openProject) seen.current.add(openProject.id)
    const unknown = !!projectId && !found && !seen.current.has(projectId)
    if (archived || found?.archived || unknown) loadArchive()
  }, [archived, projectId, !!found, found?.archived, openProject?.id])

  // Typing in the search must not wait for the lists: they follow the deferred query, and only the page on screen
  // computes its own.
  const taskScope = useMemo(() => filterScope(taskFilter, myTeam, searchQuery), [taskFilter, myTeam, searchQuery])
  const withPrivate = (scoped) => [...scopedTasks(projects, scoped, me, today), ...scopedPrivateTasks(privateTasks, scoped, me, today)]
  const tasks = useMemo(() => (view === 'tasks' ? withPrivate(taskScope) : []), [view, projects, privateTasks, taskScope, me, today])
  const mine = useMemo(() => (view === 'overview' ? withPrivate(filterScope(MINE, myTeam, '')) : []), [view, projects, privateTasks, myTeam, me, today])
  const filter = view === 'tasks' ? taskFilter : projectFilter
  const teamFiltered = (view === 'tasks' || view === 'projects') && TEAM_IDS.includes(filter)
  // Tasks without a team belong to nobody, so the hint only has a place in a view of one team.
  const unsorted = useMemo(
    () =>
      teamFiltered
        ? scopedTasks(projects, { ...taskScope, team: ALL_TEAMS, onlyMine: false, query: '' }, me, today).filter((task) => !task.team && !task.done).length
        : 0,
    [teamFiltered, projects, taskScope, me, today],
  )
  const shown = filterProjects(projects, { ...filterScope(projectFilter, myTeam, searchQuery), archived }, me)
  // New work lands in the team on screen, otherwise in the member's own team.
  const newTeam = teamFiltered ? filter : myTeam
  const askTeam = hasName && !myTeam && !teamLater && !board
  const offerTeam = filter !== myTeam && !board
  const openProjects = filterProjects(projects, { ...filterScope(ALL_TEAMS, myTeam, ''), archived: false }, me)
    .filter((project) => project.status !== 'done')
    .sort((a, b) => (projectDay(a) || '9999').localeCompare(projectDay(b) || '9999'))

  const myTeamOption = myTeam ? [{ value: myTeam, label: fill(copy.filter.myTeam, { team: copy.teams[myTeam] }) }] : []
  const otherTeams = TEAM_IDS.filter((team) => team !== myTeam).map((team) => ({ value: team, label: copy.teams[team] }))
  const allTeams = { value: ALL_TEAMS, label: copy.teamTabs.all }
  const taskFilters = [{ value: MINE, label: copy.filter.mine }, ...myTeamOption, ...otherTeams, allTeams]
  const projectFilters = [allTeams, { value: MINE, label: copy.filter.myProjects }, ...myTeamOption, ...otherTeams]

  const addTask = (title, status, isPrivate) =>
    run(
      isPrivate
        ? { action: 'addPrivate', task: { title, status, team: newTeam } }
        : {
            action: 'create',
            project: { title, description: '', type: 'task', due: '', leads: [], team: newTeam },
            task: { description: '', due: '', priority: 'normal', required: false, assignees: taskFilter === MINE ? [me] : [], status },
          },
    )
  const capture = (text, isPrivate) => {
    const captured = captureTask(text, { members, teams: TEAM_IDS.map((id) => ({ id, name: copy.teams[id] })), me, today })
    // A private task has no people, so naming someone would drop them without a word.
    const others = isPrivate ? captured.assignees.filter(({ id }) => id !== me) : []
    if (!others.length) return captured
    const token = others.map(({ name }) => `@${name}`).join(', ')
    return { ...captured, problems: [...captured.problems, { kind: 'privatePeople', token }] }
  }
  const quickAdd = async ({ title, due, assignees, team }, isPrivate) => {
    const data = await run(
      isPrivate
        ? { action: 'addPrivate', task: { title, due, team } }
        : {
            action: 'create',
            project: { title, description: '', type: 'task', due, leads: [me], team },
            task: { description: '', due, priority: 'normal', required: false, assignees: assignees.map(({ id }) => id) },
          },
    )
    if (data) setNotice({ code: 'created', at: Date.now() })
    return data
  }
  const patched = (list, task, fields) => list.map((item) => (item.id === task.id ? patchedTask(item, fields) : item))
  const patchTask = (task, fields) =>
    task.private
      ? run({ action: 'updatePrivate', taskId: task.id, patch: fields }, (list) => patched(list, task, fields), 'privateTasks')
      : run({ action: 'updateTask', id: task.projectId, taskId: task.id, patch: fields }, (list) =>
          list.map((project) => (project.id === task.projectId ? patchedProject(project, task.id, fields) : project)),
        )
  const removeTask = (task) =>
    task.private
      ? run({ action: 'removePrivate', taskId: task.id }, (list) => list.filter((item) => item.id !== task.id), 'privateTasks')
      : run({ action: 'removeTask', id: task.projectId, taskId: task.id }, (list) =>
          list
            .map((project) => (project.id === task.projectId ? { ...project, tasks: project.tasks.filter((item) => item.id !== task.id) } : project))
            .filter((project) => project.type !== 'task' || project.tasks.length),
        )
  const openTask = (task) => (task.private ? setOpenPrivateId(task.id) : open(task.projectId))
  const startPlanning = (event) => setCreateRequest({ kind: 'event', event, team: newTeam })
  const taskProps = {
    tasks,
    filter: taskFilter,
    searching: !!searchQuery.trim(),
    copy,
    locale,
    me,
    members,
    membersById,
    onPatch: patchTask,
    onOpen: openTask,
    onMenu: (task, x, y) => setTaskMenu({ task, x, y }),
  }

  const createMenu = (
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
        ['internal', 'event'].map((kind) => (
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
  )
  const toastElement = (
    <div
      ref={toast}
      popover="manual"
      role="status"
      className={`fixed inset-auto bottom-4 left-1/2 m-0 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-lg border bg-bg px-4 py-3 text-sm shadow-lg ${
        notice?.error ? 'border-danger text-danger' : 'border-border text-fg'
      }`}
    >
      {notice && (
        <span className="flex items-center gap-4">
          {fill(copy.results[notice.code], { count: notice.count })}
          {notice.undo && (
            <button type="button" className="border-0 bg-transparent p-0 text-sm font-medium text-accent underline underline-offset-2" onClick={undo}>
              {copy.undo}
            </button>
          )}
        </span>
      )}
    </div>
  )
  const search = (
    <div className="w-56 max-w-full">
      <SearchField label={copy.search} value={query} onChange={setQuery} />
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHead title={copy.views[view]} back={view === 'overview' ? null : copy.back} onBack={() => goTo('overview')}>
        {view === 'overview' && createMenu}
        {view === 'tasks' && (
          <>
            {search}
            <FilterMenu label={copy.filter.label} value={taskFilter} options={taskFilters} onChange={setTaskFilter} />
            <Segmented label={copy.layouts.label} options={{ board: copy.layouts.board, list: copy.layouts.list }} value={layout} onChange={chooseLayout} />
          </>
        )}
        {view === 'projects' && (
          <>
            {search}
            <FilterMenu label={copy.filter.label} value={projectFilter} options={projectFilters} onChange={setProjectFilter} />
            <Chip pressed={archived} onClick={() => setArchived(!archived)}>
              {copy.archive}
            </Chip>
            {createMenu}
          </>
        )}
        {view === 'events' && (
          <>
            <Segmented
              label={copy.calendar.display}
              options={{ cards: copy.calendar.cards, calendar: copy.calendar.calendar }}
              value={eventLayout}
              onChange={setEventLayout}
            />
            {createMenu}
          </>
        )}
      </PageHead>

      {!hasName && <NamePrompt copy={copy.name} current={membersById.get(me)?.name ?? ''} run={run} onSaved={() => setHasName(true)} />}
      {askTeam && <TeamPrompt copy={copy.teamPrompt} teams={copy.teams} onChoose={(team) => run({ action: 'team', team })} onLater={() => setTeamLater(true)} />}

      {view === 'overview' && (
        <TaskOverview
          entries={entries}
          complete={eventsComplete}
          planOf={planOf}
          projects={openProjects}
          mine={mine}
          today={today}
          copy={copy}
          locale={locale}
          membersById={membersById}
          onView={goTo}
          onStart={startPlanning}
          onOpen={open}
          onOpenEvent={openEvent}
          onOpenTask={openTask}
          onPatch={patchTask}
          onCapture={capture}
          onQuickAdd={quickAdd}
        />
      )}

      {view === 'tasks' && layout === 'board' && <TaskBoard {...taskProps} onAdd={addTask} />}
      {view === 'tasks' && layout === 'list' && (
        <TaskList {...taskProps} newTeam={newTeam} onAdd={(title, isPrivate) => addTask(title, 'backlog', isPrivate)} />
      )}

      {view === 'projects' &&
        (archived && archive !== 'loaded' ? (
          archive === 'failed' ? (
            <p className="py-6 text-center text-sm text-fg-muted">
              {copy.board.archiveFailed}{' '}
              <button type="button" className={QUIET_LINK} onClick={loadArchive}>
                {copy.board.retry}
              </button>
            </p>
          ) : (
            <p role="status" className="py-6 text-center text-sm text-fg-muted">
              {copy.board.archiveLoading}
            </p>
          )
        ) : shown.length ? (
          <ProjectBoard
            projects={shown}
            archived={archived}
            showTeam={!teamFiltered}
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

      {view === 'events' && eventLayout === 'cards' && (
        <EventCards
          entries={entries}
          twins={twins}
          planOf={planOf}
          complete={eventsComplete}
          today={today}
          copy={copy}
          locale={locale}
          membersById={membersById}
          onStart={startPlanning}
          onOpen={open}
          onMerge={merge}
          onApart={keepApart}
        />
      )}
      {view === 'events' && eventLayout === 'calendar' && (
        <EventCalendar
          events={entries}
          planOf={planOf}
          complete={eventsComplete}
          today={today}
          copy={copy}
          locale={locale}
          membersById={membersById}
          onStart={startPlanning}
          onOpen={open}
          onOpenEvent={openEvent}
        />
      )}

      {teamFiltered && (unsorted > 0 || offerTeam) && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-fg-muted">
          {unsorted > 0 && (
            <p>
              {fill(copy.list.unsorted, { count: unsorted })}{' '}
              <button type="button" className={QUIET_LINK} onClick={() => (view === 'tasks' ? setTaskFilter : setProjectFilter)(ALL_TEAMS)}>
                {copy.list.showUnsorted}
              </button>
            </p>
          )}
          {offerTeam && (
            <button type="button" className={QUIET_LINK} onClick={() => run({ action: 'team', team: filter })}>
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
        eventPlace={openEventPlace}
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
        entries={entries}
        planOf={planOf}
        admin={admin}
        archive={archive}
        run={run}
        onPast={loadArchive}
        onCreated={created}
        onUseEntry={(entry) => {
          const project = planOf(entry)
          if (project) open(project.id)
          else startPlanning(entry)
        }}
      />
      <EventDialog entry={shownEvent} copy={copy} locale={locale} membersById={membersById} onStart={startPlanning} onClose={() => setShownEvent(null)} />
      <CompleteDialog project={completing} copy={copy} run={run} onClose={() => setCompleting(null)} />
      <PrivateTaskDialog
        task={privateTasks.find((task) => task.id === openPrivateId) ?? null}
        copy={copy}
        run={run}
        onClose={() => setOpenPrivateId(null)}
      />
      <TaskContextMenu
        menu={taskMenu}
        copy={copy}
        onClose={() => setTaskMenu(null)}
        onOpen={openTask}
        onPatch={patchTask}
        onRemove={removeTask}
      />

      {toastHost ? createPortal(toastElement, toastHost) : toastElement}
    </div>
  )
}
