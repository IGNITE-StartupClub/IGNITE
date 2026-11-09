import assert from 'node:assert/strict'
import { test } from 'node:test'
import { calendarFeed, FEED_HEADERS, type FeedEvent, type FeedTask } from './calendarFeed.ts'

const now = new Date('2026-11-06T10:00:00.000Z')
const event: FeedEvent = {
  id: 'evt-1',
  title: 'Open Weekly',
  startAt: new Date('2026-11-10T17:00:00.000Z'),
  endAt: new Date('2026-11-10T19:00:00.000Z'),
  location: 'Lüneburg, Campus',
  url: 'https://luma.com/open-weekly',
}
const task: FeedTask = {
  id: 'task-1',
  title: 'Flyer drucken',
  due: '2026-11-30',
  projectTitle: 'Open Weekly',
  url: 'https://www.ignite-startupclub.de/mitglieder/aufgaben#abc',
}

/** The value of a property after undoing the line folding. */
const lines = (feed: string): string[] => feed.replace(/\r\n /g, '').split('\r\n')

test('frames the calendar and ends every line with CRLF', () => {
  const feed = calendarFeed([], [], now)
  assert.ok(feed.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n'))
  assert.ok(feed.endsWith('END:VCALENDAR\r\n'))
  assert.equal(feed.replace(/\r\n/g, '').includes('\n'), false)
})

test('writes events in UTC with a stable uid', () => {
  const result = lines(calendarFeed([event], [], now))
  assert.ok(result.includes('UID:event-evt-1@ignite-startupclub.de'))
  assert.ok(result.includes('DTSTAMP:20261106T100000Z'))
  assert.ok(result.includes('DTSTART:20261110T170000Z'))
  assert.ok(result.includes('DTEND:20261110T190000Z'))
})

test('leaves out a missing location', () => {
  const result = lines(calendarFeed([{ ...event, location: null }], [], now))
  assert.equal(
    result.some((line) => line.startsWith('LOCATION')),
    false,
  )
})

test('writes tasks as all-day entries that end the next day, across a month', () => {
  const result = lines(calendarFeed([], [task], now))
  assert.ok(result.includes('DTSTART;VALUE=DATE:20261130'))
  assert.ok(result.includes('DTEND;VALUE=DATE:20261201'))
  assert.ok(result.includes('SUMMARY:Aufgabe: Flyer drucken'))
  assert.ok(result.includes('TRANSP:TRANSPARENT'))
})

test('escapes text values so a title cannot add properties', () => {
  const title = 'A, B; C\\D\nEND:VEVENT'
  const result = lines(calendarFeed([{ ...event, title, location: 'X;Y' }], [], now))
  assert.ok(result.includes('SUMMARY:A\\, B\\; C\\\\D\\nEND:VEVENT'))
  assert.ok(result.includes('LOCATION:X\\;Y'))
  assert.equal(result.filter((line) => line === 'END:VEVENT').length, 1)
})

test('folds long lines at 75 octets without splitting a character', () => {
  const title = 'Übergabe für das Wintersemester, '.repeat(8)
  const feed = calendarFeed([], [{ ...task, title }], now)
  for (const line of feed.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75, line)
  assert.equal(feed.includes('�'), false)
  assert.ok(lines(feed).some((line) => line.includes('Übergabe für das Wintersemester\\, Übergabe')))
})

test('leaves out the URL of an event without a page', () => {
  const feed = lines(calendarFeed([{ ...event, url: '' }], [], now))
  assert.equal(feed.some((line) => line.startsWith('URL:')), false)
})

test('a delivered feed is cached by Vercel for 30 minutes and by nobody else', () => {
  assert.match(FEED_HEADERS['Vercel-CDN-Cache-Control'], /^max-age=1800, stale-if-error=86400$/)
  // Vercel does not cache a response whose Cache-Control says private, no-cache or no-store.
  assert.doesNotMatch(FEED_HEADERS['Cache-Control'], /private|no-cache|no-store/)
  assert.match(FEED_HEADERS['Cache-Control'], /max-age=0/)
})
