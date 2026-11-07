import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ToolError } from './mcp.ts'
import { taskTools, type TaskToolStore } from './taskTools.ts'
import type { ProjectFields, TaskFields, TaskPatch } from './tasks.ts'

const me = 'a'.repeat(24)
const other = 'b'.repeat(24)
const projectId = '11111111-1111-4111-8111-111111111111'
const taskId = '22222222-2222-4222-8222-222222222222'
const now = Date.parse('2026-11-06T10:00:00.000Z')

const task = (overrides = {}) => ({
  id: taskId,
  title: 'Flyer drucken',
  description: 'Bei der Druckerei',
  done: false,
  status: 'backlog' as const,
  due: '2026-11-08',
  priority: 'normal' as const,
  required: false,
  assignees: [me],
  team: '' as const,
  ...overrides,
})

const project = (overrides = {}) => ({
  id: projectId,
  title: 'Open Weekly',
  description: 'Unser Treffen',
  type: 'internal' as const,
  status: 'active' as const,
  due: '',
  leads: [other],
  team: '' as const,
  archived: false,
  eventDay: '',
  event: null as { id: string } | null,
  tasks: [task()],
  ...overrides,
})

function setup(projects = [project()], outcome = 'ok', complete = true) {
  const calls: {
    added?: [string, TaskFields]
    updated?: [string, string, TaskPatch]
    single?: [ProjectFields, TaskFields]
  } = {}
  const store: TaskToolStore = {
    workspace: async () => ({
      projects,
      members: [
        { id: me, name: 'Noah', team: 'ignite-infrastructure' },
        { id: other, name: 'Lisa', team: '' },
      ],
    }),
    events: async () => ({
      complete,
      events: [
        {
          id: 'evt-past',
          title: 'Vorbei',
          startAt: new Date('2026-10-01T17:00:00Z'),
          endAt: new Date('2026-10-01T19:00:00Z'),
          location: null,
          url: 'https://luma.com/a',
          source: 'luma',
        },
        {
          id: 'evt-next',
          title: 'Demo Day',
          startAt: new Date('2026-11-20T17:00:00Z'),
          endAt: new Date('2026-11-20T19:00:00Z'),
          location: 'Campus',
          url: 'https://luma.com/b',
          source: 'luma',
        },
        {
          id: 'weekly-2026-11-24',
          title: 'Weekly',
          startAt: new Date('2026-11-24T15:00:00Z'),
          endAt: new Date('2026-11-24T16:00:00Z'),
          location: 'C.40.254',
          url: '',
          source: 'series',
        },
      ],
    }),
    addTask: async (id, fields) => {
      calls.added = [id, fields]
      return outcome
    },
    updateTask: async (id, target, patch) => {
      calls.updated = [id, target, patch]
      return outcome
    },
    createSingleTask: async (fields, single) => {
      calls.single = [fields, single]
      return 'new-card'
    },
  }
  const tools = taskTools(me, store, () => now)
  const run = (name: string, args = {}) =>
    tools.find((tool) => tool.name === name)!.run(args) as Promise<Record<string, any>>
  return { calls, run, tools }
}

test('offers no tool that deletes or archives', () => {
  const names = setup().tools.map((tool) => tool.name)
  assert.deepEqual(names, ['my_tasks', 'list_projects', 'get_project', 'upcoming_events', 'create_task', 'update_task'])
  for (const tool of setup().tools) assert.equal(tool.annotations.destructiveHint ?? false, false)
})

test('my_tasks lists open own tasks by deadline with their group', async () => {
  const projects = [
    project({
      tasks: [
        task({ id: 't-later', due: '2026-12-01' }),
        task({ id: 't-over', due: '2026-11-01' }),
        task({ id: 't-done', done: true, status: 'done' }),
        task({ id: 't-other', assignees: [other] }),
      ],
    }),
    project({ id: 'archived', archived: true }),
    project({ id: 'finished', status: 'done' }),
  ]
  const { tasks, today } = await setup(projects).run('my_tasks')
  assert.equal(today, '2026-11-06')
  assert.deepEqual(
    tasks.map((item: { task_id: string; group: string }) => [item.task_id, item.group]),
    [
      ['t-over', 'overdue'],
      ['t-later', 'later'],
    ],
  )
})

test('my_tasks sends no member data besides the task', async () => {
  const { tasks } = await setup().run('my_tasks')
  assert.deepEqual(Object.keys(tasks[0]).sort(), [
    'due',
    'group',
    'priority',
    'project',
    'project_id',
    'status',
    'task_id',
    'title',
  ])
})

test('list_projects leaves out archived projects and single tasks, and filters', async () => {
  const projects = [
    project(),
    project({ id: 'mine-not', title: 'Sponsoring', leads: [], tasks: [task({ assignees: [other] })] }),
    project({ id: 'archived', archived: true }),
    project({ id: 'single', type: 'task' }),
  ]
  const { run } = setup(projects)
  assert.deepEqual(
    (await run('list_projects')).projects.map((item: { project_id: string }) => item.project_id),
    [projectId, 'mine-not'],
  )
  assert.deepEqual(
    (await run('list_projects', { only_mine: true })).projects.map((item: { project_id: string }) => item.project_id),
    [projectId],
  )
  assert.deepEqual(
    (await run('list_projects', { query: 'spons' })).projects.map((item: { project_id: string }) => item.project_id),
    ['mine-not'],
  )
  assert.deepEqual((await run('list_projects')).projects[0].progress, { done: 0, total: 1, percent: 0 })
})

test('get_project shows names instead of member ids and skips removed members', async () => {
  const { leads, tasks } = await setup([project({ tasks: [task({ assignees: [me, 'c'.repeat(24)] })] })]).run(
    'get_project',
    { project_id: projectId },
  )
  assert.deepEqual(leads, ['Lisa'])
  assert.deepEqual(tasks[0].assignees, ['Noah'])
})

test('get_project reports unknown and malformed ids as tool errors', async () => {
  const { run } = setup()
  await assert.rejects(run('get_project', { project_id: '33333333-3333-4333-8333-333333333333' }), ToolError)
  await assert.rejects(run('get_project', { project_id: 'x' }), ToolError)
})

test('upcoming_events skips past events and the Weekly and links the planning project', async () => {
  const { events } = await setup([project({ event: { id: 'evt-next' } })]).run('upcoming_events')
  assert.equal(events.length, 1)
  assert.equal(events[0].title, 'Demo Day')
  assert.equal(events[0].project_id, projectId)
})

test('upcoming_events refuses an incomplete calendar instead of leaving events out', async () => {
  await assert.rejects(setup([project()], 'ok', false).run('upcoming_events'), ToolError)
})

test('create_task adds to a project and assigns the member', async () => {
  const { calls, run } = setup()
  const answer = await run('create_task', { title: ' Raum buchen ', due: '2026-11-20', project_id: projectId })
  assert.equal(answer.project_id, projectId)
  assert.equal(calls.added?.[0], projectId)
  assert.equal(calls.added?.[1].title, 'Raum buchen')
  assert.deepEqual(calls.added?.[1].assignees, [me])
})

test("create_task without project makes a single task in the member's team", async () => {
  const { calls, run } = setup()
  const answer = await run('create_task', { title: 'Raum buchen' })
  assert.equal(answer.project_id, 'new-card')
  assert.equal(calls.single?.[0].type, 'task')
  assert.equal(calls.single?.[0].team, 'ignite-infrastructure')
  assert.deepEqual(calls.single?.[1].assignees, [me])
})

test('create_task takes no other assignees, whatever the model sends', async () => {
  const { calls, run } = setup()
  await run('create_task', { title: 'Raum buchen', assignees: [other] })
  assert.deepEqual(calls.single?.[1].assignees, [me])
})

test('create_task refuses invalid input', async () => {
  const { run } = setup()
  await assert.rejects(run('create_task', {}), ToolError)
  await assert.rejects(run('create_task', { title: 'A', due: 'morgen' }), ToolError)
  await assert.rejects(run('create_task', { title: 'A', priority: 'urgent' }), ToolError)
  await assert.rejects(run('create_task', { title: 'A', project_id: 'x' }), ToolError)
})

test('update_task passes only the fields it allows', async () => {
  const { calls, run } = setup()
  await run('update_task', {
    project_id: projectId,
    task_id: taskId,
    status: 'done',
    assignees: [other],
    required: true,
  })
  assert.deepEqual(calls.updated, [projectId, taskId, { status: 'done' }])
})

test('update_task can clear the deadline and refuses an empty change', async () => {
  const { calls, run } = setup()
  await run('update_task', { project_id: projectId, task_id: taskId, due: '' })
  assert.deepEqual(calls.updated?.[2], { due: '' })
  await assert.rejects(run('update_task', { project_id: projectId, task_id: taskId }), ToolError)
})

test('turns store outcomes into messages and treats unknown ones as bugs', async () => {
  await assert.rejects(
    setup([project()], 'unknown').run('update_task', { project_id: projectId, task_id: taskId, due: '' }),
    ToolError,
  )
  await assert.rejects(setup([project()], 'full').run('create_task', { title: 'A', project_id: projectId }), ToolError)
  await assert.rejects(
    setup([project()], 'forbidden').run('create_task', { title: 'A', project_id: projectId }),
    (err: Error) => !(err instanceof ToolError),
  )
})
