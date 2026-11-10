/**
 * The personal calendar subscription as iCalendar text (RFC 5545): the public events at their time and the member's
 * open tasks as all-day entries on their deadline. Without database access, so node --test can load it.
 * The route is pages/api/calendar/[token].ics.ts, the secret link comes from connectionsStore.ts.
 */
import { addDays } from './tasks.ts'

/**
 * Headers of a delivered feed. Vercel's CDN keeps it for 30 minutes per link and region, so a calendar on several devices
 * or polling every few minutes costs one function call per half hour (CDN hits invoke no function). The price: new
 * tasks, and a link that was replaced, switched off or belongs to a removed member, reach the calendar up to that late.
 * stale-if-error serves the last feed for a day while the route fails or Luma is down (503), because a feed without the
 * events would delete them from the subscribed calendar. Cache-Control carries no private or no-store, because Vercel
 * does not cache those; max-age=0 keeps browsers and other caches from reusing the answer without asking.
 */
export const FEED_HEADERS = {
  'Content-Type': 'text/calendar; charset=utf-8',
  'Cache-Control': 'max-age=0, must-revalidate',
  'Vercel-CDN-Cache-Control': 'max-age=1800, stale-if-error=86400',
}

const UID_DOMAIN = 'ignite-startupclub.de'
const LINE_OCTETS = 75

export interface FeedEvent {
  id: string
  title: string
  startAt: Date
  endAt: Date
  location: string | null
  url: string
}

export interface FeedTask {
  id: string
  title: string
  due: string
  projectTitle: string
  url: string
}

/** Text values escape backslash, semicolon, comma and line breaks (RFC 5545, 3.3.11). */
const escapeText = (value: string): string =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n?|\n/g, '\\n')

/** Lines end after 75 octets and go on with a space; split by code point so no umlaut breaks in two. */
function fold(line: string): string {
  const parts: string[] = []
  let part = ''
  let octets = 0
  for (const char of line) {
    const size = Buffer.byteLength(char)
    if (octets + size > LINE_OCTETS) {
      parts.push(part)
      part = ' '
      octets = 1
    }
    part += char
    octets += size
  }
  return [...parts, part].join('\r\n')
}

const utcTime = (date: Date): string => date.toISOString().replace(/[-:]|\.\d{3}/g, '')
const dateValue = (day: string): string => day.replaceAll('-', '')

function eventLines({ id, title, startAt, endAt, location, url }: FeedEvent, stamp: string): string[] {
  return [
    'BEGIN:VEVENT',
    `UID:event-${escapeText(id)}@${UID_DOMAIN}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${utcTime(startAt)}`,
    `DTEND:${utcTime(endAt)}`,
    `SUMMARY:${escapeText(title)}`,
    ...(location ? [`LOCATION:${escapeText(location)}`] : []),
    ...(url ? [`URL:${url}`] : []),
    'END:VEVENT',
  ]
}

function taskLines({ id, title, due, projectTitle, url }: FeedTask, stamp: string): string[] {
  return [
    'BEGIN:VEVENT',
    `UID:task-${escapeText(id)}@${UID_DOMAIN}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${dateValue(due)}`,
    // The end of an all-day entry is exclusive, so a task on one day ends on the next.
    `DTEND;VALUE=DATE:${dateValue(addDays(due, 1))}`,
    `SUMMARY:${escapeText(`Aufgabe: ${title}`)}`,
    `DESCRIPTION:${escapeText(projectTitle)}`,
    `URL:${url}`,
    // A deadline does not block the day.
    'TRANSP:TRANSPARENT',
    'END:VEVENT',
  ]
}

export function calendarFeed(events: FeedEvent[], tasks: FeedTask[], now: Date): string {
  const stamp = utcTime(now)
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//IGNITE Startup Club//Aufgaben und Events//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:IGNITE',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
    ...events.flatMap((event) => eventLines(event, stamp)),
    ...tasks.flatMap((task) => taskLines(task, stamp)),
    'END:VCALENDAR',
  ]
  return lines.map(fold).join('\r\n') + '\r\n'
}
