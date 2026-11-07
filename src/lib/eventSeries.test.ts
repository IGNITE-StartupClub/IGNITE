import assert from 'node:assert/strict'
import { test } from 'node:test'
import { seriesDates, type EventSeries } from './eventSeries.ts'

const series: EventSeries = {
  id: 'weekly',
  title: 'Weekly',
  firstDay: '2026-11-10',
  time: '16:30',
  minutes: 60,
  location: 'C40.254',
  skip: [],
}

const days = (dates: { id: string }[]) => dates.map(({ id }) => id.replace('weekly-', ''))

test('seriesDates starts on the first day and lists eight weeks', () => {
  const dates = seriesDates(series, '2026-11-07', [])
  assert.equal(dates.length, 8)
  assert.deepEqual(days(dates).slice(0, 3), ['2026-11-10', '2026-11-17', '2026-11-24'])
  assert.equal(new Date(dates[0].startAt).getUTCDay(), 2)
})

test('seriesDates keeps today and moves on the day after', () => {
  assert.equal(days(seriesDates(series, '2026-11-17', []))[0], '2026-11-17')
  assert.equal(days(seriesDates(series, '2026-11-18', []))[0], '2026-11-24')
})

test('seriesDates stays at the Berlin time across the change to summer time', () => {
  const [before, after] = seriesDates({ ...series, firstDay: '2027-03-23' }, '2027-03-23', [])
  assert.equal(before.startAt.toISOString(), '2027-03-23T15:30:00.000Z')
  assert.equal(after.startAt.toISOString(), '2027-03-30T14:30:00.000Z')
  assert.equal(before.endAt.toISOString(), '2027-03-23T16:30:00.000Z')
})

test('seriesDates leaves out skipped days', () => {
  assert.deepEqual(days(seriesDates({ ...series, skip: ['2026-11-17'] }, '2026-11-07', [])).slice(0, 2), ['2026-11-10', '2026-11-24'])
})

test('seriesDates gives way to the same meeting from the public calendar, not to other events', () => {
  const onTuesday = (title: string) => ({ title, startAt: new Date('2026-11-10T15:30:00.000Z') })
  assert.equal(days(seriesDates(series, '2026-11-07', [onTuesday('Open Weekly @IGNITE')]))[0], '2026-11-17')
  assert.equal(days(seriesDates(series, '2026-11-07', [onTuesday('Pitch Night')]))[0], '2026-11-10')
})

test('seriesDates marks its dates and gives them a stable id', () => {
  const [first] = seriesDates(series, '2026-11-07', [])
  assert.deepEqual(
    { ...first, startAt: undefined, endAt: undefined },
    { id: 'weekly-2026-11-10', title: 'Weekly', startAt: undefined, endAt: undefined, location: 'C40.254', url: '', coverUrl: null, source: 'series' },
  )
})
