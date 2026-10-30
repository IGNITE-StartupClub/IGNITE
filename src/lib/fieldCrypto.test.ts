import { test } from 'node:test'
import assert from 'node:assert/strict'
import { emailFingerprint, fieldKeys, open, seal } from './fieldCrypto.ts'

const keys = fieldKeys('ab'.repeat(32))

test('seal and open round-trip, with a fresh IV each time', () => {
  const first = seal(keys, 'Anna Müller', 'crm_contacts', 'id-1', 'name')
  const second = seal(keys, 'Anna Müller', 'crm_contacts', 'id-1', 'name')
  assert.match(first, /^v1:[\w-]+:[\w-]+$/)
  assert.notEqual(first, second)
  assert.equal(open(keys, first, 'crm_contacts', 'id-1', 'name'), 'Anna Müller')
  assert.equal(open(keys, seal(keys, '', 'alumni', 'id-2', 'email'), 'alumni', 'id-2', 'email'), '')
})

test('a value only opens in its own record and field', () => {
  const sealed = seal(keys, 'anna@example.com', 'crm_contacts', 'id-1', 'email')
  assert.throws(() => open(keys, sealed, 'crm_contacts', 'id-2', 'email'))
  assert.throws(() => open(keys, sealed, 'crm_contacts', 'id-1', 'phone'))
  assert.throws(() => open(keys, sealed, 'alumni', 'id-1', 'email'))
})

test('changed values, other keys and plain text fail loudly', () => {
  const sealed = seal(keys, 'secret', 'alumni', 'id', 'about')
  const flipped = sealed.slice(0, -2) + (sealed.endsWith('A') ? 'BA' : 'AA')
  assert.throws(() => open(keys, flipped, 'alumni', 'id', 'about'))
  assert.throws(() => open(fieldKeys('cd'.repeat(32)), sealed, 'alumni', 'id', 'about'))
  assert.throws(() => open(keys, 'Anna Müller', 'alumni', 'id', 'name'))
  assert.throws(() => open(keys, sealed.replace(/^v1/, 'v9'), 'alumni', 'id', 'about'))
})

test('fieldKeys rejects a missing or short secret', () => {
  assert.throws(() => fieldKeys(undefined))
  assert.throws(() => fieldKeys('abc'))
})

test('emailFingerprint ignores case and spaces and depends on the key', () => {
  assert.equal(emailFingerprint(keys, ' Anna@Example.com '), emailFingerprint(keys, 'anna@example.com'))
  assert.notEqual(emailFingerprint(keys, 'anna@example.com'), emailFingerprint(keys, 'ben@example.com'))
  assert.notEqual(
    emailFingerprint(keys, 'anna@example.com'),
    emailFingerprint(fieldKeys('cd'.repeat(32)), 'anna@example.com'),
  )
})
