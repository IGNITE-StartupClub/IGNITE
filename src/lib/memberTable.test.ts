import { test } from 'node:test'
import assert from 'node:assert/strict'
import { filterMembers, formatDateTime, memberStatus, relativeTime, toCsv, type TableMember } from './memberTable.ts'

const member = (overrides: Partial<TableMember>): TableMember => ({
  email: 'a@example.com',
  name: '',
  role: 'member',
  addedAt: '2026-01-01T00:00:00.000Z',
  lastLoginAt: '',
  hasPassword: true,
  locked: false,
  ...overrides,
})

test('memberStatus: a lock wins over a set password', () => {
  assert.equal(memberStatus(member({})), 'active')
  assert.equal(memberStatus(member({ hasPassword: false })), 'invited')
  assert.equal(memberStatus(member({ locked: true })), 'locked')
})

test('filterMembers matches address or name and both filters', () => {
  const list = [
    member({ email: 'anna@example.com', name: 'Anna Admin', role: 'admin' }),
    member({ email: 'ben@example.com', hasPassword: false }),
  ]
  assert.deepEqual(filterMembers(list, ' ADMIN ', 'all', 'all'), [list[0]])
  assert.deepEqual(filterMembers(list, 'ben@', 'all', 'all'), [list[1]])
  assert.deepEqual(filterMembers(list, '', 'admin', 'all'), [list[0]])
  assert.deepEqual(filterMembers(list, '', 'all', 'invited'), [list[1]])
  assert.deepEqual(filterMembers(list, 'anna', 'member', 'all'), [])
})

test('formatDateTime prints Berlin time on any server', () => {
  assert.equal(formatDateTime('2025-06-24T16:05:00.000Z', 'de'), '24. Juni 2025, 18:05')
  assert.equal(formatDateTime('2025-06-24T16:05:00.000Z', 'en'), '24 Jun 2025, 18:05')
})

test('relativeTime picks the largest whole unit', () => {
  const now = Date.parse('2026-10-30T12:00:00.000Z')
  const ago = (minutes: number) => new Date(now - minutes * 60_000).toISOString()
  assert.equal(relativeTime(ago(20), now, 'de'), 'Vor 20 Minuten')
  assert.equal(relativeTime(ago(24 * 60 + 5), now, 'de'), 'Gestern')
  assert.equal(relativeTime(ago(3 * 7 * 24 * 60), now, 'en'), '3 weeks ago')
  // A clock slightly ahead of the server's must not print a future time.
  assert.equal(relativeTime(ago(-1), now, 'en'), 'This minute')
})

test('toCsv quotes separators and defuses formulas', () => {
  const csv = toCsv(
    [
      ['E-Mail', 'Name'],
      ['a@example.com', '=HYPERLINK("x")'],
      ['b@example.com', 'Müller; Anna'],
    ],
    'de',
  )
  assert.equal(csv, '﻿E-Mail;Name\r\na@example.com;"\'=HYPERLINK(""x"")"\r\nb@example.com;"Müller; Anna"\r\n')
  assert.equal(toCsv([['a', 'b,c']], 'en'), '﻿a,"b,c"\r\n')
})
