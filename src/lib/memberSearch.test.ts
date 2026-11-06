import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  buildSearchIndex,
  captureTask,
  completeToken,
  dueFrom,
  dueLabel,
  openToken,
  searchGroups,
  searchMode,
  suggestions,
  tokenToComplete,
  type SearchItem,
  type SearchMember,
  type SearchTeam,
} from './memberSearch.ts'

// A Friday.
const TODAY = '2026-11-06'
const lena: SearchMember = { id: 'lena', name: 'Lena Meyer', team: 'ignite-marketing' }
const lenaB: SearchMember = { id: 'lena-b', name: 'Lena Brandt', team: 'ignite-hr' }
const tim: SearchMember = { id: 'tim', name: 'Tim Becker', team: 'ignite-relations' }
const me: SearchMember = { id: 'me', name: 'Paula Kern', team: 'ignite-infrastructure' }
const members = [lena, lenaB, tim, me]
const teams: SearchTeam[] = [
  { id: 'ignite-relations', name: 'Relations & Cooperations' },
  { id: 'ignite-marketing', name: 'Marketing' },
  { id: 'ignite-hr', name: 'Human Resources' },
]
const capture = (text: string) => captureTask(text, { members, teams, me: me.id, today: TODAY })

const item = (kind: SearchItem['kind'], title: string, fields: Partial<SearchItem> = {}): SearchItem => ({
  kind,
  id: title,
  title,
  meta: '',
  url: '/x',
  ...fields,
})

test('searchMode reads the first character', () => {
  assert.equal(searchMode(''), 'empty')
  assert.equal(searchMode('   '), 'empty')
  assert.equal(searchMode('open'), 'search')
  assert.equal(searchMode('+ Flyer'), 'task')
  assert.equal(searchMode('+'), 'task')
  assert.equal(searchMode('  @lena'), 'people')
})

test('dueFrom reads weekdays as the next such day', () => {
  assert.equal(dueFrom('mi', TODAY), '2026-11-11')
  assert.equal(dueFrom('Montag', TODAY), '2026-11-09')
  assert.equal(dueFrom('wed', TODAY), '2026-11-11')
  // Today is a Friday, so "bis Fr" means next week; "heute" says today.
  assert.equal(dueFrom('fr', TODAY), '2026-11-13')
  assert.equal(dueFrom('heute', TODAY), TODAY)
  assert.equal(dueFrom('morgen', TODAY), '2026-11-07')
  assert.equal(dueFrom('tomorrow', TODAY), '2026-11-07')
})

test('dueFrom reads dates and rolls a past one into next year', () => {
  assert.equal(dueFrom('12.11.', TODAY), '2026-11-12')
  assert.equal(dueFrom('3.1.', TODAY), '2027-01-03')
  assert.equal(dueFrom('3.1.2028', TODAY), '2028-01-03')
  assert.equal(dueFrom('31.2.', TODAY), '')
  assert.equal(dueFrom('Freibier', TODAY), '')
})

test('dueFrom reads day and month without a closing dot', () => {
  assert.equal(dueFrom('17.11', TODAY), '2026-11-17')
  assert.equal(dueFrom('3.1', TODAY), '2027-01-03')
  assert.equal(dueFrom('31.2', TODAY), '')
})

test('dueFrom reads a year with two or four digits', () => {
  assert.equal(dueFrom('17.11.26', TODAY), '2026-11-17')
  assert.equal(dueFrom('17.11.2027', TODAY), '2027-11-17')
  assert.equal(dueFrom('17.11.202', TODAY), '')
})

test('dueFrom reads month names in German and English', () => {
  assert.equal(dueFrom('17. November', TODAY), '2026-11-17')
  assert.equal(dueFrom('17 Nov.', TODAY), '2026-11-17')
  assert.equal(dueFrom('3. März 2028', TODAY), '2028-03-03')
  assert.equal(dueFrom('3 march', TODAY), '2027-03-03')
  assert.equal(dueFrom('17. Flyer', TODAY), '')
})

test('captureTask takes a date behind bis out of the title', () => {
  for (const [text, due] of [
    ['+ Aufgabenbereich beenden bis 17.11', '2026-11-17'],
    ['+ Aufgabenbereich beenden bis 17.11.', '2026-11-17'],
    ['+ Aufgabenbereich beenden bis 17.11.27', '2027-11-17'],
    ['+ Aufgabenbereich beenden bis 17. November', '2026-11-17'],
    ['+ Aufgabenbereich beenden bis 17. Nov 2027', '2027-11-17'],
  ]) {
    const task = capture(text)
    assert.equal(task.title, 'Aufgabenbereich beenden', text)
    assert.equal(task.due, due, text)
  }
})

test('captureTask reads text after a named date as title', () => {
  const task = capture('+ bis 17. Mai 20 Flyer drucken @Tim')
  assert.equal(task.title, '20 Flyer drucken')
  assert.equal(task.due, '2027-05-17')
})

test('captureTask leaves a time in the title', () => {
  const task = capture('+ Anrufen bis 10.05 Uhr')
  assert.equal(task.title, 'Anrufen bis 10.05 Uhr')
  assert.equal(task.due, '')
})

test('dueLabel names the year only when it is not this one', () => {
  assert.equal(dueLabel('2026-11-17', TODAY, 'de'), 'Di, 17. Nov.')
  assert.equal(dueLabel('2027-11-17', TODAY, 'de'), 'Mi, 17. Nov. 2027')
  assert.equal(dueLabel('2027-11-17', TODAY, 'en'), 'Wed, 17 Nov 2027')
})

test('captureTask splits title, deadline, person and team', () => {
  const task = capture('+ Flyer fürs Open Weekly drucken bis Mi @Lena-Meyer #Marketing')
  assert.equal(task.title, 'Flyer fürs Open Weekly drucken')
  assert.equal(task.due, '2026-11-11')
  assert.deepEqual(
    task.assignees.map(({ id }) => id),
    ['lena'],
  )
  assert.equal(task.team, 'ignite-marketing')
  assert.deepEqual(task.problems, [])
})

test('captureTask defaults to the member and their team', () => {
  const task = capture('+ Protokoll schreiben')
  assert.deepEqual(
    task.assignees.map(({ id }) => id),
    ['me'],
  )
  assert.equal(task.team, 'ignite-infrastructure')
  assert.equal(task.due, '')
})

test('captureTask follows the team of the first person unless a team is named', () => {
  assert.equal(capture('+ Anrufen @Tim').team, 'ignite-relations')
  assert.equal(capture('+ Anrufen @Tim #Marketing').team, 'ignite-marketing')
})

test('captureTask takes several people once each', () => {
  const task = capture('+ Aufbau @Tim @Paula @tim')
  assert.deepEqual(
    task.assignees.map(({ id }) => id),
    ['tim', 'me'],
  )
})

test('captureTask reports unknown and ambiguous people instead of guessing', () => {
  assert.deepEqual(capture('+ Anrufen @Lena').problems, [{ kind: 'ambiguousPerson', token: 'Lena' }])
  assert.deepEqual(capture('+ Anrufen @Zoe').problems, [{ kind: 'unknownPerson', token: 'Zoe' }])
  assert.deepEqual(capture('+ Anrufen #Vertrieb').problems, [{ kind: 'unknownTeam', token: 'Vertrieb' }])
})

test('captureTask matches names without accents, by last name and teams by initials', () => {
  const task = captureTask('+ Test @jose #hr', {
    members: [{ id: 'j', name: 'José Pérez', team: '' }],
    teams,
    me: 'j',
    today: TODAY,
  })
  assert.deepEqual(
    task.assignees.map(({ id }) => id),
    ['j'],
  )
  assert.equal(task.team, 'ignite-hr')
  assert.deepEqual(
    capture('+ Test @becker').assignees.map(({ id }) => id),
    ['tim'],
  )
})

test('captureTask leaves addresses, numbers and other text in the title', () => {
  const task = capture('+ Mail an a@b.de wegen Flyer #2 bis 12 Uhr')
  assert.equal(task.title, 'Mail an a@b.de wegen Flyer #2 bis 12 Uhr')
  assert.equal(task.due, '')
  assert.deepEqual(task.problems, [])
})

test('captureTask drops a marker that has no name yet', () => {
  assert.equal(capture('+ Flyer @').title, 'Flyer')
  assert.equal(capture('+ Flyer #').title, 'Flyer')
})

test('captureTask refuses a title longer than a task allows', () => {
  assert.deepEqual(capture(`+ ${'x'.repeat(201)}`).problems, [{ kind: 'tooLong', token: '' }])
})

test('openToken finds the word still being typed', () => {
  assert.deepEqual(openToken('+ Flyer @Le'), { marker: '@', word: 'Le' })
  assert.deepEqual(openToken('+ Flyer #'), { marker: '#', word: '' })
  assert.equal(openToken('+ Flyer @Lena '), null)
  assert.equal(openToken('+ Mail an a@b'), null)
})

test('suggestions offer members and teams for the open token', () => {
  assert.deepEqual(
    suggestions(openToken('+ @le'), members, teams).map(({ label }) => label),
    ['Lena Brandt', 'Lena Meyer'],
  )
  assert.deepEqual(
    suggestions(openToken('+ #mar'), members, teams).map(({ label }) => label),
    ['Marketing'],
  )
  assert.deepEqual(suggestions(null, members, teams), [])
})

test('suggestions stop once the word names its one match', () => {
  assert.deepEqual(suggestions(openToken('+ #Marketing'), members, teams), [])
  assert.deepEqual(suggestions(openToken('+ @lena-meyer'), members, teams), [])
})

test('completeToken writes a handle that resolves to one person', () => {
  const token = openToken('+ Flyer @le')
  assert.ok(token)
  const [first] = suggestions(token, members, teams)
  const text = completeToken('+ Flyer @le', token, first.handle)
  assert.equal(text, '+ Flyer @Lena-Brandt ')
  assert.deepEqual(
    capture(text).assignees.map(({ id }) => id),
    ['lena-b'],
  )
  assert.deepEqual(capture(text).problems, [])
})

test('an unclear person further back can still be completed', () => {
  for (const text of ['+ Flyer @Lena #Marketing', '+ Flyer @Lena ']) {
    const token = tokenToComplete(text, capture(text).problems, members, teams)
    assert.deepEqual(token, { marker: '@', word: 'Lena' })
    assert.deepEqual(
      suggestions(token, members, teams).map(({ label }) => label),
      ['Lena Brandt', 'Lena Meyer'],
    )
  }
  const text = '+ Flyer @Lena #Marketing'
  const done = completeToken(text, { marker: '@', word: 'Lena' }, '@Lena-Meyer')
  assert.equal(done, '+ Flyer @Lena-Meyer #Marketing ')
  assert.deepEqual(capture(done).problems, [])
})

test('the word at the end goes first while it is still being typed', () => {
  const text = '+ Flyer @Lena #Mar'
  assert.deepEqual(tokenToComplete(text, capture(text).problems, members, teams), { marker: '#', word: 'Mar' })
})

test('searchGroups needs every word and keeps the group order', () => {
  const items = [
    item('contact', 'Sparkasse Lüneburg'),
    item('task', 'Räume buchen', { meta: 'Open Weekly' }),
    item('event', 'Open Weekly November'),
    item('member', 'Lena Meyer'),
  ]
  assert.deepEqual(
    searchGroups(items, 'open weekly').map(({ kind }) => kind),
    ['task', 'event'],
  )
  assert.deepEqual(searchGroups(items, 'open sparkasse'), [])
  assert.deepEqual(
    searchGroups(items, 'luneburg').map(({ kind }) => kind),
    ['contact'],
  )
})

test('searchGroups puts title hits before meta hits and finished work last', () => {
  const items = [
    item('task', 'Flyer alt', { done: true }),
    item('task', 'Plakate', { meta: 'Flyer und mehr' }),
    item('task', 'Neue Flyer drucken'),
    item('task', 'Flyer drucken'),
  ]
  assert.deepEqual(
    searchGroups(items, 'flyer')[0].items.map(({ title }) => title),
    ['Flyer drucken', 'Neue Flyer drucken', 'Plakate', 'Flyer alt'],
  )
})

test('searchGroups limits each group', () => {
  const items = Array.from({ length: 9 }, (_, index) => item('task', `Flyer ${index}`))
  assert.equal(searchGroups(items, 'flyer')[0].items.length, 4)
})

test('searchGroups with @ only looks at people and lists them without a query', () => {
  const items = [
    item('task', 'Lena fragen'),
    item('member', 'Lena Meyer'),
    item('alumni', 'Moritz B.'),
    item('contact', 'Sparkasse'),
  ]
  assert.deepEqual(
    searchGroups(items, '@lena').map(({ kind }) => kind),
    ['member'],
  )
  assert.deepEqual(
    searchGroups(items, '@').map(({ kind }) => kind),
    ['member', 'alumni', 'contact'],
  )
})

type IndexInput = Parameters<typeof buildSearchIndex>[0]
const task = (fields: Partial<IndexInput['projects'][number]['tasks'][number]>) => ({
  id: 't1',
  title: 'Räume buchen',
  done: false,
  due: '',
  assignees: [],
  ...fields,
})
const project = (fields: Partial<IndexInput['projects'][number]>) => ({
  id: 'p1',
  title: 'Open Weekly',
  type: 'event',
  archived: false,
  event: null,
  tasks: [],
  ...fields,
})
const sources: IndexInput = {
  projects: [],
  privateTasks: [],
  members: [],
  contacts: [],
  alumni: [],
  events: [],
  guides: [],
}
const context = {
  locale: 'de' as const,
  paths: {
    tasks: '/mitglieder/aufgaben',
    crm: '/mitglieder/netzwerk',
    alumni: '/mitglieder/netzwerk/alumni',
    guide: '/materialien',
  },
  teamNames: { 'ignite-marketing': 'Marketing' },
  privateLabel: 'Nur für mich',
}

test('buildSearchIndex leaves out archived projects', () => {
  const items = buildSearchIndex({ ...sources, projects: [project({ archived: true, tasks: [task({})] })] }, context)
  assert.deepEqual(items, [])
})

test('buildSearchIndex links tasks to their project and names people and deadline', () => {
  const items = buildSearchIndex(
    {
      ...sources,
      members: [{ id: 'm1', name: 'Lena Meyer', photo: '/p.png', team: 'ignite-marketing' }],
      projects: [project({ tasks: [task({ due: '2026-11-10', assignees: ['m1'] })] })],
    },
    context,
  )
  const row = items.find(({ kind }) => kind === 'task')
  assert.equal(row?.url, '/mitglieder/aufgaben#p1')
  assert.equal(row?.meta, 'Open Weekly · Di, 10. Nov. · Lena Meyer')
  assert.ok(items.some(({ kind, title }) => kind === 'project' && title === 'Open Weekly'))
})

test('buildSearchIndex shows a single task once, without a project row', () => {
  const items = buildSearchIndex(
    { ...sources, projects: [project({ type: 'task', title: 'Räume buchen', tasks: [task({})] })] },
    context,
  )
  assert.deepEqual(
    items.map(({ kind, meta }) => [kind, meta]),
    [['task', '']],
  )
})

test('buildSearchIndex sends no email address of contacts, alumni or members', () => {
  const member = { id: 'm1', name: 'Lena', photo: '', team: '', email: 'lena@example.com' }
  const contact = { id: 'c1', name: 'Eva', organization: 'Sparkasse', role: 'Leitung', email: 'eva@example.com' }
  const person = { id: 'a1', name: 'Moritz', now: 'Gründer', city: 'Hamburg', email: 'moritz@example.com' }
  const items = buildSearchIndex({ ...sources, members: [member], contacts: [contact], alumni: [person] }, context)
  assert.equal(JSON.stringify(items).includes('example.com'), false)
  assert.equal(items.find(({ kind }) => kind === 'contact')?.url, '/mitglieder/netzwerk#c1')
  assert.equal(items.find(({ kind }) => kind === 'alumni')?.url, '/mitglieder/netzwerk/alumni#a1')
})

test('buildSearchIndex marks private tasks and leads them to the own list', () => {
  const [row] = buildSearchIndex({ ...sources, privateTasks: [task({ id: 'x', title: 'Geheim', due: '' })] }, context)
  assert.equal(row.meta, 'Nur für mich')
  assert.equal(row.url, '/mitglieder/aufgaben?ansicht=meine')
})

test('buildSearchIndex opens the planning project of an event when there is one', () => {
  const startAt = new Date('2026-11-19T18:00:00Z')
  const items = buildSearchIndex(
    {
      ...sources,
      projects: [project({ event: { id: 'e1' } })],
      events: [
        { id: 'e1', title: 'Open Weekly', startAt, endAt: startAt, location: null },
        { id: 'e2', title: 'Pitch Event', startAt, endAt: startAt, location: 'Hörsaal 1' },
      ],
    },
    { ...context, now: Date.parse('2026-11-06T12:00:00Z') },
  )
  const events = items.filter(({ kind }) => kind === 'event')
  assert.equal(events[0].url, '/mitglieder/aufgaben#p1')
  assert.equal(events[1].url, '/mitglieder/aufgaben?ansicht=events')
  assert.equal(events[1].meta, 'Do, 19. Nov. · Hörsaal 1')
  assert.equal(events[1].done, false)
})
