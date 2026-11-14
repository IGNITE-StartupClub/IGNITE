import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isOver, withOwnEvents, type EventProject, type PublicEvent } from './ownEvents.ts'

const demoDay: PublicEvent = {
  id: 'evt-demo',
  title: 'Demo Day',
  startAt: new Date('2026-11-20T17:00:00Z'),
  endAt: new Date('2026-11-20T19:00:00Z'),
  location: 'Campus',
  url: 'https://luma.com/demo',
  source: 'luma',
}

const weekly: PublicEvent = {
  id: 'weekly-2026-11-24',
  title: 'Weekly',
  startAt: new Date('2026-11-24T15:30:00Z'),
  endAt: new Date('2026-11-24T16:30:00Z'),
  location: 'C40.254',
  url: '',
  source: 'series',
}

const ownEvent = (id: string, fields: Partial<EventProject> = {}): EventProject => ({
  id,
  title: 'Sommer-Dinner',
  type: 'event',
  status: 'active',
  due: '2026-11-24',
  time: '18:00',
  endDue: '',
  endTime: '22:00',
  place: 'Mensa',
  luma: { id: 'evt-abc', url: 'https://luma.com/dinner' },
  distinctFrom: [],
  leads: [],
  team: '',
  archived: false,
  eventDay: '',
  event: null,
  tasks: [{ done: true }, { done: false }],
  ...fields,
})

const planning = (id: string, eventId: string, fields: Partial<EventProject> = {}): EventProject =>
  ownEvent(id, {
    title: 'Planung',
    due: '',
    time: '',
    endTime: '',
    place: '',
    luma: null,
    eventDay: '2026-11-20',
    event: { id: eventId, missing: false, location: 'Campus' },
    ...fields,
  })

const ids = (events: { id: string }[]) => events.map(({ id }) => id)

test('withOwnEvents lists own events between the public ones, in Berlin time and soonest first', () => {
  const events = withOwnEvents([weekly, demoDay], [ownEvent('dinner')])
  // The Weekly starts at 16:30 on the dinner's day.
  assert.deepEqual(ids(events), ['evt-demo', 'weekly-2026-11-24', 'dinner'])
  const dinner = events[2]
  assert.equal(dinner.source, 'own')
  assert.equal(dinner.projectId, 'dinner')
  assert.equal(dinner.startAt?.toISOString(), '2026-11-24T17:00:00.000Z')
  assert.equal(dinner.endAt?.toISOString(), '2026-11-24T21:00:00.000Z')
  assert.deepEqual([dinner.day, dinner.endDay, dinner.time], ['2026-11-24', '2026-11-24', '18:00'])
  assert.equal(dinner.location, 'Mensa')
  assert.equal(dinner.url, 'https://luma.com/dinner')
})

test('withOwnEvents keeps the moments of public events and links their planning', () => {
  const [demo, series] = withOwnEvents([demoDay, weekly], [planning('plan', 'evt-demo')])
  assert.deepEqual([demo.startAt, demo.endAt], [demoDay.startAt, demoDay.endAt])
  assert.deepEqual([demo.day, demo.time], ['2026-11-20', '18:00'])
  assert.equal(demo.projectId, 'plan')
  assert.equal(series.projectId, null)
})

test('withOwnEvents follows summer time', () => {
  const [event] = withOwnEvents([], [ownEvent('june', { due: '2027-06-15', time: '19:30', endTime: '23:00' })])
  assert.equal(event.startAt?.toISOString(), '2027-06-15T17:30:00.000Z')
  assert.equal(event.endAt?.toISOString(), '2027-06-15T21:00:00.000Z')
})

test('withOwnEvents leaves the times an own event does not name open', () => {
  const [allDay, openEnd, backwards, overnight] = withOwnEvents(
    [],
    [
      ownEvent('all-day', { due: '2026-11-25', time: '', endTime: '', endDue: '2026-11-26' }),
      ownEvent('open-end', { due: '2026-11-26', endTime: '' }),
      ownEvent('backwards', { due: '2026-11-27', time: '20:00', endTime: '08:00' }),
      ownEvent('overnight', { due: '2026-11-28', time: '22:00', endDue: '2026-11-29', endTime: '02:00' }),
    ],
  )
  assert.deepEqual([allDay.startAt, allDay.endAt, allDay.day, allDay.endDay], [null, null, '2026-11-25', '2026-11-26'])
  assert.equal(openEnd.startAt?.toISOString(), '2026-11-26T17:00:00.000Z')
  assert.equal(openEnd.endAt, null)
  assert.equal(backwards.endAt, null)
  assert.equal(overnight.endAt?.toISOString(), '2026-11-29T01:00:00.000Z')
})

test('withOwnEvents leaves out finished and archived own events, but a finished planning still links its event', () => {
  const events = withOwnEvents(
    [demoDay],
    [
      ownEvent('done', { status: 'done' }),
      ownEvent('archived', { archived: true }),
      planning('plan', 'evt-demo', { status: 'done' }),
    ],
  )
  assert.deepEqual(ids(events), ['evt-demo'])
  assert.equal(events[0].projectId, 'plan')
})

test('withOwnEvents shows a planning whose event left the calendar, unless it is finished', () => {
  const gone = { id: 'evt-gone', missing: true, location: 'Campus' }
  const [entry] = withOwnEvents([], [planning('open', 'evt-gone', { event: gone })])
  assert.deepEqual(
    [entry.id, entry.source, entry.projectId, entry.day, entry.startAt],
    ['open', 'own', 'open', '2026-11-20', null],
  )
  assert.deepEqual(withOwnEvents([], [planning('closed', 'evt-gone', { event: gone, status: 'done' })]), [])
})

test('withOwnEvents shows an event entered before it reached Luma once, until members keep the two apart', () => {
  const sameDay = ownEvent('twin', { title: 'Demo Day', due: '2026-11-20', time: '18:00', endTime: '20:00' })
  assert.deepEqual(ids(withOwnEvents([demoDay], [sameDay])), ['twin'])
  assert.deepEqual(ids(withOwnEvents([demoDay], [{ ...sameDay, distinctFrom: ['evt-demo'] }])), ['evt-demo', 'twin'])
})

test('isOver goes by the end, and by the last day for an event without an end time', () => {
  const [demo] = withOwnEvents([demoDay], [])
  assert.equal(isOver(demo, Date.parse('2026-11-20T18:59:00Z')), false)
  assert.equal(isOver(demo, Date.parse('2026-11-20T19:00:00Z')), true)
  const [openEnd] = withOwnEvents([], [ownEvent('open-end', { endTime: '' })])
  assert.equal(isOver(openEnd, Date.parse('2026-11-24T22:59:00Z')), false)
  assert.equal(isOver(openEnd, Date.parse('2026-11-24T23:00:00Z')), true)
})
