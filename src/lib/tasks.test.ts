import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  addDays,
  assigneeChanges,
  berlinDay,
  berlinHour,
  boardFigures,
  filterProjects,
  isRecordId,
  myFigures,
  myTasks,
  nameFromEmail,
  openRequired,
  parseLessons,
  parseName,
  parseProject,
  parseTask,
  parseTaskPatch,
  parseTemplateTasks,
  progress,
  sortMyTasks,
  taskGroup,
  tasksFromTemplate,
  templateFromTasks,
  weekEnd,
  type BoardFilters,
  type ProjectState,
  type TaskState,
} from './tasks.ts'

const ME = 'a'.repeat(24)
const BEN = 'b'.repeat(24)

const task = (overrides: Partial<TaskState> = {}): TaskState => ({
  id: 't',
  title: 'Aufgabe',
  done: false,
  due: '',
  priority: 'normal',
  required: false,
  assignees: [],
  ...overrides,
})
const project = (overrides: Partial<ProjectState> = {}): ProjectState => ({
  id: 'p',
  title: 'Projekt',
  type: 'internal',
  status: 'active',
  due: '',
  leads: [],
  archived: false,
  eventDay: '',
  tasks: [],
  ...overrides,
})

test('parseProject requires a title and accepts only known types, real days and member ids', () => {
  assert.deepEqual(parseProject({ title: ' Alumni-Netzwerk ', type: 'internal', leads: [ME, ME] }), {
    title: 'Alumni-Netzwerk',
    description: '',
    type: 'internal',
    due: '',
    leads: [ME],
  })
  for (const bad of [{ title: ' ' }, { title: 'x', type: 'meeting' }, { title: 'x', due: '2026-02-30' }, { title: 'x', leads: ['ben@x.de'] }]) {
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
  })
  assert.equal(parseTask({ title: 'x', priority: 'urgent' }), null)
  assert.equal(parseTask({ title: 'x', required: 'yes' }), null)
})

test('parseTaskPatch keeps only the given fields and refuses unknown or empty changes', () => {
  assert.deepEqual(parseTaskPatch({ done: true }), { done: true })
  assert.deepEqual(parseTaskPatch({ due: '' }), { due: '' })
  assert.equal(parseTaskPatch({}), null)
  assert.equal(parseTaskPatch({ title: '' }), null)
  assert.equal(parseTaskPatch({ createdBy: ME }), null)
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

test('boardFigures ignores archived projects', () => {
  const projects = [
    project({ tasks: [task({ assignees: [ME], due: '2026-10-01' }), task({ done: true })] }),
    project({ status: 'done', tasks: [task()] }),
    project({ archived: true, tasks: [task({ assignees: [ME] })] }),
  ]
  assert.deepEqual(boardFigures(projects, ME, '2026-10-28'), { active: 1, open: 2, mine: 1, overdue: 1 })
})

test('myTasks lists only direct assignments, not projects someone leads', () => {
  const projects = [
    project({ id: 'p1', leads: [ME], tasks: [task({ id: 'a', assignees: [BEN] }), task({ id: 'b', assignees: [ME, BEN] })] }),
    project({ id: 'p2', archived: true, tasks: [task({ id: 'c', assignees: [ME] })] }),
  ]
  const mine = myTasks(projects, ME, '2026-10-28')
  assert.deepEqual(mine.map((item) => [item.projectId, item.id]), [['p1', 'b']])
  assert.deepEqual(myFigures(mine), { open: 1, week: 0, overdue: 0, done: 0 })
})

test('sortMyTasks orders by due date, priority or last change', () => {
  const items = [
    { ...task({ id: 'late', due: '2026-11-20', priority: 'high', updatedAt: '2026-10-01' }), projectId: 'p', projectTitle: 'P', group: 'later' as const },
    { ...task({ id: 'none', due: '', priority: 'low', updatedAt: '2026-10-03' }), projectId: 'p', projectTitle: 'P', group: 'none' as const },
    { ...task({ id: 'soon', due: '2026-10-29', priority: 'normal', updatedAt: '2026-10-02' }), projectId: 'p', projectTitle: 'P', group: 'week' as const },
  ]
  assert.deepEqual(sortMyTasks(items, 'due').map((item) => item.id), ['soon', 'late', 'none'])
  assert.deepEqual(sortMyTasks(items, 'priority').map((item) => item.id), ['late', 'soon', 'none'])
  assert.deepEqual(sortMyTasks(items, 'updated').map((item) => item.id), ['none', 'soon', 'late'])
})

test('filterProjects combines type, people, overdue, search and the archive', () => {
  const projects = [
    project({ id: 'event', type: 'event', tasks: [task({ title: 'Speaker kontaktieren', assignees: [BEN], due: '2026-10-01' })] }),
    project({ id: 'mine', leads: [ME] }),
    project({ id: 'old', archived: true }),
  ]
  const base: BoardFilters = { query: '', type: '', mine: false, overdue: false, member: '', archived: false }
  const ids = (filters: Partial<BoardFilters>) =>
    filterProjects(projects, { ...base, ...filters }, ME, '2026-10-28').map((item) => item.id)
  assert.deepEqual(ids({}), ['event', 'mine'])
  assert.deepEqual(ids({ type: 'event' }), ['event'])
  assert.deepEqual(ids({ mine: true }), ['mine'])
  assert.deepEqual(ids({ member: BEN }), ['event'])
  assert.deepEqual(ids({ overdue: true }), ['event'])
  assert.deepEqual(ids({ query: 'speaker' }), ['event'])
  assert.deepEqual(ids({ archived: true }), ['old'])
})

test('openRequired counts open required tasks only', () => {
  assert.equal(openRequired([task({ required: true }), task({ required: true, done: true }), task()]), 1)
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
  assert.ok(copied.every((item) => item.assignees.length === 0))
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
