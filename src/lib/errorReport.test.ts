import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  errorEntry,
  errorGroups,
  errorPeriod,
  groupKey,
  groupStatus,
  MESSAGE_MAX,
  parseErrorAction,
  scrubMessage,
  STACK_LINES,
  STACK_MAX,
} from './errorReport.ts'

const at = (minute: number) => new Date(Date.UTC(2026, 10, 10, 9, minute))

test('email addresses in messages are replaced, so the log holds none', () => {
  assert.equal(
    scrubMessage('E11000 duplicate key error dup key: { email: "max.muster@stud.leuphana.de" }'),
    'E11000 duplicate key error dup key: { email: "<E-Mail>" }',
  )
  assert.equal(scrubMessage('to <a.b@c.de>, x@y.org failed'), 'to <<E-Mail>>, <E-Mail> failed')
  assert.equal(scrubMessage('no address @ all'), 'no address @ all')
})

test('long messages are cut', () => {
  const message = scrubMessage('x'.repeat(MESSAGE_MAX * 2))
  assert.equal(message.length, MESSAGE_MAX)
  assert.ok(message.endsWith('…'))
})

test('an entry keeps context, type, message and the top of the stack', () => {
  const error = new TypeError('Cannot read properties of null (reading "x") for a@b.de')
  const entry = errorEntry('Tasks action failed', error, at(0))
  assert.equal(entry.context, 'Tasks action failed')
  assert.equal(entry.name, 'TypeError')
  assert.equal(entry.message, 'Cannot read properties of null (reading "x") for <E-Mail>')
  assert.ok(entry.stack.startsWith('at '), entry.stack)
  assert.ok(entry.stack.split('\n').length <= STACK_LINES)
  const deep = new Error('deep')
  deep.stack = ['Error: deep', ...Array.from({ length: 20 }, (_, i) => `    at frame${i} (/var/task/${'a'.repeat(120)}.js:1:1)`)].join('\n')
  const kept = errorEntry('x', deep, at(0)).stack
  assert.equal(kept.split('\n').length, STACK_LINES)
  assert.ok(kept.length > MESSAGE_MAX && kept.length <= STACK_MAX)
  assert.deepEqual(entry.at, at(0))
})

test('something thrown that is no Error keeps its text', () => {
  const entry = errorEntry('MCP request failed', 'timeout', at(0))
  assert.deepEqual({ name: entry.name, message: entry.message, stack: entry.stack }, { name: 'string', message: 'timeout', stack: '' })
})

test('equal errors form one group with count and time span, the most frequent first', () => {
  const base = { name: 'Error', stack: '' }
  const groups = errorGroups([
    { ...base, context: 'Member login failed', message: 'timeout', at: at(5) },
    { ...base, context: 'CRM read failed', message: 'boom', at: at(1) },
    { ...base, context: 'Member login failed', message: 'timeout', at: at(2) },
    { ...base, context: 'Member login failed', message: 'timeout', at: at(9) },
    { ...base, context: 'Member login failed', message: 'other', at: at(3) },
  ])
  assert.deepEqual(
    groups.map(({ context, message, count, first, last }) => ({ context, message, count, first, last })),
    [
      { context: 'Member login failed', message: 'timeout', count: 3, first: at(2), last: at(9) },
      { context: 'Member login failed', message: 'other', count: 1, first: at(3), last: at(3) },
      { context: 'CRM read failed', message: 'boom', count: 1, first: at(1), last: at(1) },
    ],
  )
})

test('the period comes from ?tage=, anything unknown is seven days', () => {
  assert.equal(errorPeriod('1'), 1)
  assert.equal(errorPeriod('30'), 30)
  for (const param of [null, '', '0', '14', 'abc', '7.5']) assert.equal(errorPeriod(param), 7, String(param))
})

test('a group key depends on context, type and message only', () => {
  const key = groupKey({ context: 'CRM read failed', name: 'Error', message: 'boom' })
  assert.match(key, /^[0-9a-f]{16}$/)
  assert.equal(key, groupKey({ context: 'CRM read failed', name: 'Error', message: 'boom' }))
  assert.notEqual(key, groupKey({ context: 'CRM read failed', name: 'Error', message: 'bang' }))
  assert.notEqual(key, groupKey({ context: 'CRM read faile', name: 'dError', message: 'boom' }))
})

test('a group marked done stays done until a newer entry comes', () => {
  assert.equal(groupStatus(at(5), null), 'new')
  assert.equal(groupStatus(at(5), at(5)), 'resolved')
  assert.equal(groupStatus(at(5), at(9)), 'resolved')
  assert.equal(groupStatus(at(10), at(9)), 'again')
})

test('an error action names resolve or reopen and a group key, nothing else', () => {
  const key = '0123456789abcdef'
  assert.deepEqual(parseErrorAction({ action: 'resolve', key }), { action: 'resolve', key })
  assert.deepEqual(parseErrorAction({ action: 'reopen', key }), { action: 'reopen', key })
  for (const body of [null, [], {}, { action: 'delete', key }, { action: 'resolve', key: 'xyz' }, { action: 'resolve', key, all: true }]) {
    assert.equal(parseErrorAction(body), null, JSON.stringify(body))
  }
})
