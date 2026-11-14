/**
 * The tasks module of the members area (React island). It opens on an overview of the member's own tasks, the next 14
 * days and their projects; tabs lead to all tasks (a board, or the same tasks as a list, remembered in this browser),
 * the projects and the events, and teamleads reach the Team-Check of their team from the overview. All tasks always
 * start on the member's own and their filter leads on to their team, every team, the tasks nobody has taken, the tasks
 * of no team and every other team; projects start on all teams, events show everything. Every field that adds a task
 * reads the same short form (TaskCapture). Members without a team choose it here; admins can set it on the member
 * management page.
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
 * the digest mail, the start page and the search turns into that hash on load (LINKED_VIEWS); a bare hash with the id of
 * a private task opens that task.
 * Props: copy (memberArea.tasks.workspace plus teams, team id → name, and problems of the quick add), initialState
 * ({ revision, projects, templates, members, privateTasks }), events (public events with `day`, `endDay`, `time`),
 * eventsComplete, me (member id), named (has entered a name), admin, board (the board works across teams, so it is not
 * asked for one), teamlead (sees the Team-Check), locale, today (YYYY-MM-DD, Berlin).
 * Styles: ./forms.css plus Tailwind utilities.
 */
import React, { lazy, Suspense, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Plus } from 'lucide-react'
import {
  ALL_TEAMS,
  applyChanges,
  calendarEntries,
  filterProjects,
  filterScope,
  isSingleTask,
  projectDeadlines,
  MINE,
  myProjects,
  NAME_MAX,
  NO_TEAM,
  patchedProject,
  nextTurn,
  patchedTask,
  scopedPrivateTasks,
  scopedTasks,
  taskHash,
  taskRoute,
  teamCheck,
  TEAM_IDS,
  UNASSIGNED,
  unassignedTasks,
  withArchive,
} from '../../lib/tasks'
import { Chip, fill, Menu, MENU_ITEM, PRIMARY_BUTTON, SearchField, TOOL_BUTTON } from './memberUi'
import { fetchNews, useLiveRefresh } from './useLiveRefresh'
import EventCalendar from './tasks/EventCalendar'
import EventCards from './tasks/EventCards'
import ProjectBoard from './tasks/ProjectBoard'
import TaskBoard from './tasks/TaskBoard'
import TaskList from './tasks/TaskList'
import TaskOverview from './tasks/TaskOverview'
import TasksTour from './tasks/TasksTour'
import TeamCheck from './tasks/TeamCheck'
import { dayPart, FilterMenu, focusTask, INPUT, LABEL, SELECT, Segmented, shortDay, SURFACE, TaskContextMenu } from './tasks/taskUi'
import './forms.css'

// The dialogs, the project panel above all, were about a third of this island's code but show only after a click or a
// deep link. They load in chunks of their own, so the page hydrates without them, and are fetched once the page is idle
// (loadDialogs), so opening one does not wait for the network.
const DIALOG_CHUNKS = {
  ProjectPanel: () => import('./tasks/ProjectPanel'),
  CreateDialog: () => import('./tasks/CreateDialog'),
  CompleteDialog: () => import('./tasks/CompleteDialog'),
  DayTaskDialog: () => import('./tasks/DayTaskDialog'),
  EventDialog: () => import('./tasks/EventDialog'),
  PrivateTaskDialog: () => import('./tasks/PrivateTaskDialog'),
  TaskDialog: () => import('./tasks/TaskDialog'),
}
const ProjectPanel = lazy(DIALOG_CHUNKS.ProjectPanel)
const CreateDialog = lazy(DIALOG_CHUNKS.CreateDialog)
const CompleteDialog = lazy(DIALOG_CHUNKS.CompleteDialog)
const DayTaskDialog = lazy(DIALOG_CHUNKS.DayTaskDialog)
const EventDialog = lazy(DIALOG_CHUNKS.EventDialog)
const PrivateTaskDialog = lazy(DIALOG_CHUNKS.PrivateTaskDialog)
const TaskDialog = lazy(DIALOG_CHUNKS.TaskDialog)

function loadDialogs() {
  for (const load of Object.values(DIALOG_CHUNKS)) {
    // Safe to ignore: this only warms the cache. If the chunk fails here, React.lazy loads it again when the dialog
    // is opened and reports a failure there.
    load().catch(() => {})
  }
}

/**
 * Mounts a dialog the first time `open` is set and keeps it mounted afterwards, like before the split: the dialogs open
 * and close their <dialog> themselves in an effect on their prop, which also runs on the first mount. Nothing renders
 * on the server, because every dialog starts closed.
 */
function Deferred({ open, children }) {
  const [used, setUsed] = useState(false)
  if (open && !used) setUsed(true)
  return open || used ? <Suspense fallback={null}>{children}</Suspense> : null
}

const LAYOUT_KEY = 'ignite-tasks-layout'
const TEAM_LATER_KEY = 'ignite-team-later'
// ?ansicht=… of links from elsewhere: the page, and where on it to land. `scroll` names the element to bring into view.
const LINKED_VIEWS = {
  aufgaben: { view: 'tasks' },
  meine: { view: 'tasks', filter: MINE },
  projekte: { view: 'projects' },
  events: { view: 'events' },
  kalender: { view: 'events', eventLayout: 'calendar' },
  ueberfaellig: { view: 'tasks', filter: MINE, layout: 'list', scroll: 'tasks-overdue' },
  woche: { view: 'tasks', filter: MINE, layout: 'list', scroll: 'tasks-week' },
  verteilen: { view: 'overview', scroll: 'my-unassigned' },
}
const TABS = ['overview', 'tasks', 'projects', 'events']
const CAPTURE_ID = 'task-capture'
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

function PageHead({ title, subtitle, back, onBack, children }) {
  return (
    <header className="flex flex-col gap-1.5">
      {back && (
        <button type="button" className="w-fit border-0 bg-transparent p-0 text-sm text-fg-muted hover:text-fg" onClick={onBack}>
          <span aria-hidden="true">← </span>
          {back}
        </button>
      )}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 id="page-title" className="text-display-sm hyphens-none">
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-sm text-fg-muted">{subtitle}</p>}
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2">{children}</div>
      </div>
    </header>
  )
}

/** The pages of the module as tabs; they replace the links back to the overview. */
function Tabs({ copy, view, onView }) {
  return (
    <nav data-tour="tabs" aria-label={copy.views.label} className="-mt-2 overflow-x-auto border-0 border-b border-solid border-border">
      <ul role="list" className="flex w-fit gap-1">
        {TABS.map((tab) => (
          <li key={tab}>
            <button
              type="button"
              aria-current={view === tab ? 'page' : undefined}
              className={`-mb-px whitespace-nowrap rounded-none border-0 border-b-2 border-solid bg-transparent px-3 py-2.5 text-sm font-medium ${
                view === tab ? 'border-fg text-fg' : 'border-transparent text-fg-muted hover:text-fg'
              }`}
              onClick={() => onView(tab)}
            >
              {tab === 'tasks' ? (
                <>
                  <span className="sm:hidden">{copy.tabs.tasksShort}</span>
                  <span className="hidden sm:inline">{copy.tabs.tasks}</span>
                </>
              ) : (
                copy.tabs[tab]
              )}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default function TaskWorkspace({ copy, initialState, events, eventsComplete, me, named, admin, board, teamlead, locale, today, tour }) {
  const [state, setState] = useState(initialState)
  const [touring, setTouring] = useState(tour)
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
  const [dayTask, setDayTask] = useState(null)
  const [shownEvent, setShownEvent] = useState(null)
  const [completing, setCompleting] = useState(null)
  const [taskMenu, setTaskMenu] = useState(null)
  const [notice, setNotice] = useState(null)
  const [toastHost, setToastHost] = useState(null)
  const [hasName, setHasName] = useState(named)
  const [teamLater, setTeamLater] = useState(false)
  const [checkTeam, setCheckTeam] = useState(myTeam)
  // Counts up when "Aufgabe" is pressed on the page of all tasks, which opens the field of the first column or the list.
  const [addSignal, setAddSignal] = useState(0)
  const toast = useRef(null)
  const { projectId } = route
  // The Team-Check is the teamleads' page; a link to it opens the overview for everybody else.
  const view = route.view === 'teamcheck' && !teamlead ? 'overview' : route.view
  // Leaving the overview ends the tour, so it never starts over on the way back.
  useEffect(() => {
    if (view !== 'overview') setTouring(false)
  }, [view])

  useEffect(() => {
    try {
      if (localStorage.getItem(LAYOUT_KEY) === 'list') setLayout('list')
      if (localStorage.getItem(TEAM_LATER_KEY)) setTeamLater(true)
    } catch {
      // Without storage the page shows the board and asks for the team, which are the defaults anyway.
    }
    const url = new URL(window.location.href)
    const linked = LINKED_VIEWS[url.searchParams.get('ansicht')]
    if (linked) {
      url.searchParams.delete('ansicht')
      url.hash = taskHash(linked.view, null)
      window.history.replaceState(window.history.state, '', url)
      if (linked.filter) setTaskFilter(linked.filter)
      if (linked.layout) setLayout(linked.layout)
      if (linked.eventLayout) setEventLayout(linked.eventLayout)
      // Once the page is drawn; the island renders the overview first and the view after this effect.
      if (linked.scroll) setTimeout(() => document.getElementById(linked.scroll)?.scrollIntoView({ block: 'start' }), 100)
    }
    // A bare hash with the id of a private task (links of the start page) opens that task on the overview.
    const privateId = taskRoute(window.location.hash).projectId
    if (privateId && initialState.privateTasks.some((task) => task.id === privateId)) {
      setOpenPrivateId(privateId)
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`)
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

  useEffect(() => {
    // Safari has no requestIdleCallback.
    if (!('requestIdleCallback' in window)) {
      const timer = setTimeout(loadDialogs, 1000)
      return () => clearTimeout(timer)
    }
    const handle = window.requestIdleCallback(loadDialogs, { timeout: 3000 })
    return () => window.cancelIdleCallback(handle)
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
  // A card made a project closes the task dialog and stays open, now in the panel.
  const closeTaskDialog = () => {
    const card = projects.find((project) => project.id === projectId)
    if (!card || isSingleTask(card)) closePanel()
  }
  // Every page starts at its top, also when the tab bar or a link sits further down on a phone.
  const goTo = (next) => {
    go(next, null)
    window.scrollTo({ top: 0 })
  }
  const showMine = () => {
    setTaskFilter(MINE)
    goTo('tasks')
  }
  const focusCapture = () => {
    const field = document.getElementById(CAPTURE_ID)
    field?.focus({ preventScroll: true })
    field?.scrollIntoView({ block: 'center', behavior: 'smooth' })
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

  // A repeating task that gets done jumps back to the backlog; the toast says so and names its next deadline.
  const repeatNotice = (body) => {
    if (body.action !== 'updateTask' && body.action !== 'updatePrivate') return null
    const task =
      body.action === 'updatePrivate'
        ? state.privateTasks.find((item) => item.id === body.taskId)
        : state.projects.find((project) => project.id === body.id)?.tasks.find((item) => item.id === body.taskId)
    const turn = task && nextTurn(task, body.patch, today)
    return turn?.repeated ? { code: 'repeated', values: { date: shortDay(turn.due, locale) } } : null
  }

  const run = async (body, optimistic, key = 'projects') => {
    const repeated = repeatNotice(body)
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
        if (repeated) setNotice({ ...repeated, at: Date.now() })
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
  // A single task opens in its own dialog, everything else in the panel.
  const openSingle = openProject && isSingleTask(openProject) ? openProject : null
  const openPanel = openProject && !openSingle ? openProject : null
  const openEventPlace = openProject?.event ? events.find((event) => event.id === openProject.event.id)?.location : undefined
  const openPrivateTask = privateTasks.find((task) => task.id === openPrivateId) ?? null
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
  // An entry added from a day of a calendar stays in the calendar, where it now shows.
  const created = (id, stay) => {
    setNotice({ code: 'created', at: Date.now() })
    if (!stay) open(id)
  }
  const merge = async (project, event) => {
    if (await run({ action: 'linkEvent', id: project.id, eventId: event.id })) setNotice({ code: 'merged', at: Date.now() })
  }
  const keepApart = (project, event) =>
    run({ action: 'keepEventApart', id: project.id, eventId: event.id }, (list) =>
      list.map((item) => (item.id === project.id ? { ...item, distinctFrom: [...item.distinctFrom, event.id] } : item)),
    )
  // "Später" holds in this browser, so the question does not come back with every visit.
  const later = () => {
    setTeamLater(true)
    try {
      localStorage.setItem(TEAM_LATER_KEY, '1')
    } catch {
      // Without storage the question comes back next time, which is harmless.
    }
  }
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
  const unassigned = useMemo(() => (view === 'overview' ? unassignedTasks(projects, me, today) : []), [view, projects, me, today])
  // Teamleads see their team's check on the overview and may look at any team's on its page.
  const shownCheckTeam = view === 'teamcheck' ? checkTeam || myTeam || TEAM_IDS[0] : myTeam
  const check = useMemo(
    () =>
      teamlead && (view === 'teamcheck' || (view === 'overview' && myTeam))
        ? { team: shownCheckTeam, ...teamCheck(projects, shownCheckTeam, me, today) }
        : null,
    [teamlead, view, myTeam, shownCheckTeam, projects, me, today],
  )
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
  // New work lands in the team on screen, otherwise in the member's own team. The field for a task only names a team the
  // filter shows; without one a task joins the team of its first person.
  const newTeam = teamFiltered ? filter : myTeam
  const screenTeam = teamFiltered ? filter : ''
  const askTeam = hasName && !myTeam && !teamLater && !board
  const offerTeam = filter !== myTeam && !board
  const ledOpen = myProjects(projects, me)
  const projectCount = projects.filter((project) => !project.archived && project.type !== 'task').length
  const deadlines = useMemo(() => projectDeadlines(projects), [projects])
  const calendarShown = view === 'events' && eventLayout === 'calendar'
  const myDeadlines = useMemo(
    () => (calendarShown ? withPrivate(filterScope(MINE, myTeam, '')).filter((task) => task.due && !task.done) : []),
    [calendarShown, projects, privateTasks, myTeam, me, today],
  )

  const myTeamOption = myTeam ? [{ value: myTeam, label: fill(copy.filter.myTeam, { team: copy.teams[myTeam] }) }] : []
  const otherTeams = TEAM_IDS.filter((team) => team !== myTeam).map((team) => ({ value: team, label: copy.teams[team] }))
  const allTeams = { value: ALL_TEAMS, label: copy.teamTabs.all }
  const projectFilters = [allTeams, { value: MINE, label: copy.filter.myProjects }, ...myTeamOption, ...otherTeams]
  const filterName = (value) =>
    ({ [MINE]: copy.filter.mine, [ALL_TEAMS]: copy.teamTabs.all, [UNASSIGNED]: copy.filter.chips.unassigned, [NO_TEAM]: copy.teamTabs.none })[value] ??
    fill(copy.filter.teamNamed, { team: copy.teams[value] })

  // Every field that adds a task ends here (TaskCapture): the creator leads the new task, so they may delete it.
  const addCaptured = async ({ title, due, assignees, team }, isPrivate, status = 'backlog') => {
    const data = await run(
      isPrivate
        ? { action: 'addPrivate', task: { title, due, team, status } }
        : {
            action: 'create',
            project: { title, description: '', type: 'task', due, leads: [me], team },
            task: { description: '', due, priority: 'normal', required: false, assignees: assignees.map(({ id }) => id), status },
          },
    )
    if (data) setNotice({ code: 'created', at: Date.now() })
    return data
  }
  const patched = (list, task, fields) => list.map((item) => (item.id === task.id ? patchedTask(item, fields, today) : item))
  const patchTask = (task, fields) =>
    task.private
      ? run({ action: 'updatePrivate', taskId: task.id, patch: fields }, (list) => patched(list, task, fields), 'privateTasks')
      : run({ action: 'updateTask', id: task.projectId, taskId: task.id, patch: fields }, (list) =>
          list.map((project) => (project.id === task.projectId ? patchedProject(project, task.id, fields, today) : project)),
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
  // A project gets the day as its deadline; an event brings its day from Luma. Both stay in the calendar afterwards.
  const addOnDay = (kind, day) =>
    kind === 'task' ? setDayTask({ day }) : setCreateRequest({ kind, team: newTeam, due: kind === 'internal' ? day : '', stay: true })
  const addDayTask = ({ title, due }, isPrivate) => addCaptured({ title, due, assignees: [{ id: me }], team: newTeam }, isPrivate)
  const taskProps = {
    tasks,
    filter: taskFilter,
    searching: !!searchQuery.trim(),
    copy,
    locale,
    today,
    me,
    members,
    membersById,
    team: screenTeam,
    // Cards name a task's team only when it is not the one the member looks at anyway.
    knownTeam: teamFiltered ? filter : myTeam,
    addSignal,
    captureId: CAPTURE_ID,
    onAdd: addCaptured,
    onPatch: patchTask,
    onOpen: openTask,
    onMenu: (task, x, y) => setTaskMenu({ task, x, y }),
  }

  const createMenu = (
    <Menu label={copy.create} className={`${TOOL_BUTTON} shrink-0`}>
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
  // On the overview the field of "Meine Aufgaben" adds the task, on the page of all tasks the field of the first column
  // or the list. Phones have the overview's fixed button at the bottom instead.
  const taskButton = (
    <button
      type="button"
      className={`${PRIMARY_BUTTON} shrink-0 ${view === 'overview' ? 'max-sm:hidden' : ''}`}
      onClick={view === 'overview' ? focusCapture : () => setAddSignal((count) => count + 1)}
    >
      <Plus aria-hidden="true" className="h-4 w-4" />
      {copy.addTask}
    </button>
  )
  // The projects page only adds projects and the events page only events, so neither needs the menu.
  const createButton = (kind, label) => (
    <button type="button" className={`${PRIMARY_BUTTON} shrink-0`} onClick={() => setCreateRequest({ kind, team: newTeam })}>
      <Plus aria-hidden="true" className="h-4 w-4" />
      {label}
    </button>
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
          {fill(copy.results[notice.code], { count: notice.count, ...notice.values })}
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
      <PageHead
        title={view === 'teamcheck' ? fill(copy.teamCheck.heading, { team: copy.teams[shownCheckTeam] }) : copy.views[view]}
        subtitle={
          view === 'overview'
            ? dayPart(today, locale, { weekday: 'long', day: 'numeric', month: 'long' })
            : view === 'tasks'
              ? `${filterName(taskFilter)} · ${fill(copy.overview.openCount, { count: tasks.filter((task) => !task.done).length })}`
              : null
        }
        back={view === 'teamcheck' ? copy.tabs.overview : null}
        onBack={() => goTo('overview')}
      >
        {view === 'overview' && (
          <>
            {createMenu}
            {taskButton}
          </>
        )}
        {view === 'tasks' && (
          <>
            {search}
            <Segmented label={copy.layouts.label} options={{ board: copy.layouts.board, list: copy.layouts.list }} value={layout} onChange={chooseLayout} />
            {taskButton}
          </>
        )}
        {view === 'teamcheck' && (
          <label className="flex items-center gap-2 text-sm text-fg-muted">
            {copy.teamCheck.team}
            <select className={SELECT} value={shownCheckTeam} onChange={(e) => setCheckTeam(e.target.value)}>
              {TEAM_IDS.map((team) => (
                <option key={team} value={team}>
                  {copy.teams[team]}
                </option>
              ))}
            </select>
          </label>
        )}
        {view === 'projects' && (
          <>
            {search}
            <FilterMenu label={copy.filter.label} value={projectFilter} options={projectFilters} onChange={setProjectFilter} />
            <Chip pressed={archived} onClick={() => setArchived(!archived)}>
              {copy.archive}
            </Chip>
            {createButton('internal', copy.createKinds.internal.label)}
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
            {createButton('event', copy.createDialog.headings.event)}
          </>
        )}
      </PageHead>

      {view !== 'teamcheck' && <Tabs copy={copy} view={view} onView={goTo} />}

      {!hasName && <NamePrompt copy={copy.name} current={membersById.get(me)?.name ?? ''} run={run} onSaved={() => setHasName(true)} />}
      {askTeam && <TeamPrompt copy={copy.teamPrompt} teams={copy.teams} onChoose={(team) => run({ action: 'team', team })} onLater={later} />}

      {view === 'overview' && (
        <TaskOverview
          entries={entries}
          complete={eventsComplete}
          planOf={planOf}
          projects={ledOpen}
          projectCount={projectCount}
          mine={mine}
          unassigned={unassigned}
          check={check}
          today={today}
          copy={copy}
          locale={locale}
          me={me}
          members={members}
          membersById={membersById}
          captureId={CAPTURE_ID}
          onView={goTo}
          onMine={showMine}
          onTeamCheck={() => goTo('teamcheck')}
          onStart={startPlanning}
          onOpen={open}
          onOpenEvent={openEvent}
          onOpenTask={openTask}
          onPatch={patchTask}
          onAdd={addCaptured}
          deadlines={deadlines}
          onAddOnDay={addOnDay}
        />
      )}

      {touring && view === 'overview' && !projectId && (
        <TasksTour copy={copy.tour} captureId={CAPTURE_ID} onDone={() => setTouring(false)} />
      )}

      {view === 'tasks' && (
        <div className="-mt-2 flex flex-wrap items-center gap-2" role="group" aria-label={copy.filter.label}>
          <span className="text-sm text-fg-muted">{copy.filter.show}</span>
          {[
            { value: MINE, label: copy.filter.chips.mine },
            ...(myTeam ? [{ value: myTeam, label: copy.filter.chips.myTeam }] : []),
            { value: ALL_TEAMS, label: copy.filter.chips.all },
            { value: UNASSIGNED, label: copy.filter.chips.unassigned },
            { value: NO_TEAM, label: copy.filter.chips.noTeam },
          ].map((option) => (
            <Chip key={option.value} pressed={taskFilter === option.value} onClick={() => setTaskFilter(option.value)}>
              {option.label}
            </Chip>
          ))}
          <select
            aria-label={copy.filter.otherTeam}
            className={`${SELECT} ${otherTeams.some((team) => team.value === taskFilter) ? 'border-fg' : ''}`}
            value={otherTeams.some((team) => team.value === taskFilter) ? taskFilter : ''}
            onChange={(e) => e.target.value && setTaskFilter(e.target.value)}
          >
            <option value="">{copy.filter.otherTeam}</option>
            {otherTeams.map((team) => (
              <option key={team.value} value={team.value}>
                {team.label}
              </option>
            ))}
          </select>
        </div>
      )}
      {view === 'tasks' && layout === 'board' && <TaskBoard {...taskProps} />}
      {view === 'tasks' && layout === 'list' && <TaskList {...taskProps} />}

      {view === 'teamcheck' && check && (
        <TeamCheck
          check={check}
          team={shownCheckTeam}
          today={today}
          copy={copy}
          locale={locale}
          me={me}
          members={members}
          membersById={membersById}
          onPatch={patchTask}
          onOpenTask={openTask}
        />
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
          onOpenTask={openTask}
          deadlines={deadlines}
          tasks={myDeadlines}
          onAddOnDay={addOnDay}
        />
      )}

      {teamFiltered && (unsorted > 0 || offerTeam) && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-fg-muted">
          {unsorted > 0 && (
            <p>
              {fill(copy.list.unsorted, { count: unsorted })}{' '}
              <button type="button" className={QUIET_LINK} onClick={() => (view === 'tasks' ? setTaskFilter(NO_TEAM) : setProjectFilter(ALL_TEAMS))}>
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

      <Deferred open={openPanel}>
        <ProjectPanel
          project={openPanel}
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
      </Deferred>
      <Deferred open={openSingle}>
        <TaskDialog
          project={openSingle}
          copy={copy}
          locale={locale}
          me={me}
          members={members}
          membersById={membersById}
          run={run}
          onClose={closeTaskDialog}
        />
      </Deferred>
      <Deferred open={createRequest}>
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
          onOpen={open}
          onUseEntry={(entry) => {
            const project = planOf(entry)
            if (project) open(project.id)
            else startPlanning(entry)
          }}
        />
      </Deferred>
      <Deferred open={dayTask}>
        <DayTaskDialog request={dayTask} copy={copy} onAdd={addDayTask} onClose={() => setDayTask(null)} />
      </Deferred>
      <Deferred open={shownEvent}>
        <EventDialog entry={shownEvent} copy={copy} locale={locale} membersById={membersById} onStart={startPlanning} onClose={() => setShownEvent(null)} />
      </Deferred>
      <Deferred open={completing}>
        <CompleteDialog project={completing} copy={copy} membersById={membersById} run={run} onClose={() => setCompleting(null)} />
      </Deferred>
      <Deferred open={openPrivateTask}>
        <PrivateTaskDialog
          task={openPrivateTask}
          copy={copy}
          run={run}
          onClose={() => setOpenPrivateId(null)}
          onShared={(id) => {
            setNotice({ code: 'shared', at: Date.now() })
            open(id)
          }}
        />
      </Deferred>
      <TaskContextMenu
        menu={taskMenu}
        copy={copy}
        me={me}
        onClose={() => setTaskMenu(null)}
        onOpen={openTask}
        onPatch={patchTask}
        onRemove={removeTask}
      />

      {toastHost ? createPortal(toastElement, toastHost) : toastElement}
    </div>
  )
}
