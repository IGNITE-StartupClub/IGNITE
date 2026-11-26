import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  allowedPatch,
  byName,
  currentSemester,
  filterPeople,
  groupPeople,
  mayDelete,
  mayEdit,
  mayRecordConsent,
  mayView,
  monthLabel,
  NO_FILTERS,
  parseEntry,
  parseNewPerson,
  parseOrg,
  parsePersonPatch,
  parseTag,
  publicView,
  seedTagId,
  semesterStartsBetween,
  tagKey,
  viewFor,
  type ListedPerson,
  type Viewer,
} from './network.ts'

const member: Viewer = { id: 'm1', role: 'member', position: 'member' }
const teamlead: Viewer = { id: 'm2', role: 'member', position: 'teamlead' }
const board: Viewer = { id: 'm3', role: 'member', position: 'board' }
const admin: Viewer = { id: 'm4', role: 'admin', position: 'member' }
const alumnus: Viewer = { id: 'm5', role: 'member', position: 'alumni' }

test('visibility levels follow the position, admins see everything', () => {
  assert.equal(mayView('members', member), true)
  assert.equal(mayView('leads', member), false)
  assert.equal(mayView('leads', teamlead), true)
  assert.equal(mayView('board', teamlead), false)
  assert.equal(mayView('board', board), true)
  assert.equal(mayView('hidden', board), false)
  assert.equal(mayView('hidden', admin), true)
  assert.equal(mayView('members', alumnus), true)
  assert.equal(mayView('leads', alumnus), false)
})

test('a new external contact needs a first name and where we know them from', () => {
  assert.equal(parseNewPerson({ kind: 'external', firstName: 'Anna' }), null)
  assert.equal(parseNewPerson({ kind: 'external', source: 'Pitch Night' }), null)
  const parsed = parseNewPerson({ kind: 'external', firstName: ' Anna ', lastName: 'Beispiel', source: 'Pitch Night', relations: ['sponsor'] })
  assert.deepEqual(parsed, { kind: 'external', fields: { firstName: 'Anna', lastName: 'Beispiel', source: 'Pitch Night', relations: ['sponsor'] } })
  assert.equal(parseNewPerson({ kind: 'member', firstName: 'Anna' }), null)
  assert.equal(parseNewPerson({ kind: 'alumni', firstName: 'Ben' }), null)
  assert.ok(parseNewPerson({ kind: 'alumni', firstName: 'Ben', listed: true }))
})

test('patches only take the fields of the kind and valid values', () => {
  assert.equal(parsePersonPatch({ team: 'ignite-hr' }, 'external'), null)
  assert.equal(parsePersonPatch({ source: 'x' }, 'member'), null)
  assert.deepEqual(parsePersonPatch({ semester: '3' }, 'member'), { semester: 3 })
  assert.equal(parsePersonPatch({ semester: 0 }, 'member'), null)
  assert.equal(parsePersonPatch({ memberSince: '2025-13' }, 'member'), null)
  assert.deepEqual(parsePersonPatch({ memberSince: '2025-03' }, 'member'), { memberSince: '2025-03' })
  assert.equal(parsePersonPatch({ answers: { unknown: 'x' } }, 'member'), null)
  assert.deepEqual(parsePersonPatch({ answers: { motto: ' Läuft ' } }, 'member'), { answers: { motto: 'Läuft' } })
  assert.equal(parsePersonPatch({ igniteFrom: 2022, igniteTo: 2020 }, 'alumni'), null)
  assert.equal(parsePersonPatch({}, 'member'), null)
  assert.equal(parsePersonPatch({ firstName: '' }, 'member'), null)
})

test('contact links are checked and normalised', () => {
  assert.deepEqual(parsePersonPatch({ linkedin: 'linkedin.com/in/anna' }, 'member'), { linkedin: 'https://linkedin.com/in/anna' })
  assert.equal(parsePersonPatch({ linkedin: 'https://evil.com/linkedin.com' }, 'member'), null)
  assert.deepEqual(parsePersonPatch({ instagram: '@anna.b' }, 'member'), { instagram: 'https://www.instagram.com/anna.b/' })
  assert.deepEqual(parsePersonPatch({ website: 'fairtrail.de' }, 'external'), { website: 'https://fairtrail.de/' })
  assert.equal(parsePersonPatch({ website: 'https://user:pw@fairtrail.de' }, 'external'), null)
  assert.equal(parsePersonPatch({ email: 'no-address' }, 'member'), null)
  assert.equal(parsePersonPatch({ phone: '+49 (0) 123-45' }, 'member')?.phone, '+49 (0) 123-45')
})

test('visibility settings only take known fields and allowed levels', () => {
  assert.deepEqual(parsePersonPatch({ vis: { headline: 'public' } }, 'alumni'), { vis: { headline: 'public' } })
  assert.equal(parsePersonPatch({ vis: { phone: 'public' } }, 'external'), null)
  assert.deepEqual(parsePersonPatch({ vis: { phone: 'board' } }, 'external'), { vis: { phone: 'board' } })
  assert.equal(parsePersonPatch({ vis: { firstName: 'board' } }, 'external'), null)
})

const contact = { kind: 'external' as const, memberId: null, createdBy: 'm1' }
const alumniByHand = { kind: 'alumni' as const, memberId: null, createdBy: 'm1' }
const ownProfile = { kind: 'member' as const, memberId: 'm1', createdBy: 'm1' }

test('who edits and deletes whom', () => {
  assert.equal(mayEdit(contact, teamlead), true)
  assert.equal(mayEdit(contact, alumnus), false)
  assert.equal(mayEdit(ownProfile, member), true)
  assert.equal(mayEdit(ownProfile, board), false)
  assert.equal(mayEdit(ownProfile, admin), true)
  assert.equal(mayEdit(alumniByHand, teamlead), false)
  assert.equal(mayEdit(alumniByHand, member), true)
  assert.equal(mayEdit(alumniByHand, board), true)
  assert.equal(mayEdit({ kind: 'alumni', memberId: 'm5', createdBy: 'm5' }, alumnus), true)
  assert.equal(mayDelete(contact, member), true)
  assert.equal(mayDelete(contact, teamlead), false)
  assert.equal(mayDelete(contact, admin), true)
  assert.equal(mayDelete(ownProfile, admin), false)
})

test('consent comes from the person when they have a login', () => {
  assert.equal(mayRecordConsent(ownProfile, member, false), true)
  assert.equal(mayRecordConsent(ownProfile, admin, false), false)
  assert.equal(mayRecordConsent(ownProfile, admin, true), true)
  assert.equal(mayRecordConsent(contact, teamlead, false), true)
})

test('a patch never writes fields the viewer cannot see', () => {
  const stored = { ...contact, vis: { phone: 'board' as const } }
  assert.deepEqual(allowedPatch({ phone: '123', email: 'a@b.de' }, stored, member), { email: 'a@b.de' })
  assert.deepEqual(allowedPatch({ phone: '123' }, stored, board), { phone: '123' })
  assert.deepEqual(allowedPatch({ vis: { phone: 'members', email: 'leads' } }, stored, member), { vis: { email: 'leads' } })
  assert.deepEqual(allowedPatch({ nextStep: 'Anrufen' }, stored, alumnus), {})
})

test('the view empties hidden fields, names their level and drops the CRM for alumni', () => {
  const person = {
    ...contact,
    firstName: 'Anna',
    phone: '123',
    email: 'a@b.de',
    linkedin: '',
    nextStep: 'Anrufen',
    vis: { phone: 'board' as const, linkedin: 'board' as const },
  }
  const seen = viewFor(person, member)
  assert.equal(seen.phone, '')
  assert.equal(seen.email, 'a@b.de')
  assert.deepEqual(seen.locked, { phone: 'board' })
  assert.equal(seen.nextStep, 'Anrufen')
  assert.equal(viewFor(person, board).phone, '123')
  assert.equal('nextStep' in viewFor(person, alumnus), false)
  const own = viewFor({ ...person, memberId: 'm1', kind: 'member' as const }, member)
  assert.equal(own.phone, '123')
})

test('the public view needs consent and shows only public base fields', () => {
  const person = { firstName: 'Ben', lastName: 'A', headline: 'Gründer', email: 'b@a.de', vis: { headline: 'public' as const }, consentAt: null }
  assert.equal(publicView(person), null)
  const shown = publicView({ ...person, consentAt: '2026-11-24T10:00:00Z', igniteRole: 'Marketing' })!
  assert.equal(shown.headline, 'Gründer')
  assert.equal(shown.igniteRole, '')
  assert.equal('email' in shown, false)
})

test('semesters count on at 1 April and 1 October', () => {
  assert.equal(semesterStartsBetween('2026-03-31', '2026-04-01'), 1)
  assert.equal(semesterStartsBetween('2026-04-01', '2026-04-01'), 0)
  assert.equal(semesterStartsBetween('2025-11-01', '2027-04-02'), 3)
  assert.equal(currentSemester(3, '2026-05-01', '2026-11-24'), 4)
  assert.equal(currentSemester(null, '2026-05-01', '2026-11-24'), null)
  assert.equal(monthLabel('2025-03'), '03/2025')
})

const people: ListedPerson[] = [
  { id: '1', kind: 'member', firstName: 'Lena', lastName: 'Zett', team: 'ignite-hr', position: 'teamlead', major: 'BWL', tags: ['t-ki'] },
  { id: '2', kind: 'member', firstName: 'Anna', lastName: 'Berg', team: 'ignite-marketing', position: 'member', major: 'Kultur', tags: ['t-nh', 't-music'] },
  { id: '3', kind: 'member', firstName: 'Anna', lastName: 'Alt', position: 'board', tags: ['t-ki', 't-music'] },
  { id: '4', kind: 'alumni', firstName: 'Ben', lastName: 'Ex', openFor: ['mentoring'] },
  { id: '5', kind: 'external', firstName: 'Carla', lastName: 'Kunde', relations: ['sponsor'], organizationId: 'o1', nextStep: 'Anrufen', nextDue: '2026-11-01' },
]
const context = { tagLabels: { 't-ki': 'Künstliche Intelligenz', 't-nh': 'Nachhaltigkeit', 't-music': 'Musik' }, orgNames: { o1: 'Fairtrail' }, today: '2026-11-24' }

test('sorting goes by first name, then last name', () => {
  assert.deepEqual([...people].sort(byName).map((p) => p.id), ['3', '2', '4', '5', '1'])
})

test('filters: OR inside a filter, AND across filters and tag categories', () => {
  const ids = (filters: Partial<typeof NO_FILTERS>) => filterPeople(people, { ...NO_FILTERS, ...filters }, context).map((p) => p.id)
  assert.deepEqual(ids({ teams: ['ignite-hr', 'ignite-marketing'] }), ['1', '2'])
  assert.deepEqual(ids({ tags: { interests: ['t-ki', 't-nh'] } }), ['1', '2', '3'])
  assert.deepEqual(ids({ tags: { interests: ['t-ki'], hobbies: ['t-music'] } }), ['3'])
  assert.deepEqual(ids({ kinds: ['member'], positions: ['board'] }), ['3'])
  assert.deepEqual(ids({ relations: ['sponsor'] }), ['5'])
  assert.deepEqual(ids({ dueOnly: true }), ['5'])
  assert.deepEqual(ids({ query: 'fairtrail' }), ['5'])
  assert.deepEqual(ids({ query: 'intelligenz' }), ['1', '3'])
  assert.deepEqual(ids({ openFor: ['mentoring'] }), ['4'])
})

test('grouping rearranges without dropping anyone', () => {
  const groups = groupPeople(people, 'team', ['ignite-marketing', 'ignite-hr'])
  assert.deepEqual(groups.map((g) => g.key), ['board', 'ignite-marketing', 'ignite-hr', 'alumni', 'external'])
  assert.equal(groups.flatMap((g) => g.people).length, people.length)
  assert.deepEqual(groupPeople(people, 'kind', []).map((g) => g.key), ['member', 'alumni', 'external'])
})

test('tags, organisations and entries are parsed', () => {
  assert.deepEqual(parseTag({ category: 'skills', label: '  Video   Schnitt ' }), { category: 'skills', label: 'Video Schnitt' })
  assert.equal(parseTag({ category: 'colors', label: 'Blau' }), null)
  assert.equal(parseTag({ category: 'skills', label: 'x' }), null)
  assert.equal(tagKey(' KI '), tagKey('ki'))
  assert.equal(seedTagId('interests', 'Künstliche Intelligenz'), 'seed-interests-kunstliche-intelligenz')
  assert.equal(parseOrg({ relations: ['partner'] }, true), null)
  assert.deepEqual(parseOrg({ name: 'EMN', relations: ['partner'], website: 'europeanmentorshipnetwork.com' }, true), {
    name: 'EMN',
    relations: ['partner'],
    website: 'https://europeanmentorshipnetwork.com/',
  })
  assert.equal(parseOrg({ evil: 1 }, false), null)
  assert.equal(parseEntry({ type: 'note', date: '2026-02-30', text: 'x' }), null)
  assert.deepEqual(parseEntry({ type: 'mail', date: '2026-11-24', text: 'Hallo' }), { type: 'mail', date: '2026-11-24', text: 'Hallo' })
})
