/**
 * What the start page of the members area shows (MembersPage.astro, MemberDashboard, TeamChoice): the member's open
 * tasks, what a lead still has to hand out, the next event and the profile the team choice saves. Without database
 * access, so node --test can load it.
 */
import { isOver, type ListedEvent } from './ownEvents.ts'
import {
  nextTurn,
  parseName,
  parseTeam,
  taskGroup,
  type PrivateTaskState,
  type ProjectState,
  type Repeat,
  type TaskGroup,
  type TaskState,
  type TeamId,
} from './tasks.ts'

type Locale = 'de' | 'en'

export type HomeProject = Pick<ProjectState, 'id' | 'title' | 'type' | 'status' | 'archived' | 'leads'> & {
  tasks: Pick<TaskState, 'id' | 'title' | 'due' | 'done' | 'assignees' | 'repeat'>[]
}

export interface HomeTask {
  id: string
  title: string
  due: string
  group: TaskGroup
  /** The deadline a tick here gives a repeating task, '' for one that does not repeat. */
  nextDue: string
  projectId: string
  projectTitle: string
  /** A private task has no project; projectId and projectTitle stay ''. */
  private: boolean
  /** A single task is a project of its own, so the project title only repeats the task's. */
  single: boolean
}

/** Where the server sends a repeating task that is ticked here (nextTurn): back to the backlog with this deadline. */
function nextDeadline(task: { due: string; repeat?: Repeat }, today: string): string {
  // The task is open, and from either open column a tick goes the same way.
  const turn = nextTurn({ done: false, status: 'backlog', due: task.due, repeat: task.repeat }, { done: true }, today)
  return turn.repeated ? turn.due : ''
}

/** The member's open tasks, private ones included, soonest deadline first and tasks without one last. */
export function openTasks(projects: HomeProject[], me: string, today: string, privateTasks: PrivateTaskState[]): HomeTask[] {
  const shared = projects
    .filter((project) => !project.archived && project.status !== 'done')
    .flatMap((project) =>
      project.tasks
        .filter((task) => !task.done && task.assignees.includes(me))
        .map((task) => ({
          id: task.id,
          title: task.title,
          due: task.due,
          group: taskGroup(task, today),
          nextDue: nextDeadline(task, today),
          projectId: project.id,
          projectTitle: project.title,
          private: false,
          single: project.type === 'task',
        })),
    )
  const own = privateTasks
    .filter((task) => !task.done)
    .map(({ id, title, due, repeat }) => ({
      id,
      title,
      due,
      group: taskGroup({ done: false, due }, today),
      nextDue: nextDeadline({ due, repeat }, today),
      projectId: '',
      projectTitle: '',
      private: true,
      single: false,
    }))
  return [...shared, ...own].sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'))
}

export const homeFigures = (tasks: Pick<HomeTask, 'group'>[]) => ({
  open: tasks.length,
  week: tasks.filter((task) => task.group === 'week').length,
  overdue: tasks.filter((task) => task.group === 'overdue').length,
})

/**
 * The open tasks once the member has ticked those in `ticked` here: a repeating task stays open with its next deadline,
 * as on the server, so the figures follow.
 */
export function afterTicks<T extends Pick<HomeTask, 'id' | 'due' | 'group' | 'nextDue'>>(
  tasks: T[],
  ticked: ReadonlySet<string>,
  today: string,
): T[] {
  return tasks.flatMap((task) => {
    if (!ticked.has(task.id)) return [task]
    return task.nextDue
      ? [{ ...task, due: task.nextDue, group: taskGroup({ done: false, due: task.nextDue }, today) }]
      : []
  })
}

/**
 * Open tasks nobody has taken in the open projects the member leads, single tasks included: what is left to hand out.
 */
export const unassignedCount = (projects: HomeProject[], me: string): number =>
  projects
    .filter((project) => !project.archived && project.status !== 'done' && project.leads.includes(me))
    .flatMap((project) => project.tasks)
    .filter((task) => !task.done && !task.assignees.length).length

/** The member's open tasks for an event: those in the project that plans it (`planId`), none without one. */
export const eventTaskCount = (tasks: Pick<HomeTask, 'projectId'>[], planId: string | null): number =>
  planId ? tasks.filter((task) => task.projectId === planId).length : 0

/** The event running now or else coming up first; `events` are sorted by start (withOwnEvents). */
export const nextEvent = <T extends Pick<ListedEvent, 'endAt' | 'endDay'>>(events: T[], now: number): T | null =>
  events.find((event) => !isOver(event, now)) ?? null

const format = (date: Date, locale: Locale, timeZone: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'de', { timeZone, ...options }).format(date)

const weekdayDay = (date: Date, locale: Locale, timeZone: string) =>
  `${format(date, locale, timeZone, { weekday: 'short' }).replace('.', '')}, ${format(date, locale, timeZone, { day: 'numeric', month: 'short' })}`

/** "Mi, 4. Nov." / "Wed, 4 Nov" for a YYYY-MM-DD day. */
export const dayLabel = (day: string, locale: Locale): string => weekdayDay(new Date(`${day}T00:00:00Z`), locale, 'UTC')

const dateParts = (date: Date, locale: Locale, timeZone: string) => ({
  // Cut from the format with a day, because German only writes "Nov." with its dot next to a day.
  month: format(date, locale, timeZone, { day: 'numeric', month: 'short' }).replace(/^\d+\.?\s*/, ''),
  day: format(date, locale, timeZone, { day: 'numeric' }),
  weekdayDay: weekdayDay(date, locale, timeZone),
})

/** The parts of an event's start in Berlin: the date tile and the line next to it. */
export function eventDate(startAt: Date, locale: Locale) {
  const berlin = 'Europe/Berlin'
  return {
    ...dateParts(startAt, locale, berlin),
    time: format(startAt, locale, berlin, { hour: '2-digit', minute: '2-digit' }),
  }
}

/** The date tile and line of a YYYY-MM-DD day, for an event that may have no start time (withOwnEvents). */
export const dayDate = (day: string, locale: Locale) => dateParts(new Date(`${day}T00:00:00Z`), locale, 'UTC')

/** First word and the rest, to prefill the name fields and to greet by first name. */
export function splitName(name: string): { firstName: string; lastName: string } {
  const [firstName = '', ...rest] = name.trim().split(/\s+/)
  return { firstName, lastName: rest.join(' ') }
}

/** Everyone picks a team on the start page and changes it with ?team, except the board, which works across all teams. */
export const showsTeamChoice = (hasTeam: boolean, board: boolean, asked: boolean): boolean => !board && (!hasTeam || asked)

/** What the team choice saves. Unlike parseTeam, no team is not an answer here. */
export function parseProfile(input: unknown): { firstName: string; lastName: string; team: TeamId } | null {
  const name = parseName(input)
  const team = parseTeam((input as { team?: unknown } | null)?.team)
  return name && team ? { ...name, team } : null
}
