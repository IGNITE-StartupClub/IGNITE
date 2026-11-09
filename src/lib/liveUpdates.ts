/**
 * Keeps the member islands current within Vercel's limits, where every request counts as a function invocation and
 * every answer as Fast Origin Transfer. An island asks for news every REFRESH_MS, but only while its page is visible
 * and in use, so a tab left open costs nothing. It sends the revision it knows: a short string that stands for a
 * collection (number of records, latest change), so the usual answer is a few bytes and only a change brings data.
 * Runs in the browser as well, so the mongodb import stays type-only; node --test can load this module.
 */
import type { Collection, Document } from 'mongodb'

export const REFRESH_MS = 30_000
export const IDLE_MS = 120_000
/** Clocks of two server instances and writes still under way can stamp a change just before the latest one. */
const OVERLAP_MS = 5_000

interface RefreshMoment {
  now: number
  lastCheck: number
  lastUse: number
  hidden: boolean
}

export const refreshDue = ({ now, lastCheck, lastUse, hidden }: RefreshMoment): boolean =>
  !hidden && now - lastUse < IDLE_MS && now - lastCheck >= REFRESH_MS

export const revisionOf = (count: number, latest: Date | null | undefined): string => `${count}.${latest?.getTime() ?? 0}`

/**
 * The revision of a list a page has just read. It saves the page a query of its own, and it cannot run ahead of what
 * the client got: a change the list missed still counts as new.
 */
export const listRevision = (list: { updatedAt: Date }[]): string =>
  revisionOf(list.length, list.reduce<Date | null>((latest, { updatedAt }) => (latest && latest > updatedAt ? latest : updatedAt), null))

/**
 * Marks a revision whose latest change is younger than OVERLAP_MS. A write stamped just before that change can still be
 * under way and land later without changing the count or the latest change, so the plain revision would hide it for
 * good. A client holding the marked revision asks once more after the moment has passed: the plain revision differs
 * then, and changedSince reaches back far enough to bring that write.
 */
export function markUnsettled(revision: string, now: number): string {
  const latest = Number(/^\d+\.(\d+)$/.exec(revision)?.[1] ?? 0)
  return now - latest < OVERLAP_MS ? `${revision}~` : revision
}

/** Where a client with this revision has to catch up from; null when it knows nothing yet. */
export function changedSince(revision: unknown): Date | null {
  const match = typeof revision === 'string' ? /^\d+\.(\d{1,15})~?$/.exec(revision) : null
  return match ? new Date(Number(match[1]) - OVERLAP_MS) : null
}

/**
 * The revision of a collection with an index on updatedAt. It reads that index and the collection's count, no record.
 * Writes that should reach the islands have to set updatedAt; deletions show in the count.
 */
export async function collectionRevision<T extends Document>(collection: Collection<T>): Promise<string> {
  const [count, [latest]] = await Promise.all([
    collection.estimatedDocumentCount(),
    collection.find({}, { sort: { updatedAt: -1 }, limit: 1, projection: { _id: 0, updatedAt: 1 } }).toArray(),
  ])
  return revisionOf(count, latest?.updatedAt)
}

/** The fields of a form that differ from where it started, so saving never writes back values nobody touched. */
export const changedFields = <T extends object>(before: T, after: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(after).filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(before[key as keyof T])),
  ) as Partial<T>
