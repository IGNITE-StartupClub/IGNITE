import { test } from 'node:test'
import assert from 'node:assert/strict'
import { openTeams } from '../data/openTeams.ts'
import {
  addDays,
  addMonths,
  daysBetween,
  nextDue,
  nextTurn,
  ALL_TEAMS,
  applyChanges,
  applyMemberChange,
  assigneeChanges,
  berlinClock,
  berlinDay,
  berlinHour,
  boardColumns,
  calendarEntries,
  eventTwin,
  filterProjects,
  fitsItsKind,
  ledProjects,
  filterScope,
  isEvent,
  isRecordId,
  isSingleTask,
  mayRemoveTask,
  nameFromEmail,
  memberChange,
  mirroredFields,
  nextStanding,
  openRequired,
  parseName,
  parseProject,
  parseFolderUrl,
  parseProjectPatch,
  parseTask,
  parseTaskPatch,
  patchedProject,
  patchedTask,
  parseTeam,
  parseTemplateTasks,
  progress,
  projectDeadlines,
  projectEdits,
  projectAssignees,
  projectStatus,
  scopedPrivateTasks,
  scopedTasks,
  sameTitle,
  similarTitles,
  sortTasks,
  TEAM_IDS,
  taskGroup,
  taskHash,
  taskRoute,
  taskStatus,
  taskTeam,
  tasksFromTemplate,
  templateFromTasks,
  weekEnd,
  weekStart,
  withArchive,
  type PrivateTaskState,
  type ProjectState,
  type Scope,
  type TaskState,
} from './tasks.ts'

const ME = 'a'.repeat(24)
const BEN = 'b'.repeat(24)
const MARKETING = 'ignite-marketing'
const RELATIONS = 'ignite-relations'

const privateTask = (overrides: Partial<PrivateTaskState> = {}): PrivateTaskState => ({
  id: 'p',
  title: 'Privat',
  description: '',
  done: false,
  status: 'backlog',
  doneAt: '',
  due: '',
  priority: 'normal',
  team: '',
  ...overrides,
})

const task = (overrides: Partial<TaskState> = {}): TaskState => ({
  id: 't',
  title: 'Aufgabe',
  done: false,
  status: 'backlog',
  due: '',
  priority: 'normal',
  required: false,
  assignees: [],
  team: '',
  ...overrides,
})
const project = (overrides: Partial<ProjectState> = {}): ProjectState => ({
  id: 'p',
  title: 'Projekt',
  type: 'internal',
  status: 'active',
  due: '',
  leads: [],
  team: '',
  archived: false,
  eventDay: '',
  tasks: [],
  ...overrides,
})

test('parseProject requires a title and accepts only known types, teams, real days and member ids', () => {
  assert.deepEqual(parseProject({ title: ' Alumni-Netzwerk ', type: 'internal', leads: [ME, ME], team: MARKETING }), {
    title: 'Alumni-Netzwerk',
    description: '',
    type: 'internal',
    due: '',
    time: '',
    place: '',
    endDue: '',
    endTime: '',
    coverUrl: '',
    luma: null,
    folderUrl: '',
    leads: [ME],
    team: MARKETING,
  })
  assert.equal(parseProject({ title: 'x', time: '18:30' })?.time, '18:30')
  assert.equal(parseProject({ title: 'x', place: ' Hörsaal 1 ' })?.place, 'Hörsaal 1')
  for (const bad of [
    { title: ' ' },
    { title: 'x', type: 'meeting' },
    { title: 'x', due: '2026-02-30' },
    { title: 'x', leads: ['ben@x.de'] },
    { title: 'x', team: 'podcast' },
    { title: 'x', time: '24:00' },
    { title: 'x', time: '8:30' },
    { title: 'x', place: 'p'.repeat(500) },
    { title: 'x', folderUrl: 'https://example.com/folder' },
  ]) {
    assert.equal(parseProject(bad), null, JSON.stringify(bad))
  }
})

test('parseProject takes an own event by hand, without any Luma field', () => {
  const event = parseProject({ title: 'Utopia-Dinner', type: 'event', due: '2026-11-24', time: '18:00', place: 'Utopia' })
  assert.equal(event?.luma, null)
  assert.deepEqual([event?.endDue, event?.endTime, event?.coverUrl], ['', '', ''])
})

test('parseProject takes the Luma fields of an import and refuses foreign ones', () => {
  const imported = parseProject({
    title: 'Utopia-Dinner',
    type: 'event',
    due: '2026-11-24',
    endDue: '2026-11-24',
    endTime: '22:00',
    coverUrl: 'https://images.lumacdn.com/uploads/s6/cover.png',
    luma: { id: 'evt-uxwE4KqRRWSUgds', url: 'https://lu.ma/ubmm9b6x?tk=abc' },
  })
  assert.deepEqual(imported?.luma, { id: 'evt-uxwE4KqRRWSUgds', url: 'https://luma.com/ubmm9b6x' })
  assert.equal(imported?.endTime, '22:00')
  for (const bad of [
    { coverUrl: 'https://evil.example/cover.png' },
    { luma: { id: 'evt-uxwE4KqRRWSUgds', url: 'https://evil.example/ubmm9b6x' } },
    { luma: { id: 'cal-123456', url: 'https://luma.com/ubmm9b6x' } },
    { luma: 'https://luma.com/ubmm9b6x' },
    { endDue: '2026-11-23' },
    { due: '', endDue: '2026-11-24' },
    { endTime: '25:00' },
  ]) {
    assert.equal(parseProject({ title: 'x', type: 'event', due: '2026-11-24', ...bad }), null, JSON.stringify(bad))
  }
})

test('parseTask defaults priority and required, rejects unknown priorities', () => {
  assert.deepEqual(parseTask({ title: 'Raum buchen', assignees: [BEN] }), {
    title: 'Raum buchen',
    description: '',
    due: '',
    priority: 'normal',
    required: false,
    assignees: [BEN],
    team: '',
    status: 'backlog',
    repeat: '',
  })
  assert.equal(parseTask({ title: 'x', priority: 'urgent' }), null)
  assert.equal(parseTask({ title: 'x', team: 'podcast' }), null)
  assert.equal(parseTask({ title: 'x', required: 'yes' }), null)
  assert.equal(parseTask({ title: 'x', status: 'blocked' }), null)
  assert.equal(parseTask({ title: 'x', status: 'doing' })?.status, 'doing')
  assert.equal(parseTask({ title: 'x', status: 'review' }), null)
})

test('parseTaskPatch keeps only the given fields and refuses unknown or empty changes', () => {
  assert.deepEqual(parseTaskPatch({ done: true }), { done: true })
  assert.deepEqual(parseTaskPatch({ due: '' }), { due: '' })
  assert.deepEqual(parseTaskPatch({ team: MARKETING }), { team: MARKETING })
  assert.deepEqual(parseTaskPatch({ status: 'doing' }), { status: 'doing' })
  assert.equal(parseTaskPatch({ status: 'blocked' }), null)
  assert.equal(parseTaskPatch({ team: 'podcast' }), null)
  assert.equal(parseTaskPatch({}), null)
  assert.equal(parseTaskPatch({ title: '' }), null)
  assert.equal(parseTaskPatch({ createdBy: ME }), null)
  assert.equal(parseTaskPatch({ toString: 'x' }), null)
})

test('parseTemplateTasks checks offsets and needs at least one task', () => {
  assert.deepEqual(parseTemplateTasks([{ title: 'Speaker kontaktieren', offsetDays: -30 }]), [
    { title: 'Speaker kontaktieren', description: '', priority: 'normal', required: false, offsetDays: -30 },
  ])
  assert.equal(parseTemplateTasks([]), null)
  assert.equal(parseTemplateTasks([{ title: 'x', offsetDays: 1.5 }]), null)
  assert.equal(parseTemplateTasks([{ title: 'x', offsetDays: 400 }]), null)
})

test('parseName needs first and last name', () => {
  assert.deepEqual(parseName({ firstName: ' Ben ', lastName: 'Kaiser' }), { firstName: 'Ben', lastName: 'Kaiser' })
  assert.equal(parseName({ firstName: 'Ben' }), null)
})

test('isRecordId accepts UUIDs and built-in template ids only', () => {
  assert.ok(isRecordId('0f8fad5b-d9cb-469f-a165-70867728950e'))
  assert.ok(isRecordId('std-company-visit'))
  assert.ok(!isRecordId('../members'))
  assert.ok(!isRecordId({ $ne: '' }))
})

test('nameFromEmail turns the local part into a name', () => {
  assert.equal(nameFromEmail('max.muster@leuphana.de'), 'Max Muster')
  assert.equal(nameFromEmail('anna_lena-schulz2@x.de'), 'Anna Lena Schulz2')
  assert.equal(nameFromEmail('42@x.de'), '42')
})

test('berlinDay and berlinHour follow summer and winter time', () => {
  // 17:30 UTC is 19:30 in summer (CEST) and 18:30 in winter (CET).
  assert.equal(berlinHour(Date.parse('2026-07-01T17:30:00Z')), 19)
  assert.equal(berlinHour(Date.parse('2026-12-01T17:30:00Z')), 18)
  assert.equal(berlinDay(Date.parse('2026-12-31T23:30:00Z')), '2027-01-01')
})

test('weekStart is the Monday of the current week', () => {
  assert.equal(weekStart('2026-11-11'), '2026-11-09') // Wednesday
  assert.equal(weekStart('2026-11-09'), '2026-11-09') // Monday
  assert.equal(weekStart('2026-11-15'), '2026-11-09') // Sunday
  assert.equal(weekStart('2026-03-01'), '2026-02-23') // Sunday after a short February
})

test('weekEnd is the Sunday of the current week', () => {
  assert.equal(weekEnd('2026-10-28'), '2026-11-01') // Wednesday
  assert.equal(weekEnd('2026-11-01'), '2026-11-01') // Sunday
  assert.equal(weekEnd('2026-11-02'), '2026-11-08') // Monday
})

test('projectAssignees lists each assignee once and leaves out the leads', () => {
  const tasks = [{ assignees: ['lead', 'ana'] }, { assignees: ['ana', 'ben'] }, { assignees: [] }]
  assert.deepEqual(projectAssignees({ leads: ['lead'], tasks }), ['ana', 'ben'])
  assert.deepEqual(projectAssignees({ leads: ['lead'], tasks: [] }), [])
})

test('progress has no percentage without tasks', () => {
  assert.deepEqual(progress([]), { done: 0, total: 0, percent: null })
  assert.deepEqual(progress([{ done: true }, { done: true }, { done: false }]), { done: 2, total: 3, percent: 67 })
})

test('taskGroup puts every task in exactly one group', () => {
  const today = '2026-10-28'
  assert.equal(taskGroup({ done: true, due: '2026-10-01' }, today), 'done')
  assert.equal(taskGroup({ done: false, due: '2026-10-27' }, today), 'overdue')
  assert.equal(taskGroup({ done: false, due: '2026-10-28' }, today), 'week')
  assert.equal(taskGroup({ done: false, due: '2026-11-01' }, today), 'week')
  assert.equal(taskGroup({ done: false, due: '2026-11-02' }, today), 'later')
  assert.equal(taskGroup({ done: false, due: '' }, today), 'none')
})

const scope = (overrides: Partial<Scope> = {}): Scope => ({ team: ALL_TEAMS, myTeam: '', onlyMine: false, query: '', ...overrides })

test('TEAM_IDS match the teams on the website', () => {
  assert.deepEqual([...TEAM_IDS], openTeams.map((team) => team.id))
})

test('parseTeam accepts a known team or no team', () => {
  assert.equal(parseTeam(MARKETING), MARKETING)
  assert.equal(parseTeam(''), '')
  assert.equal(parseTeam(undefined), '')
  assert.equal(parseTeam('ignite-podcast'), null)
  assert.equal(parseTeam({ $ne: '' }), null)
})

test('taskTeam prefers the team of the task over the one of its project', () => {
  assert.equal(taskTeam({ team: MARKETING }, { team: RELATIONS }), MARKETING)
  assert.equal(taskTeam({ team: '' }, { team: RELATIONS }), RELATIONS)
  assert.equal(taskTeam({ team: '' }, { team: '' }), '')
})

test('scopedTasks shows the team of a tab, and on the own tab also what the member is assigned to elsewhere', () => {
  const projects = [
    project({ id: 'm', team: MARKETING, tasks: [task({ id: 'post' }), task({ id: 'sponsor', team: RELATIONS })] }),
    project({ id: 'r', team: RELATIONS, tasks: [task({ id: 'call', assignees: [ME] }), task({ id: 'flyer', team: MARKETING })] }),
    project({ id: 'free', tasks: [task({ id: 'unsorted' })] }),
  ]
  const ids = (overrides: Partial<Scope>) => scopedTasks(projects, scope(overrides), ME, '2026-10-28').map((item) => item.id)
  assert.deepEqual(ids({ team: MARKETING, myTeam: MARKETING }), ['post', 'call', 'flyer'])
  assert.deepEqual(ids({ team: MARKETING, myTeam: RELATIONS }), ['post', 'flyer'])
  assert.deepEqual(ids({ team: RELATIONS, myTeam: MARKETING }), ['sponsor', 'call'])
  assert.deepEqual(ids({}), ['post', 'sponsor', 'call', 'flyer', 'unsorted'])
})

test('scopedTasks narrows to own tasks and the search, and hands out team and group of each task', () => {
  const projects = [
    project({ id: 'p', title: 'Sommerfest', team: MARKETING, tasks: [task({ id: 'a', title: 'Plakat', assignees: [ME], due: '2026-10-01' }), task({ id: 'b', title: 'Flyer' })] }),
  ]
  const list = (overrides: Partial<Scope>) => scopedTasks(projects, scope(overrides), ME, '2026-10-28')
  assert.deepEqual(list({ onlyMine: true }).map((item) => [item.id, item.team, item.group, item.projectTitle]), [['a', MARKETING, 'overdue', 'Sommerfest']])
  assert.deepEqual(list({ query: 'flyer' }).map((item) => item.id), ['b'])
  assert.deepEqual(list({ query: 'sommer' }).map((item) => item.id), ['a', 'b'])
})

test('scopedPrivateTasks shows a private task on its team, on the own tab and on all teams', () => {
  const tasks = [privateTask({ id: 'm', team: MARKETING }), privateTask({ id: 'r', team: RELATIONS }), privateTask({ id: 'n', team: '' })]
  const ids = (overrides: Partial<Scope>) => scopedPrivateTasks(tasks, scope(overrides), ME, '2026-10-28').map((item) => item.id)
  assert.deepEqual(ids({ team: ALL_TEAMS }), ['m', 'r', 'n'])
  assert.deepEqual(ids({ team: MARKETING, myTeam: MARKETING }), ['m', 'r', 'n'], 'the own tab lists all private tasks of the member')
  assert.deepEqual(ids({ team: RELATIONS, myTeam: MARKETING }), ['r'])
})

test('scopedPrivateTasks follows the search and hands out the shape of the task list', () => {
  const tasks = [privateTask({ id: 'a', title: 'Pitch üben', due: '2026-10-20' }), privateTask({ id: 'b', title: 'Kurswahl' })]
  const list = (overrides: Partial<Scope>) => scopedPrivateTasks(tasks, scope(overrides), ME, '2026-10-28')
  assert.deepEqual(list({ query: 'PITCH' }).map((item) => item.id), ['a'])
  const [first] = list({})
  assert.equal(first.private, true)
  assert.deepEqual(first.assignees, [ME], 'it counts as assigned, so "Nur meine" keeps it')
  assert.equal(first.group, 'overdue')
  assert.equal(first.projectId, '')
})

test('scopedTasks leaves out archived and finished projects', () => {
  const projects = [
    project({ id: 'old', archived: true, tasks: [task({ id: 'a', assignees: [ME] })] }),
    project({ id: 'over', status: 'done', tasks: [task({ id: 'b', assignees: [ME] })] }),
    project({ id: 'live', tasks: [task({ id: 'c', assignees: [ME], done: true })] }),
  ]
  assert.deepEqual(scopedTasks(projects, scope(), ME, '2026-10-28').map((item) => [item.id, item.group]), [['c', 'done']])
})

test('sortTasks puts the earliest deadline first, the higher priority before others on the same day', () => {
  const items = [
    task({ id: 'none', due: '', priority: 'high' }),
    task({ id: 'late', due: '2026-11-20' }),
    task({ id: 'soon', due: '2026-10-29', priority: 'low' }),
    task({ id: 'urgent', due: '2026-10-29', priority: 'high' }),
  ]
  assert.deepEqual(sortTasks(items).map((item) => item.id), ['urgent', 'soon', 'late', 'none'])
})

test('filterProjects shows a project to its team, to teams with a task in it and on the own tab to those involved', () => {
  const projects = [
    project({ id: 'own', team: MARKETING }),
    project({ id: 'shared', team: RELATIONS, tasks: [task({ team: MARKETING })] }),
    project({ id: 'other', team: RELATIONS, leads: [ME] }),
    project({ id: 'free' }),
  ]
  const ids = (overrides: Partial<Scope>) => filterProjects(projects, { ...scope(overrides), archived: false }, ME).map((item) => item.id)
  assert.deepEqual(ids({ team: MARKETING, myTeam: MARKETING }), ['own', 'shared', 'other'])
  assert.deepEqual(ids({ team: MARKETING }), ['own', 'shared'])
  assert.deepEqual(ids({ team: RELATIONS }), ['shared', 'other'])
  assert.deepEqual(ids({}), ['own', 'shared', 'other', 'free'])
})

test('a project of all teams shows on every team tab, and so do its tasks', () => {
  const projects = [
    project({ id: 'dinner', type: 'event', team: ALL_TEAMS, tasks: [task({ id: 'tables' }), task({ id: 'ads', team: MARKETING })] }),
    project({ id: 'mine', team: MARKETING }),
  ]
  const cards = (overrides: Partial<Scope>) => filterProjects(projects, { ...scope(overrides), archived: false }, ME).map((item) => item.id)
  assert.deepEqual(cards({ team: RELATIONS }), ['dinner'])
  assert.deepEqual(cards({ team: MARKETING }), ['dinner', 'mine'])
  const tasks = (overrides: Partial<Scope>) => scopedTasks(projects, scope(overrides), ME, '2026-10-28').map((item) => [item.id, item.team])
  assert.deepEqual(tasks({ team: RELATIONS }), [['tables', ALL_TEAMS]])
  assert.deepEqual(tasks({ team: MARKETING }), [['tables', ALL_TEAMS], ['ads', MARKETING]])
})

test('only projects take all teams; members and tasks keep one team or none', () => {
  assert.equal(parseProject({ title: 'Utopia-Dinner', team: ALL_TEAMS })?.team, ALL_TEAMS)
  assert.deepEqual(parseProjectPatch({ team: ALL_TEAMS }), { team: ALL_TEAMS })
  assert.equal(parseTeam(ALL_TEAMS), null)
  assert.equal(parseTask({ title: 'Tische', team: ALL_TEAMS }), null)
})

test('filterProjects combines own projects, search and the archive; single tasks only show there', () => {
  const projects = [
    project({ id: 'event', type: 'event', tasks: [task({ title: 'Speaker kontaktieren', assignees: [BEN] })] }),
    project({ id: 'mine', leads: [ME] }),
    project({ id: 'single', type: 'task', tasks: [task()] }),
    project({ id: 'old', archived: true }),
    project({ id: 'oldSingle', type: 'task', archived: true }),
  ]
  const ids = (overrides: Partial<Scope & { archived: boolean }>) =>
    filterProjects(projects, { ...scope(), archived: false, ...overrides }, ME).map((item) => item.id)
  assert.deepEqual(ids({}), ['event', 'mine'])
  assert.deepEqual(ids({ onlyMine: true }), ['mine'])
  assert.deepEqual(ids({ query: 'speaker' }), ['event'])
  assert.deepEqual(ids({ archived: true }), ['old', 'oldSingle'])
})

test('ledProjects keeps the open projects the member leads, soonest first and those without a day last', () => {
  const projects = [
    project({ id: 'later', leads: [ME], due: '2026-12-31' }),
    project({ id: 'undated', leads: [ME, BEN] }),
    project({ id: 'event', type: 'event', leads: [ME], eventDay: '2026-11-24' }),
    project({ id: 'assigned', tasks: [task({ assignees: [ME] })], due: '2026-11-20' }),
    project({ id: 'others', leads: [BEN], due: '2026-11-20' }),
    project({ id: 'done', leads: [ME], status: 'done', due: '2026-11-20' }),
    project({ id: 'archived', leads: [ME], archived: true, due: '2026-11-20' }),
    project({ id: 'single', type: 'task', leads: [ME], due: '2026-11-20' }),
  ]
  assert.deepEqual(
    ledProjects(projects, ME).map((item) => item.id),
    ['event', 'later', 'undated'],
  )
})

test('projectDeadlines keeps the open internal projects with a deadline', () => {
  const projects = [
    project({ id: 'dated', due: '2026-11-20' }),
    project({ id: 'undated' }),
    project({ id: 'event', type: 'event', due: '2026-11-24' }),
    project({ id: 'single', type: 'task', due: '2026-11-20' }),
    project({ id: 'done', status: 'done', due: '2026-11-20' }),
    project({ id: 'archived', archived: true, due: '2026-11-20' }),
  ]
  assert.deepEqual(
    projectDeadlines(projects).map((item) => item.id),
    ['dated'],
  )
})

test('fitsItsKind takes an event only with its Luma event', () => {
  const luma = { id: 'evt-uxwE4KqRRWSUgds', url: 'https://luma.com/ubmm9b6x' }
  const fields = (input: Record<string, unknown>) => {
    const parsed = parseProject({ title: 'Utopia-Dinner', ...input })
    assert.ok(parsed, JSON.stringify(input))
    return parsed
  }
  assert.equal(fitsItsKind(fields({ type: 'event', due: '2026-11-24', luma }), false), true)
  assert.equal(fitsItsKind(fields({ type: 'event', due: '2026-11-24' }), false), false, 'an event by hand is a project')
  assert.equal(fitsItsKind(fields({ type: 'event', luma }), false), false, 'an own event needs its day')
  assert.equal(fitsItsKind(fields({ type: 'event' }), true), true, 'a planning takes day and link from its public event')
  assert.equal(fitsItsKind(fields({ type: 'event', due: '2026-11-24', luma }), true), false)
  assert.equal(fitsItsKind(fields({ type: 'internal', due: '2026-11-24' }), false), true)
  assert.equal(fitsItsKind(fields({ type: 'internal', due: '2026-11-24', luma }), false), false)
  assert.equal(fitsItsKind(fields({ type: 'internal', due: '2026-11-24', endTime: '22:00' }), false), false)
})

test('openRequired counts open required tasks only', () => {
  assert.equal(openRequired([task({ required: true }), task({ required: true, done: true }), task()]), 1)
})

test('taskStatus reads tasks stored before the board from their done flag', () => {
  assert.equal(taskStatus({ done: true }), 'done')
  assert.equal(taskStatus({ done: false }), 'backlog')
  assert.equal(taskStatus({ done: false, status: 'doing' }), 'doing')
  assert.equal(taskStatus({ done: false, status: 'review' }), 'doing')
})

test('nextStanding keeps status and done in step', () => {
  const open = { done: false, status: 'doing' } as const
  const finished = { done: true, status: 'done' } as const
  assert.deepEqual(nextStanding(open, { status: 'doing' }), { done: false, status: 'doing' })
  assert.deepEqual(nextStanding(open, { status: 'done' }), finished)
  assert.deepEqual(nextStanding(finished, { status: 'doing' }), open)
  assert.deepEqual(nextStanding(open, { done: true }), finished)
  assert.deepEqual(nextStanding(finished, { done: false }), { done: false, status: 'backlog' })
  assert.deepEqual(nextStanding(open, { done: false }), open)
  assert.deepEqual(nextStanding(open, { title: 'Neu' }), open)
})

test('boardColumns sorts open columns by deadline and shows the last finished task first', () => {
  const columns = boardColumns([
    { ...task({ id: 'late', status: 'doing', due: '2026-12-01' }), doneAt: '' },
    { ...task({ id: 'soon', status: 'doing', due: '2026-11-10' }), doneAt: '' },
    { ...task({ id: 'older', status: 'done', done: true }), doneAt: '2026-11-01T10:00:00.000Z' },
    { ...task({ id: 'newer', status: 'done', done: true }), doneAt: '2026-11-05T10:00:00.000Z' },
  ])
  assert.deepEqual(columns.doing.map((item) => item.id), ['soon', 'late'])
  assert.deepEqual(columns.done.map((item) => item.id), ['newer', 'older'])
  assert.deepEqual(columns.backlog, [])
})

test('tasksFromTemplate starts every task open and unassigned, with deadlines only from relative rules', () => {
  const copied = tasksFromTemplate(
    [
      { title: 'Speaker kontaktieren', description: '', priority: 'high', required: true, offsetDays: -30 },
      { title: 'Follow-up', description: '', priority: 'normal', required: false, offsetDays: 2 },
      { title: 'Technik', description: '', priority: 'normal', required: false, offsetDays: null },
    ],
    '2027-03-10',
  )
  assert.deepEqual(copied.map((item) => item.due), ['2027-02-08', '2027-03-12', ''])
  assert.ok(copied.every((item) => item.assignees.length === 0 && item.team === '' && item.status === 'backlog'))
  assert.deepEqual(tasksFromTemplate([{ title: 'x', description: '', priority: 'low', required: false, offsetDays: -3 }], '')[0].due, '')
})

test('templateFromTasks turns deadlines into days relative to the event and drops absolute dates otherwise', () => {
  const template = templateFromTasks(
    [
      { title: 'Location', description: '', priority: 'normal', required: false, due: '2026-03-01' },
      { title: 'Ohne Datum', description: '', priority: 'low', required: false, due: '' },
    ],
    '2026-03-22',
  )
  assert.deepEqual(template.map((item) => item.offsetDays), [-21, null])
  assert.equal(templateFromTasks([{ title: 'x', description: '', priority: 'low', required: false, due: '2026-03-01' }], '')[0].offsetDays, null)
  assert.equal(addDays('2026-03-22', -21), '2026-03-01')
})

test('assigneeChanges reports who was added and who removed', () => {
  assert.deepEqual(assigneeChanges([ME], [BEN]), { added: [BEN], removed: [ME] })
  assert.deepEqual(assigneeChanges([ME], [ME]), { added: [], removed: [] })
})

test('TEAM_IDS match the teams on the website', () => {
  assert.deepEqual([...TEAM_IDS], openTeams.map((team) => team.id))
})

test('parseTeam accepts a known team or no team', () => {
  assert.equal(parseTeam('ignite-marketing'), 'ignite-marketing')
  assert.equal(parseTeam(''), '')
  assert.equal(parseTeam(undefined), '')
  assert.equal(parseTeam('ignite-podcast'), null)
  assert.equal(parseTeam({ $ne: '' }), null)
})

test('parseTaskPatch takes people as one step in one direction, never as a whole list', () => {
  assert.deepEqual(parseTaskPatch({ assignees: { add: [ME] } }), { assignees: { add: [ME], remove: [] } })
  assert.deepEqual(parseTaskPatch({ assignees: { remove: [BEN] } }), { assignees: { add: [], remove: [BEN] } })
  assert.equal(parseTaskPatch({ assignees: [ME] }), null)
  assert.equal(parseTaskPatch({ assignees: {} }), null)
  assert.equal(parseTaskPatch({ assignees: { add: [ME], remove: [BEN] } }), null)
  assert.equal(parseTaskPatch({ assignees: { add: ['no-id'] } }), null)
})

test('parseProjectPatch keeps the given fields and refuses type, empty titles and unknown keys', () => {
  assert.deepEqual(parseProjectPatch({ due: '2026-12-01' }), { due: '2026-12-01' })
  assert.deepEqual(parseProjectPatch({ title: ' Neu ', team: MARKETING }), { title: 'Neu', team: MARKETING })
  assert.deepEqual(parseProjectPatch({ leads: { add: [ME] } }), { leads: { add: [ME], remove: [] } })
  assert.equal(parseProjectPatch({ title: ' ' }), null)
  assert.equal(parseProjectPatch({ type: 'event' }), null)
  assert.equal(parseProjectPatch({ leads: [ME] }), null)
  assert.equal(parseProjectPatch({}), null)
})

test('parseFolderUrl takes only https links into the Leuphana SharePoint and stores them normalized', () => {
  const folder = 'https://leuphanalg.sharepoint.com/sites/IGNITE_zg0pjl/Shared%20Documents/200%20%20Teamfahrt%20Berlin'
  assert.equal(parseFolderUrl(` ${folder} `), folder)
  assert.equal(parseFolderUrl('https://leuphanalg.sharepoint.com/:f:/s/IGNITE_zg0pjl/EkAbc?e=x1'), 'https://leuphanalg.sharepoint.com/:f:/s/IGNITE_zg0pjl/EkAbc?e=x1')
  assert.equal(parseFolderUrl('https://LEUPHANALG.sharepoint.com/sites/IGNITE_zg0pjl'), 'https://leuphanalg.sharepoint.com/sites/IGNITE_zg0pjl')
  assert.equal(parseFolderUrl(''), '')
  assert.equal(parseFolderUrl(undefined), '')
  for (const bad of [
    'http://leuphanalg.sharepoint.com/sites/IGNITE_zg0pjl',
    'https://leuphanalg.sharepoint.com.evil.example/sites/IGNITE_zg0pjl',
    'https://evil.example/?u=https://leuphanalg.sharepoint.com',
    'https://user@leuphanalg.sharepoint.com/sites/IGNITE_zg0pjl',
    'https://leuphanalg.sharepoint.com:8443/sites/IGNITE_zg0pjl',
    'javascript:alert(1)',
    'leuphanalg.sharepoint.com/sites/IGNITE_zg0pjl',
    `https://leuphanalg.sharepoint.com/${'a'.repeat(2000)}`,
    42,
  ]) {
    assert.equal(parseFolderUrl(bad), null, String(bad))
  }
  const linked = parseProjectPatch({ folderUrl: folder })
  assert.deepEqual(linked, { folderUrl: folder })
  assert.deepEqual(parseProjectPatch({ folderUrl: '' }), { folderUrl: '' })
  assert.equal(parseProjectPatch({ folderUrl: 'https://example.com' }), null)
})

test('memberChange says who a picker added or removed, and applyMemberChange replays it on a newer list', () => {
  assert.deepEqual(memberChange([ME], [ME, BEN]), { add: [BEN], remove: [] })
  assert.deepEqual(memberChange([ME, BEN], [BEN]), { add: [], remove: [ME] })
  assert.deepEqual(applyMemberChange([ME], { add: [BEN], remove: [] }), [ME, BEN])
  assert.deepEqual(applyMemberChange([ME, BEN], { add: [BEN], remove: [] }), [ME, BEN])
  assert.deepEqual(applyMemberChange([ME, BEN], { add: [], remove: [ME] }), [BEN])
})

test('patchedTask applies people as a step and leaves the rest of the task alone', () => {
  const task = { done: false, status: 'doing' as const, due: '', assignees: [ME], title: 'A' }
  assert.deepEqual(patchedTask(task, { assignees: { add: [BEN], remove: [] } }, '2026-11-09'), { ...task, assignees: [ME, BEN] })
  assert.deepEqual(patchedTask(task, { title: 'B' }, '2026-11-09'), { ...task, title: 'B' })
})

test('patchedTask adds no people to a private task', () => {
  const task = { done: false, status: 'doing' as const, due: '', title: 'A' }
  assert.deepEqual(patchedTask(task, { title: 'B' }, '2026-11-09'), { ...task, title: 'B' })
})

test('addMonths keeps the day or takes the last day of a shorter month', () => {
  assert.equal(addMonths('2026-01-31', 1), '2026-02-28')
  assert.equal(addMonths('2028-01-31', 1), '2028-02-29')
  assert.equal(addMonths('2026-11-15', 2), '2027-01-15')
})

test('nextDue keeps the weekday whether the task is done early or late', () => {
  // 2026-11-15 is a Sunday.
  assert.equal(nextDue('2026-11-15', 'weekly', '2026-11-13'), '2026-11-22')
  assert.equal(nextDue('2026-11-15', 'weekly', '2026-11-15'), '2026-11-22')
  assert.equal(nextDue('2026-11-15', 'weekly', '2026-11-30'), '2026-12-06')
  assert.equal(nextDue('2026-11-15', 'biweekly', '2026-11-16'), '2026-11-29')
})

test('nextDue jumps straight to the next step from a deadline long ago', () => {
  assert.equal(nextDue('0001-01-01', 'weekly', '2026-11-09'), addDays('0001-01-01', (Math.floor(daysBetween('0001-01-01', '2026-11-09') / 7) + 1) * 7))
  assert.equal(nextDue('0001-01-15', 'monthly', '2026-11-09'), '2026-11-15')
  assert.equal(nextDue('0001-01-05', 'monthly', '2026-11-09'), '2026-12-05')
  assert.equal(nextDue('2026-11-30', 'monthly', '2026-11-30'), '2026-12-30')
  assert.equal(nextDue('2026-12-15', 'weekly', '2026-11-09'), '2026-12-22')
})

test('nextDue counts months from the first deadline, so short months do not shift later ones', () => {
  assert.equal(nextDue('2026-01-31', 'monthly', '2026-02-01'), '2026-02-28')
  assert.equal(nextDue('2026-01-31', 'monthly', '2026-03-01'), '2026-03-31')
})

test('nextTurn sends a repeating task back to the backlog with its next deadline', () => {
  const task = { done: false, status: 'doing' as const, due: '2026-11-15', repeat: 'weekly' as const }
  const back = { done: false, status: 'backlog', due: '2026-11-22', repeated: true }
  assert.deepEqual(nextTurn(task, { done: true }, '2026-11-15'), back)
  assert.deepEqual(nextTurn(task, { status: 'done' }, '2026-11-15'), back)
})

test('nextTurn starts the rhythm from today without a deadline and uses a rhythm set in the same change', () => {
  const task = { done: false, status: 'backlog' as const, due: '' }
  assert.deepEqual(nextTurn(task, { done: true, repeat: 'weekly' }, '2026-11-09'), { done: false, status: 'backlog', due: '2026-11-16', repeated: true })
})

test('nextTurn leaves tasks without a rhythm and other changes alone', () => {
  const once = { done: false, status: 'doing' as const, due: '2026-11-15' }
  assert.deepEqual(nextTurn(once, { done: true }, '2026-11-15'), { done: true, status: 'done', due: '2026-11-15', repeated: false })
  const weekly = { ...once, repeat: 'weekly' as const }
  assert.deepEqual(nextTurn(weekly, { status: 'backlog' }, '2026-11-15'), { done: false, status: 'backlog', due: '2026-11-15', repeated: false })
  assert.deepEqual(nextTurn({ ...weekly, done: true, status: 'done' }, { done: true }, '2026-11-15'), { done: true, status: 'done', due: '2026-11-15', repeated: false })
})

test('patchedTask shows a finished repeating task back in the backlog at once', () => {
  const task = { done: false, status: 'doing' as const, due: '2026-11-15', repeat: 'weekly' as const, title: 'Post' }
  assert.deepEqual(patchedTask(task, { done: true }, '2026-11-14'), { ...task, status: 'backlog', due: '2026-11-22' })
})

test('parseTask and parseTaskPatch read the rhythm', () => {
  assert.equal(parseTask({ title: 'A' })?.repeat, '')
  assert.equal(parseTask({ title: 'A', repeat: 'weekly' })?.repeat, 'weekly')
  assert.equal(parseTask({ title: 'A', repeat: 'daily' }), null)
  assert.deepEqual(parseTaskPatch({ repeat: 'monthly' }), { repeat: 'monthly' })
  assert.deepEqual(parseTaskPatch({ repeat: '' }), { repeat: '' })
})

test('patchedTask stamps a task it finishes, so the done column shows it on top', () => {
  const now = '2026-11-07T10:00:00.000Z'
  const open = { done: false, status: 'doing' as const, due: '', doneAt: '' }
  assert.deepEqual(patchedTask(open, { status: 'done' }, '2026-11-07', now), { done: true, status: 'done', due: '', doneAt: now })
  assert.deepEqual(patchedTask(open, { done: true }, '2026-11-07', now), { done: true, status: 'done', due: '', doneAt: now })
  const finished = { done: true, status: 'done' as const, due: '', doneAt: '2026-11-01T08:00:00.000Z' }
  assert.deepEqual(patchedTask(finished, { done: false }, '2026-11-07', now), { done: false, status: 'backlog', due: '', doneAt: '' })
  assert.deepEqual(patchedTask(finished, { title: 'B' }, '2026-11-07', now), { ...finished, title: 'B' })
  const columns = boardColumns([
    { ...task({ id: 'old', status: 'done', done: true }), doneAt: '2026-11-05T08:00:00.000Z' },
    { ...patchedTask({ ...task({ id: 'new' }), doneAt: '' }, { status: 'done' }, '2026-11-07', now) },
  ])
  assert.deepEqual(columns.done.map(({ id }) => id), ['new', 'old'])
})

test('a single task and its card keep title, description and deadline in step', () => {
  const single = project({ type: 'task', title: 'Flyer', due: '2026-11-20', tasks: [task({ id: 'x', title: 'Flyer', due: '2026-11-20' })] })
  const renamed = patchedProject(single, 'x', { title: 'Plakat', priority: 'high' }, '2026-11-09')
  assert.equal(renamed.title, 'Plakat')
  assert.equal(renamed.tasks[0].title, 'Plakat')
  assert.equal(renamed.tasks[0].priority, 'high')
  assert.equal(patchedProject(single, 'x', { due: '2026-11-22' }, '2026-11-09').due, '2026-11-22')

  // A card with more tasks, and every project, keeps its own title.
  const two = project({ type: 'task', title: 'Flyer', tasks: [task({ id: 'x' }), task({ id: 'y' })] })
  assert.equal(patchedProject(two, 'x', { title: 'Plakat' }, '2026-11-09').title, 'Flyer')
  const internal = project({ tasks: [task({ id: 'x' })] })
  assert.equal(patchedProject(internal, 'x', { title: 'Plakat' }, '2026-11-09').title, 'Projekt')

  // A repeating single task moves its card to the next deadline too.
  const weekly = project({ type: 'task', due: '2026-11-15', tasks: [task({ id: 'x', due: '2026-11-15', repeat: 'weekly' })] })
  const repeated = patchedProject(weekly, 'x', { done: true }, '2026-11-15')
  assert.equal(repeated.tasks[0].due, '2026-11-22')
  assert.equal(repeated.due, '2026-11-22')

  assert.equal(isSingleTask(single), true)
  assert.equal(isSingleTask(two), false)
  assert.deepEqual(mirroredFields({ title: 'A', priority: 'low', due: '' } as never), { title: 'A', due: '' })
})

test('applyChanges replaces what changed, keeps the rest and drops what is gone', () => {
  const project = (id: string, updatedAt: string, title = id) => ({ id, updatedAt, title })
  const state = {
    revision: '3.1',
    templates: ['kept'],
    members: ['old'],
    projects: [project('a', '2026-11-03T00:00:00.000Z'), project('b', '2026-11-02T00:00:00.000Z'), project('c', '2026-11-01T00:00:00.000Z')],
    privateTasks: [],
  }
  const own = { id: 'p', title: 'Nur für mich', description: '', done: false, status: 'backlog' as const, doneAt: '', due: '', priority: 'normal' as const, team: '' as const }
  const next = applyChanges(state, {
    revision: '3.2',
    ids: ['a', 'c', 'd'],
    projects: [project('c', '2026-11-05T00:00:00.000Z', 'neu'), project('d', '2026-11-04T00:00:00.000Z')],
    members: ['new'],
    privateTasks: [own],
  })
  assert.deepEqual(next.projects.map(({ id }) => id), ['c', 'd', 'a'])
  assert.equal(next.projects[0].title, 'neu')
  assert.equal(next.revision, '3.2')
  assert.deepEqual(next.members, ['new'])
  assert.deepEqual(next.templates, ['kept'])
  assert.deepEqual(next.privateTasks, [own])
})

test('withArchive lets folded copies give way and keeps what the island got later', () => {
  const project = (id: string, updatedAt: string, extra: { folded?: true; title?: string } = {}) => ({ id, updatedAt, title: id, ...extra })
  const state = {
    revision: '5.1',
    projects: [
      project('open', '2026-11-06T00:00:00.000Z'),
      project('plan', '2026-10-01T00:00:00.000Z', { folded: true }),
      // Restored by someone else after the archive was read: the island's copy is the newer one.
      project('restored', '2026-11-05T00:00:00.000Z', { title: 'zurück' }),
    ],
  }
  const next = withArchive(state, [
    project('plan', '2026-10-01T00:00:00.000Z', { title: 'mit Aufgaben' }),
    project('restored', '2026-10-20T00:00:00.000Z'),
    project('old', '2026-09-01T00:00:00.000Z'),
  ])
  assert.deepEqual(next.projects.map(({ id }) => id), ['open', 'restored', 'plan', 'old'])
  assert.equal(next.projects.find(({ id }) => id === 'plan')?.title, 'mit Aufgaben')
  assert.equal(next.projects.find(({ id }) => id === 'plan')?.folded, undefined)
  assert.equal(next.projects.find(({ id }) => id === 'restored')?.title, 'zurück')
  assert.equal(next.revision, '5.1')
})

test('berlinClock follows summer and winter time', () => {
  assert.equal(berlinClock(Date.parse('2026-07-01T16:30:00Z')), '18:30')
  assert.equal(berlinClock(Date.parse('2026-12-01T16:30:00Z')), '17:30')
  assert.equal(berlinClock(Date.parse('2026-12-01T23:05:00Z')), '00:05')
})

test('the review column of earlier records reads as in progress', () => {
  assert.equal(projectStatus('review'), 'active')
  assert.equal(projectStatus('planned'), 'planned')
  assert.equal(projectStatus('done'), 'done')
})

test('mayRemoveTask allows admins, the task creator, the project creator and leads, nobody else', () => {
  const owned = { createdBy: BEN }
  const run = { createdBy: 'c'.repeat(24), leads: ['d'.repeat(24)] }
  assert.equal(mayRemoveTask(owned, run, { id: ME, role: 'admin' }), true)
  assert.equal(mayRemoveTask(owned, run, { id: BEN, role: 'member' }), true)
  assert.equal(mayRemoveTask(owned, run, { id: 'c'.repeat(24), role: 'member' }), true)
  assert.equal(mayRemoveTask(owned, run, { id: 'd'.repeat(24), role: 'member' }), true)
  assert.equal(mayRemoveTask(owned, run, { id: ME, role: 'member' }), false)
})

test('similarTitles ignores case, accents and punctuation and accepts one title inside the other', () => {
  assert.equal(similarTitles('Founder-Talk!', 'founder talk'), true)
  assert.equal(similarTitles('Gründerabend', 'GRUNDERABEND'), true)
  assert.equal(similarTitles('Founder Talk', 'Founder Talk mit Lena'), true)
  assert.equal(similarTitles('Pitch Night', 'Open Weekly'), false)
  // Whole words only, and short words say nothing.
  assert.equal(similarTitles('Talk', 'Talkshow im Audimax'), false)
  assert.equal(similarTitles('Ein', 'Ein Abend mit Lena'), false)
})

test('sameTitle only accepts the same words', () => {
  assert.equal(sameTitle('Founder-Talk!', 'founder talk'), true)
  assert.equal(sameTitle('Founder Talk', 'Founder Talk mit Lena'), false)
})

const calendarEvent = (overrides = {}) => ({
  id: 'evt-1',
  title: 'Founder Talk',
  day: '2026-11-20',
  endDay: '2026-11-20',
  time: '18:00',
  location: 'Hörsaal 1',
  url: 'https://lu.ma/x',
  coverUrl: null,
  source: 'luma' as const,
  ...overrides,
})

const ownEvent = (overrides: Partial<ProjectState> = {}) =>
  project({ id: 'own-1', title: 'Founder Talk', type: 'event', due: '2026-11-20', event: null, ...overrides })

test('eventTwin is sure on the same day with a similar title and only asks otherwise', () => {
  const same = calendarEvent()
  assert.deepEqual(eventTwin(ownEvent(), [same]), { event: same, sure: true })
  const otherTitle = calendarEvent({ title: 'Pitch Night' })
  assert.deepEqual(eventTwin(ownEvent(), [otherTitle]), { event: otherTitle, sure: false })
  const close = calendarEvent({ day: '2026-11-22' })
  assert.deepEqual(eventTwin(ownEvent(), [close]), { event: close, sure: false })
})

test('eventTwin leaves a weekly series alone and respects "these are different events"', () => {
  assert.equal(eventTwin(ownEvent(), [calendarEvent({ day: '2026-11-27' })]), null)
  assert.equal(eventTwin(ownEvent({ distinctFrom: ['evt-1'] }), [calendarEvent()]), null)
})

test('eventTwin prefers the similar title over the nearer day', () => {
  const twin = calendarEvent({ id: 'evt-2', day: '2026-11-21' })
  const other = calendarEvent({ id: 'evt-3', title: 'Pitch Night' })
  assert.equal(eventTwin(ownEvent(), [other, twin])?.event.id, 'evt-2')
})

test('calendarEntries keeps the Weekly in the calendar and never pairs an own event with it', () => {
  const tuesday = calendarEvent({ id: 'weekly-2026-11-20', title: 'Weekly', source: 'series' })
  for (const title of ['Pitch Night', 'Weekly']) {
    const { entries, twins } = calendarEntries([tuesday], [ownEvent({ title })])
    assert.deepEqual(entries.map(({ id }) => id).sort(), [ownEvent().id, tuesday.id].sort())
    assert.equal(twins.size, 0)
  }
  assert.equal(isEvent(tuesday), false)
  assert.equal(isEvent(calendarEvent()), true)
})

test('calendarEntries shows own events and never the same event twice', () => {
  const { entries, twins } = calendarEntries([calendarEvent()], [ownEvent({ time: '19:00', place: 'Café' })])
  assert.deepEqual(
    entries.map(({ id, source, time, location }) => ({ id, source, time, location })),
    [{ id: 'own-1', source: 'own', time: '19:00', location: 'Café' }],
  )
  assert.equal(twins.get('own-1')?.id, 'evt-1')
})

test('calendarEntries shows the Luma link, cover and end day of an imported own event', () => {
  const imported = ownEvent({
    luma: { id: 'evt-uxwE4KqRRWSUgds', url: 'https://luma.com/ubmm9b6x' },
    coverUrl: 'https://images.lumacdn.com/uploads/s6/cover.png',
    endDue: '2026-11-21',
  })
  const [entry] = calendarEntries([], [imported]).entries
  assert.deepEqual([entry.url, entry.coverUrl, entry.endDay], ['https://luma.com/ubmm9b6x', 'https://images.lumacdn.com/uploads/s6/cover.png', '2026-11-21'])
  const [byHand] = calendarEntries([], [ownEvent()]).entries
  assert.deepEqual([byHand.url, byHand.coverUrl, byHand.endDay], ['', null, '2026-11-20'])
})

test('calendarEntries keeps an uncertain twin visible and asks', () => {
  const { entries, twins } = calendarEntries([calendarEvent({ title: 'Pitch Night' })], [ownEvent()])
  assert.deepEqual(entries.map(({ id }) => id).sort(), ['evt-1', 'own-1'])
  assert.equal(twins.get('own-1')?.id, 'evt-1')
})

test('calendarEntries shows both once members said they differ', () => {
  const { entries, twins } = calendarEntries([calendarEvent()], [ownEvent({ distinctFrom: ['evt-1'] })])
  assert.equal(entries.length, 2)
  assert.equal(twins.size, 0)
})

test('calendarEntries shows a merged event once, as the public event', () => {
  const merged = ownEvent({ event: { id: 'evt-1', missing: false, location: 'Hörsaal 1' }, eventDay: '2026-11-20' })
  const { entries, twins } = calendarEntries([calendarEvent()], [merged])
  assert.deepEqual(entries.map(({ id, source }) => ({ id, source })), [{ id: 'evt-1', source: 'luma' }])
  assert.equal(twins.size, 0)
})

test('calendarEntries never offers a public event that already has its planning project', () => {
  const planning = project({ id: 'plan', type: 'event', event: { id: 'evt-1', missing: false, location: null }, eventDay: '2026-11-20' })
  const { entries, twins } = calendarEntries([calendarEvent()], [planning, ownEvent()])
  assert.deepEqual(entries.map(({ id }) => id).sort(), ['evt-1', 'own-1'])
  assert.equal(twins.size, 0)
})

test('calendarEntries keeps a planned event that left the calendar, and leaves out archived and undated ones', () => {
  const cancelled = project({ id: 'gone', title: 'Abgesagt', type: 'event', event: { id: 'evt-9', missing: true, location: 'Mensa' }, eventDay: '2026-12-01' })
  const { entries } = calendarEntries([], [cancelled, ownEvent({ id: 'old', archived: true }), ownEvent({ id: 'open', due: '' }), project({ id: 'plain', due: '2026-11-20' })])
  assert.deepEqual(entries.map(({ id, location, day }) => ({ id, location, day })), [{ id: 'gone', location: 'Mensa', day: '2026-12-01' }])
})

test('calendarEntries sorts by day and time', () => {
  const { entries } = calendarEntries(
    [calendarEvent({ id: 'late', title: 'Spät', time: '20:00' }), calendarEvent({ id: 'next', title: 'Morgen', day: '2026-11-21', endDay: '2026-11-21', time: '09:00' })],
    [ownEvent({ title: 'Früh', time: '08:00', distinctFrom: ['late', 'next'] })],
  )
  assert.deepEqual(entries.map(({ id }) => id), ['own-1', 'late', 'next'])
})

test('filterScope reads the board filter', () => {
  assert.deepEqual(filterScope('mine', MARKETING, 'flyer'), { team: ALL_TEAMS, myTeam: MARKETING, onlyMine: true, query: 'flyer' })
  assert.deepEqual(filterScope(MARKETING, '', ''), { team: MARKETING, myTeam: '', onlyMine: false, query: '' })
  assert.deepEqual(filterScope(ALL_TEAMS, MARKETING, ''), { team: ALL_TEAMS, myTeam: MARKETING, onlyMine: false, query: '' })
})

test('taskHash and taskRoute are each other\'s inverse', () => {
  for (const view of ['overview', 'tasks', 'projects', 'events'] as const) {
    for (const id of [null, 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6']) {
      assert.deepEqual(taskRoute(taskHash(view, id)), { view, projectId: id })
    }
  }
  assert.equal(taskHash('overview', null), '')
  assert.equal(taskHash('tasks', 'x'), '#board/x')
})

test('taskRoute opens the view of a broken hash without a project', () => {
  assert.deepEqual(taskRoute('#board/%E0%A4'), { view: 'tasks', projectId: null })
  assert.deepEqual(taskRoute('#%E0%A4'), { view: 'overview', projectId: null })
})

test('taskRoute still opens the links of mails and of the older tabs', () => {
  assert.deepEqual(taskRoute('#f81d4fae-7dec-11d0-a765-00a0c91e6bf6'), { view: 'overview', projectId: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6' })
  assert.deepEqual(taskRoute(''), { view: 'overview', projectId: null })
})

test('projectEdits names every changed field and each lead who joins or leaves', () => {
  const stored = { title: 'Teamfotos', description: '', due: '2026-11-20', leads: [ME], team: 'ignite-marketing' as const }
  assert.deepEqual(
    projectEdits(stored, { title: 'Teamfotos auf der Website', due: '', time: '18:30', team: '', leads: { add: [BEN], remove: [] } }),
    [
      { action: 'renamed', detail: 'Teamfotos auf der Website' },
      { action: 'undated', detail: '' },
      { action: 'timed', detail: '18:30' },
      { action: 'unteamed', detail: '' },
      { action: 'leadAdded', detail: '', member: BEN },
    ],
  )
  assert.deepEqual(projectEdits(stored, { description: 'Für die Teamseite', place: 'C.40.254', folderUrl: 'https://leuphanalg.sharepoint.com/x', team: 'ignite-hr', leads: { add: [], remove: [ME] } }), [
    { action: 'described', detail: '' },
    { action: 'placed', detail: 'C.40.254' },
    { action: 'folderLinked', detail: '' },
    { action: 'teamed', detail: 'ignite-hr' },
    { action: 'leadRemoved', detail: '', member: ME },
  ])
})

test('projectEdits ignores values that are already stored', () => {
  const stored = { title: 'Weekly', description: 'Agenda', due: '2026-11-10', leads: [ME] }
  assert.deepEqual(projectEdits(stored, { title: 'Weekly', description: 'Agenda', due: '2026-11-10', time: '', place: '', team: '' }), [])
  assert.deepEqual(projectEdits(stored, { leads: { add: [ME], remove: [BEN] } }), [])
  assert.deepEqual(projectEdits(stored, { due: '2026-11-17' }), [{ action: 'dated', detail: '2026-11-17' }])
  assert.deepEqual(projectEdits({ ...stored, folderUrl: 'https://leuphanalg.sharepoint.com/x' }, { folderUrl: '' }), [{ action: 'folderUnlinked', detail: '' }])
})
