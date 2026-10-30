import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hashToken, isProtectedPath, memberAreaLocale, memberLoginPath, newToken, normalizeEmail } from './memberAuth.ts'

test('normalizeEmail trims and lowercases valid addresses', () => {
  assert.equal(normalizeEmail('  Max.Muster@Leuphana.DE '), 'max.muster@leuphana.de')
})

test('normalizeEmail rejects non-strings and implausible addresses', () => {
  for (const value of [undefined, 42, '', 'max', 'max@leuphana', 'a b@c.de', 'x'.repeat(250) + '@a.de']) {
    assert.equal(normalizeEmail(value), null, String(value))
  }
})

test('newToken returns distinct url-safe tokens', () => {
  const a = newToken()
  assert.match(a, /^[A-Za-z0-9_-]{43}$/)
  assert.notEqual(a, newToken())
})

test('hashToken is deterministic and does not contain the token', () => {
  const token = newToken()
  assert.equal(hashToken(token), hashToken(token))
  assert.match(hashToken(token), /^[0-9a-f]{64}$/)
  assert.ok(!hashToken(token).includes(token))
})

test('isProtectedPath covers the members area except its login pages', () => {
  for (const path of ['/mitglieder', '/mitglieder/', '/mitglieder/dokumente', '/en/members', '/en/members/x']) {
    assert.equal(isProtectedPath(path), true, path)
  }
  for (const path of ['/mitglieder/login', '/mitglieder/login/', '/en/members/login', '/', '/mitgliederbereich', '/en/', '/materialien/']) {
    assert.equal(isProtectedPath(path), false, path)
  }
})

test('memberAreaLocale and memberLoginPath map both languages', () => {
  assert.equal(memberAreaLocale('/mitglieder/login'), 'de')
  assert.equal(memberAreaLocale('/en/members/'), 'en')
  assert.equal(memberAreaLocale('/news/'), null)
  assert.equal(memberLoginPath('de'), '/mitglieder/login')
  assert.equal(memberLoginPath('en'), '/en/members/login')
})
