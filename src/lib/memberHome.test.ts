import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  afterTicks,
  dayDate,
  dayLabel,
  eventDate,
  eventTaskCount,
  homeFigures,
  nextEvent,
  openTasks,
  parseProfile,
  showsTeamChoice,
  splitName,
  unassignedCount,
} from './memberHome.ts'
import type { HomeProject } from './memberHome.ts'
import type { PrivateTaskState, TaskState } from './tasks.ts'

const ME = 'me'
const TODAY = '2026-11-06'

const task = (id: string, fields: Partial<TaskState> = {}): TaskState => ({
  id,
  title: id,
  done: false,
  status: 'backlog',
  due: '',
  priority: 'normal',
  required: false,
  assignees: [ME],
  team: '',
  ...fields,
})

const privateTask = (id: string, fields: Partial<PrivateTaskState> = {}): PrivateTaskState => ({
  id,
  title: id,
  description: '',
  done: false,
  status: 'backlog',
  doneAt: '',
  due: '',
  priority: 'normal',
  team: '',
  ...fields,
})

const project = (id: string, tasks: TaskState[], fields: Partial<HomeProject> = {}): HomeProject => ({
  id,
  title: `Project ${id}`,
  type: 'internal',
  status: 'active',
  leads: [],
  archived: false,
  tasks,
  ...fields,
})

test('openTasks lists only open tasks of the member, soonest deadline first and tasks without one last', () => {
  const tasks = openTasks(
    [
      project('a', [
        task('later', { due: '2026-12-01' }),
        task('none'),
        task('done', { due: '2026-11-01', done: true }),
        task('other', { due: '2026-11-01', assignees: ['someone'] }),
      ]),
      project('b', [task('overdue', { due: '2026-11-02' })]),
    ],
    ME,
    TODAY,
    [],
  )
  assert.deepEqual(
    tasks.map(({ id }) => id),
    ['overdue', 'later', 'none'],
  )
})

test('openTasks leaves out archived and finished projects', () => {
  const tasks = openTasks([project('a', [task('x')], { archived: true }), project('b', [task('y')], { status: 'done' })], ME, TODAY, [])
  assert.deepEqual(tasks, [])
})

test('openTasks marks tasks that are a project of their own, whose project title only repeats them', () => {
  const [single] = openTasks([project('a', [task('x')], { type: 'task' })], ME, TODAY, [])
  const [inProject] = openTasks([project('b', [task('y')], { type: 'internal' })], ME, TODAY, [])
  assert.equal(single.single, true)
  assert.equal(inProject.single, false)
})

test('openTasks carries what the dashboard shows and links to', () => {
  const [first] = openTasks([project('a', [task('x', { due: '2026-11-08' })])], ME, TODAY, [])
  assert.deepEqual(first, {
    id: 'x',
    title: 'x',
    due: '2026-11-08',
    group: 'week',
    nextDue: '',
    projectId: 'a',
    projectTitle: 'Project a',
    private: false,
    single: false,
  })
})

test('openTasks names the deadline a tick gives a repeating task, as the server works it out', () => {
  const tasks = openTasks(
    [
      project('a', [
        task('weekly', { due: '2026-11-04', repeat: 'weekly' }),
        task('monthly', { due: '2026-10-31', repeat: 'monthly' }),
        task('none', { repeat: 'weekly' }),
      ]),
    ],
    ME,
    TODAY,
    [privateTask('p', { due: '2026-11-06', repeat: 'biweekly' })],
  )
  const next = Object.fromEntries(tasks.map(({ id, nextDue }) => [id, nextDue]))
  // Overdue since Wednesday: the next Wednesday after today. A month from 31 October is 30 November.
  assert.equal(next.weekly, '2026-11-11')
  assert.equal(next.monthly, '2026-11-30')
  // Without a deadline the rhythm starts today.
  assert.equal(next.none, '2026-11-13')
  assert.equal(next.p, '2026-11-20')
})

test('openTasks lists open private tasks by their deadline, without a project', () => {
  const done: PrivateTaskState = { ...privateTask('done'), done: true, status: 'done' }
  const tasks = openTasks([project('a', [task('x', { due: '2026-11-08' })])], ME, TODAY, [privateTask('p', { due: '2026-11-07' }), done])
  assert.deepEqual(tasks.map(({ id, private: isPrivate }) => [id, isPrivate]), [['p', true], ['x', false]])
  assert.equal(tasks[0].projectId, '')
  assert.equal(tasks[0].nextDue, '')
})

test('homeFigures counts open, this week and overdue', () => {
  const tasks = openTasks(
    [project('a', [task('o', { due: '2026-11-02' }), task('w', { due: TODAY }), task('l', { due: '2026-12-24' }), task('n')])],
    ME,
    TODAY,
    [],
  )
  assert.deepEqual(homeFigures(tasks), { open: 4, week: 1, overdue: 1 })
})

test('homeFigures follow ticks: a finished task leaves, a repeating one stays with its next deadline', () => {
  const tasks = openTasks(
    [
      project('a', [
        task('late', { due: '2026-11-02' }),
        task('weekly', { due: '2026-11-05', repeat: 'weekly' }),
        task('soon', { due: TODAY }),
      ]),
    ],
    ME,
    TODAY,
    [],
  )
  assert.deepEqual(homeFigures(tasks), { open: 3, week: 1, overdue: 2 })
  const after = afterTicks(tasks, new Set(['late', 'weekly']), TODAY)
  assert.deepEqual(
    after.map(({ id, due, group }) => [id, due, group]),
    [
      ['weekly', '2026-11-12', 'later'],
      ['soon', TODAY, 'week'],
    ],
  )
  assert.deepEqual(homeFigures(after), { open: 2, week: 1, overdue: 0 })
})

test('unassignedCount counts open tasks without people in the open projects the member leads', () => {
  const nobody = { assignees: [] }
  const projects = [
    project('led', [task('free', nobody), task('taken'), task('finished', { ...nobody, done: true })], { leads: [ME] }),
    project('single', [task('card', nobody)], { type: 'task', leads: [ME, 'someone'] }),
    project('foreign', [task('other', nobody)], { leads: ['someone'] }),
    project('archived', [task('old', nobody)], { leads: [ME], archived: true }),
    project('done', [task('closed', nobody)], { leads: [ME], status: 'done' }),
  ]
  assert.equal(unassignedCount(projects, ME), 2)
  assert.equal(unassignedCount(projects, 'nobody'), 0)
})

test('eventTaskCount counts the tasks of the project that plans the event, none without one', () => {
  const tasks = openTasks(
    [project('plan', [task('x'), task('y')], { type: 'event' }), project('b', [task('z')])],
    ME,
    TODAY,
    [privateTask('p')],
  )
  assert.equal(eventTaskCount(tasks, 'plan'), 2)
  assert.equal(eventTaskCount(tasks, 'other'), 0)
  // Private tasks have no project, so an event without planning must not count them.
  assert.equal(eventTaskCount(tasks, null), 0)
})

test('nextEvent skips events that are over and keeps one that is still running', () => {
  const at = (iso: string) => new Date(iso)
  const past = { id: 'past', endDay: '2026-11-01', endAt: at('2026-11-01T19:00:00Z') }
  const running = { id: 'running', endDay: TODAY, endAt: at('2026-11-06T18:00:00Z') }
  const coming = { id: 'coming', endDay: '2026-11-19', endAt: at('2026-11-19T20:00:00Z') }
  const now = at('2026-11-06T12:00:00Z').getTime()
  assert.equal(nextEvent([past, running, coming], now)?.id, 'running')
  assert.equal(nextEvent([past, coming], now)?.id, 'coming')
  assert.equal(nextEvent([past], now), null)
})

test('nextEvent keeps an own event without an end time until its last day is over', () => {
  const allDay = { id: 'all-day', endDay: TODAY, endAt: null }
  const late = new Date('2026-11-06T22:30:00Z').getTime()
  assert.equal(nextEvent([allDay], late)?.id, 'all-day')
  assert.equal(nextEvent([allDay], new Date('2026-11-06T23:30:00Z').getTime()), null)
})

test('dayLabel names the weekday without a dot', () => {
  assert.equal(dayLabel('2026-11-04', 'de'), 'Mi, 4. Nov.')
  assert.equal(dayLabel('2026-11-04', 'en'), 'Wed, 4 Nov')
})

test('eventDate shows Berlin time, also when the day differs from UTC', () => {
  assert.deepEqual(eventDate(new Date('2026-11-19T17:30:00Z'), 'de'), { month: 'Nov.', day: '19', weekdayDay: 'Do, 19. Nov.', time: '18:30' })
  assert.deepEqual(eventDate(new Date('2026-12-31T23:30:00Z'), 'en'), { month: 'Jan', day: '1', weekdayDay: 'Fri, 1 Jan', time: '00:30' })
})

test('dayDate fills the same tile from a day', () => {
  assert.deepEqual(dayDate('2026-11-24', 'de'), { month: 'Nov.', day: '24', weekdayDay: 'Di, 24. Nov.' })
  assert.deepEqual(dayDate('2027-01-01', 'en'), { month: 'Jan', day: '1', weekdayDay: 'Fri, 1 Jan' })
})

test('splitName takes the first word as first name and the rest as last name', () => {
  assert.deepEqual(splitName('Noah Samel'), { firstName: 'Noah', lastName: 'Samel' })
  assert.deepEqual(splitName('Anna Maria von Hagen'), { firstName: 'Anna', lastName: 'Maria von Hagen' })
  assert.deepEqual(splitName('Noah'), { firstName: 'Noah', lastName: '' })
})

test('showsTeamChoice asks members without a team and on request, but never the board', () => {
  assert.equal(showsTeamChoice(false, false, false), true)
  assert.equal(showsTeamChoice(true, false, false), false)
  assert.equal(showsTeamChoice(true, false, true), true)
  assert.equal(showsTeamChoice(false, true, false), false)
  assert.equal(showsTeamChoice(false, true, true), false)
})

test('parseProfile needs both names and a real team', () => {
  const profile = { firstName: ' Noah ', lastName: 'Samel', team: 'ignite-marketing' }
  assert.deepEqual(parseProfile(profile), { firstName: 'Noah', lastName: 'Samel', team: 'ignite-marketing' })
  assert.equal(parseProfile({ ...profile, team: '' }), null)
  assert.equal(parseProfile({ ...profile, team: 'ignite-unknown' }), null)
  assert.equal(parseProfile({ ...profile, firstName: '' }), null)
  assert.equal(parseProfile(null), null)
})
