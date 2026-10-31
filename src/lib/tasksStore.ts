/**
 * MongoDB access for the tasks module of the members area. Collections:
 * - `task_projects`: the cards of the board (event projects, internal projects, single tasks) with their subtasks,
 *   lessons learned and activity log embedded, so one update changes a project atomically. A unique index on
 *   `event.id` lets every public event have at most one planning project. `event` is a snapshot of the public event;
 *   syncEvents refreshes it and never touches tasks, people or status.
 * - `task_templates`: checklists to start a project from; the standard ones (data/taskTemplates.ts) are copied in once.
 * - `task_notifications`: one pending entry per member and task they were newly assigned to, until the daily digest
 *   (taskDigest.ts) sends it. Removing the assignment, finishing or deleting the task removes the entry.
 * Members are referenced by the hex id of their `members` document. Every signed-in member reads and changes
 * projects and tasks; archiving and changing the leads is up to admins, the creator and the project's leads, deleting a
 * project and archiving templates up to admins.
 */
import { randomUUID } from 'node:crypto'
import { ObjectId } from 'mongodb'
import type { MemberRole } from './memberAuth'
import { database, displayName, type Member } from './members'
import { photoPath } from './emailSignature'
import { standardTemplates } from '../data/taskTemplates'
import type { TaskEvent } from './taskEvents'
import {
  assigneeChanges,
  berlinDay,
  MAX_TASKS,
  type Lessons,
  type ProjectFields,
  type ProjectStatus,
  type ProjectType,
  type TaskFields,
  type TaskPatch,
  type TemplateTask,
  tasksFromTemplate,
  templateFromTasks,
} from './tasks'

const ACTIVITY_MAX = 300

interface TaskDoc extends TaskFields {
  id: string
  done: boolean
  doneBy: string | null
  doneAt: Date | null
  position: number
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

interface EventSnapshot {
  id: string
  title: string
  startAt: Date
  endAt: Date
  location: string | null
  url: string
  /** The event is no longer in the calendar, for example because it was cancelled. */
  missing: boolean
}

export type ActivityAction =
  | 'created'
  | 'edited'
  | 'status'
  | 'archived'
  | 'restored'
  | 'taskAdded'
  | 'taskEdited'
  | 'taskDone'
  | 'taskReopened'
  | 'taskRemoved'
  | 'assigned'
  | 'unassigned'
  | 'due'
  | 'lessons'
  | 'template'

interface Activity {
  at: Date
  actor: string
  action: ActivityAction
  /** Task title, new status, member id or template name, depending on the action. */
  detail: string
  member?: string
}

interface ProjectDoc {
  _id: string
  title: string
  description: string
  type: ProjectType
  status: ProjectStatus
  event: EventSnapshot | null
  due: string
  leads: string[]
  tasks: TaskDoc[]
  lessons: (Lessons & { by: string; at: Date }) | null
  activity: Activity[]
  createdBy: string
  createdAt: Date
  updatedAt: Date
  completedAt: Date | null
  archivedAt: Date | null
}

interface TemplateDoc {
  _id: string
  name: string
  description: string
  tasks: TemplateTask[]
  sourceProjectId: string | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
  archivedAt: Date | null
}

export interface NotificationDoc {
  /** `${memberId}:${taskId}`, so assigning someone twice before the digest still makes one entry. */
  _id: string
  memberId: string
  projectId: string
  taskId: string
  createdAt: Date
}

/** The signed-in member as the tasks module sees them. */
export interface TaskActor {
  id: string
  email: string
  role: MemberRole
  /** Whether they entered first and last name themselves. */
  named: boolean
}

let ready: Promise<unknown> | null = null

async function collections() {
  const db = await database()
  const projects = db.collection<ProjectDoc>('task_projects')
  const templates = db.collection<TemplateDoc>('task_templates')
  const notifications = db.collection<NotificationDoc>('task_notifications')
  ready ??= Promise.all([
    projects.createIndex({ 'event.id': 1 }, { unique: true, partialFilterExpression: { 'event.id': { $type: 'string' } } }),
    projects.createIndex({ 'tasks.id': 1 }),
    notifications.createIndex({ taskId: 1 }),
    notifications.createIndex({ projectId: 1 }),
    ...standardTemplates.map(({ id, ...template }) =>
      templates.updateOne(
        { _id: id },
        {
          $setOnInsert: {
            ...template,
            sourceProjectId: null,
            createdBy: 'system',
            createdAt: new Date(),
            updatedAt: new Date(),
            archivedAt: null,
          },
        },
        { upsert: true },
      ),
    ),
  ]).catch((err) => {
    ready = null
    throw err
  })
  await ready
  return { projects, templates, notifications, members: db.collection<Member & { _id: ObjectId }>('members') }
}

/** The member behind a session, with the id the module uses; null when they were removed meanwhile. */
export async function taskActor(session: { email: string; role: MemberRole }): Promise<TaskActor | null> {
  const { members } = await collections()
  const member = await members.findOne({ email: session.email }, { projection: { _id: 1, firstName: 1, lastName: 1 } })
  return member && { id: member._id.toHexString(), email: session.email, role: session.role, named: !!(member.firstName && member.lastName) }
}

/** Name and photo of every member, the only personal data the board shows. */
async function directory() {
  const { members } = await collections()
  const db = await database()
  const [list, photos] = await Promise.all([
    members.find({}, { projection: { _id: 1, email: 1, firstName: 1, lastName: 1, signature: 1 } }).toArray(),
    db.collection<{ _id: string; email: string }>('member_photos').find({}, { projection: { _id: 1, email: 1 }, sort: { createdAt: 1 } }).toArray(),
  ])
  const photoIds = new Map(photos.map(({ _id, email }) => [email, _id]))
  return list
    .map((member) => {
      const photoId = photoIds.get(member.email)
      return { id: member._id.toHexString(), name: displayName(member), photo: photoId ? photoPath(photoId) : '' }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))
}
export type TaskMember = Awaited<ReturnType<typeof directory>>[number]

const mayArchive = (project: Pick<ProjectDoc, 'createdBy' | 'leads'>, actor: TaskActor) =>
  actor.role === 'admin' || project.createdBy === actor.id || project.leads.includes(actor.id)

function projectSummary(project: ProjectDoc, actor: TaskActor, known: Set<string>) {
  const people = (ids: string[]) => ids.filter((id) => known.has(id))
  return {
    id: project._id,
    title: project.title,
    description: project.description,
    type: project.type,
    status: project.status,
    event: project.event && {
      ...project.event,
      startAt: project.event.startAt.toISOString(),
      endAt: project.event.endAt.toISOString(),
    },
    eventDay: project.event ? berlinDay(project.event.startAt.getTime()) : '',
    due: project.due,
    leads: people(project.leads),
    tasks: [...project.tasks]
      .sort((a, b) => a.position - b.position)
      .map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        done: task.done,
        doneBy: task.doneBy,
        doneAt: task.doneAt?.toISOString() ?? '',
        due: task.due,
        priority: task.priority,
        required: task.required,
        assignees: people(task.assignees),
        createdBy: task.createdBy,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      })),
    lessons: project.lessons && { ...project.lessons, at: project.lessons.at.toISOString() },
    activity: [...project.activity].reverse().map((entry) => ({ ...entry, at: entry.at.toISOString() })),
    createdBy: project.createdBy,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    completedAt: project.completedAt?.toISOString() ?? '',
    archived: !!project.archivedAt,
    mayArchive: mayArchive(project, actor),
    mayDelete: actor.role === 'admin',
  }
}
export type ProjectSummary = ReturnType<typeof projectSummary>

function templateSummary(template: TemplateDoc) {
  return {
    id: template._id,
    name: template.name,
    description: template.description,
    tasks: template.tasks,
    sourceProjectId: template.sourceProjectId,
    standard: template._id.startsWith('std-'),
  }
}
export type TemplateSummary = ReturnType<typeof templateSummary>

/** Everything the TaskWorkspace island shows: projects, active templates and the member directory. */
export async function workspaceState(actor: TaskActor) {
  const { projects, templates } = await collections()
  const [projectList, templateList, members] = await Promise.all([
    projects.find({}, { sort: { updatedAt: -1 } }).toArray(),
    templates.find({ archivedAt: null }, { sort: { name: 1 } }).toArray(),
    directory(),
  ])
  const known = new Set(members.map((member) => member.id))
  return {
    projects: projectList.map((project) => projectSummary(project, actor, known)),
    templates: templateList.map(templateSummary),
    members,
  }
}
export type WorkspaceState = Awaited<ReturnType<typeof workspaceState>>

const activity = (actor: TaskActor, action: ActivityAction, detail = '', member?: string): Activity => ({
  at: new Date(),
  actor: actor.id,
  action,
  detail,
  ...(member ? { member } : {}),
})

const pushActivity = (entries: Activity[]) => ({ activity: { $each: entries, $slice: -ACTIVITY_MAX } })

/** Queues a digest entry for everyone newly assigned, except the actor, who knows already. */
async function notify(projectId: string, taskId: string, memberIds: string[], actor: TaskActor) {
  const { notifications } = await collections()
  const createdAt = new Date()
  await Promise.all(
    memberIds
      .filter((memberId) => memberId !== actor.id)
      .map((memberId) =>
        notifications.updateOne(
          { _id: `${memberId}:${taskId}` },
          { $setOnInsert: { memberId, projectId, taskId, createdAt } },
          { upsert: true },
        ),
      ),
  )
}

async function unnotify(taskId: string, memberIds?: string[]) {
  const { notifications } = await collections()
  await notifications.deleteMany(memberIds ? { taskId, memberId: { $in: memberIds } } : { taskId })
}

function newTask(fields: TaskFields, position: number, actor: TaskActor, now: Date): TaskDoc {
  return { ...fields, id: randomUUID(), done: false, doneBy: null, doneAt: null, position, createdBy: actor.id, createdAt: now, updatedAt: now }
}

const eventSnapshot = (event: TaskEvent): EventSnapshot => ({
  id: event.id,
  title: event.title,
  startAt: event.startAt,
  endAt: event.endAt,
  location: event.location,
  url: event.url,
  missing: false,
})

export type TemplateSource = { kind: 'template' | 'project'; id: string; include: number[] | null }

/** The checklist a new project starts from; null for an unknown source. Earlier projects count from their own day. */
export async function templateTasks(source: TemplateSource): Promise<TemplateTask[] | null> {
  const { projects, templates } = await collections()
  let tasks: TemplateTask[]
  if (source.kind === 'template') {
    const template = await templates.findOne({ _id: source.id })
    if (!template) return null
    tasks = template.tasks
  } else {
    const project = await projects.findOne({ _id: source.id })
    if (!project) return null
    const anchor = project.event ? berlinDay(project.event.startAt.getTime()) : project.due
    tasks = templateFromTasks([...project.tasks].sort((a, b) => a.position - b.position), anchor)
  }
  return source.include ? tasks.filter((_, index) => source.include!.includes(index)) : tasks
}

interface NewProject {
  fields: ProjectFields
  status: ProjectStatus
  event: TaskEvent | null
  template: TemplateTask[] | null
  /** The one task of a single-task card. */
  task: TaskFields | null
}

/** Creates a project; returns its id, or 'duplicate' when the event already has a planning project. */
export async function createProject(actor: TaskActor, input: NewProject): Promise<{ id: string } | 'duplicate'> {
  const { projects } = await collections()
  const now = new Date()
  const _id = randomUUID()
  const anchor = input.event ? berlinDay(input.event.startAt.getTime()) : input.fields.due
  const fromTemplate = input.template ? tasksFromTemplate(input.template, anchor) : []
  const tasks = [...fromTemplate, ...(input.task ? [input.task] : [])].map((fields, index) => newTask(fields, index, actor, now))
  try {
    await projects.insertOne({
      _id,
      ...input.fields,
      status: input.status,
      event: input.event && eventSnapshot(input.event),
      tasks,
      lessons: null,
      activity: [activity(actor, 'created')],
      createdBy: actor.id,
      createdAt: now,
      updatedAt: now,
      completedAt: input.status === 'done' ? now : null,
      archivedAt: null,
    })
  } catch (err) {
    if ((err as { code?: number }).code === 11000) return 'duplicate'
    throw err
  }
  // Templates bring nobody along, so only a single task with people in it notifies.
  for (const task of tasks) if (task.assignees.length) await notify(_id, task.id, task.assignees, actor)
  return { id: _id }
}

type Outcome = 'ok' | 'unknown' | 'forbidden' | 'full'

/**
 * Edits title, description, date and leads. Only those who may archive change the leads, because being a lead grants
 * that right. Everyone else keeps the stored leads and gets 'forbidden' for adding one; a missing lead is ignored, since
 * the client never sees leads whose member was removed and sends the list without them.
 */
export async function updateProject(actor: TaskActor, id: string, fields: Omit<ProjectFields, 'type'>): Promise<Outcome> {
  const { projects } = await collections()
  const project = await projects.findOne({ _id: id }, { projection: { createdBy: 1, leads: 1 } })
  if (!project) return 'unknown'
  const { leads, ...rest } = fields
  const owner = mayArchive(project, actor)
  if (!owner && leads.some((lead) => !project.leads.includes(lead))) return 'forbidden'
  const { matchedCount } = await projects.updateOne(
    // Pinning the read leads keeps a concurrent lead change from slipping past the check above.
    { _id: id, leads: project.leads },
    { $set: { ...rest, ...(owner && { leads }), updatedAt: new Date() }, $push: pushActivity([activity(actor, 'edited')]) },
  )
  return matchedCount ? 'ok' : 'unknown'
}

export async function setStatus(actor: TaskActor, id: string, status: ProjectStatus): Promise<Outcome> {
  const { projects } = await collections()
  const now = new Date()
  const { matchedCount } = await projects.updateOne(
    { _id: id },
    {
      $set: { status, completedAt: status === 'done' ? now : null, updatedAt: now },
      $push: pushActivity([activity(actor, 'status', status)]),
    },
  )
  return matchedCount ? 'ok' : 'unknown'
}

export async function setArchived(actor: TaskActor, id: string, archived: boolean): Promise<Outcome> {
  const { projects } = await collections()
  const project = await projects.findOne({ _id: id }, { projection: { createdBy: 1, leads: 1 } })
  if (!project) return 'unknown'
  if (!mayArchive(project, actor)) return 'forbidden'
  const now = new Date()
  await projects.updateOne(
    { _id: id },
    { $set: { archivedAt: archived ? now : null, updatedAt: now }, $push: pushActivity([activity(actor, archived ? 'archived' : 'restored')]) },
  )
  return 'ok'
}

/** Final deletion with all tasks and pending notifications; admins only. */
export async function deleteProject(actor: TaskActor, id: string): Promise<Outcome> {
  if (actor.role !== 'admin') return 'forbidden'
  const { projects, notifications } = await collections()
  const { deletedCount } = await projects.deleteOne({ _id: id })
  await notifications.deleteMany({ projectId: id })
  return deletedCount ? 'ok' : 'unknown'
}

export async function addTask(actor: TaskActor, id: string, fields: TaskFields): Promise<Outcome> {
  const { projects } = await collections()
  const project = await projects.findOne({ _id: id }, { projection: { 'tasks.position': 1 } })
  if (!project) return 'unknown'
  if (project.tasks.length >= MAX_TASKS) return 'full'
  const now = new Date()
  const task = newTask(fields, Math.max(-1, ...project.tasks.map((item) => item.position)) + 1, actor, now)
  await projects.updateOne(
    { _id: id },
    {
      $push: { tasks: task, ...pushActivity([activity(actor, 'taskAdded', task.title)]) },
      $set: { updatedAt: now },
    },
  )
  await notify(id, task.id, task.assignees, actor)
  return 'ok'
}

/** Changes the given fields of one task, logs what matters and keeps the digest entries in step with the people. */
export async function updateTask(actor: TaskActor, id: string, taskId: string, patch: TaskPatch): Promise<Outcome> {
  const { projects } = await collections()
  const project = await projects.findOne({ _id: id, 'tasks.id': taskId }, { projection: { tasks: { $elemMatch: { id: taskId } } } })
  const task = project?.tasks[0]
  if (!task) return 'unknown'
  const now = new Date()
  const set: Record<string, unknown> = { updatedAt: now, 'tasks.$[t].updatedAt': now }
  for (const [key, value] of Object.entries(patch)) set[`tasks.$[t].${key}`] = value
  const entries: Activity[] = []
  if (patch.done !== undefined && patch.done !== task.done) {
    set['tasks.$[t].doneBy'] = patch.done ? actor.id : null
    set['tasks.$[t].doneAt'] = patch.done ? now : null
    entries.push(activity(actor, patch.done ? 'taskDone' : 'taskReopened', task.title))
  }
  const { added, removed } = assigneeChanges(task.assignees, patch.assignees ?? task.assignees)
  for (const member of added) entries.push(activity(actor, 'assigned', task.title, member))
  for (const member of removed) entries.push(activity(actor, 'unassigned', task.title, member))
  if (patch.due !== undefined && patch.due !== task.due) entries.push(activity(actor, 'due', task.title))
  const edited = (['title', 'description', 'priority', 'required'] as const).some((key) => patch[key] !== undefined && patch[key] !== task[key])
  if (edited) entries.push(activity(actor, 'taskEdited', patch.title ?? task.title))

  await projects.updateOne(
    { _id: id },
    { $set: set, ...(entries.length ? { $push: pushActivity(entries) } : {}) },
    { arrayFilters: [{ 't.id': taskId }] },
  )
  if (removed.length) await unnotify(taskId, removed)
  // A finished task needs no "you were assigned" mail any more.
  if (patch.done) await unnotify(taskId)
  else if (added.length && !task.done) await notify(id, taskId, added, actor)
  return 'ok'
}

export async function removeTask(actor: TaskActor, id: string, taskId: string): Promise<Outcome> {
  const { projects } = await collections()
  const project = await projects.findOne({ _id: id, 'tasks.id': taskId }, { projection: { tasks: { $elemMatch: { id: taskId } } } })
  const task = project?.tasks[0]
  if (!task) return 'unknown'
  await projects.updateOne(
    { _id: id },
    { $pull: { tasks: { id: taskId } }, $set: { updatedAt: new Date() }, $push: pushActivity([activity(actor, 'taskRemoved', task.title)]) },
  )
  await unnotify(taskId)
  return 'ok'
}

/** Puts the tasks in the given order; ids missing from `order` keep their place behind the listed ones. */
export async function reorderTasks(id: string, order: string[]): Promise<Outcome> {
  const { projects } = await collections()
  const project = await projects.findOne({ _id: id }, { projection: { 'tasks.id': 1, 'tasks.position': 1 } })
  if (!project) return 'unknown'
  const known = new Set(project.tasks.map((task) => task.id))
  const listed = order.filter((taskId) => known.has(taskId))
  const rest = [...project.tasks].sort((a, b) => a.position - b.position).map((task) => task.id).filter((taskId) => !listed.includes(taskId))
  const ids = [...listed, ...rest]
  await projects.updateOne(
    { _id: id },
    { $set: Object.fromEntries(ids.map((_, index) => [`tasks.$[t${index}].position`, index])) },
    { arrayFilters: ids.map((taskId, index) => ({ [`t${index}.id`]: taskId })) },
  )
  return 'ok'
}

export async function saveLessons(actor: TaskActor, id: string, lessons: Lessons): Promise<Outcome> {
  const { projects } = await collections()
  const now = new Date()
  const { matchedCount } = await projects.updateOne(
    { _id: id },
    { $set: { lessons: { ...lessons, by: actor.id, at: now }, updatedAt: now }, $push: pushActivity([activity(actor, 'lessons')]) },
  )
  return matchedCount ? 'ok' : 'unknown'
}

/** Saves the project's task list as a new template, deadlines as days relative to its day. */
export async function saveAsTemplate(actor: TaskActor, id: string, name: string): Promise<Outcome> {
  const { projects, templates } = await collections()
  const project = await projects.findOne({ _id: id })
  if (!project) return 'unknown'
  const tasks = await templateTasks({ kind: 'project', id, include: null })
  if (!tasks?.length) return 'unknown'
  const now = new Date()
  await templates.insertOne({
    _id: randomUUID(),
    name,
    description: project.title,
    tasks,
    sourceProjectId: id,
    createdBy: actor.id,
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
  })
  await projects.updateOne({ _id: id }, { $push: pushActivity([activity(actor, 'template', name)]) })
  return 'ok'
}

export async function archiveTemplate(actor: TaskActor, id: string): Promise<Outcome> {
  if (actor.role !== 'admin') return 'forbidden'
  const { templates } = await collections()
  const { matchedCount } = await templates.updateOne({ _id: id }, { $set: { archivedAt: new Date(), updatedAt: new Date() } })
  return matchedCount ? 'ok' : 'unknown'
}

/**
 * Refreshes the event snapshot of every planning project from the calendar. Only title, dates, place and link change;
 * an event that left the calendar is marked missing, never deleted with its project. With an incomplete calendar
 * (Luma unreachable) or an event long past, which Luma no longer lists, the snapshot stays as it is.
 */
export async function syncEvents(events: TaskEvent[], complete: boolean): Promise<void> {
  const { projects } = await collections()
  const byId = new Map(events.map((event) => [event.id, event]))
  const linked = await projects.find({ event: { $ne: null } }, { projection: { event: 1 } }).toArray()
  const now = Date.now()
  await Promise.all(
    linked.map(({ _id, event }) => {
      if (!event) return null
      const current = byId.get(event.id)
      if (current) {
        const next = eventSnapshot(current)
        const same =
          !event.missing &&
          event.title === next.title &&
          event.startAt.getTime() === next.startAt.getTime() &&
          event.endAt.getTime() === next.endAt.getTime() &&
          event.location === next.location &&
          event.url === next.url
        return same ? null : projects.updateOne({ _id }, { $set: { event: next } })
      }
      const shouldBeListed = complete && event.startAt.getTime() > now
      return shouldBeListed && !event.missing ? projects.updateOne({ _id }, { $set: { 'event.missing': true } }) : null
    }),
  )
}

/** For the digest: the projects behind the given ids, with the fields the mail needs. */
export async function projectsForDigest(ids: string[]) {
  const { projects } = await collections()
  return projects
    .find({ _id: { $in: ids } }, { projection: { title: 1, archivedAt: 1, tasks: 1 } })
    .toArray()
}

export async function pendingNotifications(): Promise<NotificationDoc[]> {
  const { notifications } = await collections()
  return notifications.find({}, { sort: { createdAt: 1 } }).toArray()
}

export async function dropNotifications(ids: string[]): Promise<void> {
  const { notifications } = await collections()
  await notifications.deleteMany({ _id: { $in: ids } })
}

/** Name and address of the members behind the given ids; removed members are missing from the map. */
export async function recipients(ids: string[]) {
  const { members } = await collections()
  const list = await members
    .find({ _id: { $in: ids.map((id) => new ObjectId(id)) } }, { projection: { email: 1, firstName: 1, lastName: 1, signature: 1 } })
    .toArray()
  return new Map(list.map((member) => [member._id.toHexString(), { email: member.email, name: member.firstName || displayName(member).split(' ')[0] }]))
}

