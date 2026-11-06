import { test } from 'node:test'
import assert from 'node:assert/strict'
import { openTeams } from '../data/openTeams.ts'
import {
  addDays,
  ALL_TEAMS,
  applyChanges,
  applyMemberChange,
  assigneeChanges,
  berlinDay,
  berlinHour,
  boardColumns,
  filterProjects,
  isRecordId,
  nameFromEmail,
  memberChange,
  nextStanding,
  openRequired,
  parseLessons,
  parseName,
  parseProject,
  parseProjectPatch,
  parseTask,
  parseTaskPatch,
  patchedTask,
  parseTeam,
  parseTemplateTasks,
  progress,
  projectAssignees,
  scopedPrivateTasks,
  scopedTasks,
  sortTasks,
  TEAM_IDS,
  taskGroup,
  taskStatus,
  taskTeam,
  tasksFromTemplate,
  templateFromTasks,
  weekEnd,
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
    leads: [ME],
    team: MARKETING,
  })
  for (const bad of [{ title: ' ' }, { title: 'x', type: 'meeting' }, { title: 'x', due: '2026-02-30' }, { title: 'x', leads: ['ben@x.de'] }, { title: 'x', team: 'podcast' }]) {
    assert.equal(parseProject(bad), null, JSON.stringify(bad))
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
  })
  assert.equal(parseTask({ title: 'x', priority: 'urgent' }), null)
  assert.equal(parseTask({ title: 'x', team: 'podcast' }), null)
  assert.equal(parseTask({ title: 'x', required: 'yes' }), null)
  assert.equal(parseTask({ title: 'x', status: 'blocked' }), null)
  assert.equal(parseTask({ title: 'x', status: 'review' })?.status, 'review')
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

test('parseLessons needs at least one answer', () => {
  assert.equal(parseLessons({ wellDone: '', improve: ' ' }), null)
  assert.deepEqual(parseLessons({ improve: 'Früher buchen' }), { wellDone: '', improve: 'Früher buchen', notes: '' })
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

test('openRequired counts open required tasks only', () => {
  assert.equal(openRequired([task({ required: true }), task({ required: true, done: true }), task()]), 1)
})

test('taskStatus reads tasks stored before the board from their done flag', () => {
  assert.equal(taskStatus({ done: true }), 'done')
  assert.equal(taskStatus({ done: false }), 'backlog')
  assert.equal(taskStatus({ done: false, status: 'review' }), 'review')
})

test('nextStanding keeps status and done in step', () => {
  const open = { done: false, status: 'doing' } as const
  const finished = { done: true, status: 'done' } as const
  assert.deepEqual(nextStanding(open, { status: 'review' }), { done: false, status: 'review' })
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
  assert.deepEqual(columns.review, [])
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

test('memberChange says who a picker added or removed, and applyMemberChange replays it on a newer list', () => {
  assert.deepEqual(memberChange([ME], [ME, BEN]), { add: [BEN], remove: [] })
  assert.deepEqual(memberChange([ME, BEN], [BEN]), { add: [], remove: [ME] })
  assert.deepEqual(applyMemberChange([ME], { add: [BEN], remove: [] }), [ME, BEN])
  assert.deepEqual(applyMemberChange([ME, BEN], { add: [BEN], remove: [] }), [ME, BEN])
  assert.deepEqual(applyMemberChange([ME, BEN], { add: [], remove: [ME] }), [BEN])
})

test('patchedTask applies people as a step and leaves the rest of the task alone', () => {
  const task = { done: false, status: 'doing' as const, assignees: [ME], title: 'A' }
  assert.deepEqual(patchedTask(task, { assignees: { add: [BEN], remove: [] } }), { ...task, assignees: [ME, BEN] })
  assert.deepEqual(patchedTask(task, { title: 'B' }), { ...task, title: 'B' })
})

test('patchedTask adds no people to a private task', () => {
  const task = { done: false, status: 'doing' as const, title: 'A' }
  assert.deepEqual(patchedTask(task, { title: 'B' }), { ...task, title: 'B' })
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
