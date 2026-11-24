/**
 * Rules of the website feedback: what a member may send, what an entry keeps and when it goes. An anonymous entry keeps
 * neither the member nor a time finer than the Berlin day, so neither the database nor the admin page tells who sent
 * it or in which order. feedbackStore.ts holds the Mongo access. No extensionless imports, so node --test loads it,
 * and no node:crypto, because the dialogs import the lists too.
 */
import { berlinDay } from './tasks.ts'

export const FEEDBACK_KINDS = ['missing', 'annoying', 'bug', 'idea'] as const
export type FeedbackKind = (typeof FEEDBACK_KINDS)[number]

/** Where on the website: the parts of the members area, the search and everything else. */
export const FEEDBACK_AREAS = ['home', 'tasks', 'network', 'storage', 'signature', 'search', 'other'] as const
export type FeedbackArea = (typeof FEEDBACK_AREAS)[number]

export const FEEDBACK_STATUSES = ['new', 'seen', 'done', 'rejected'] as const
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number]

export const FEEDBACK_TEXT_MAX = 2000
/** Entries per member and Berlin day, anonymous ones included. */
export const FEEDBACK_DAILY_LIMIT = 5
export const FEEDBACK_KEEP_MONTHS = 12

const isOneOf = <T extends string>(list: readonly T[], value: unknown): value is T => list.includes(value as T)

const isFeedbackId = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value)

export interface FeedbackInput {
  kind: FeedbackKind
  area: FeedbackArea
  text: string
  /** True when the member sends it with their name. */
  named: boolean
}

export type FeedbackAction =
  | { action: 'send'; feedback: FeedbackInput }
  | { action: 'status'; id: string; status: FeedbackStatus }
  | { action: 'task'; id: string }

/** The body of a request to /api/members/feedback, or null when it is malformed. */
export function parseFeedbackAction(input: unknown): FeedbackAction | null {
  if (!input || typeof input !== 'object') return null
  const body = input as Record<string, unknown>
  if (body.action === 'send') {
    const { kind, area, text, named } = body
    if (!isOneOf(FEEDBACK_KINDS, kind) || !isOneOf(FEEDBACK_AREAS, area)) return null
    if (typeof named !== 'boolean' || typeof text !== 'string') return null
    const trimmed = text.replace(/\r\n?/g, '\n').trim()
    if (!trimmed || trimmed.length > FEEDBACK_TEXT_MAX) return null
    return { action: 'send', feedback: { kind, area, text: trimmed, named } }
  }
  if (!isFeedbackId(body.id)) return null
  if (body.action === 'status') {
    return isOneOf(FEEDBACK_STATUSES, body.status) ? { action: 'status', id: body.id, status: body.status } : null
  }
  return body.action === 'task' ? { action: 'task', id: body.id } : null
}

export interface FeedbackEntry {
  /** A random UUID: an ObjectId would keep the second the entry was made. */
  _id: string
  kind: FeedbackKind
  area: FeedbackArea
  text: string
  /** The Berlin day it was sent (YYYY-MM-DD), the finest time an entry keeps. */
  day: string
  status: FeedbackStatus
  /** The sender's member id, only on entries sent with the name. */
  memberId?: string
  /** The single task an admin made from it. */
  taskId?: string
  /** TTL: FEEDBACK_KEEP_MONTHS after its day. */
  expiresAt: Date
}

const dayParts = (day: string): [number, number, number] => {
  const [year, month, date] = day.split('-').map(Number)
  return [year, month, date]
}

/** When an entry of `day` goes: the same date twelve months later at midnight UTC (29 February moves to 1 March). */
export function feedbackExpiry(day: string): Date {
  const [year, month, date] = dayParts(day)
  return new Date(Date.UTC(year, month - 1 + FEEDBACK_KEEP_MONTHS, date))
}

/** When the daily counter of `day` goes: midnight UTC after it, which follows the end of the Berlin day all year. */
export function quotaExpiry(day: string): Date {
  const [year, month, date] = dayParts(day)
  return new Date(Date.UTC(year, month - 1, date + 1))
}

/** The Berlin day of `now`, the only time an entry and its counter know. */
export const feedbackDay = (now: number): string => berlinDay(now)

/** The document a send stores. An anonymous one has no memberId field at all, not even an empty one. */
export function feedbackEntry(input: FeedbackInput, memberId: string, day: string, id: string): FeedbackEntry {
  return {
    _id: id,
    kind: input.kind,
    area: input.area,
    text: input.text,
    day,
    status: 'new',
    ...(input.named ? { memberId } : {}),
    expiresAt: feedbackExpiry(day),
  }
}

const TASK_TITLE_PREFIX = 'Website-Feedback: '
const TASK_TITLE_TEXT = 100

/** Title of the task an admin makes from an entry: its first line, cut by characters so no emoji splits. */
export function feedbackTaskTitle(text: string): string {
  const line = Array.from(text.trim().split('\n')[0].replace(/\s+/g, ' ').trim())
  const cut = line.length > TASK_TITLE_TEXT ? `${line.slice(0, TASK_TITLE_TEXT - 1).join('').trimEnd()}…` : line.join('')
  return TASK_TITLE_PREFIX + cut
}

/** Page paths of the areas that are pages, per locale; the server passes memberPagePath values. */
export type AreaPaths = Record<'home' | 'tasks' | 'network' | 'storage' | 'signature', string>

const withoutSlash = (path: string): string => path.replace(/\/+$/, '')

/**
 * The area of the page at `pathname`. The start page matches only itself, because every member page sits below it;
 * the others match their sub pages too (the Netzwerk tabs). Admin and other pages are 'other'.
 */
export function feedbackArea(pathname: string, paths: AreaPaths): FeedbackArea {
  const path = withoutSlash(pathname)
  if (path === withoutSlash(paths.home)) return 'home'
  const pages = ['tasks', 'network', 'storage', 'signature'] as const
  return pages.find((area) => path === withoutSlash(paths[area]) || path.startsWith(`${withoutSlash(paths[area])}/`)) ?? 'other'
}
