/**
 * Rules of the tasks module ("Aufgaben" in the members area), shared by the API, the store, the daily digest and the
 * TaskWorkspace island: allowed values, input parsing, progress, the groups of "Meine Aufgaben", key figures, filters
 * and copying a task list from a template or an earlier project. Free of local imports, so node --test runs it.
 * Days are YYYY-MM-DD in Europe/Berlin throughout, like the CRM; members are referenced by the hex id of their
 * `members` document, never by email, so no address reaches the browser.
 */

export const PROJECT_TYPES = ['event', 'internal', 'task'] as const
export type ProjectType = (typeof PROJECT_TYPES)[number]

/** The board columns, in order. The status is set by hand and never follows the progress. */
export const PROJECT_STATUSES = ['planned', 'active', 'review', 'done'] as const
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export const PRIORITIES = ['low', 'normal', 'high'] as const
export type Priority = (typeof PRIORITIES)[number]

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
  /** Deadline of an internal project or a single task, the date of an event project without a public event. */
  due: string
  leads: string[]
}

export interface TaskFields {
  title: string
  description: string
  due: string
  priority: Priority
  /** A required task left open makes the board ask before the project moves to "done". */
  required: boolean
  assignees: string[]
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

export interface Lessons {
  wellDone: string
  improve: string
  notes: string
}

/** The parts of a task the rules below read. */
export interface TaskState {
  id: string
  title: string
  done: boolean
  due: string
  priority: Priority
  required: boolean
  assignees: string[]
  updatedAt?: string
}

export interface ProjectState {
  id: string
  title: string
  type: ProjectType
  status: ProjectStatus
  due: string
  leads: string[]
  archived: boolean
  /** Start day of the linked public event, '' without one. */
  eventDay: string
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
    leads: members(fields.leads),
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
  })
}

export type TaskPatch = Partial<TaskFields> & { done?: boolean }

/** A change to some fields of a task; null when it changes nothing or any given field is invalid. */
export function parseTaskPatch(input: unknown): TaskPatch | null {
  const fields = fieldsOf(input)
  if (!fields) return null
  const parsers: Record<keyof TaskPatch, (value: unknown) => Parsed<unknown>> = {
    title: (value) => text(value, TITLE_MAX, true),
    description: (value) => text(value, TEXT_MAX),
    due: day,
    priority: (value) => choice(value, PRIORITIES, 'normal'),
    required: flag,
    assignees: members,
    done: flag,
  }
  const patch: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(fields)) {
    if (!(key in parsers) || value === undefined) return null
    const parsed = parsers[key as keyof TaskPatch](value)
    if (parsed === INVALID) return null
    patch[key] = parsed
  }
  return Object.keys(patch).length ? (patch as TaskPatch) : null
}

export function parseLessons(input: unknown): Lessons | null {
  const fields = fieldsOf(input)
  if (!fields) return null
  const lessons = parse<Lessons>({
    wellDone: text(fields.wellDone, TEXT_MAX),
    improve: text(fields.improve, TEXT_MAX),
    notes: text(fields.notes, TEXT_MAX),
  })
  return lessons && (lessons.wellDone || lessons.improve || lessons.notes) ? lessons : null
}

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

export const isOverdue = (task: Pick<TaskState, 'done' | 'due'>, today: string): boolean =>
  !task.done && !!task.due && task.due < today

/** Open required tasks, the reason to confirm before a project moves to "done". */
export const openRequired = (tasks: Pick<TaskState, 'done' | 'required'>[]): number =>
  tasks.filter((task) => task.required && !task.done).length

export const TASK_GROUPS = ['overdue', 'week', 'later', 'none', 'done'] as const
export type TaskGroup = (typeof TASK_GROUPS)[number]

/** The one group of "Meine Aufgaben" a task belongs to. */
export function taskGroup(task: Pick<TaskState, 'done' | 'due'>, today: string): TaskGroup {
  if (task.done) return 'done'
  if (!task.due) return 'none'
  if (task.due < today) return 'overdue'
  return task.due <= weekEnd(today) ? 'week' : 'later'
}

/** Key figures of the board; archived projects count nowhere. */
export function boardFigures(projects: ProjectState[], me: string, today: string) {
  const live = projects.filter((project) => !project.archived)
  const open = live.flatMap((project) => project.tasks.filter((task) => !task.done))
  return {
    active: live.filter((project) => project.status !== 'done').length,
    open: open.length,
    mine: open.filter((task) => task.assignees.includes(me)).length,
    overdue: open.filter((task) => isOverdue(task, today)).length,
  }
}

export interface MyTask extends TaskState {
  projectId: string
  projectTitle: string
  group: TaskGroup
}

/** The tasks assigned to `me` in projects that are not archived, each with its group. */
export function myTasks(projects: ProjectState[], me: string, today: string): MyTask[] {
  return projects
    .filter((project) => !project.archived)
    .flatMap((project) =>
      project.tasks
        .filter((task) => task.assignees.includes(me))
        .map((task) => ({ ...task, projectId: project.id, projectTitle: project.title, group: taskGroup(task, today) })),
    )
}

export function myFigures(tasks: MyTask[]) {
  return {
    open: tasks.filter((task) => !task.done).length,
    week: tasks.filter((task) => task.group === 'week').length,
    overdue: tasks.filter((task) => task.group === 'overdue').length,
    done: tasks.filter((task) => task.done).length,
  }
}

export const MY_SORTS = ['due', 'priority', 'updated'] as const
export type MySort = (typeof MY_SORTS)[number]

const PRIORITY_RANK: Record<Priority, number> = { high: 0, normal: 1, low: 2 }

export function sortMyTasks<T extends MyTask>(tasks: T[], sort: MySort): T[] {
  const byDue = (a: T, b: T) => (a.due || '9999').localeCompare(b.due || '9999')
  const compare: Record<MySort, (a: T, b: T) => number> = {
    due: (a, b) => byDue(a, b) || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
    priority: (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || byDue(a, b),
    updated: (a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''),
  }
  return [...tasks].sort(compare[sort])
}

export interface BoardFilters {
  query: string
  type: ProjectType | ''
  /** Only projects `me` leads or has tasks in. */
  mine: boolean
  overdue: boolean
  member: string
  archived: boolean
}

export const involves = (project: ProjectState, member: string): boolean =>
  project.leads.includes(member) || project.tasks.some((task) => task.assignees.includes(member))

export function filterProjects<T extends ProjectState>(projects: T[], filters: BoardFilters, me: string, today: string): T[] {
  const query = filters.query.trim().toLowerCase()
  return projects.filter(
    (project) =>
      project.archived === filters.archived &&
      (!filters.type || project.type === filters.type) &&
      (!filters.mine || involves(project, me)) &&
      (!filters.member || involves(project, filters.member)) &&
      (!filters.overdue || project.tasks.some((task) => isOverdue(task, today))) &&
      (!query || project.title.toLowerCase().includes(query) || project.tasks.some((task) => task.title.toLowerCase().includes(query))),
  )
}

/** Day a project is about: the event start, else its own date. */
export const projectDay = (project: Pick<ProjectState, 'eventDay' | 'due'>): string => project.eventDay || project.due

/**
 * The tasks of a template or an earlier project as new tasks: all open, nobody assigned, deadlines only where a
 * relative rule exists and the new project has a day to count from. Old absolute dates never carry over.
 */
export function tasksFromTemplate(tasks: TemplateTask[], anchorDay: string): TaskFields[] {
  return tasks.map((task) => ({
    title: task.title,
    description: task.description,
    priority: task.priority,
    required: task.required,
    assignees: [],
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
