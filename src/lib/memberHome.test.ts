import assert from 'node:assert/strict'
import { test } from 'node:test'
import { dayLabel, eventDate, eventTaskCount, homeFigures, nextEvent, openTasks, parseProfile, showsTeamChoice, splitName } from './memberHome.ts'
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
  due: '',
  leads: [],
  team: '',
  archived: false,
  eventDay: '',
  tasks,
  event: null,
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

test('openTasks carries what the dashboard shows and links to', () => {
  const [first] = openTasks([project('a', [task('x', { due: '2026-11-08' })], { event: { id: 'evt' } })], ME, TODAY, [])
  assert.deepEqual(first, {
    id: 'x',
    title: 'x',
    due: '2026-11-08',
    group: 'week',
    projectId: 'a',
    projectTitle: 'Project a',
    eventId: 'evt',
    private: false,
  })
})

test('openTasks lists open private tasks by their deadline, without a project', () => {
  const done: PrivateTaskState = { ...privateTask('done'), done: true, status: 'done' }
  const tasks = openTasks([project('a', [task('x', { due: '2026-11-08' })])], ME, TODAY, [privateTask('p', { due: '2026-11-07' }), done])
  assert.deepEqual(tasks.map(({ id, private: isPrivate }) => [id, isPrivate]), [['p', true], ['x', false]])
  assert.equal(tasks[0].projectId, '')
  assert.equal(tasks[0].eventId, '')
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

test('eventTaskCount counts only tasks of that event', () => {
  const tasks = openTasks(
    [project('a', [task('x'), task('y')], { event: { id: 'evt' } }), project('b', [task('z')])],
    ME,
    TODAY,
    [],
  )
  assert.equal(eventTaskCount(tasks, 'evt'), 2)
  assert.equal(eventTaskCount(tasks, 'other'), 0)
})

test('nextEvent skips events that are over and keeps one that is still running', () => {
  const at = (iso: string) => new Date(iso)
  const past = { id: 'past', startAt: at('2026-11-01T17:00:00Z'), endAt: at('2026-11-01T19:00:00Z') }
  const running = { id: 'running', startAt: at('2026-11-06T09:00:00Z'), endAt: at('2026-11-06T18:00:00Z') }
  const coming = { id: 'coming', startAt: at('2026-11-19T17:30:00Z'), endAt: at('2026-11-19T20:00:00Z') }
  const now = at('2026-11-06T12:00:00Z').getTime()
  assert.equal(nextEvent([past, running, coming], now)?.id, 'running')
  assert.equal(nextEvent([past, coming], now)?.id, 'coming')
  assert.equal(nextEvent([past], now), null)
})

test('dayLabel names the weekday without a dot', () => {
  assert.equal(dayLabel('2026-11-04', 'de'), 'Mi, 4. Nov.')
  assert.equal(dayLabel('2026-11-04', 'en'), 'Wed, 4 Nov')
})

test('eventDate shows Berlin time, also when the day differs from UTC', () => {
  assert.deepEqual(eventDate(new Date('2026-11-19T17:30:00Z'), 'de'), { month: 'Nov.', day: '19', weekdayDay: 'Do, 19. Nov.', time: '18:30' })
  assert.deepEqual(eventDate(new Date('2026-12-31T23:30:00Z'), 'en'), { month: 'Jan', day: '1', weekdayDay: 'Fri, 1 Jan', time: '00:30' })
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
