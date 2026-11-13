import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  FEEDBACK_TEXT_MAX,
  feedbackArea,
  feedbackDay,
  feedbackEntry,
  feedbackExpiry,
  feedbackTaskTitle,
  parseFeedbackAction,
  quotaExpiry,
} from './feedback.ts'

const ID = '0f8fad5b-d9cb-469f-a165-70867728950e'
const send = { action: 'send', kind: 'bug', area: 'tasks', text: '  Der Haken fehlt am Handy.\r\n', named: false }

test('parseFeedbackAction accepts a send and cleans its text', () => {
  assert.deepEqual(parseFeedbackAction(send), {
    action: 'send',
    feedback: { kind: 'bug', area: 'tasks', text: 'Der Haken fehlt am Handy.', named: false },
  })
  const parsed = parseFeedbackAction({ ...send, text: 'a\r\nb' })
  assert.equal(parsed?.action === 'send' && parsed.feedback.text, 'a\nb')
})

test('parseFeedbackAction refuses what the dialog cannot send', () => {
  for (const body of [
    null,
    'send',
    { ...send, kind: 'praise' },
    { ...send, area: 'admin' },
    { ...send, text: '   ' },
    { ...send, text: 'x'.repeat(FEEDBACK_TEXT_MAX + 1) },
    { ...send, text: 42 },
    { ...send, named: 'yes' },
    { action: 'status', id: ID, status: 'review' },
    { action: 'status', id: '../members', status: 'seen' },
    { action: 'task', id: { $ne: '' } },
    { action: 'delete', id: ID },
  ]) {
    assert.equal(parseFeedbackAction(body), null, JSON.stringify(body))
  }
  assert.equal(parseFeedbackAction({ ...send, text: 'x'.repeat(FEEDBACK_TEXT_MAX) })?.action, 'send')
})

test('parseFeedbackAction reads the admin actions', () => {
  assert.deepEqual(parseFeedbackAction({ action: 'status', id: ID, status: 'done' }), { action: 'status', id: ID, status: 'done' })
  assert.deepEqual(parseFeedbackAction({ action: 'task', id: ID }), { action: 'task', id: ID })
})

test('an anonymous entry keeps no member and no time finer than the day', () => {
  const parsed = parseFeedbackAction(send)
  assert.ok(parsed?.action === 'send')
  const entry = feedbackEntry(parsed.feedback, '65f0c0ffee0000000000abcd', '2026-11-13', ID)
  assert.equal('memberId' in entry, false)
  assert.equal(entry.day, '2026-11-13')
  assert.equal(entry.status, 'new')
  assert.equal(entry._id, ID)
  // The only date in the document is the expiry, at midnight of a day.
  assert.equal(entry.expiresAt.toISOString(), '2027-11-13T00:00:00.000Z')
  const dates = Object.values(entry).filter((value) => value instanceof Date)
  assert.deepEqual(dates, [entry.expiresAt])
})

test('a named entry keeps the member id', () => {
  const entry = feedbackEntry({ kind: 'idea', area: 'home', text: 'Mehr Farbe', named: true }, 'abc123', '2026-11-13', ID)
  assert.equal(entry.memberId, 'abc123')
})

test('feedbackDay follows the Berlin calendar day', () => {
  // 22:30 UTC is already the next day in Berlin in summer (UTC+2) and in winter (UTC+1) at 23:30.
  assert.equal(feedbackDay(Date.UTC(2026, 6, 1, 22, 30)), '2026-07-02')
  assert.equal(feedbackDay(Date.UTC(2026, 6, 1, 21, 30)), '2026-07-01')
  assert.equal(feedbackDay(Date.UTC(2026, 11, 1, 23, 30)), '2026-12-02')
  assert.equal(feedbackDay(Date.UTC(2026, 11, 1, 22, 30)), '2026-12-01')
})

test('entries expire twelve months after their day, counters after the day', () => {
  assert.equal(feedbackExpiry('2026-01-31').toISOString(), '2027-01-31T00:00:00.000Z')
  assert.equal(feedbackExpiry('2028-02-29').toISOString(), '2029-03-01T00:00:00.000Z')
  assert.equal(quotaExpiry('2026-11-13').toISOString(), '2026-11-14T00:00:00.000Z')
  assert.equal(quotaExpiry('2026-12-31').toISOString(), '2027-01-01T00:00:00.000Z')
  // The counter outlives the Berlin day in summer and winter, so a new day never meets an old count.
  assert.ok(quotaExpiry('2026-07-01').getTime() > Date.UTC(2026, 6, 1, 22, 0))
  assert.ok(quotaExpiry('2026-12-01').getTime() > Date.UTC(2026, 11, 1, 23, 0))
})

test('feedbackTaskTitle takes the first line and cuts long ones', () => {
  assert.equal(feedbackTaskTitle('Suche findet keine Rechnungen\nDetails folgen'), 'Website-Feedback: Suche findet keine Rechnungen')
  const long = feedbackTaskTitle(`${'Wort '.repeat(40)}🙂`)
  assert.ok(long.startsWith('Website-Feedback: Wort Wort'))
  assert.ok(long.endsWith('…'))
  assert.equal(Array.from(long.slice('Website-Feedback: '.length)).length <= 100, true)
  // Cutting by characters keeps an emoji whole at the end.
  const emoji = feedbackTaskTitle('🙂'.repeat(120))
  assert.equal(emoji, `Website-Feedback: ${'🙂'.repeat(99)}…`)
})

test('feedbackArea maps the current page to its area', () => {
  const paths = {
    home: '/mitglieder/',
    tasks: '/mitglieder/aufgaben',
    network: '/mitglieder/netzwerk',
    storage: '/mitglieder/ablage',
    signature: '/mitglieder/signatur',
  }
  assert.equal(feedbackArea('/mitglieder/', paths), 'home')
  assert.equal(feedbackArea('/mitglieder', paths), 'home')
  assert.equal(feedbackArea('/mitglieder/aufgaben', paths), 'tasks')
  assert.equal(feedbackArea('/mitglieder/netzwerk/alumni', paths), 'network')
  assert.equal(feedbackArea('/mitglieder/ablage/', paths), 'storage')
  assert.equal(feedbackArea('/mitglieder/signatur', paths), 'signature')
  assert.equal(feedbackArea('/mitglieder/verwaltung', paths), 'other')
  assert.equal(feedbackArea('/mitglieder/aufgabenliste', paths), 'other')
})
