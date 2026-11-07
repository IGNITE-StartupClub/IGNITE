/**
 * Rules of the tasks module ("Aufgaben" in the members area), shared by the API, the store, the daily digest and the
 * TaskWorkspace island: allowed values, input parsing, teams, progress, the deadline groups of the task list, filters
 * and copying a task list from a template or an earlier project. Free of local imports, so node --test runs it.
 * Days are YYYY-MM-DD in Europe/Berlin throughout, like the CRM; members are referenced by the hex id of their
 * `members` document, never by email, so no address reaches the browser.
 */

export const PROJECT_TYPES = ['event', 'internal', 'task'] as const
export type ProjectType = (typeof PROJECT_TYPES)[number]

/** The board columns, in order. The status is set by hand and never follows the progress. */
export const PROJECT_STATUSES = ['planned', 'active', 'done'] as const
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

/** The columns of the task board, in order. */
export const TASK_STATUSES = ['backlog', 'doing', 'done'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

/** A fourth column of both boards until 2026-11. Records may still hold it; taskStatus and projectStatus read it as "doing". */
export type StoredStatus<T> = T | 'review'

export const PRIORITIES = ['low', 'normal', 'high'] as const
export type Priority = (typeof PRIORITIES)[number]

/** The ids of data/openTeams.ts, which also holds the names; tasks.test.ts keeps the two in step. */
export const TEAM_IDS = ['ignite-relations', 'ignite-marketing', 'ignite-hr', 'ignite-finance-legal', 'ignite-infrastructure'] as const
export type TeamId = (typeof TEAM_IDS)[number]
/** '' is no team: a member who has not chosen one, a project nobody sorted in, a task that follows its project. */
export type TeamChoice = TeamId | ''
/** The tab that shows every team. */
export const ALL_TEAMS = 'all'

export const TITLE_MAX = 200
export const TEXT_MAX = 4000
export const NAME_MAX = 60
export const MAX_ASSIGNEES = 30
export const MAX_TASKS = 300
/** Relative deadlines reach at most a year before or after the event. */
export const OFFSET_MAX = 366

export interface ProjectFields {
  title: string
  description: string
  type: ProjectType
  /** Deadline of an internal project or a single task, the date of an own event (an event project without a public event). */
  due: string
  /** Start of an own event as "18:30", '' when open. */
  time: string
  /** Place of an own event. */
  place: string
  leads: string[]
  team: TeamChoice
}

export interface TaskFields {
  title: string
  description: string
  due: string
  priority: Priority
  /** A required task left open makes the board ask before the project moves to "done". */
  required: boolean
  assignees: string[]
  /** Only when the task belongs to another team than its project; see taskTeam. */
  team: TeamChoice
  status: TaskStatus
}

/** What a template or an earlier project hands to a new project: no status, people or absolute dates. */
export interface TemplateTask {
  title: string
  description: string
  priority: Priority
  required: boolean
  /** Days relative to the event (negative = before), or null for no deadline. */
  offsetDays: number | null
}

/** The parts of a task the rules below read. */
export interface TaskState {
  id: string
  title: string
  done: boolean
  status: TaskStatus
  due: string
  priority: Priority
  required: boolean
  assignees: string[]
  team: TeamChoice
  /** Set by the server: whether this member may delete the task (mayRemoveTask). */
  mayRemove?: boolean
}

/** A task only its member sees (privateTasksStore.ts): no project, no other people, no subtasks. */
export interface PrivateTaskState {
  id: string
  title: string
  description: string
  done: boolean
  status: TaskStatus
  doneAt: string
  due: string
  priority: Priority
  team: TeamChoice
}

export interface ProjectState {
  id: string
  title: string
  type: ProjectType
  status: ProjectStatus
  due: string
  leads: string[]
  team: TeamChoice
  archived: boolean
  /** Start day of the linked public event, '' without one. */
  eventDay: string
  /** The public event a planning project belongs to; `missing` once it left the calendar. */
  event?: { id: string; missing: boolean; location: string | null } | null
  time?: string
  place?: string
  /** Public events members declared to be another event than this own one. */
  distinctFrom?: string[]
  tasks: TaskState[]
}

// Marks an invalid field inside the parsers; never leaves this module.
const INVALID = Symbol('invalid')
type Parsed<T> = T | typeof INVALID

function text(value: unknown, max: number, required = false): Parsed<string> {
  if (value === undefined || value === null) return required ? INVALID : ''
  if (typeof value !== 'string') return INVALID
  const trimmed = value.trim()
  return trimmed.length > max || (required && !trimmed) ? INVALID : trimmed
}

export const isDay = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !isNaN(date.getTime()) && date.toISOString().startsWith(value)
}

function day(value: unknown): Parsed<string> {
  if (value === undefined || value === null || value === '') return ''
  return isDay(value) ? value : INVALID
}

function clock(value: unknown): Parsed<string> {
  if (value === undefined || value === null || value === '') return ''
  return typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : INVALID
}

function choice<T extends string>(value: unknown, allowed: readonly T[], fallback: T): Parsed<T> {
  if (value === undefined) return fallback
  return allowed.includes(value as T) ? (value as T) : INVALID
}

function flag(value: unknown): Parsed<boolean> {
  if (value === undefined) return false
  return typeof value === 'boolean' ? value : INVALID
}

/** Hex id of a `members` document (Mongo ObjectId). */
export const isMemberId = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{24}$/.test(value)

/** Ids of a record of this module (randomUUID) or of a built-in template ("std-…"). */
export const isRecordId = (value: unknown): value is string =>
  typeof value === 'string' && /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|std-[a-z-]{1,40})$/.test(value)

function members(value: unknown): Parsed<string[]> {
  if (value === undefined) return []
  if (!Array.isArray(value) || value.length > MAX_ASSIGNEES || !value.every(isMemberId)) return INVALID
  return [...new Set(value)]
}

function team(value: unknown): Parsed<TeamChoice> {
  if (value === undefined || value === null || value === '') return ''
  return TEAM_IDS.includes(value as TeamId) ? (value as TeamId) : INVALID
}

/** A team id or '' for no team; null when it is neither. */
export function parseTeam(value: unknown): TeamChoice | null {
  const parsed = team(value)
  return parsed === INVALID ? null : parsed
}

function offset(value: unknown): Parsed<number | null> {
  if (value === undefined || value === null || value === '') return null
  return Number.isInteger(value) && Math.abs(value as number) <= OFFSET_MAX ? (value as number) : INVALID
}

const fieldsOf = (input: unknown): Record<string, unknown> | null =>
  typeof input === 'object' && input !== null && !Array.isArray(input) ? (input as Record<string, unknown>) : null

/** Returns the parsed object, or null when any field is missing, too long or not allowed. */
function parse<T>(values: { [K in keyof T]: Parsed<T[K]> }): T | null {
  return Object.values(values).includes(INVALID) ? null : (values as T)
}

export function parseProject(input: unknown): ProjectFields | null {
  const fields = fieldsOf(input)
  if (!fields) return null
  return parse<ProjectFields>({
    title: text(fields.title, TITLE_MAX, true),
    description: text(fields.description, TEXT_MAX),
    type: choice(fields.type, PROJECT_TYPES, 'internal'),
    due: day(fields.due),
    time: clock(fields.time),
    place: text(fields.place, TITLE_MAX),
    leads: members(fields.leads),
    team: team(fields.team),
  })
}

export function parseTask(input: unknown): TaskFields | null {
  const fields = fieldsOf(input)
  if (!fields) return null
  return parse<TaskFields>({
    title: text(fields.title, TITLE_MAX, true),
    description: text(fields.description, TEXT_MAX),
    due: day(fields.due),
    priority: choice(fields.priority, PRIORITIES, 'normal'),
    required: flag(fields.required),
    assignees: members(fields.assignees),
    team: team(fields.team),
    status: choice(fields.status, TASK_STATUSES, 'backlog'),
  })
}

/** People joining or leaving a list. Two members changing the list at once then both keep their change. */
export interface MemberChange {
  add: string[]
  remove: string[]
}

export type TaskPatch = Partial<Omit<TaskFields, 'assignees'>> & { done?: boolean; assignees?: MemberChange }
export type ProjectPatch = Partial<Pick<ProjectFields, 'title' | 'description' | 'due' | 'time' | 'place' | 'team'>> & { leads?: MemberChange }

// One direction only: MongoDB cannot add to and pull from an array in one update, and a picker click changes one person.
function memberChangeOf(value: unknown): Parsed<MemberChange> {
  const fields = fieldsOf(value)
  if (!fields) return INVALID
  const add = members(fields.add)
  const remove = members(fields.remove)
  if (add === INVALID || remove === INVALID) return INVALID
  return !add.length === !remove.length ? INVALID : { add, remove }
}

/** A change to some fields; null when it changes nothing or any given field is unknown or invalid. */
function parsePatch<T>(input: unknown, parsers: Record<string, (value: unknown) => Parsed<unknown>>): T | null {
  const fields = fieldsOf(input)
  if (!fields) return null
  const patch: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(fields)) {
    if (!Object.hasOwn(parsers, key) || value === undefined) return null
    const parsed = parsers[key](value)
    if (parsed === INVALID) return null
    patch[key] = parsed
  }
  return Object.keys(patch).length ? (patch as T) : null
}

export const parseTaskPatch = (input: unknown): TaskPatch | null =>
  parsePatch<TaskPatch>(input, {
    title: (value) => text(value, TITLE_MAX, true),
    description: (value) => text(value, TEXT_MAX),
    due: day,
    priority: (value) => choice(value, PRIORITIES, 'normal'),
    required: flag,
    assignees: memberChangeOf,
    team,
    status: (value) => choice(value, TASK_STATUSES, 'backlog'),
    done: flag,
  })

export const parseProjectPatch = (input: unknown): ProjectPatch | null =>
  parsePatch<ProjectPatch>(input, {
    title: (value) => text(value, TITLE_MAX, true),
    description: (value) => text(value, TEXT_MAX),
    due: day,
    time: clock,
    place: (value) => text(value, TITLE_MAX),
    team,
    leads: memberChangeOf,
  })

export function parseTemplateTasks(input: unknown): TemplateTask[] | null {
  if (!Array.isArray(input) || !input.length || input.length > MAX_TASKS) return null
  const tasks = input.map((item) => {
    const fields = fieldsOf(item)
    if (!fields) return null
    return parse<TemplateTask>({
      title: text(fields.title, TITLE_MAX, true),
      description: text(fields.description, TEXT_MAX),
      priority: choice(fields.priority, PRIORITIES, 'normal'),
      required: flag(fields.required),
      offsetDays: offset(fields.offsetDays),
    })
  })
  return tasks.every(Boolean) ? (tasks as TemplateTask[]) : null
}

/** First and last name a member enters for themselves; both required. */
export function parseName(input: unknown): { firstName: string; lastName: string } | null {
  const fields = fieldsOf(input)
  if (!fields) return null
  return parse({ firstName: text(fields.firstName, NAME_MAX, true), lastName: text(fields.lastName, NAME_MAX, true) })
}

/** "Max Muster" from "max.muster@leuphana.de", for members who have not entered a name yet. */
export function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? ''
  const words = local
    .split(/[._-]+/)
    .filter((word) => word && !/^\d+$/.test(word))
    .map((word) => word[0].toUpperCase() + word.slice(1))
  return words.join(' ') || local
}

/** Today in Berlin as YYYY-MM-DD. */
export const berlinDay = (now: number): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date(now))

/** The hour (0–23) in Berlin, summer time included. */
export const berlinHour = (now: number): number =>
  Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour: '2-digit', hourCycle: 'h23' }).format(new Date(now)))

/** The time of day in Berlin as "18:30". */
export const berlinClock = (now: number): string =>
  new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(now))

export function addDays(dayValue: string, days: number): string {
  const date = new Date(`${dayValue}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export const daysBetween = (from: string, to: string): number =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000)

/** Sunday of the week (Monday to Sunday) that contains `today`. */
export function weekEnd(today: string): string {
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay() // 0 = Sunday
  return addDays(today, weekday === 0 ? 0 : 7 - weekday)
}

/** Done tasks against all tasks; `percent` is null without tasks, so an empty project shows no made-up value. */
export function progress(tasks: Pick<TaskState, 'done'>[]): { done: number; total: number; percent: number | null } {
  const done = tasks.filter((task) => task.done).length
  return { done, total: tasks.length, percent: tasks.length ? Math.round((done / tasks.length) * 100) : null }
}

/** The people on a project's tasks without its leads, who are named on a line of their own. */
export const projectAssignees = (project: { leads: string[]; tasks: Pick<TaskState, 'assignees'>[] }): string[] =>
  [...new Set(project.tasks.flatMap((task) => task.assignees))].filter((id) => !project.leads.includes(id))

export const isOverdue = (task: Pick<TaskState, 'done' | 'due'>, today: string): boolean =>
  !task.done && !!task.due && task.due < today

/** Open required tasks, the reason to confirm before a project moves to "done". */
export const openRequired = (tasks: Pick<TaskState, 'done' | 'required'>[]): number =>
  tasks.filter((task) => task.required && !task.done).length

/** Tasks stored before the board have no status; their done flag tells where they stand. */
export function taskStatus(task: { done: boolean; status?: StoredStatus<TaskStatus> }): TaskStatus {
  if (task.status === 'review') return 'doing'
  return task.status ?? (task.done ? 'done' : 'backlog')
}

export const projectStatus = (status: StoredStatus<ProjectStatus>): ProjectStatus => (status === 'review' ? 'active' : status)

/** Tasks are shared work, so only who created one or runs its project deletes it. Everybody else may still finish it. */
export const mayRemoveTask = (
  task: { createdBy: string },
  project: { createdBy: string; leads: string[] },
  actor: { id: string; role: string },
): boolean => actor.role === 'admin' || task.createdBy === actor.id || project.createdBy === actor.id || project.leads.includes(actor.id)

type Standing = Pick<TaskState, 'done' | 'status'>

/**
 * Where a task stands after a change. The board moves the status and checkboxes set done, so both always agree: the
 * last column is done, and a task checked open again returns to the backlog.
 */
export function nextStanding(task: Standing, patch: TaskPatch): Standing {
  if (patch.status) return { status: patch.status, done: patch.status === 'done' }
  if (patch.done === undefined || patch.done === task.done) return { status: task.status, done: task.done }
  return { status: patch.done ? 'done' : 'backlog', done: patch.done }
}

/** A task with a change applied, for updates the UI shows before the server answers. */
export const patchedTask = <T extends Standing & { assignees?: string[] }>(task: T, patch: TaskPatch): T => ({
  ...task,
  ...patch,
  ...nextStanding(task, patch),
  ...(patch.assignees && { assignees: applyMemberChange(task.assignees ?? [], patch.assignees) }),
})

export const TASK_GROUPS = ['overdue', 'week', 'later', 'none', 'done'] as const
export type TaskGroup = (typeof TASK_GROUPS)[number]

/** The one group of the task list a task belongs to. */
export function taskGroup(task: Pick<TaskState, 'done' | 'due'>, today: string): TaskGroup {
  if (task.done) return 'done'
  if (!task.due) return 'none'
  if (task.due < today) return 'overdue'
  return task.due <= weekEnd(today) ? 'week' : 'later'
}

/** What the workspace shows: the selected tab plus "Nur meine" and the search. */
export interface Scope {
  /** A team id or ALL_TEAMS. */
  team: string
  /** The member's own team, '' without one. Its tab also shows what they are assigned to in other teams. */
  myTeam: string
  onlyMine: boolean
  query: string
}

/** The team a task counts for: its own, else the one of its project. */
export const taskTeam = (task: Pick<TaskState, 'team'>, project: Pick<ProjectState, 'team'>): TeamChoice => task.team || project.team

export interface ListTask extends TaskState {
  projectId: string
  projectTitle: string
  projectType: ProjectType
  group: TaskGroup
  /** Only set on the member's private tasks; see scopedPrivateTasks. */
  private?: boolean
}

const contains = (text: string, query: string) => text.toLowerCase().includes(query)

/**
 * The tasks of the task list, each with the team it counts for and its group. Archived and finished projects are
 * over, so tasks left open in them no longer ask for attention.
 */
export function scopedTasks(projects: ProjectState[], scope: Scope, me: string, today: string): ListTask[] {
  const query = scope.query.trim().toLowerCase()
  return projects
    .filter((project) => !project.archived && project.status !== 'done')
    .flatMap((project) =>
      project.tasks
        .map((task) => ({
          ...task,
          team: taskTeam(task, project),
          projectId: project.id,
          projectTitle: project.title,
          projectType: project.type,
          group: taskGroup(task, today),
        }))
        .filter((task) => {
          const assigned = task.assignees.includes(me)
          const inTab = scope.team === ALL_TEAMS || task.team === scope.team || (scope.team === scope.myTeam && assigned)
          return inTab && (!scope.onlyMine || assigned) && (!query || contains(task.title, query) || contains(task.projectTitle, query))
        }),
    )
}

/**
 * The member's private tasks in the shape of the task list, so board and list show them between the others. They count
 * as assigned to the member, which puts them on the member's own tab and under "Nur meine".
 */
export function scopedPrivateTasks(tasks: PrivateTaskState[], scope: Scope, me: string, today: string): (ListTask & PrivateTaskState)[] {
  const query = scope.query.trim().toLowerCase()
  return tasks
    .filter((task) => {
      const inTab = scope.team === ALL_TEAMS || task.team === scope.team || scope.team === scope.myTeam
      return inTab && (!query || contains(task.title, query))
    })
    .map((task) => ({
      ...task,
      private: true,
      required: false,
      assignees: [me],
      projectId: '',
      projectTitle: '',
      projectType: 'task',
      group: taskGroup(task, today),
    }))
}

const PRIORITY_RANK: Record<Priority, number> = { high: 0, normal: 1, low: 2 }

/** Earliest deadline first, tasks without one last; on the same day the higher priority first. */
export const sortTasks = <T extends Pick<TaskState, 'due' | 'priority'>>(tasks: T[]): T[] =>
  [...tasks].sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999') || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])

/** The tasks of each board column: earliest deadline first, the done column with the last finished task on top. */
export function boardColumns<T extends TaskState & { doneAt: string }>(tasks: T[]): Record<TaskStatus, T[]> {
  const inColumn = (status: TaskStatus) => tasks.filter((task) => task.status === status)
  return {
    backlog: sortTasks(inColumn('backlog')),
    doing: sortTasks(inColumn('doing')),
    done: inColumn('done').sort((a, b) => b.doneAt.localeCompare(a.doneAt)),
  }
}

export const involves = (project: ProjectState, member: string): boolean =>
  project.leads.includes(member) || project.tasks.some((task) => task.assignees.includes(member))

/**
 * The cards of the board. A project shows for its own team and for every team with a task in it, and on the member's
 * own tab also when they are involved. Single tasks live in the task list; only the archive shows them as cards.
 */
export function filterProjects<T extends ProjectState>(projects: T[], filters: Scope & { archived: boolean }, me: string): T[] {
  const query = filters.query.trim().toLowerCase()
  const inTab = (project: T) =>
    filters.team === ALL_TEAMS ||
    project.team === filters.team ||
    project.tasks.some((task) => task.team === filters.team) ||
    (filters.team === filters.myTeam && involves(project, me))
  return projects.filter(
    (project) =>
      project.archived === filters.archived &&
      (filters.archived || project.type !== 'task') &&
      inTab(project) &&
      (!filters.onlyMine || involves(project, me)) &&
      (!query || contains(project.title, query) || project.tasks.some((task) => contains(task.title, query))),
  )
}

/** Day a project is about: the event start, else its own date. */
export const projectDay = (project: Pick<ProjectState, 'eventDay' | 'due'>): string => project.eventDay || project.due

/** One entry of the calendar: a public event (Luma, hand-listed) or an own event, which is a project without a public event. */
export interface CalendarEvent {
  /** The public event's id, or the project's for own events. */
  id: string
  title: string
  day: string
  endDay: string
  /** "18:30" in Berlin, '' when open. */
  time: string
  location: string | null
  url: string
  coverUrl: string | null
  source: 'luma' | 'external' | 'series' | 'own'
}

/** Lower case without accents or punctuation, so "Founder-Talk!" and "founder talk" compare equal. */
const comparable = (title: string): string =>
  title
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()

export const sameTitle = (a: string, b: string): boolean => comparable(a) === comparable(b)

const SHORTEST_PART = 4

/** The same words, or one title inside the other: "Founder Talk" and "Founder Talk mit Lena". */
export function similarTitles(a: string, b: string): boolean {
  if (sameTitle(a, b)) return true
  const [first, second] = [comparable(a), comparable(b)]
  const [short, long] = first.length < second.length ? [first, second] : [second, first]
  return short.length >= SHORTEST_PART && ` ${long} `.includes(` ${short} `)
}

// A weekly series repeats its title, so the same title a week apart is another event.
const TWIN_DAYS = 3

interface OwnEvent extends Pick<ProjectState, 'id' | 'title' | 'eventDay' | 'due'> {
  distinctFrom?: string[]
}

/**
 * The public event that may be this own event, which someone entered before it reached Luma. Same day with a similar
 * title is `sure`; the same day alone or a similar title close by is only worth asking about.
 */
export function eventTwin<E extends CalendarEvent>(project: OwnEvent, events: E[]): { event: E; sure: boolean } | null {
  const day = projectDay(project)
  const ranked = events
    .filter((event) => !project.distinctFrom?.includes(event.id))
    .map((event) => {
      const distance = Math.abs(daysBetween(day, event.day))
      const similar = similarTitles(project.title, event.title)
      return { event, distance, similar }
    })
    .filter(({ distance, similar }) => (similar ? distance <= TWIN_DAYS : distance === 0))
    .sort((a, b) => Number(b.similar) - Number(a.similar) || a.distance - b.distance)
  const best = ranked[0]
  return best ? { event: best.event, sure: best.similar && best.distance === 0 } : null
}

/**
 * Everything the calendar shows, soonest first, and for each own event the public event it may be (`twins`, by project
 * id). A `sure` twin stays out of the list until a member decides, so the event never shows twice; other twins stay in,
 * because hiding a real event would be worse than asking. Nothing here changes data: only linkEvent merges the two.
 */
export function calendarEntries<E extends CalendarEvent>(events: E[], projects: (ProjectState & OwnEvent)[]) {
  const planned = new Set(projects.flatMap((project) => (project.event ? [project.event.id] : [])))
  const open = events.filter((event) => !planned.has(event.id) && isEvent(event))
  const twins = new Map<string, E>()
  const hidden = new Set<string>()
  const own: CalendarEvent[] = []
  for (const project of projects) {
    const day = projectDay(project)
    if (project.type !== 'event' || project.archived || !day) continue
    // A planning project joins the list only when its event left the calendar, otherwise the event itself is there.
    if (project.event && !project.event.missing) continue
    own.push({
      id: project.id,
      title: project.title,
      day,
      endDay: day,
      time: project.time ?? '',
      location: project.place || project.event?.location || null,
      url: '',
      coverUrl: null,
      source: 'own',
    })
    const twin = project.event ? null : eventTwin(project, open)
    if (!twin) continue
    twins.set(project.id, twin.event)
    if (twin.sure) hidden.add(twin.event.id)
  }
  const entries: CalendarEvent[] = [...events.filter((event) => !hidden.has(event.id)), ...own]
  return { entries: entries.sort((a, b) => a.day.localeCompare(b.day) || a.time.localeCompare(b.time)), twins }
}

/** The Weekly is the club's meeting, not an event: it shows in the calendars only, never in event lists, search or planning. */
export const isEvent = (entry: { source: string }): boolean => entry.source !== 'series'

/** The filters of the task board: the member's own tasks, a team, or every team. */
export const MINE = 'mine'

export const filterScope = (filter: string, myTeam: string, query: string): Scope => ({
  team: filter === MINE ? ALL_TEAMS : filter,
  myTeam,
  onlyMine: filter === MINE,
  query,
})

export const TASK_VIEWS = ['overview', 'tasks', 'projects', 'events'] as const
export type TaskView = (typeof TASK_VIEWS)[number]

const VIEW_SLUGS: Record<Exclude<TaskView, 'overview'>, string> = { tasks: 'board', projects: 'projekte', events: 'events' }

/**
 * The URL hash of a view and an open project, "#board/<id>". A hash and not a query, because Astro's router takes a
 * changed query for another page and reloads it when the member goes back, which would throw the island away.
 */
export function taskHash(view: TaskView, projectId: string | null): string {
  const parts = [view === 'overview' ? '' : VIEW_SLUGS[view], projectId ? encodeURIComponent(projectId) : ''].filter(Boolean)
  return parts.length ? `#${parts.join('/')}` : ''
}

/** View and open project of a hash. "#<id>" alone is the older link to a project and opens it on the overview. */
export function taskRoute(hash: string): { view: TaskView; projectId: string | null } {
  const [first = '', second = ''] = hash.replace(/^#/, '').split('/')
  const view = (Object.keys(VIEW_SLUGS) as (keyof typeof VIEW_SLUGS)[]).find((key) => VIEW_SLUGS[key] === first)
  if (view) return { view, projectId: second ? decodeURIComponent(second) : null }
  return { view: 'overview', projectId: first ? decodeURIComponent(first) : null }
}

/**
 * The tasks of a template or an earlier project as new tasks: all open, nobody assigned, in the team of the new project,
 * deadlines only where a relative rule exists and the new project has a day to count from. Old absolute dates never
 * carry over.
 */
export function tasksFromTemplate(tasks: TemplateTask[], anchorDay: string): TaskFields[] {
  return tasks.map((task) => ({
    title: task.title,
    description: task.description,
    priority: task.priority,
    required: task.required,
    assignees: [],
    team: '',
    status: 'backlog',
    due: anchorDay && task.offsetDays !== null ? addDays(anchorDay, task.offsetDays) : '',
  }))
}

/**
 * The task list of a project as a template: titles, descriptions, priorities and order, and each deadline as days
 * relative to the project's day where both exist. Status, people and comments stay behind.
 */
export function templateFromTasks(
  tasks: (Pick<TaskFields, 'title' | 'description' | 'priority' | 'required' | 'due'> & { offsetDays?: number | null })[],
  anchorDay: string,
): TemplateTask[] {
  return tasks.map((task) => ({
    title: task.title,
    description: task.description,
    priority: task.priority,
    required: task.required,
    offsetDays:
      task.offsetDays ?? (anchorDay && task.due && Math.abs(daysBetween(anchorDay, task.due)) <= OFFSET_MAX ? daysBetween(anchorDay, task.due) : null),
  }))
}

/** Members newly on `next` and no longer on `previous`, for notifications and the activity log. */
export function assigneeChanges(previous: string[], next: string[]) {
  return { added: next.filter((id) => !previous.includes(id)), removed: previous.filter((id) => !next.includes(id)) }
}

export type ProjectEditAction =
  | 'renamed'
  | 'described'
  | 'dated'
  | 'undated'
  | 'timed'
  | 'untimed'
  | 'placed'
  | 'unplaced'
  | 'teamed'
  | 'unteamed'
  | 'leadAdded'
  | 'leadRemoved'

export interface ProjectEdit {
  action: ProjectEditAction
  /** The new title, day, time, place or team; '' where the log names no value. */
  detail: string
  member?: string
}

/**
 * The log entries of a project edit: one per field the patch really changes and one per lead who joins or leaves, so
 * the activity tab says what happened. A value someone else saved just before does not count as a change.
 */
export function projectEdits(
  stored: Pick<ProjectFields, 'title' | 'description' | 'due' | 'leads'> & { time?: string; place?: string; team?: TeamChoice },
  patch: ProjectPatch,
): ProjectEdit[] {
  const edits: ProjectEdit[] = []
  const changes = (key: 'title' | 'description' | 'due' | 'time' | 'place' | 'team') => patch[key] !== undefined && patch[key] !== (stored[key] ?? '')
  const setOrClear = (value: string, set: ProjectEditAction, clear: ProjectEditAction) => edits.push({ action: value ? set : clear, detail: value })
  if (changes('title')) edits.push({ action: 'renamed', detail: patch.title! })
  if (changes('description')) edits.push({ action: 'described', detail: '' })
  if (changes('due')) setOrClear(patch.due!, 'dated', 'undated')
  if (changes('time')) setOrClear(patch.time!, 'timed', 'untimed')
  if (changes('place')) setOrClear(patch.place!, 'placed', 'unplaced')
  if (changes('team')) setOrClear(patch.team!, 'teamed', 'unteamed')
  if (patch.leads) {
    const { added, removed } = assigneeChanges(stored.leads, applyMemberChange(stored.leads, patch.leads))
    for (const member of added) edits.push({ action: 'leadAdded', detail: '', member })
    for (const member of removed) edits.push({ action: 'leadRemoved', detail: '', member })
  }
  return edits
}

/** What a picker changed, as the server takes it. */
export function memberChange(previous: string[], next: string[]): MemberChange {
  const { added, removed } = assigneeChanges(previous, next)
  return { add: added, remove: removed }
}

export const applyMemberChange = (list: string[], { add, remove }: MemberChange): string[] => [
  ...list.filter((id) => !remove.includes(id)),
  ...add.filter((id) => !list.includes(id)),
]

interface WorkspaceChanges<P, M> {
  revision: string
  /** Every project there is, so the island drops what was deleted. */
  ids: string[]
  /** Only the projects that changed. */
  projects: P[]
  members: M[]
  /** Always all of them: a member has few, and they have no revision of their own. */
  privateTasks: PrivateTaskState[]
}

/** The workspace after an answer from the server: changed projects replace their copies, deleted ones leave. */
export function applyChanges<P extends { id: string; updatedAt: string }, M, S extends { revision: string; projects: P[]; members: M[] }>(
  state: S,
  changes: WorkspaceChanges<P, M>,
): S {
  const ids = new Set(changes.ids)
  const changed = new Set(changes.projects.map((project) => project.id))
  const kept = state.projects.filter((project) => ids.has(project.id) && !changed.has(project.id))
  return {
    ...state,
    revision: changes.revision,
    members: changes.members,
    privateTasks: changes.privateTasks,
    projects: [...kept, ...changes.projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  }
}
