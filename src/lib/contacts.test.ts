import { test } from 'node:test'
import assert from 'node:assert/strict'
import { berlinDay, formatDay, initials } from './contacts.ts'

test('day helpers use Berlin dates', () => {
  assert.equal(berlinDay(Date.parse('2026-10-30T23:30:00Z')), '2026-10-31')
  assert.equal(formatDay('2025-06-24', 'de'), '24. Juni 2025')
  assert.equal(formatDay('2025-06-24', 'en'), '24 Jun 2025')
  assert.equal(initials('Anna Maria Beispiel'), 'AB')
  assert.equal(initials('anna'), 'a')
})
