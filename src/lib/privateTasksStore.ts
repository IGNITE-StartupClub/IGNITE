/**
 * MongoDB access for private tasks (`private_tasks`), which a member keeps for themselves on the tasks board. They live
 * apart from `task_projects` on purpose: that collection reaches every member (workspaceState), while every query here
 * carries the member's id, so no other member and no admin gets at them. Title and description are sealed
 * (fieldCrypto.ts) with the member bound in, so a record moved to another member fails to open. There is no activity
 * log, digest or template for them, and they go with the account (removeMember).
 */
import { randomUUID } from 'node:crypto'
import { fieldKeys, open, seal, type FieldKeys } from './fieldCrypto'
import { database, setUpInBackground } from './members'
import { MAX_TASKS, nextStanding, taskStatus, type PrivateTaskState, type StoredStatus, type TaskFields, type TaskPatch, type TaskStatus } from './tasks'
import { putInTrash, takeFromTrash } from './taskTrash'

const COLLECTION = 'private_tasks'
const SEALED = ['title', 'description'] as const
const PLAIN = ['due', 'priority', 'team'] as const

interface PrivateTaskDoc extends Omit<PrivateTaskState, 'id' | 'doneAt' | 'status'> {
  _id: string
  memberId: string
  status?: StoredStatus<TaskStatus>
  doneAt: Date | null
  createdAt: Date
  updatedAt: Date
}

let keys: FieldKeys | null = null
const cryptoKeys = () => (keys ??= fieldKeys(process.env.ENCRYPTION_SECRET))

const sealed = (value: string, memberId: string, id: string, field: string) => seal(cryptoKeys(), value, COLLECTION, `${memberId}:${id}`, field)
const opened = (value: string, memberId: string, id: string, field: string) => open(cryptoKeys(), value, COLLECTION, `${memberId}:${id}`, field)

let indexed = false

async function collection() {
  const tasks = (await database()).collection<PrivateTaskDoc>(COLLECTION)
  if (!indexed) {
    indexed = true
    setUpInBackground('private tasks', () => tasks.createIndex({ memberId: 1 }))
  }
  return tasks
}

/** The private tasks of one member, oldest first. */
export async function privateTasks(memberId: string): Promise<PrivateTaskState[]> {
  const tasks = await collection()
  const list = await tasks.find({ memberId }, { sort: { createdAt: 1 } }).toArray()
  return list.map((task) => ({
    id: task._id,
    title: opened(task.title, memberId, task._id, 'title'),
    description: opened(task.description, memberId, task._id, 'description'),
    done: task.done,
    status: taskStatus(task),
    doneAt: task.doneAt?.toISOString() ?? '',
    due: task.due,
    priority: task.priority,
    team: task.team,
  }))
}

export async function addPrivateTask(memberId: string, fields: TaskFields): Promise<'ok' | 'privateFull'> {
  const tasks = await collection()
  if ((await tasks.countDocuments({ memberId })) >= MAX_TASKS) return 'privateFull'
  const id = randomUUID()
  const now = new Date()
  const done = fields.status === 'done'
  await tasks.insertOne({
    _id: id,
    memberId,
    title: sealed(fields.title, memberId, id, 'title'),
    description: sealed(fields.description, memberId, id, 'description'),
    done,
    status: fields.status,
    doneAt: done ? now : null,
    due: fields.due,
    priority: fields.priority,
    team: fields.team,
    createdAt: now,
    updatedAt: now,
  })
  return 'ok'
}

export async function updatePrivateTask(memberId: string, id: string, patch: TaskPatch): Promise<'ok' | 'unknown'> {
  const tasks = await collection()
  const now = new Date()
  const set: Partial<PrivateTaskDoc> = { updatedAt: now }
  for (const key of SEALED) if (patch[key] !== undefined) set[key] = sealed(patch[key], memberId, id, key)
  for (const key of PLAIN) if (patch[key] !== undefined) Object.assign(set, { [key]: patch[key] })
  // Standing is only written when the patch moves the task, as in updateTask: the values read here would undo a tick
  // made on another device in between.
  if (patch.done !== undefined || patch.status !== undefined) {
    const task = await tasks.findOne({ _id: id, memberId }, { projection: { done: 1, status: 1 } })
    if (!task) return 'unknown'
    const { done, status } = nextStanding({ done: task.done, status: taskStatus(task) }, patch)
    Object.assign(set, { done, status })
    if (done !== task.done) set.doneAt = done ? now : null
  }
  const { matchedCount } = await tasks.updateOne({ _id: id, memberId }, { $set: set })
  return matchedCount ? 'ok' : 'unknown'
}

/** The trash keeps the task as stored, still sealed, so the undo puts back the same record. */
export async function removePrivateTask(memberId: string, id: string): Promise<'ok' | 'unknown'> {
  const tasks = await collection()
  const task = await tasks.findOneAndDelete({ _id: id, memberId })
  if (!task) return 'unknown'
  await putInTrash('private', memberId, id, task)
  return 'ok'
}

export async function restorePrivateTask(memberId: string, id: string): Promise<'ok' | 'unknown'> {
  const tasks = await collection()
  const task = await takeFromTrash<PrivateTaskDoc>('private', memberId, id)
  if (!task) return 'unknown'
  await tasks.insertOne({ ...task, updatedAt: new Date() })
  return 'ok'
}
