/**
 * MongoDB access for private tasks (`private_tasks`), which a member keeps for themselves on the tasks board. They live
 * apart from `task_projects` on purpose: that collection reaches every member (workspaceState), while every query here
 * carries the member's id, so no other member and no admin gets at them. Title and description are sealed
 * (fieldCrypto.ts) with the member bound in, so a record moved to another member fails to open. There is no activity
 * log, digest or template for them, and they go with the account (removeMember).
 */
import { randomUUID } from 'node:crypto'
import { fieldKeys, open, seal, type FieldKeys } from './fieldCrypto'
import { database } from './members'
import { MAX_TASKS, nextStanding, type PrivateTaskState, type TaskFields, type TaskPatch } from './tasks'

const COLLECTION = 'private_tasks'
const SEALED = ['title', 'description'] as const
const PLAIN = ['due', 'priority', 'team'] as const

interface PrivateTaskDoc extends Omit<PrivateTaskState, 'id' | 'doneAt'> {
  _id: string
  memberId: string
  doneAt: Date | null
  createdAt: Date
  updatedAt: Date
}

let keys: FieldKeys | null = null
const cryptoKeys = () => (keys ??= fieldKeys(process.env.ENCRYPTION_SECRET))

const sealed = (value: string, memberId: string, id: string, field: string) => seal(cryptoKeys(), value, COLLECTION, `${memberId}:${id}`, field)
const opened = (value: string, memberId: string, id: string, field: string) => open(cryptoKeys(), value, COLLECTION, `${memberId}:${id}`, field)

let indexed: Promise<unknown> | null = null

async function collection() {
  const tasks = (await database()).collection<PrivateTaskDoc>(COLLECTION)
  indexed ??= tasks.createIndex({ memberId: 1 }).catch((err) => {
    indexed = null
    throw err
  })
  await indexed
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
    status: task.status,
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
  const task = await tasks.findOne({ _id: id, memberId }, { projection: { done: 1, status: 1 } })
  if (!task) return 'unknown'
  const now = new Date()
  const { done, status } = nextStanding(task, patch)
  const set: Partial<PrivateTaskDoc> = { done, status, updatedAt: now }
  if (done !== task.done) set.doneAt = done ? now : null
  for (const key of SEALED) if (patch[key] !== undefined) set[key] = sealed(patch[key], memberId, id, key)
  for (const key of PLAIN) if (patch[key] !== undefined) Object.assign(set, { [key]: patch[key] })
  await tasks.updateOne({ _id: id, memberId }, { $set: set })
  return 'ok'
}

export async function removePrivateTask(memberId: string, id: string): Promise<'ok' | 'unknown'> {
  const tasks = await collection()
  const { deletedCount } = await tasks.deleteOne({ _id: id, memberId })
  return deletedCount ? 'ok' : 'unknown'
}
