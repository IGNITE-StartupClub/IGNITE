/**
 * "Deine Startup-Woche": the weekly list of startup events in Lüneburg and Hamburg behind the Instagram bio link
 * (/startup-woche). Each week is one edition, a JSON file in src/content/startupWeek/ named after its Monday.
 * No extensionless imports, so `node --test` can load this module.
 */

const DAY_MS = 86_400_000
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

export interface Edition<E extends { date: string } = { date: string }> {
  /** Monday of the week, YYYY-MM-DD. */
  start: string
  events: E[]
}

const dayValue = (day: string) => Date.parse(`${day}T00:00:00Z`)

export const addDays = (day: string, days: number): string => new Date(dayValue(day) + days * DAY_MS).toISOString().slice(0, 10)

/** The calendar day in Berlin as YYYY-MM-DD; the events and the posting rhythm follow German time. */
export const berlinDay = (now: Date): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)

/** Problems with one edition, empty when it is valid. Checked by the content schema, so a wrong file fails the build. */
export function editionProblems(start: string, dates: string[]): string[] {
  if (!ISO_DAY.test(start) || addDays(start, 0) !== start) return [`start "${start}" is no date in the form YYYY-MM-DD`]
  const problems: string[] = []
  if (new Date(dayValue(start)).getUTCDay() !== 1) problems.push(`start ${start} is no Monday`)
  const end = addDays(start, 6)
  for (const date of dates) {
    if (!ISO_DAY.test(date) || addDays(date, 0) !== date) problems.push(`event date "${date}" is no date in the form YYYY-MM-DD`)
    else if (date < start || date > end) problems.push(`event date ${date} lies outside the week ${start} to ${end}`)
  }
  return problems
}

/**
 * The edition the bio link shows on `today`: the newest one that has begun by tomorrow, so the post published on
 * Sunday already finds next week's list. Before the first edition, the earliest one. Null when there is none or
 * when the newest one has ended, because a list of past events is no use behind the link.
 */
export function currentEdition<E extends { date: string }>(editions: Edition<E>[], today: string): Edition<E> | null {
  const sorted = [...editions].sort((a, b) => a.start.localeCompare(b.start))
  const tomorrow = addDays(today, 1)
  const begun = sorted.filter((edition) => edition.start <= tomorrow)
  const edition = begun.at(-1) ?? sorted[0]
  if (!edition || addDays(edition.start, 6) < today) return null
  return edition
}

/** Events in order of day and time; an event without a time comes first on its day. */
export const sortEvents = <E extends { date: string; time?: string }>(events: E[]): E[] =>
  [...events].sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''))

export const isPast = (event: { date: string }, today: string): boolean => event.date < today
