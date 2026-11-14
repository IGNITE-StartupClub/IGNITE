import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseGuideRequest } from './guideRequest.ts'

const IDS = ['idee', 'pitch', 'team']
const valid = { packages: ['pitch'], name: 'Mia Muster', email: ' Mia@Example.de ', consent: true }

test('accepts the minimum and normalises the address', () => {
  const result = parseGuideRequest(valid, IDS)
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.request.email, 'mia@example.de')
  assert.equal(result.request.occupation, '')
  assert.equal(result.request.whatsapp, false)
  assert.equal(result.request.locale, 'de')
})

test('keeps packages in the site order', () => {
  const result = parseGuideRequest({ ...valid, packages: ['team', 'idee'] }, IDS)
  assert.ok(result.ok)
  if (result.ok) assert.deepEqual(result.request.packages, ['idee', 'team'])
})

test('refuses no, unknown or repeated packages', () => {
  for (const packages of [[], ['unknown'], ['pitch', 'unknown'], ['pitch', 'pitch'], 'pitch']) {
    assert.deepEqual(parseGuideRequest({ ...valid, packages }, IDS), { ok: false, problem: 'packages' })
  }
})

test('needs a name, a valid address and consent', () => {
  assert.equal(parseGuideRequest({ ...valid, name: '   ' }, IDS).ok, false)
  assert.equal(parseGuideRequest({ ...valid, name: 'x'.repeat(121) }, IDS).ok, false)
  assert.equal(parseGuideRequest({ ...valid, email: 'mia@' }, IDS).ok, false)
  assert.equal(parseGuideRequest({ ...valid, consent: 'yes' }, IDS).ok, false)
  assert.equal(parseGuideRequest({ ...valid, consent: undefined }, IDS).ok, false)
})

test('keeps only the details of the chosen occupation', () => {
  const details = { company: 'Acme', field: 'Vertrieb', university: 'Leuphana', program: 'BWL' }
  const work = parseGuideRequest({ ...valid, ...details, occupation: 'work' }, IDS)
  const study = parseGuideRequest({ ...valid, ...details, occupation: 'study' }, IDS)
  const other = parseGuideRequest({ ...valid, ...details, occupation: 'other' }, IDS)
  assert.ok(work.ok && study.ok && other.ok)
  if (!work.ok || !study.ok || !other.ok) return
  assert.deepEqual([work.request.company, work.request.field, work.request.university], ['Acme', 'Vertrieb', ''])
  assert.deepEqual([study.request.company, study.request.university, study.request.program], ['', 'Leuphana', 'BWL'])
  assert.deepEqual([other.request.company, other.request.university], ['', ''])
})

test('refuses an unknown occupation and overlong or non-text details', () => {
  assert.equal(parseGuideRequest({ ...valid, occupation: 'retired' }, IDS).ok, false)
  assert.equal(parseGuideRequest({ ...valid, occupation: 'work', company: 'x'.repeat(151) }, IDS).ok, false)
  assert.equal(parseGuideRequest({ ...valid, occupation: 'work', company: 42 }, IDS).ok, false)
})

test('refuses a filled honeypot', () => {
  assert.deepEqual(parseGuideRequest({ ...valid, website: 'http://spam' }, IDS), { ok: false, problem: 'honeypot' })
})

test('takes WhatsApp and locale only from exact values', () => {
  const result = parseGuideRequest({ ...valid, whatsapp: 'true', locale: 'fr' }, IDS)
  assert.ok(result.ok)
  if (result.ok) assert.deepEqual([result.request.whatsapp, result.request.locale], [false, 'de'])
  const english = parseGuideRequest({ ...valid, whatsapp: true, locale: 'en' }, IDS)
  assert.ok(english.ok)
  if (english.ok) assert.deepEqual([english.request.whatsapp, english.request.locale], [true, 'en'])
})
