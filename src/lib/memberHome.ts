/**
 * What the start page of the members area shows (MembersPage.astro, MemberDashboard, TeamChoice): the member's open
 * tasks, the next event and the profile the team choice saves. Without database access, so node --test can load it.
 */
import { parseName, parseTeam, taskGroup, type PrivateTaskState, type ProjectState, type TaskGroup, type TeamId } from './tasks.ts'

type Locale = 'de' | 'en'

export type HomeProject = ProjectState & { event: { id: string } | null }

export interface HomeTask {
  id: string
  title: string
  due: string
  group: TaskGroup
  projectId: string
  projectTitle: string
  /** The public event of the task's project, '' without one. */
  eventId: string
  /** A private task has no project; projectId and projectTitle stay ''. */
  private: boolean
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
          projectId: project.id,
          projectTitle: project.title,
          eventId: project.event?.id ?? '',
          private: false,
        })),
    )
  const own = privateTasks
    .filter((task) => !task.done)
    .map(({ id, title, due }) => ({
      id,
      title,
      due,
      group: taskGroup({ done: false, due }, today),
      projectId: '',
      projectTitle: '',
      eventId: '',
      private: true,
    }))
  return [...shared, ...own].sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'))
}

export const homeFigures = (tasks: Pick<HomeTask, 'group'>[]) => ({
  open: tasks.length,
  week: tasks.filter((task) => task.group === 'week').length,
  overdue: tasks.filter((task) => task.group === 'overdue').length,
})

export const eventTaskCount = (tasks: Pick<HomeTask, 'eventId'>[], eventId: string): number =>
  tasks.filter((task) => task.eventId === eventId).length

/** The event running now or else coming up first; `events` are sorted by start. */
export const nextEvent = <T extends { endAt: Date }>(events: T[], now: number): T | null =>
  events.find((event) => event.endAt.getTime() > now) ?? null

const format = (date: Date, locale: Locale, timeZone: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'de', { timeZone, ...options }).format(date)

const weekdayDay = (date: Date, locale: Locale, timeZone: string) =>
  `${format(date, locale, timeZone, { weekday: 'short' }).replace('.', '')}, ${format(date, locale, timeZone, { day: 'numeric', month: 'short' })}`

/** "Mi, 4. Nov." / "Wed, 4 Nov" for a YYYY-MM-DD day. */
export const dayLabel = (day: string, locale: Locale): string => weekdayDay(new Date(`${day}T00:00:00Z`), locale, 'UTC')

/** The parts of an event's start in Berlin: the date tile and the line next to it. */
export function eventDate(startAt: Date, locale: Locale) {
  const berlin = 'Europe/Berlin'
  return {
    // Cut from the format with a day, because German only writes "Nov." with its dot next to a day.
    month: format(startAt, locale, berlin, { day: 'numeric', month: 'short' }).replace(/^\d+\.?\s*/, ''),
    day: format(startAt, locale, berlin, { day: 'numeric' }),
    weekdayDay: weekdayDay(startAt, locale, berlin),
    time: format(startAt, locale, berlin, { hour: '2-digit', minute: '2-digit' }),
  }
}

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
