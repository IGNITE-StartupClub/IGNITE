import assert from 'node:assert/strict'
import { test } from 'node:test'
import { changedFields, changedSince, IDLE_MS, listRevision, REFRESH_MS, refreshDue, revisionOf } from './liveUpdates.ts'

const NOW = 1_000_000

test('refreshDue asks only on a visible page in use, and at most once per interval', () => {
  const moment = { now: NOW, lastCheck: NOW - REFRESH_MS, lastUse: NOW, hidden: false }
  assert.equal(refreshDue(moment), true)
  assert.equal(refreshDue({ ...moment, hidden: true }), false)
  assert.equal(refreshDue({ ...moment, lastUse: NOW - IDLE_MS }), false)
  assert.equal(refreshDue({ ...moment, lastCheck: NOW - REFRESH_MS + 1 }), false)
})

test('listRevision equals the revision of the collection, in whatever order the list came', () => {
  const list = [new Date(2000), new Date(5000), new Date(3000)].map((updatedAt) => ({ updatedAt }))
  assert.equal(listRevision(list), revisionOf(3, new Date(5000)))
  assert.equal(listRevision([]), revisionOf(0, null))
})

test('revisionOf changes with the latest change and with the number of records', () => {
  const at = new Date(5_000)
  assert.equal(revisionOf(3, at), '3.5000')
  assert.notEqual(revisionOf(3, at), revisionOf(2, at))
  assert.equal(revisionOf(0, null), '0.0')
})

test('changedSince reaches back a little behind the revision and refuses anything else', () => {
  assert.equal(changedSince('3.1000000')?.getTime(), 995_000)
  assert.equal(changedSince(undefined), null)
  assert.equal(changedSince('latest'), null)
  assert.equal(changedSince('3.' + '9'.repeat(16)), null)
  assert.equal(changedSince({ $gt: '' }), null)
})

test('changedFields keeps only what differs from the start, lists included', () => {
  const start = { title: 'A', due: '', flags: ['partner'] }
  assert.deepEqual(changedFields(start, { ...start }), {})
  assert.deepEqual(changedFields(start, { ...start, due: '2026-11-06' }), { due: '2026-11-06' })
  assert.deepEqual(changedFields(start, { ...start, flags: ['partner', 'sponsor'] }), { flags: ['partner', 'sponsor'] })
})
