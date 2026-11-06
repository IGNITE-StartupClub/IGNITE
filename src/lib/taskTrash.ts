/**
 * The undo behind deleting a task (`task_trash`). A deleted task waits here for ten minutes, then a TTL index removes it.
 * Only the member who deleted it gets it back, and only once, because taking an entry out is one atomic step. An entry
 * is written after the delete succeeded, from what the delete returned, so a request that lost the race leaves none. If
 * the write itself fails the task stays deleted without an undo; the member sees the error.
 */
import { database, setUpInBackground } from './members'

const TRASH_MS = 10 * 60_000

interface TrashDoc<T> {
  /** `${memberId}:${taskId}` */
  _id: string
  deletedBy: string
  expiresAt: Date
  content: T
}

let indexed = false

async function collection<T>() {
  const trash = (await database()).collection<TrashDoc<T>>('task_trash')
  if (!indexed) {
    indexed = true
    setUpInBackground('task trash', () => trash.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }))
  }
  return trash
}

const entryId = (memberId: string, taskId: string) => `${memberId}:${taskId}`

export async function putInTrash<T>(memberId: string, taskId: string, content: T): Promise<void> {
  const trash = await collection<T>()
  await trash.replaceOne(
    { _id: entryId(memberId, taskId) },
    { deletedBy: memberId, expiresAt: new Date(Date.now() + TRASH_MS), content },
    { upsert: true },
  )
}

/** What this member deleted, gone from the trash once returned; null when it expired or was taken already. */
export async function takeFromTrash<T>(memberId: string, taskId: string): Promise<T | null> {
  const trash = await collection<T>()
  const entry = await trash.findOneAndDelete({ _id: entryId(memberId, taskId) })
  return entry?.content ?? null
}
