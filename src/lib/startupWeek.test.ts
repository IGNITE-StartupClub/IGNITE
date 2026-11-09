import assert from 'node:assert/strict'
import { test } from 'node:test'
import { addDays, berlinDay, currentEdition, editionProblems, isPast, sortEvents } from './startupWeek.ts'

const edition = (start: string) => ({ start, events: [{ date: start }] })
const KW46 = edition('2026-11-09')
const KW47 = edition('2026-11-16')

test('addDays crosses months and years', () => {
  assert.equal(addDays('2026-11-30', 1), '2026-12-01')
  assert.equal(addDays('2026-12-28', 6), '2027-01-03')
})

test('berlinDay uses Berlin time, not UTC', () => {
  assert.equal(berlinDay(new Date('2026-11-08T23:30:00Z')), '2026-11-09')
  assert.equal(berlinDay(new Date('2026-07-05T21:59:00Z')), '2026-07-05')
  assert.equal(berlinDay(new Date('2026-07-05T22:00:00Z')), '2026-07-06')
})

test('editionProblems accepts a Monday with events inside its week', () => {
  assert.deepEqual(editionProblems('2026-11-09', ['2026-11-09', '2026-11-15']), [])
})

test('editionProblems names a start that is no Monday and dates outside the week', () => {
  assert.deepEqual(editionProblems('2026-11-10', []), ['start 2026-11-10 is no Monday'])
  assert.deepEqual(editionProblems('2026-11-09', ['2026-11-16', '2026-11-08']), [
    'event date 2026-11-16 lies outside the week 2026-11-09 to 2026-11-15',
    'event date 2026-11-08 lies outside the week 2026-11-09 to 2026-11-15',
  ])
  assert.deepEqual(editionProblems('2026-11-9', []), ['start "2026-11-9" is no date in the form YYYY-MM-DD'])
  assert.deepEqual(editionProblems('2026-11-09', ['2026-11-31']), ['event date "2026-11-31" is no date in the form YYYY-MM-DD'])
})

test('currentEdition shows the running week', () => {
  assert.equal(currentEdition([KW47, KW46], '2026-11-12'), KW46)
})

test('currentEdition switches to next week on Sunday once it is published', () => {
  assert.equal(currentEdition([KW46, KW47], '2026-11-14'), KW46)
  assert.equal(currentEdition([KW46, KW47], '2026-11-15'), KW47)
  assert.equal(currentEdition([KW46], '2026-11-15'), KW46)
})

test('currentEdition shows the first edition before it begins', () => {
  assert.equal(currentEdition([KW47, KW46], '2026-11-02'), KW46)
})

test('currentEdition shows nothing once the newest week has ended', () => {
  assert.equal(currentEdition([KW46], '2026-11-16'), null)
  assert.equal(currentEdition([], '2026-11-12'), null)
})

test('sortEvents orders by day, then time, all-day events first', () => {
  const events = [
    { date: '2026-11-11', time: '19:00' },
    { date: '2026-11-10', time: '18:30' },
    { date: '2026-11-11', time: '12:00' },
    { date: '2026-11-11' },
  ]
  assert.deepEqual(sortEvents(events), [events[1], events[3], events[2], events[0]])
})

test('isPast marks days before today only', () => {
  assert.equal(isPast({ date: '2026-11-10' }, '2026-11-11'), true)
  assert.equal(isPast({ date: '2026-11-11' }, '2026-11-11'), false)
})
