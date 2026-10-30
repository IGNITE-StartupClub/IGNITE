import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  hashPassword,
  hashToken,
  isAdminPath,
  isJsonRequest,
  isMemberRole,
  isProtectedPath,
  memberAreaLocale,
  memberPagePath,
  newToken,
  normalizeEmail,
  passwordProblem,
  verifyPassword,
} from './memberAuth.ts'

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

test('hashPassword salts every hash and verifyPassword accepts only the right password', async () => {
  const stored = await hashPassword('korrekt pferd batterie')
  assert.match(stored, /^scrypt\$32768\$8\$1\$[A-Za-z0-9_-]+\$[A-Za-z0-9_-]+$/)
  assert.ok(!stored.includes('korrekt'))
  assert.notEqual(stored, await hashPassword('korrekt pferd batterie'))
  assert.equal(await verifyPassword('korrekt pferd batterie', stored), true)
  assert.equal(await verifyPassword('korrekt pferd batteri', stored), false)
  assert.equal(await verifyPassword('', stored), false)
})

test('verifyPassword treats composed and decomposed umlauts alike', async () => {
  const stored = await hashPassword('Grüße aus Lüneburg')
  assert.equal(await verifyPassword('Grüße aus Lüneburg'.normalize('NFD'), stored), true)
})

test('verifyPassword rejects missing and malformed hashes', async () => {
  assert.equal(await verifyPassword('irgendein passwort', undefined), false)
  assert.equal(await verifyPassword('irgendein passwort', 'plain'), false)
  assert.equal(await verifyPassword('irgendein passwort', 'bcrypt$x$y$z$a$b'), false)
})

test('passwordProblem enforces length only', () => {
  assert.equal(passwordProblem('kurz'), 'tooShort')
  assert.equal(passwordProblem(undefined), 'tooShort')
  assert.equal(passwordProblem('a'.repeat(129)), 'tooLong')
  assert.equal(passwordProblem('nur kleinbuchstaben'), null)
  // Counts characters, not UTF-16 units: ten emoji are ten characters.
  assert.equal(passwordProblem('🔥'.repeat(10)), null)
})

test('isMemberRole accepts only known roles', () => {
  assert.equal(isMemberRole('admin'), true)
  assert.equal(isMemberRole('member'), true)
  assert.equal(isMemberRole('root'), false)
})

test('isProtectedPath covers the members area except login and password pages', () => {
  for (const path of ['/mitglieder', '/mitglieder/', '/mitglieder/signatur', '/mitglieder/verwaltung', '/en/members', '/en/members/x']) {
    assert.equal(isProtectedPath(path), true, path)
  }
  for (const path of ['/mitglieder/login', '/mitglieder/login/', '/mitglieder/passwort', '/en/members/login', '/en/members/password/', '/', '/mitgliederbereich', '/en/', '/materialien/']) {
    assert.equal(isProtectedPath(path), false, path)
  }
})

test('isAdminPath matches only the admin page in both languages', () => {
  assert.equal(isAdminPath('/mitglieder/verwaltung'), true)
  assert.equal(isAdminPath('/en/members/admin/'), true)
  assert.equal(isAdminPath('/mitglieder/'), false)
  assert.equal(isAdminPath('/mitglieder/verwaltung-alt'), false)
})

test('memberAreaLocale and memberPagePath map both languages', () => {
  assert.equal(memberAreaLocale('/mitglieder/login'), 'de')
  assert.equal(memberAreaLocale('/en/members/'), 'en')
  assert.equal(memberAreaLocale('/news/'), null)
  assert.equal(memberPagePath('login', 'de'), '/mitglieder/login')
  assert.equal(memberPagePath('password', 'en'), '/en/members/password')
  assert.equal(memberPagePath('admin', 'de'), '/mitglieder/verwaltung')
})

test('isJsonRequest requires an application/json content type', () => {
  assert.equal(isJsonRequest('application/json'), true)
  assert.equal(isJsonRequest('application/json; charset=utf-8'), true)
  assert.equal(isJsonRequest('text/plain'), false)
  assert.equal(isJsonRequest('application/x-www-form-urlencoded'), false)
  assert.equal(isJsonRequest(null), false)
})
