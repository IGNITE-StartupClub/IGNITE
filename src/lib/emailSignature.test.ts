import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  BADGE_PATH,
  isComplete,
  isPhotoId,
  LIVE_ORIGIN,
  parseSignature,
  photoPath,
  SIGNATURE_MAX_LENGTH,
  signatureStorageKey,
  signatureHtml,
  type SignatureFields,
} from './emailSignature.ts'

const PHOTO_ID = 'a'.repeat(21) + '-_' + 'B'.repeat(20)

const text = {
  tagline: 'Tagline',
  namePlaceholder: 'Vorname Nachname',
  rolePlaceholder: 'Rolle',
  emailPlaceholder: 'name@example.org',
}
const links = [{ platform: 'Instagram', url: 'https://www.instagram.com/ignite.lueneburg/' }]
const fields = (overrides: Partial<SignatureFields> = {}): SignatureFields => ({
  name: 'Alex Beispiel',
  role: 'Events',
  email: 'alex@example.org',
  phone: '',
  photo: '',
  ...overrides,
})

test('escapes user input', () => {
  const html = signatureHtml(fields({ name: '<script>alert(1)</script>', role: 'A & "B"' }), text, links, '')
  assert.ok(!html.includes('<script>'))
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'))
  assert.ok(html.includes('A &amp; &quot;B&quot;'))
})

test('prefixes the badge with the given origin', () => {
  assert.ok(signatureHtml(fields(), text, links, '').includes(`src="${BADGE_PATH}"`))
  assert.ok(signatureHtml(fields(), text, links, LIVE_ORIGIN).includes(`src="${LIVE_ORIGIN}${BADGE_PATH}"`))
})

test('sizes every table to its content, whatever the host page sets for tables', () => {
  const html = signatureHtml(fields({ photo: photoPath(PHOTO_ID) }), text, links, '')
  const tables = html.match(/<table [^>]*>/g) ?? []
  assert.equal(tables.length, 2)
  for (const table of tables) assert.match(table, /width:auto;table-layout:auto;/)
})

test('shows only uploaded photos, from the given origin', () => {
  const photo = photoPath(PHOTO_ID)
  assert.ok(signatureHtml(fields({ photo }), text, links, '').includes(`src="${photo}"`))
  assert.ok(signatureHtml(fields({ photo }), text, links, LIVE_ORIGIN).includes(`src="${LIVE_ORIGIN}${photo}"`))
  for (const other of ['https://example.org/me.jpg', `${photo}"onerror="alert(1)`, photoPath('short'), 'javascript:alert(1)']) {
    assert.equal((signatureHtml(fields({ photo: other }), text, links, '').match(/<img /g) ?? []).length, 1, other)
  }
})

test('isPhotoId accepts only 43 base64url characters', () => {
  assert.ok(isPhotoId(PHOTO_ID))
  assert.ok(!isPhotoId(`${PHOTO_ID}x`))
  assert.ok(!isPhotoId('../../etc/passwd'))
})

test('links the phone number with digits only and omits it when empty', () => {
  assert.ok(signatureHtml(fields({ phone: '+49 (0) 151 234' }), text, links, '').includes('href="tel:+490151234"'))
  assert.ok(!signatureHtml(fields(), text, links, '').includes('tel:'))
})

test('falls back to placeholders for empty fields', () => {
  const html = signatureHtml(fields({ name: ' ', role: '', email: '' }), text, links, '')
  assert.ok(html.includes('Vorname Nachname'))
  assert.ok(html.includes('mailto:name@example.org'))
})

test('requires name, role and email', () => {
  assert.equal(isComplete(fields()), true)
  assert.equal(isComplete(fields({ role: '  ' })), false)
})

test('parseSignature keeps only complete, trimmed text fields', () => {
  const body = { name: ' Alex Beispiel ', role: 'Events', email: 'alex@example.org', phone: '', photo: '/x', admin: true }
  assert.deepEqual(parseSignature(body), { name: 'Alex Beispiel', role: 'Events', email: 'alex@example.org', phone: '' })
  assert.equal(parseSignature({ ...body, role: ' ' }), null)
  assert.equal(parseSignature({ ...body, phone: undefined }), null)
  assert.equal(parseSignature({ ...body, name: 'x'.repeat(SIGNATURE_MAX_LENGTH + 1) }), null)
  assert.equal(parseSignature({ ...body, email: 42 }), null)
  assert.equal(parseSignature(null), null)
})

test('lets contact lines wrap after a separator, never before it', () => {
  const html = signatureHtml(fields({ phone: '+49 151 0000000' }), text, links, '')
  assert.ok(html.includes('&nbsp;· </span>'))
  assert.ok(!html.includes('·&nbsp;'))
})

test('keeps one signature draft per account', () => {
  assert.notEqual(signatureStorageKey('a@example.org'), signatureStorageKey('b@example.org'))
  assert.equal(signatureStorageKey('a@example.org'), signatureStorageKey('a@example.org'))
})
