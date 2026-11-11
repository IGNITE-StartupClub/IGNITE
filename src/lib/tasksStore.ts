/**
 * MongoDB access for the tasks module of the members area. Collections:
 * - `task_projects`: event projects, internal projects and single tasks with their subtasks and activity log
 *   embedded, so one update changes a project atomically. Projects and tasks saved before teams existed
 *   have no `team` and read as ''. A unique index on
 *   `event.id` lets every public event have at most one planning project. `event` is a snapshot of the public event;
 *   syncEvents refreshes it and never touches tasks, people or status. Every write sets `updatedAt`, because the islands
 *   learn of changes through it (liveUpdates.ts). The activity log stays out of the workspace state: it is most of a
 *   project's size and only one tab shows it, so that tab loads it through projectActivity. Archived projects stay out
 *   too, apart from folded planning projects (sharedWorkspace), and load when someone opens the archive; finished single
 *   tasks archive themselves after SETTLE_DAYS (settleFinishedTasks). A single task, a card of type 'task' with one
 *   task, keeps title, description and deadline on both card and task (MIRRORED_FIELDS in tasks.ts).
 * - `task_templates`: checklists to start a project from; the standard ones (data/taskTemplates.ts) are copied in once.
 * - `task_notifications`: one pending entry per member and task they were newly assigned to, until the daily digest
 *   (taskDigest.ts) sends it. Removing the assignment or finishing the task removes the entry. Deleting the task leaves
 *   it, so an undo needs no bookkeeping: the digest drops entries whose task is gone.
 * An own event is an event project without a public event (`event: null`) whose `due` is its date. It stands in the
 * calendar next to the public events (calendarEntries in tasks.ts). When the same event later reaches Luma nothing
 * changes by itself: a member merges them (linkEvent) or keeps them apart (keepEventApart).
 * Members are referenced by the hex id of their `members` document. Every signed-in member reads and changes
 * projects and tasks; archiving and changing the leads is up to admins, the creator and the project's leads, deleting a
 * task up to them and the task's creator (mayRemoveTask), deleting a project and archiving templates up to admins.
 */
import { randomUUID } from 'node:crypto'
import { ObjectId, type Filter } from 'mongodb'
import type { MemberRole } from './memberAuth'
import type { HomeProject } from './memberHome'
import { database, displayName, setUpInBackground, type Member, type SessionMember } from './members'
import { photoPath } from './emailSignature'
import { changedSince, collectionRevision, listRevision, markUnsettled } from './liveUpdates'
import { privateTasks } from './privateTasksStore'
import { putInTrash, takeFromTrash } from './taskTrash'
import { standardTemplates } from '../data/taskTemplates'
import type { TaskEvent } from './taskEvents'
import {
  applyMemberChange,
  assigneeChanges,
  berlinDay,
  isSingleTask,
  MAX_ASSIGNEES,
  MAX_TASKS,
  type LumaRef,
  type MemberChange,
  type ProjectFields,
  type ProjectEditAction,
  type ProjectPatch,
  type ProjectStatus,
  type ProjectType,
  type Repeat,
  type StoredStatus,
  type TaskFields,
  type TaskPatch,
  type TaskStatus,
  type TeamChoice,
  type TemplateTask,
  mayRemoveTask,
  mirroredFields,
  nextTurn,
  projectEdits,
  projectStatus,
  sameTitle,
  taskStatus,
  tasksFromTemplate,
  templateFromTasks,
} from './tasks'

const ACTIVITY_MAX = 300

interface TaskDoc extends Omit<TaskFields, 'team' | 'status' | 'repeat'> {
  id: string
  team?: TeamChoice
  status?: StoredStatus<TaskStatus>
  repeat?: Repeat
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
  // Only in logs from before updateProject named each change (projectEdits).
  | 'edited'
  | 'status'
  | 'archived'
  // By settleFinishedTasks, with the actor 'system' and the days as detail.
  | 'autoArchived'
  | 'restored'
  | 'taskAdded'
  | 'taskEdited'
  | 'taskDone'
  | 'taskReopened'
  | 'taskRemoved'
  | 'taskRestored'
  | 'eventLinked'
  | 'eventUnlinked'
  | 'assigned'
  | 'unassigned'
  | 'due'
  // Lessons learned are gone; logs from before still hold this entry.
  | 'lessons'
  | 'template'
  | ProjectEditAction

interface Activity {
  at: Date
  actor: string
  action: ActivityAction
  /** Task title, new status, member id, template name or number of days, depending on the action. */
  detail: string
  member?: string
}

interface ProjectDoc {
  _id: string
  title: string
  description: string
  type: ProjectType
  status: StoredStatus<ProjectStatus>
  event: EventSnapshot | null
  due: string
  /** Start and place of an own event; projects saved before them have neither. */
  time?: string
  place?: string
  /** End, cover and Luma event of an own event; projects saved before the Luma import have none of them. */
  endDue?: string
  endTime?: string
  coverUrl?: string
  luma?: LumaRef | null
  /** Link to the project's SharePoint folder (parseFolderUrl); projects saved before it have none. */
  folderUrl?: string
  /** Public events members declared to be another event than this own one. */
  distinctFrom?: string[]
  leads: string[]
  team?: TeamChoice
  tasks: TaskDoc[]
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

let seeded = false

async function collections() {
  const db = await database()
  const projects = db.collection<ProjectDoc>('task_projects')
  const templates = db.collection<TemplateDoc>('task_templates')
  const notifications = db.collection<NotificationDoc>('task_notifications')
  if (!seeded) {
    seeded = true
    setUpInBackground('tasks', () =>
      Promise.all([
        projects.createIndex({ 'event.id': 1 }, { unique: true, partialFilterExpression: { 'event.id': { $type: 'string' } } }),
        // One own event per Luma event; events entered by hand carry no id and never collide.
        projects.createIndex({ 'luma.id': 1 }, { unique: true, partialFilterExpression: { 'luma.id': { $type: 'string' } } }),
        projects.createIndex({ 'tasks.id': 1 }),
        projects.createIndex({ updatedAt: -1 }),
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
      ]),
    )
  }
  return { projects, templates, notifications, members: db.collection<Member & { _id: ObjectId }>('members') }
}

/** The member the middleware or a connection (connectionsStore.ts) has just read, as the module sees them. */
export const sessionActor = (member: Pick<SessionMember, 'id' | 'email' | 'role' | 'firstName' | 'lastName'>): TaskActor => ({
  id: member.id,
  email: member.email,
  role: member.role,
  named: !!(member.firstName && member.lastName),
})

/** Name, photo and team of every member, the only personal data the board shows. */
async function directory() {
  const { members } = await collections()
  const db = await database()
  const [list, photos] = await Promise.all([
    members.find({}, { projection: { _id: 1, email: 1, firstName: 1, lastName: 1, signature: 1, team: 1 } }).toArray(),
    db.collection<{ _id: string; email: string }>('member_photos').find({}, { projection: { _id: 1, email: 1 }, sort: { createdAt: 1 } }).toArray(),
  ])
  const photoIds = new Map(photos.map(({ _id, email }) => [email, _id]))
  return list
    .map((member) => {
      const photoId = photoIds.get(member.email)
      return { id: member._id.toHexString(), name: displayName(member), photo: photoId ? photoPath(photoId) : '', team: member.team ?? '' }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))
}
export type TaskMember = Awaited<ReturnType<typeof directory>>[number]

const mayArchive = (project: Pick<ProjectDoc, 'createdBy' | 'leads'>, actor: TaskActor) =>
  actor.role === 'admin' || project.createdBy === actor.id || project.leads.includes(actor.id)

/**
 * Every member gets every project with each page load, so this holds only what the islands, the search and the MCP
 * tools read; who created or finished a task stays on the server.
 */
function projectSummary(project: Omit<ProjectDoc, 'activity'>, actor: TaskActor, known: Set<string>, folded = false) {
  const people = (ids: string[]) => ids.filter((id) => known.has(id))
  return {
    // Archived and sent without tasks and description (sharedWorkspace); the island loads the rest on demand.
    ...(folded && { folded }),
    id: project._id,
    title: project.title,
    description: project.description,
    type: project.type,
    status: projectStatus(project.status),
    event: project.event && {
      ...project.event,
      startAt: project.event.startAt.toISOString(),
      endAt: project.event.endAt.toISOString(),
    },
    eventDay: project.event ? berlinDay(project.event.startAt.getTime()) : '',
    due: project.due,
    time: project.time ?? '',
    place: project.place ?? '',
    endDue: project.endDue ?? '',
    endTime: project.endTime ?? '',
    coverUrl: project.coverUrl ?? '',
    luma: project.luma ?? null,
    folderUrl: project.folderUrl ?? '',
    distinctFrom: project.distinctFrom ?? [],
    leads: people(project.leads),
    team: project.team ?? '',
    tasks: [...project.tasks]
      .sort((a, b) => a.position - b.position)
      .map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        done: task.done,
        status: taskStatus(task),
        doneAt: task.doneAt?.toISOString() ?? '',
        due: task.due,
        priority: task.priority,
        required: task.required,
        assignees: people(task.assignees),
        team: task.team ?? '',
        repeat: task.repeat ?? '',
        mayRemove: mayRemoveTask(task, project, actor),
      })),
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

/**
 * Stands for the project list. New templates, new members and a member's private tasks are not part of it; they arrive
 * with the next load or project change. A young revision carries a mark (markUnsettled), because projects are stamped by
 * the instance that writes them, before the write reaches the database.
 */
export async function workspaceRevision(): Promise<string> {
  const { projects } = await collections()
  return markUnsettled(await collectionRevision(projects), Date.now())
}

// Projects completed before lessons learned were dropped still store `lessons`; nothing reads them any more.
const WITHOUT_ACTIVITY = { projection: { activity: 0, lessons: 0 } }

type ArchivedStub = Pick<ProjectDoc, '_id' | 'updatedAt' | 'archivedAt'>

/** Archived projects the island still needs without its archive: the planning of a public event, see sharedWorkspace. */
const NEEDED_WHEN_ARCHIVED = { event: { $ne: null } }

/**
 * Every project that is not archived, in full. Archived planning projects of public events come folded, without tasks
 * and description: the calendar needs them to know an event was planned, otherwise it offered to plan it again. Other
 * archived projects come as stubs, which count in the revision, so a poll matches it, but never leave the server.
 * Without this the page would grow with every finished project; the archive loads when someone opens it.
 */
const CURRENT_PROJECTS = [
  { $sort: { updatedAt: -1 } },
  { $unset: ['activity', 'lessons'] },
  {
    $replaceWith: {
      $switch: {
        branches: [
          { case: { $eq: [{ $ifNull: ['$archivedAt', null] }, null] }, then: '$$ROOT' },
          { case: { $ne: [{ $ifNull: ['$event', null] }, null] }, then: { $mergeObjects: ['$$ROOT', { tasks: [], description: '' }] } },
        ],
        default: { _id: '$_id', updatedAt: '$updatedAt', archivedAt: '$archivedAt' },
      },
    },
  },
]

/**
 * Projects and the member directory: the core of workspaceState, and what the MCP tools read. `archived` brings the
 * archived projects in full, for a TaskWorkspace that has loaded its archive.
 */
export async function sharedWorkspace(actor: TaskActor, { archived = false } = {}) {
  const { projects } = await collections()
  const [list, members] = await Promise.all([
    archived
      ? projects.find({}, { ...WITHOUT_ACTIVITY, sort: { updatedAt: -1 } }).toArray()
      : projects.aggregate<Omit<ProjectDoc, 'activity'> | ArchivedStub>(CURRENT_PROJECTS).toArray(),
    directory(),
  ])
  const known = new Set(members.map((member) => member.id))
  const sent = list.filter((project): project is Omit<ProjectDoc, 'activity'> => 'tasks' in project)
  return {
    revision: markUnsettled(listRevision(list), Date.now()),
    projects: sent.map((project) => projectSummary(project, actor, known, !archived && !!project.archivedAt)),
    members,
  }
}

/**
 * Everything the TaskWorkspace island shows: projects, active templates, the member directory and their private tasks.
 */
export async function workspaceState(actor: TaskActor, options: { archived?: boolean } = {}) {
  const { templates } = await collections()
  const [shared, templateList, ownTasks] = await Promise.all([
    sharedWorkspace(actor, options),
    templates.find({ archivedAt: null }, { sort: { name: 1 } }).toArray(),
    privateTasks(actor.id),
  ])
  return { ...shared, templates: templateList.map(templateSummary), privateTasks: ownTasks }
}
export type WorkspaceState = Awaited<ReturnType<typeof workspaceState>>

/** The archived projects in full, for the archive view, an archived project opened by link and copying an earlier one. */
export async function archivedProjects(actor: TaskActor) {
  const { projects } = await collections()
  const [list, members] = await Promise.all([
    projects.find({ archivedAt: { $ne: null } }, { ...WITHOUT_ACTIVITY, sort: { updatedAt: -1 } }).toArray(),
    directory(),
  ])
  const known = new Set(members.map((member) => member.id))
  return list.map((project) => projectSummary(project, actor, known))
}

/** A finished single task leaves the board after this many days without a change; a restore counts as a change. */
export const SETTLE_DAYS = 30

/**
 * Archives the single tasks that were finished and left unchanged for SETTLE_DAYS, so the board and every load of the
 * tasks page stay small; the nightly cron /api/cron/task-archive runs it. Returns how many it archived.
 */
export async function settleFinishedTasks(now: Date): Promise<number> {
  const { projects } = await collections()
  const { modifiedCount } = await projects.updateMany(
    {
      type: 'task',
      archivedAt: null,
      'tasks.0': { $exists: true },
      tasks: { $not: { $elemMatch: { done: false } } },
      updatedAt: { $lt: new Date(now.getTime() - SETTLE_DAYS * 86_400_000) },
    },
    {
      $set: { archivedAt: now, updatedAt: now },
      $push: pushActivity([{ at: now, actor: 'system', action: 'autoArchived', detail: String(SETTLE_DAYS) }]),
    },
  )
  return modifiedCount
}

/** An open project or event as the Ablage page lists it. */
export interface ProjectFolder {
  id: string
  title: string
  type: ProjectType
  team: TeamChoice
  /** Event day or deadline, '' without one. */
  day: string
  /** '' while nobody has linked its SharePoint folder. */
  folderUrl: string
}

/** Open projects and events with what the Ablage page shows of them, soonest first and those without a day last. */
export async function projectFolders(): Promise<ProjectFolder[]> {
  const { projects } = await collections()
  const list = await projects
    .find(
      { archivedAt: null, status: { $ne: 'done' }, type: { $ne: 'task' } },
      { projection: { title: 1, type: 1, team: 1, due: 1, 'event.startAt': 1, folderUrl: 1 } },
    )
    .toArray()
  return list
    .map(({ _id, title, type, team, due, event, folderUrl }) => ({
      id: _id,
      title,
      type,
      team: team ?? '',
      day: event ? berlinDay(event.startAt.getTime()) : due,
      folderUrl: folderUrl ?? '',
    }))
    .sort((a, b) => (a.day || '9999').localeCompare(b.day || '9999'))
}

/** The open projects with a task of this member, all the start page and the calendar feed need of the workspace. */
export async function assignedProjects(actor: TaskActor): Promise<HomeProject[]> {
  const { projects } = await collections()
  const list = await projects
    .find(
      { archivedAt: null, status: { $ne: 'done' }, 'tasks.assignees': actor.id },
      {
        // Only what openTasks reads: descriptions can be long, and the calendar feed asks this on every poll.
        projection: {
          title: 1,
          type: 1,
          status: 1,
          'event.id': 1,
          'tasks.id': 1,
          'tasks.title': 1,
          'tasks.due': 1,
          'tasks.done': 1,
          'tasks.assignees': 1,
          'tasks.position': 1,
        },
        sort: { updatedAt: -1 },
      },
    )
    .toArray()
  return list.map(({ _id, title, type, status, event, tasks }) => ({
    id: _id,
    title,
    type,
    status: projectStatus(status),
    archived: false,
    event: event ?? null,
    tasks: [...tasks].sort((a, b) => a.position - b.position),
  }))
}

/**
 * What changed since the client's revision, for applyChanges: answers stay small however large the workspace grows.
 * The revision is read before the changes, here or by the caller (`revision`), so a change landing during the read
 * arrives twice rather than not at all. Projects that changed come in full, archived ones too: that is how an island
 * learns that another member archived or restored one. `ids` lists what the island may hold, so it drops what was
 * deleted; without its archive (`archived`) that leaves out the archived projects sharedWorkspace does not send.
 */
export async function workspaceChanges(actor: TaskActor, known: unknown, { revision, archived = false }: { revision?: string; archived?: boolean } = {}) {
  const { projects } = await collections()
  const current = revision ?? (await workspaceRevision())
  const since = changedSince(known)
  const [changed, ids, members, ownTasks] = await Promise.all([
    projects.find(since ? { updatedAt: { $gte: since } } : {}, WITHOUT_ACTIVITY).toArray(),
    projects.find(archived ? {} : { $or: [{ archivedAt: null }, NEEDED_WHEN_ARCHIVED] }, { projection: { _id: 1 } }).toArray(),
    directory(),
    privateTasks(actor.id),
  ])
  const people = new Set(members.map((member) => member.id))
  return {
    revision: current,
    ids: ids.map(({ _id }) => _id),
    projects: changed.map((project) => projectSummary(project, actor, people)),
    members,
    privateTasks: ownTasks,
  }
}

/** The log of one project, newest first; null for an unknown project. */
export async function projectActivity(id: string) {
  const { projects } = await collections()
  const project = await projects.findOne({ _id: id }, { projection: { activity: 1 } })
  return project && [...project.activity].reverse().map((entry) => ({ ...entry, at: entry.at.toISOString() }))
}

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
  const done = fields.status === 'done'
  return {
    ...fields,
    id: randomUUID(),
    done,
    doneBy: done ? actor.id : null,
    doneAt: done ? now : null,
    position,
    createdBy: actor.id,
    createdAt: now,
    updatedAt: now,
  }
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

/** A project's tasks as a checklist, with deadlines counted from the project's own day. */
const checklist = (project: Pick<ProjectDoc, 'event' | 'due' | 'tasks'>): TemplateTask[] =>
  templateFromTasks(
    [...project.tasks].sort((a, b) => a.position - b.position),
    project.event ? berlinDay(project.event.startAt.getTime()) : project.due,
  )

const CHECKLIST_FIELDS = { projection: { event: 1, due: 1, tasks: 1 } }

/** The checklist a new project starts from; null for an unknown source. Earlier projects count from their own day. */
export async function templateTasks(source: TemplateSource): Promise<TemplateTask[] | null> {
  const { projects, templates } = await collections()
  let tasks: TemplateTask[]
  if (source.kind === 'template') {
    const template = await templates.findOne({ _id: source.id })
    if (!template) return null
    tasks = template.tasks
  } else {
    const project = await projects.findOne({ _id: source.id }, CHECKLIST_FIELDS)
    if (!project) return null
    tasks = checklist(project)
  }
  if (!source.include) return tasks
  const kept = new Set(source.include)
  return tasks.filter((_, index) => kept.has(index))
}

interface NewProject {
  fields: ProjectFields
  status: ProjectStatus
  event: TaskEvent | null
  template: TemplateTask[] | null
  /** The one task of a single-task card. */
  task: TaskFields | null
}

/**
 * Creates a project; returns its id, or 'duplicate' when the event already has a planning project or an own event of
 * that name stands on that day. The second check reads first, so two members saving the same second both get through.
 * That costs a double entry, never data, and one of them can archive it.
 */
/** The own event imported from this Luma event, archived or not; the form names it before a second import. */
export async function projectOfLumaEvent(lumaId: string): Promise<{ id: string; title: string } | null> {
  const { projects } = await collections()
  const project = await projects.findOne({ 'luma.id': lumaId }, { projection: { title: 1 } })
  return project && { id: project._id, title: project.title }
}

export async function createProject(actor: TaskActor, input: NewProject): Promise<{ id: string } | 'duplicate'> {
  const { projects } = await collections()
  if (input.fields.type === 'event' && !input.event) {
    const sameDay = await projects
      .find({ type: 'event', event: null, due: input.fields.due, archivedAt: null }, { projection: { title: 1 } })
      .toArray()
    if (sameDay.some(({ title }) => sameTitle(title, input.fields.title))) return 'duplicate'
  }
  const now = new Date()
  const _id = randomUUID()
  const anchor = input.event ? berlinDay(input.event.startAt.getTime()) : input.fields.due
  const fromTemplate = input.template ? tasksFromTemplate(input.template, anchor) : []
  const tasks = [...fromTemplate, ...(input.task ? [input.task] : [])].map((fields, index) => newTask(fields, index, actor, now))
  // The card of a single task starts with its task's values (MIRRORED_FIELDS); the MCP tools send them only with the task.
  const fields = input.fields.type === 'task' && input.task ? { ...input.fields, ...mirroredFields(input.task) } : input.fields
  try {
    await projects.insertOne({
      _id,
      ...fields,
      status: input.status,
      event: input.event && eventSnapshot(input.event),
      tasks,
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

type Outcome = 'ok' | 'unknown' | 'forbidden' | 'full' | 'crowded' | 'invalid'

/** The update for one step on a list of people; parsePatch lets only one direction through. */
const memberUpdate = (path: string, { add, remove }: MemberChange) =>
  add.length ? { $addToSet: { [path]: { $each: add } } } : { $pull: { [path]: { $in: remove } } }

/**
 * Changes the given fields, leaving the others to whoever edits them at the same time. Only those who may archive change
 * the leads, because being a lead grants that right. The task of a single task follows its card (MIRRORED_FIELDS).
 */
export async function updateProject(actor: TaskActor, id: string, patch: ProjectPatch): Promise<Outcome> {
  const { projects } = await collections()
  const project = await projects.findOne(
    { _id: id },
    { projection: { createdBy: 1, leads: 1, type: 1, event: 1, title: 1, description: 1, due: 1, time: 1, place: 1, endDue: 1, folderUrl: 1, team: 1, 'tasks.id': 1 } },
  )
  if (!project) return 'unknown'
  const { leads, ...fields } = patch
  // Its date is all that places an own event in the calendar.
  if (fields.due === '' && project.type === 'event' && !project.event) return 'invalid'
  // An end day before the start is refused when set, and dropped when the start moves past it: the event then ends on
  // its own day, so moving an event never fails over its end.
  const due = fields.due ?? project.due
  const endDue = fields.endDue ?? project.endDue ?? ''
  if (endDue && endDue < due) {
    if (fields.endDue) return 'invalid'
    fields.endDue = ''
  }
  if (leads && !mayArchive(project, actor)) return 'forbidden'
  if (leads && applyMemberChange(project.leads, leads).length > MAX_ASSIGNEES) return 'crowded'
  // A lead's right comes from the list itself, so losing the role in between makes the update miss.
  const leadOnly = leads && actor.role !== 'admin' && project.createdBy !== actor.id
  const edits = projectEdits(project, patch)
  const now = new Date()
  // The task is addressed by its id, so a task added in between keeps its own values.
  const mirror = isSingleTask(project) ? Object.entries(mirroredFields(fields)) : []
  const set: Record<string, unknown> = { ...fields, updatedAt: now }
  for (const [key, value] of mirror) set[`tasks.$[t].${key}`] = value
  if (mirror.length) set['tasks.$[t].updatedAt'] = now
  const { matchedCount } = await projects.updateOne(
    { _id: id, ...(leadOnly && { leads: actor.id }) },
    {
      $set: set,
      ...(edits.length ? { $push: pushActivity(edits.map((edit) => activity(actor, edit.action, edit.detail, edit.member))) } : {}),
      ...(leads && memberUpdate('leads', leads)),
    },
    mirror.length ? { arrayFilters: [{ 't.id': project.tasks[0].id }] } : {},
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

/**
 * mayArchive and mayRemoveTask as filters. A write repeats the rights it checked, so a lead who lost the role since the
 * read misses like anyone else (see `leadOnly` in updateProject). Admins need no filter.
 */
const runsProject = (actor: TaskActor): Filter<ProjectDoc>[] => [{ createdBy: actor.id }, { leads: actor.id }]
const archiveRight = (actor: TaskActor): Filter<ProjectDoc> => (actor.role === 'admin' ? {} : { $or: runsProject(actor) })
const removeRight = (actor: TaskActor, taskId: string): Filter<ProjectDoc> =>
  actor.role === 'admin' ? {} : { $or: [...runsProject(actor), { tasks: { $elemMatch: { id: taskId, createdBy: actor.id } } }] }

/** What a write with rights in its filter means when it matched nothing: still there, so the rights failed. */
async function missed(target: Filter<ProjectDoc>): Promise<Outcome> {
  const { projects } = await collections()
  return (await projects.countDocuments(target, { limit: 1 })) ? 'forbidden' : 'unknown'
}

export async function setArchived(actor: TaskActor, id: string, archived: boolean): Promise<Outcome> {
  const { projects } = await collections()
  const now = new Date()
  const { matchedCount } = await projects.updateOne(
    { _id: id, ...archiveRight(actor) },
    { $set: { archivedAt: archived ? now : null, updatedAt: now }, $push: pushActivity([activity(actor, archived ? 'archived' : 'restored')]) },
  )
  return matchedCount ? 'ok' : missed({ _id: id })
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
  // A card goes with its last task, so it can be gone since the read above.
  const { matchedCount } = await projects.updateOne(
    { _id: id },
    {
      $push: { tasks: task, ...pushActivity([activity(actor, 'taskAdded', task.title)]) },
      $set: { updatedAt: now },
    },
  )
  if (!matchedCount) return 'unknown'
  await notify(id, task.id, task.assignees, actor)
  return 'ok'
}

/**
 * Changes the given fields of one task, logs what matters and keeps the digest entries in step with the people. The card
 * of a single task follows its task (MIRRORED_FIELDS).
 */
export async function updateTask(actor: TaskActor, id: string, taskId: string, patch: TaskPatch): Promise<Outcome> {
  const { projects } = await collections()
  const project = await projects.findOne<Pick<ProjectDoc, 'type' | 'tasks'> & { taskCount: number }>(
    { _id: id, 'tasks.id': taskId },
    { projection: { type: 1, taskCount: { $size: '$tasks' }, tasks: { $elemMatch: { id: taskId } } } },
  )
  const task = project?.tasks[0]
  if (!project || !task) return 'unknown'
  const { assignees: people, ...fields } = patch
  const assignees = people ? applyMemberChange(task.assignees, people) : task.assignees
  if (assignees.length > MAX_ASSIGNEES) return 'crowded'
  const now = new Date()
  const single = project.type === 'task' && project.taskCount === 1
  const set: Record<string, unknown> = { updatedAt: now, 'tasks.$[t].updatedAt': now, ...(single && mirroredFields(fields)) }
  const turn = { done: task.done, status: taskStatus(task), due: task.due, repeat: task.repeat }
  const { done, status, due, repeated } = nextTurn(turn, patch, berlinDay(now.getTime()))
  // Standing is only written when the patch moves the task: the values just read would undo a move made in between.
  const moved = patch.done !== undefined || patch.status !== undefined
  for (const [key, value] of Object.entries({ ...fields, ...(moved && { done, status }), ...(repeated && { due }) })) set[`tasks.$[t].${key}`] = value
  const entries: Activity[] = []
  if (done !== task.done) {
    set['tasks.$[t].doneBy'] = done ? actor.id : null
    set['tasks.$[t].doneAt'] = done ? now : null
    entries.push(activity(actor, done ? 'taskDone' : 'taskReopened', task.title))
  }
  // A repeating task is done for this round and open for the next: the log keeps the completion and the new deadline.
  if (repeated) entries.push(activity(actor, 'taskDone', task.title), activity(actor, 'due', task.title))
  // The card of a single task shows the task's deadline (MIRRORED_FIELDS), so it moves along.
  if (repeated && single) set.due = due
  const { added, removed } = assigneeChanges(task.assignees, assignees)
  for (const member of added) entries.push(activity(actor, 'assigned', task.title, member))
  for (const member of removed) entries.push(activity(actor, 'unassigned', task.title, member))
  if (!repeated && patch.due !== undefined && patch.due !== task.due) entries.push(activity(actor, 'due', task.title))
  const edited =
    (['title', 'description', 'priority', 'required'] as const).some((key) => patch[key] !== undefined && patch[key] !== task[key]) ||
    (patch.team !== undefined && patch.team !== (task.team ?? ''))
  if (edited) entries.push(activity(actor, 'taskEdited', patch.title ?? task.title))

  // Someone may have deleted the task since the read above; then the change has nothing to land on.
  const { matchedCount } = await projects.updateOne(
    { _id: id, 'tasks.id': taskId },
    {
      $set: set,
      ...(entries.length ? { $push: pushActivity(entries) } : {}),
      ...(people && memberUpdate('tasks.$[t].assignees', people)),
    },
    { arrayFilters: [{ 't.id': taskId }] },
  )
  if (!matchedCount) return 'unknown'
  // A finished task (or a finished round of a repeating one) needs no "you were assigned" mail any more; the digest skips done tasks anyway.
  const finished = (done && !task.done) || repeated
  await Promise.all([
    finished ? unnotify(taskId) : removed.length ? unnotify(taskId, removed) : null,
    !finished && !done && !task.done && added.length ? notify(id, taskId, added, actor) : null,
  ])
  return 'ok'
}

interface DeletedTask {
  projectId: string
  task: TaskDoc
  /** The card a single task was alone on: it goes with its task, because an empty card would show nothing. */
  card: ProjectDoc | null
}

/**
 * Deletes a task, which its deleter can undo for a while (restoreTask). The delete itself is the claim: of two requests
 * at once only one gets the stored document back, the other hears 'unknown', so only the winner fills the trash, and
 * with the task as it stood at that moment. An edit that landed just before stays part of the undo.
 */
export async function removeTask(actor: TaskActor, id: string, taskId: string): Promise<Outcome> {
  const { projects } = await collections()
  const oneTask = { tasks: { $elemMatch: { id: taskId } } }
  const project = await projects.findOne({ _id: id, 'tasks.id': taskId }, { projection: { createdBy: 1, leads: 1, ...oneTask } })
  const task = project?.tasks[0]
  if (!project || !task) return 'unknown'
  if (!mayRemoveTask(task, project, actor)) return 'forbidden'
  const target: Filter<ProjectDoc> = { _id: id, 'tasks.id': taskId, ...removeRight(actor, taskId) }
  // The card keeps all of itself for the undo; from a project only the task is needed.
  const card = await projects.findOneAndDelete({ ...target, type: 'task', 'tasks.1': { $exists: false } })
  const before =
    card ??
    (await projects.findOneAndUpdate(
      target,
      { $pull: { tasks: { id: taskId } }, $set: { updatedAt: new Date() }, $push: pushActivity([activity(actor, 'taskRemoved', task.title)]) },
      { returnDocument: 'before', projection: oneTask },
    ))
  const deleted = before?.tasks.find((item) => item.id === taskId)
  if (!deleted) return missed({ _id: id, 'tasks.id': taskId })
  await putInTrash<DeletedTask>('shared', actor.id, taskId, { projectId: id, task: deleted, card })
  return 'ok'
}

/** Undoes removeTask: back into its project with its old place and people, or back with its card. */
export async function restoreTask(actor: TaskActor, taskId: string): Promise<Outcome> {
  const { projects } = await collections()
  const deleted = await takeFromTrash<DeletedTask>('shared', actor.id, taskId)
  if (!deleted) return 'unknown'
  const now = new Date()
  const { matchedCount } = await projects.updateOne(
    { _id: deleted.projectId },
    { $push: { tasks: deleted.task, ...pushActivity([activity(actor, 'taskRestored', deleted.task.title)]) }, $set: { updatedAt: now } },
  )
  if (matchedCount) return 'ok'
  if (!deleted.card) return 'unknown'
  await projects.insertOne({ ...deleted.card, updatedAt: now })
  return 'ok'
}

/**
 * Merges an own event with the public event it turned out to be. Only the snapshot is added, so tasks, people and status
 * stay; date, time and place stay stored too, which is what makes unlinkEvent possible. The unique index on `event.id`
 * decides when two members merge at once, and repeating the same merge counts as done.
 */
export async function linkEvent(actor: TaskActor, id: string, event: TaskEvent): Promise<Outcome | 'duplicate'> {
  const { projects } = await collections()
  try {
    const { matchedCount } = await projects.updateOne(
      { _id: id, type: 'event', event: null },
      { $set: { event: eventSnapshot(event), updatedAt: new Date() }, $push: pushActivity([activity(actor, 'eventLinked', event.title)]) },
    )
    if (matchedCount) return 'ok'
  } catch (err) {
    if ((err as { code?: number }).code === 11000) return 'duplicate'
    throw err
  }
  const project = await projects.findOne({ _id: id }, { projection: { 'event.id': 1 } })
  if (!project) return 'unknown'
  return project.event?.id === event.id ? 'ok' : 'duplicate'
}

/** Remembers that an own event and a public event only look alike, so the question does not come back. */
export async function keepEventApart(id: string, eventId: string): Promise<Outcome> {
  const { projects } = await collections()
  const { matchedCount } = await projects.updateOne(
    { _id: id, type: 'event', event: null },
    { $addToSet: { distinctFrom: eventId }, $set: { updatedAt: new Date() } },
  )
  return matchedCount ? 'ok' : 'unknown'
}

/**
 * Undoes linkEvent. Only an event with its own date can stand alone again, so planning projects started from a public
 * event stay linked.
 */
export async function unlinkEvent(actor: TaskActor, id: string): Promise<Outcome> {
  const { projects } = await collections()
  const project = await projects.findOne({ _id: id, type: 'event', due: { $ne: '' } }, { projection: { 'event.id': 1 } })
  const eventId = project?.event?.id
  if (!eventId) return 'unknown'
  const { matchedCount } = await projects.updateOne(
    { _id: id, 'event.id': eventId },
    { $set: { event: null, updatedAt: new Date() }, $addToSet: { distinctFrom: eventId }, $push: pushActivity([activity(actor, 'eventUnlinked')]) },
  )
  return matchedCount ? 'ok' : 'unknown'
}

/** Puts the tasks in the given order; ids missing from `order` keep their place behind the listed ones. */
export async function reorderTasks(id: string, order: string[]): Promise<Outcome> {
  const { projects } = await collections()
  const project = await projects.findOne({ _id: id }, { projection: { 'tasks.id': 1, 'tasks.position': 1 } })
  if (!project) return 'unknown'
  const known = new Set(project.tasks.map((task) => task.id))
  // Each id once: two array filters on the same task make MongoDB refuse the whole update.
  const listed = new Set(order.filter((taskId) => known.has(taskId)))
  const rest = [...project.tasks].sort((a, b) => a.position - b.position).map((task) => task.id).filter((taskId) => !listed.has(taskId))
  const ids = [...listed, ...rest]
  const { matchedCount } = await projects.updateOne(
    { _id: id },
    { $set: { updatedAt: new Date(), ...Object.fromEntries(ids.map((_, index) => [`tasks.$[t${index}].position`, index])) } },
    { arrayFilters: ids.map((taskId, index) => ({ [`t${index}.id`]: taskId })) },
  )
  return matchedCount ? 'ok' : 'unknown'
}

/** Saves the project's task list as a new template, deadlines as days relative to its day. */
export async function saveAsTemplate(actor: TaskActor, id: string, name: string): Promise<Outcome> {
  const { projects, templates } = await collections()
  const project = await projects.findOne({ _id: id }, { projection: { ...CHECKLIST_FIELDS.projection, title: 1 } })
  if (!project) return 'unknown'
  const tasks = checklist(project)
  if (!tasks.length) return 'unknown'
  const now = new Date()
  // The log entry goes first: when the project is gone since the read above, no template is made from it.
  const { matchedCount } = await projects.updateOne(
    { _id: id },
    { $set: { updatedAt: now }, $push: pushActivity([activity(actor, 'template', name)]) },
  )
  if (!matchedCount) return 'unknown'
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
  return 'ok'
}

export async function archiveTemplate(actor: TaskActor, id: string): Promise<Outcome> {
  if (actor.role !== 'admin') return 'forbidden'
  const { templates } = await collections()
  const { matchedCount } = await templates.updateOne({ _id: id }, { $set: { archivedAt: new Date(), updatedAt: new Date() } })
  return matchedCount ? 'ok' : 'unknown'
}

// The calendar itself only changes this often, see CACHE_MS in luma.ts.
const EVENT_SYNC_MS = 5 * 60_000
let nextSync = 0

/**
 * Refreshes the event snapshot of every planning project from the German calendar, the language the snapshot is stored
 * in (the English one names places differently). Only title, dates, place and link change;
 * an event that left the calendar is marked missing, never deleted with its project. With an incomplete calendar
 * (Luma unreachable) or an event long past, which Luma no longer lists, the snapshot stays as it is.
 */
export async function syncEvents(events: TaskEvent[], complete: boolean): Promise<void> {
  if (Date.now() < nextSync) return
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
        return same ? null : projects.updateOne({ _id }, { $set: { event: next, updatedAt: new Date() } })
      }
      const shouldBeListed = complete && event.startAt.getTime() > now
      return shouldBeListed && !event.missing ? projects.updateOne({ _id }, { $set: { 'event.missing': true, updatedAt: new Date() } }) : null
    }),
  )
  nextSync = now + EVENT_SYNC_MS
}

/** For the digest: the projects behind the given ids, with the fields the mail needs. */
export async function projectsForDigest(ids: string[]) {
  const { projects } = await collections()
  return projects
    .find({ _id: { $in: ids } }, { projection: { title: 1, status: 1, archivedAt: 1, tasks: 1 } })
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

