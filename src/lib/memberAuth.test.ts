import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  CODE_LENGTH,
  codeKey,
  decodePhoto,
  hashCode,
  hashPassword,
  hashToken,
  isAdminPath,
  isListedAddress,
  isJsonRequest,
  isMemberRole,
  isProtectedApiPath,
  isProtectedPath,
  memberAreaLocale,
  memberPagePath,
  newCode,
  newToken,
  normalizeCode,
  normalizeEmail,
  PHOTO_MAX_BYTES,
  passwordKey,
  passwordProblem,
  sameDigest,
  verifyPassword,
} from './memberAuth.ts'

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')

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

const pepper = passwordKey('a'.repeat(64))

test('hashPassword salts every hash and verifyPassword accepts only the right password', async () => {
  const stored = await hashPassword('korrekt pferd batterie', pepper)
  assert.match(stored, /^scrypt-hmac\$32768\$8\$1\$[A-Za-z0-9_-]+\$[A-Za-z0-9_-]+$/)
  assert.ok(!stored.includes('korrekt'))
  assert.notEqual(stored, await hashPassword('korrekt pferd batterie', pepper))
  assert.equal(await verifyPassword('korrekt pferd batterie', stored, pepper), true)
  assert.equal(await verifyPassword('korrekt pferd batteri', stored, pepper), false)
  assert.equal(await verifyPassword('', stored, pepper), false)
})

test('verifyPassword needs the pepper the hash was made with', async () => {
  const stored = await hashPassword('korrekt pferd batterie', pepper)
  assert.equal(await verifyPassword('korrekt pferd batterie', stored, passwordKey('b'.repeat(64))), false)
})

test('passwordKey differs from codeKey for the same secret', () => {
  const secret = 'c'.repeat(64)
  assert.equal(passwordKey(secret).length, 32)
  assert.notDeepEqual(passwordKey(secret), codeKey(secret))
})

test('verifyPassword treats composed and decomposed umlauts alike', async () => {
  const stored = await hashPassword('Grüße aus Lüneburg', pepper)
  assert.equal(await verifyPassword('Grüße aus Lüneburg'.normalize('NFD'), stored, pepper), true)
})

test('verifyPassword rejects missing, malformed and unpeppered hashes', async () => {
  assert.equal(await verifyPassword('irgendein passwort', undefined, pepper), false)
  assert.equal(await verifyPassword('irgendein passwort', 'plain', pepper), false)
  assert.equal(await verifyPassword('irgendein passwort', 'bcrypt$x$y$z$a$b', pepper), false)
  assert.equal(await verifyPassword('irgendein passwort', 'scrypt$32768$8$1$c2FsdA$aGFzaA', pepper), false)
})

test('passwordProblem enforces length only', () => {
  assert.equal(passwordProblem('kurz'), 'tooShort')
  assert.equal(passwordProblem(undefined), 'tooShort')
  assert.equal(passwordProblem('a'.repeat(129)), 'tooLong')
  assert.equal(passwordProblem('nur kleinbuchstaben'), null)
  // Counts characters, not UTF-16 units: ten emoji are ten characters.
  assert.equal(passwordProblem('🔥'.repeat(10)), null)
})
test('newCode returns CODE_LENGTH digits, leading zeros included', () => {
  for (let i = 0; i < 200; i++) {
    assert.equal(normalizeCode(newCode()) !== null, true)
  }
  assert.equal(newCode().length, CODE_LENGTH)
})

test('normalizeCode accepts exactly the code length in digits and ignores spaces', () => {
  assert.equal(normalizeCode('042 917'), '042917')
  for (const value of [undefined, 42917, '', '04291', '0429170', '04291a', '-42917']) {
    assert.equal(normalizeCode(value), null, String(value))
  }
})

test('hashCode depends on code, address and key', () => {
  const key = codeKey('a'.repeat(64))
  const hash = hashCode('042917', 'max@leuphana.de', key)
  assert.match(hash, /^[0-9a-f]{64}$/)
  assert.equal(sameDigest(hash, hashCode('042917', 'max@leuphana.de', key)), true)
  assert.equal(sameDigest(hash, hashCode('042918', 'max@leuphana.de', key)), false)
  assert.equal(sameDigest(hash, hashCode('042917', 'eva@leuphana.de', key)), false)
  assert.equal(sameDigest(hash, hashCode('042917', 'max@leuphana.de', codeKey('b'.repeat(64)))), false)
})

test('isMemberRole accepts only known roles', () => {
  assert.equal(isMemberRole('admin'), true)
  assert.equal(isMemberRole('member'), true)
  assert.equal(isMemberRole('root'), false)
})

test('isProtectedPath covers the members area except the login page', () => {
  for (const path of ['/mitglieder', '/mitglieder/', '/mitglieder/signatur', '/mitglieder/verwaltung', '/mitglieder/passwort', '/en/members', '/en/members/x']) {
    assert.equal(isProtectedPath(path), true, path)
  }
  for (const path of ['/mitglieder/login', '/mitglieder/login/', '/en/members/login', '/', '/mitgliederbereich', '/en/', '/materialien/']) {
    assert.equal(isProtectedPath(path), false, path)
  }
})

test('isProtectedApiPath closes every member endpoint except the sign-in ones', () => {
  for (const path of ['/api/members/admin', '/api/members/contacts', '/api/members/contacts/42', '/api/members/']) {
    assert.equal(isProtectedApiPath(path), true, path)
  }
  for (const path of ['/api/members/login', '/api/members/code/', '/api/members/password', '/api/members/logout', '/api/contact', '/api/membersx']) {
    assert.equal(isProtectedApiPath(path), false, path)
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
  assert.equal(memberPagePath('signature', 'en'), '/en/members/signature')
  assert.equal(memberPagePath('admin', 'de'), '/mitglieder/verwaltung')
})

test('isJsonRequest requires an application/json content type', () => {
  assert.equal(isJsonRequest('application/json'), true)
  assert.equal(isJsonRequest('application/json; charset=utf-8'), true)
  assert.equal(isJsonRequest('text/plain'), false)
  assert.equal(isJsonRequest('application/x-www-form-urlencoded'), false)
  assert.equal(isJsonRequest(null), false)
})

test('decodePhoto accepts only JPEG data URLs up to PHOTO_MAX_BYTES', () => {
  const jpeg = (size: number) => Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(size - 5), Buffer.from([0xff, 0xd9])])
  const dataUrl = (bytes: Buffer, type = 'jpeg') => `data:image/${type};base64,${bytes.toString('base64')}`
  assert.deepEqual(decodePhoto(dataUrl(jpeg(1000))), jpeg(1000))
  assert.equal(decodePhoto(dataUrl(jpeg(PHOTO_MAX_BYTES + 1))), null)
  assert.equal(decodePhoto(dataUrl(jpeg(1000), 'png')), null)
  assert.equal(decodePhoto(dataUrl(Buffer.from('<svg onload="alert(1)"></svg>'))), null)
  assert.equal(decodePhoto(42), null)
})

test('isListedAddress matches the SHA-256 of the normalized address only', () => {
  const hashes = [sha256('other@leuphana.de'), sha256('max@leuphana.de')]
  assert.equal(isListedAddress('max@leuphana.de', hashes), true)
  assert.equal(isListedAddress('eva@leuphana.de', hashes), false)
  assert.equal(isListedAddress('max@leuphana.de', []), false)
})
