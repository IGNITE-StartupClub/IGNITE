/**
 * Own events beside the public ones outside the tasks island: on the start page, in the calendar feed and in the MCP
 * tool upcoming_events. An own event is an event project without a public event (`event: null`), its day in `due` and
 * optional start and end times. calendarEntries (tasks.ts) merges both lists and hides a public event that is surely an
 * own one, as the hub's calendar does; this adds the moments those three need. Without database access, so node --test
 * can load it.
 */
import { berlinMoment } from './eventSeries.ts'
import {
  berlinClock,
  berlinDay,
  calendarEntries,
  type CalendarEvent,
  type ProjectState,
  type TaskState,
} from './tasks.ts'
import type { TaskEvent } from './taskEvents'

/** A public event (Luma, hand-listed or the Weekly) as loadTaskEvents gives it; these lists show no covers. */
export type PublicEvent = Omit<TaskEvent, 'coverUrl'>

/**
 * An event project that is not archived, as tasksStore.eventProjects reads it: an own event or the planning of a public
 * event. Of its tasks only the done flags come along, for progress().
 */
export type EventProject = Omit<ProjectState, 'tasks'> & { tasks: Pick<TaskState, 'done'>[] }

/** An event of these lists. `id` is the public event's id, or the project's for an own event. */
export interface ListedEvent extends Omit<CalendarEvent, 'coverUrl'> {
  /**
   * Null where an own event names no time: without a start time it lasts its days, without an end time its end is
   * open.
   */
  startAt: Date | null
  endAt: Date | null
  /** The project that plans it: the own event itself or the planning of a public event; null without one. */
  projectId: string | null
}

/** Start and end of an own event; an end that does not come after the start counts as open. */
function ownMoments({ day, endDay, time }: Pick<CalendarEvent, 'day' | 'endDay' | 'time'>, endTime: string) {
  if (!time) return { startAt: null, endAt: null }
  const startAt = berlinMoment(day, time)
  const endAt = endTime ? berlinMoment(endDay, endTime) : null
  return { startAt, endAt: endAt && endAt > startAt ? endAt : null }
}

/**
 * The public events with the own events among them, soonest first. A done project makes no entry of its own, like an
 * archived one: neither an own event nor a planning whose event left the calendar. A done planning still links its
 * event.
 */
export function withOwnEvents(events: PublicEvent[], projects: EventProject[]): ListedEvent[] {
  const shown = projects.filter((project) => project.status !== 'done' || (project.event && !project.event.missing))
  const calendar = events.map((event) => ({
    id: event.id,
    title: event.title,
    day: berlinDay(event.startAt.getTime()),
    endDay: berlinDay(event.endAt.getTime()),
    time: berlinClock(event.startAt.getTime()),
    location: event.location,
    url: event.url,
    coverUrl: null,
    source: event.source,
  }))
  // calendarEntries reads no tasks, and an EventProject brings only their done flags.
  const { entries } = calendarEntries(
    calendar,
    shown.map((project) => ({ ...project, tasks: [] })),
  )
  const moments = new Map(events.map(({ id, startAt, endAt }) => [id, { startAt, endAt }]))
  return entries.map((entry) => {
    const own = entry.source === 'own'
    const project = own ? shown.find(({ id }) => id === entry.id) : shown.find(({ event }) => event?.id === entry.id)
    const moment = own ? ownMoments(entry, project?.endTime ?? '') : moments.get(entry.id)
    return {
      id: entry.id,
      title: entry.title,
      day: entry.day,
      endDay: entry.endDay,
      time: entry.time,
      location: entry.location,
      url: entry.url,
      source: entry.source,
      startAt: moment?.startAt ?? null,
      endAt: moment?.endAt ?? null,
      projectId: project?.id ?? null,
    }
  })
}

/** Whether an event is over at `now`; one without an end time lasts until its last day is over. */
export const isOver = (event: Pick<ListedEvent, 'endAt' | 'endDay'>, now: number): boolean =>
  event.endAt ? event.endAt.getTime() <= now : event.endDay < berlinDay(now)
