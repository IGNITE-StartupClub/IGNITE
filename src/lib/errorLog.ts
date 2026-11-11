/**
 * The server error log: collection `error_log`, one document per caught server error (errorReport.ts says what it
 * keeps). Vercel keeps runtime logs only briefly on Hobby, so routes call logError where they used console.error. The
 * admin page "Systemzustand" (MemberSystemPage) shows the entries grouped, and the daily report (errorReportMail.ts)
 * mails new ones to the admins who want it. A TTL index removes entries after KEEP_DAYS, reported or not.
 * `error_resolved` holds one document per group an admin marked done (`_id` its groupKey), and the `settings`
 * document `errorReport` the time of the last report run.
 */
import type { ObjectId } from 'mongodb'
import {
  errorEntry,
  groupKey,
  groupStatus,
  type ErrorEntry,
  type ErrorGroup,
  type ErrorPeriod,
  type GroupStatus,
} from './errorReport'
import { database, setUpInBackground } from './members'

export const KEEP_DAYS = 30
const RESOLVED_KEEP_DAYS = 2 * KEEP_DAYS

interface ErrorDoc extends ErrorEntry {
  _id?: ObjectId
  /** Set once a report run has handled the entry, whether or not anyone wanted the mail. */
  reportedAt?: Date
}

let indexed = false

async function errors() {
  const collection = (await database()).collection<ErrorDoc>('error_log')
  if (!indexed) {
    indexed = true
    setUpInBackground('error log', () =>
      Promise.all([
        collection.createIndex({ at: 1 }, { expireAfterSeconds: KEEP_DAYS * 86_400 }),
        collection.createIndex({ reportedAt: 1, at: 1 }),
      ]),
    )
  }
  return collection
}

/**
 * Writes `err` to the runtime log and to `error_log`. Never throws: it runs inside catch blocks, and a failure here
 * must not replace the answer the route is about to give. When the database is the cause, the runtime log still has it.
 */
export async function logError(context: string, err: unknown): Promise<void> {
  console.error(`${context}:`, err)
  try {
    await (await errors()).insertOne(errorEntry(context, err, new Date()))
  } catch (logFailure) {
    console.error('Writing the error log failed:', logFailure)
  }
}

/** The entries no report run has handled yet, oldest first. */
export async function unreportedErrors(): Promise<(ErrorEntry & { _id: ObjectId })[]> {
  const docs = await (await errors()).find({ reportedAt: { $exists: false } }, { sort: { at: 1 } }).toArray()
  return docs as (ErrorEntry & { _id: ObjectId })[]
}

export async function markReported(ids: ObjectId[], at: Date): Promise<void> {
  await (await errors()).updateMany({ _id: { $in: ids } }, { $set: { reportedAt: at } })
}

interface ResolvedDoc {
  _id: string
  resolvedAt: Date
  resolvedBy: string
}

let resolvedIndexed = false

/** Small: one document per group ever marked done, kept RESOLVED_KEEP_DAYS, longer than any entry it refers to. */
async function resolvedGroups() {
  const collection = (await database()).collection<ResolvedDoc>('error_resolved')
  if (!resolvedIndexed) {
    resolvedIndexed = true
    setUpInBackground('resolved errors', () =>
      collection.createIndex({ resolvedAt: 1 }, { expireAfterSeconds: RESOLVED_KEEP_DAYS * 86_400 }),
    )
  }
  return collection
}
const reportRuns = async () => (await database()).collection<{ _id: 'errorReport'; lastRunAt: Date }>('settings')

/** Older groups beyond this are left out of the page; an error storm of more kinds still shows in the counts. */
const BOARD_GROUPS_MAX = 100
const DAY_MS = 86_400_000

export interface BoardGroup extends ErrorGroup {
  key: string
  status: GroupStatus
  resolvedAt: Date | null
}

export interface ErrorBoard {
  groups: BoardGroup[]
  /** Entries in the last day, week and month. */
  counts: { day: number; week: number; month: number }
  lastAt: Date | null
}

/** Everything the admin page shows about errors, read in one wave. */
export async function errorBoard(days: ErrorPeriod, now: Date): Promise<ErrorBoard> {
  const [collection, resolvedCollection] = await Promise.all([errors(), resolvedGroups()])
  const since = (span: number) => new Date(now.getTime() - span * DAY_MS)
  const [grouped, day, week, month, latest, resolvedDocs] = await Promise.all([
    collection
      .aggregate<ErrorGroup>([
        { $match: { at: { $gte: since(days) } } },
        { $sort: { at: 1 } },
        {
          $group: {
            _id: { context: '$context', name: '$name', message: '$message' },
            count: { $sum: 1 },
            first: { $first: '$at' },
            last: { $last: '$at' },
            stack: { $last: '$stack' },
          },
        },
        // The most recent first, so a group that came back after being marked done is on top again.
        { $sort: { last: -1 } },
        { $limit: BOARD_GROUPS_MAX },
        {
          $project: {
            _id: 0,
            context: '$_id.context',
            name: '$_id.name',
            message: '$_id.message',
            count: 1,
            first: 1,
            last: 1,
            stack: 1,
          },
        },
      ])
      .toArray(),
    collection.countDocuments({ at: { $gte: since(1) } }),
    collection.countDocuments({ at: { $gte: since(7) } }),
    collection.countDocuments({ at: { $gte: since(30) } }),
    collection.findOne({}, { sort: { at: -1 }, projection: { at: 1 } }),
    // All of them in the same wave instead of a second query by key: the collection stays small.
    resolvedCollection.find({}, { projection: { resolvedAt: 1 } }).toArray(),
  ])
  const resolved = new Map(resolvedDocs.map((doc) => [doc._id, doc.resolvedAt]))
  return {
    groups: grouped.map((group) => {
      const key = groupKey(group)
      const resolvedAt = resolved.get(key) ?? null
      return { ...group, key, resolvedAt, status: groupStatus(group.last, resolvedAt) }
    }),
    counts: { day, week, month },
    lastAt: latest?.at ?? null,
  }
}

/** Marks a group done (until a newer entry comes, see groupStatus) or takes the mark back. */
export async function setResolved(key: string, resolved: boolean, by: string, at: Date): Promise<Date | null> {
  const collection = await resolvedGroups()
  if (!resolved) {
    await collection.deleteOne({ _id: key })
    return null
  }
  await collection.updateOne({ _id: key }, { $set: { resolvedAt: at, resolvedBy: by } }, { upsert: true })
  return at
}

/** Round trip time of a ping, in milliseconds. */
export async function databaseLatency(): Promise<number> {
  const db = await database()
  const start = performance.now()
  await db.command({ ping: 1 })
  return Math.round(performance.now() - start)
}

export async function recordReportRun(at: Date): Promise<void> {
  await (await reportRuns()).updateOne({ _id: 'errorReport' }, { $set: { lastRunAt: at } }, { upsert: true })
}

export async function lastReportRun(): Promise<Date | null> {
  return (await (await reportRuns()).findOne({ _id: 'errorReport' }))?.lastRunAt ?? null
}
