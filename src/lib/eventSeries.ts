/**
 * The dates of a weekly series. They come from its rule (data/eventSeries.ts) on every load and are never stored, so a
 * changed time reaches every coming date, and only the weeks ahead exist: past dates drop out of the calendar by themselves.
 */
import { addDays, berlinClock, berlinDay, daysBetween, similarTitles } from './tasks.ts'
import type { TaskEvent } from './taskEvents'

export interface EventSeries {
  id: string
  title: string
  /** The first date; the series repeats every 7 days from here. */
  firstDay: string
  /** "16:30" in Berlin. */
  time: string
  minutes: number
  location: string | null
  /** Dates that do not take place. */
  skip: string[]
}

const WEEKS_AHEAD = 8

/** The moment a clock in Berlin shows this time, summer time included. */
function berlinMoment(day: string, time: string): Date {
  const asUtc = Date.parse(`${day}T${time}:00Z`)
  const shownInBerlin = Date.parse(`${berlinDay(asUtc)}T${berlinClock(asUtc)}:00Z`)
  return new Date(asUtc - (shownInBerlin - asUtc))
}

/**
 * The dates from `today` on. A date gives way to a similar event of that day in `listed`, for example an Open Weekly in
 * Luma, because that entry has the real page and the same meeting must not show twice.
 */
export function seriesDates(series: EventSeries, today: string, listed: { title: string; startAt: Date }[]): TaskEvent[] {
  const weeksGone = Math.max(0, Math.ceil(daysBetween(series.firstDay, today) / 7))
  const inCalendar = (day: string) =>
    listed.some((event) => berlinDay(event.startAt.getTime()) === day && similarTitles(event.title, series.title))
  return Array.from({ length: WEEKS_AHEAD }, (_, week) => addDays(series.firstDay, (weeksGone + week) * 7))
    .filter((day) => !series.skip.includes(day) && !inCalendar(day))
    .map((day) => {
      const startAt = berlinMoment(day, series.time)
      return {
        id: `${series.id}-${day}`,
        title: series.title,
        startAt,
        endAt: new Date(startAt.getTime() + series.minutes * 60_000),
        location: series.location,
        url: '',
        coverUrl: null,
        source: 'series',
      }
    })
}
