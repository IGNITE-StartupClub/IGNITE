import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BADGE_PATH, isComplete, LIVE_ORIGIN, signatureHtml, type SignatureFields } from './emailSignature.ts'

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
  const html = signatureHtml(fields({ photo: 'https://example.org/me.jpg' }), text, links, '')
  const tables = html.match(/<table [^>]*>/g) ?? []
  assert.equal(tables.length, 2)
  for (const table of tables) assert.match(table, /width:auto;table-layout:auto;/)
})

test('shows only https photos', () => {
  const photo = 'https://example.org/me.jpg'
  assert.ok(signatureHtml(fields({ photo }), text, links, '').includes(`src="${photo}"`))
  assert.ok(!signatureHtml(fields({ photo: 'http://example.org/me.jpg' }), text, links, '').includes('me.jpg'))
  assert.ok(!signatureHtml(fields({ photo: 'javascript:alert(1)' }), text, links, '').includes('javascript:'))
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
