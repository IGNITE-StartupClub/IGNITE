/**
 * Rules of the server error log (errorLog.ts), its admin page (MemberSystemPage, ErrorBoard island) and its daily report
 * mail (errorReportMail.ts), without database access.
 * An entry keeps where the error happened, its type and its message, but no member, address or request data: email
 * addresses in messages are replaced, so the log holds no personal data on purpose.
 * Imports only node:crypto, so node --test can load this module.
 */
import { createHash } from 'node:crypto'

export interface ErrorEntry {
  at: Date
  /** What failed, the text the route passed, e.g. 'Member login failed'. */
  context: string
  name: string
  message: string
  /** The top frames only: enough to find the line, short enough for a mail. */
  stack: string
}

export interface ErrorGroup {
  context: string
  name: string
  message: string
  count: number
  first: Date
  last: Date
  stack: string
}

export const MESSAGE_MAX = 500
export const STACK_LINES = 8
export const STACK_MAX = 2000
/** Groups beyond this are only counted in the mail, so an error storm cannot produce a mail nobody can read. */
export const REPORT_GROUPS_MAX = 20

const EMAIL = /[^\s@<>"'(),;:]+@[^\s@<>"'(),;:]+\.[a-z]{2,}/gi

const cut = (text: string, max: number): string => (text.length > max ? `${text.slice(0, max - 1)}…` : text)

/** The message without email addresses, cut to MESSAGE_MAX characters. */
export const scrubMessage = (message: string): string => cut(message.replace(EMAIL, '<E-Mail>'), MESSAGE_MAX)

/** The stored form of `err`; anything thrown that is not an Error keeps its text as the message. */
export function errorEntry(context: string, err: unknown, at: Date): ErrorEntry {
  const error = err instanceof Error ? err : null
  const stackLines = (error?.stack ?? '').split('\n').slice(1, STACK_LINES + 1)
  return {
    at,
    context: scrubMessage(context),
    name: error?.name ?? typeof err,
    message: scrubMessage(error ? error.message : String(err)),
    stack: cut(stackLines.map((line) => line.trim()).join('\n').replace(EMAIL, '<E-Mail>'), STACK_MAX),
  }
}

/** One group per context, type and message, the most frequent first, then the most recent. */
export function errorGroups(entries: ErrorEntry[]): ErrorGroup[] {
  const groups = new Map<string, ErrorGroup>()
  for (const entry of entries) {
    const key = `${entry.context}\u0000${entry.name}\u0000${entry.message}`
    const group = groups.get(key)
    if (!group) {
      groups.set(key, { ...entry, count: 1, first: entry.at, last: entry.at })
      continue
    }
    group.count += 1
    if (entry.at < group.first) group.first = entry.at
    if (entry.at > group.last) {
      group.last = entry.at
      group.stack = entry.stack
    }
  }
  return [...groups.values()].sort((a, b) => b.count - a.count || b.last.getTime() - a.last.getTime())
}

/** The periods the admin page offers, in days; the first entry after 1 is the default. */
export const ERROR_PERIODS = [1, 7, 30] as const
export type ErrorPeriod = (typeof ERROR_PERIODS)[number]
export const DEFAULT_ERROR_PERIOD: ErrorPeriod = 7

/** The period of the `?tage=` parameter; anything else is the default. */
export function errorPeriod(param: string | null): ErrorPeriod {
  const days = Number(param)
  return (ERROR_PERIODS as readonly number[]).includes(days) ? (days as ErrorPeriod) : DEFAULT_ERROR_PERIOD
}

/** Stable id of a group, the same for every entry with that context, type and message. */
export const groupKey = (group: Pick<ErrorEntry, 'context' | 'name' | 'message'>): string =>
  createHash('sha256').update(`${group.context}\u0000${group.name}\u0000${group.message}`).digest('hex').slice(0, 16)

export const isGroupKey = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{16}$/.test(value)

/**
 * 'resolved' while no entry came after an admin marked the group done; 'again' once one did; 'new' when nobody ever
 * marked it.
 */
export type GroupStatus = 'new' | 'again' | 'resolved'
export function groupStatus(last: Date, resolvedAt: Date | null): GroupStatus {
  if (!resolvedAt) return 'new'
  return last > resolvedAt ? 'again' : 'resolved'
}

export type ErrorAction = { action: 'resolve' | 'reopen'; key: string }

/** The body of POST /api/members/errors, or null. */
export function parseErrorAction(input: unknown): ErrorAction | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null
  const { action, key, ...rest } = input as Record<string, unknown>
  if (Object.keys(rest).length || (action !== 'resolve' && action !== 'reopen') || !isGroupKey(key)) return null
  return { action, key }
}
