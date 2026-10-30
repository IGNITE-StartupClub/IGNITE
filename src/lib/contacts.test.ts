import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  berlinDay,
  filterAlumni,
  filterContacts,
  formatDay,
  initials,
  isDue,
  parseAlumni,
  parseContact,
  parseEntry,
  type AlumniFields,
  type ContactFields,
} from './contacts.ts'

const contact = (overrides: Partial<ContactFields & { entries: { text: string }[] }> = {}) => ({
  name: 'Anna Beispiel',
  organization: 'Fairtrail',
  role: 'CEO',
  flags: [],
  email: '',
  phone: '',
  linkedin: '',
  owner: '',
  source: 'Pitch Night 2026',
  nextStep: '',
  nextDue: '',
  entries: [] as { text: string }[],
  ...overrides,
})

const alumni = (overrides: Partial<AlumniFields> = {}): AlumniFields => ({
  name: 'Ben Alumni',
  now: 'Gründer, Solarwerk',
  igniteFrom: 2019,
  igniteTo: 2022,
  city: 'Hamburg',
  industry: 'sustainability',
  status: 'founder',
  help: ['mentoring'],
  about: '',
  linkedin: '',
  email: '',
  open: true,
  ...overrides,
})

test('parseContact requires a name and the source, trims and normalises', () => {
  assert.deepEqual(
    parseContact({
      name: '  Anna ',
      source: 'Messe',
      flags: ['sponsor', 'partner'],
      email: 'Anna@Example.com',
      linkedin: 'linkedin.com/in/anna',
    }),
    {
      name: 'Anna',
      organization: '',
      role: '',
      // In the order of CRM_FLAGS, without duplicates.
      flags: ['partner', 'sponsor'],
      email: 'anna@example.com',
      phone: '',
      linkedin: 'https://linkedin.com/in/anna',
      owner: '',
      source: 'Messe',
      nextStep: '',
      nextDue: '',
    },
  )
  assert.equal(parseContact({ name: 'Anna' }), null)
  assert.equal(parseContact({ name: ' ', source: 'Messe' }), null)
  assert.equal(parseContact({ name: 'Anna', source: 'Messe', flags: ['vip'] }), null)
  assert.equal(parseContact({ name: 'Anna', source: 'Messe', email: 'no-address' }), null)
  assert.equal(parseContact({ name: 'Anna', source: 'Messe', nextDue: '2026-02-30' }), null)
  assert.equal(parseContact({ name: 'x'.repeat(101), source: 'Messe' }), null)
  assert.equal(parseContact('Anna'), null)
})

test('only https LinkedIn links pass', () => {
  const link = (linkedin: string) => parseContact({ name: 'A', source: 'B', linkedin })?.linkedin ?? null
  assert.equal(
    link('https://www.linkedin.com/company/ignite-leuphana'),
    'https://www.linkedin.com/company/ignite-leuphana',
  )
  assert.equal(link('https://linkedin.com.evil.example/in/a'), null)
  assert.equal(link('javascript:alert(1)'), null)
  assert.equal(link('http://www.linkedin.com/in/a'), null)
})

test('parseEntry needs a known type, a real day and text', () => {
  assert.deepEqual(parseEntry({ type: 'meeting', date: '2026-10-30', text: ' Call ' }), {
    type: 'meeting',
    date: '2026-10-30',
    text: 'Call',
  })
  assert.equal(parseEntry({ type: 'done', date: '2026-10-30', text: 'x' }), null)
  assert.equal(parseEntry({ type: 'note', date: '', text: 'x' }), null)
  assert.equal(parseEntry({ type: 'note', date: '2026-10-30', text: '' }), null)
})

test('parseAlumni requires consent and a sensible IGNITE time', () => {
  const input = { name: 'Ben', igniteFrom: '2019', igniteTo: 2022, help: ['pitch'], open: true, consent: true }
  assert.equal(parseAlumni(input)?.igniteFrom, 2019)
  assert.equal(parseAlumni({ ...input, consent: undefined }), null)
  assert.equal(parseAlumni({ ...input, consent: 'yes' }), null)
  assert.equal(parseAlumni({ ...input, igniteTo: 2018 }), null)
  assert.equal(parseAlumni({ ...input, industry: 'crypto' }), null)
  assert.equal(parseAlumni({ ...input, open: undefined }), null)
})

test('isDue and filterContacts', () => {
  const today = '2026-10-30'
  assert.equal(isDue({ nextStep: 'Anrufen', nextDue: '2026-10-30' }, today), true)
  assert.equal(isDue({ nextStep: 'Anrufen', nextDue: '2026-10-31' }, today), false)
  assert.equal(isDue({ nextStep: '', nextDue: '2026-10-01' }, today), false)

  const list = [
    contact({ name: 'Anna', flags: ['sponsor'], nextStep: 'Anrufen', nextDue: '2026-10-01' }),
    contact({
      name: 'Ben',
      organization: 'Uni',
      flags: ['partner', 'university'],
      entries: [{ text: 'Vertrag besprochen' }],
    }),
  ]
  assert.deepEqual(filterContacts(list, '', ['sponsor', 'partner'], false, today), list)
  assert.deepEqual(filterContacts(list, '', ['university'], false, today), [list[1]])
  assert.deepEqual(filterContacts(list, '', [], true, today), [list[0]])
  assert.deepEqual(filterContacts(list, 'VERTRAG', [], false, today), [list[1]])
  assert.deepEqual(filterContacts(list, 'anna', ['partner'], false, today), [])
})

test('filterAlumni: one match per group, every group', () => {
  const list = [
    alumni({ name: 'Ben', help: ['mentoring', 'pitch'] }),
    alumni({ name: 'Cara', city: 'Berlin', industry: 'fintech', status: 'investor', help: ['funding'] }),
  ]
  const none = { help: [], industry: [], status: [] }
  assert.deepEqual(filterAlumni(list, '', { ...none, help: ['pitch', 'funding'] }), list)
  assert.deepEqual(filterAlumni(list, '', { ...none, help: ['funding'], status: ['founder'] }), [])
  assert.deepEqual(filterAlumni(list, 'berlin', none), [list[1]])
})

test('day helpers use Berlin dates', () => {
  assert.equal(berlinDay(Date.parse('2026-10-30T23:30:00Z')), '2026-10-31')
  assert.equal(formatDay('2025-06-24', 'de'), '24. Juni 2025')
  assert.equal(formatDay('2025-06-24', 'en'), '24 Jun 2025')
  assert.equal(initials('Anna Maria Beispiel'), 'AB')
  assert.equal(initials('anna'), 'a')
})
