/**
 * Pure helpers for the member table on the admin page (MemberAdmin.jsx): status, search and filter, the time
 * columns and the CSV export. No imports, so node --test can load it directly.
 */

/** The fields of a member summary (members.ts) the table works with. */
export interface TableMember {
  email: string
  name: string
  role: 'member' | 'admin'
  owner: boolean
  addedAt: string
  lastLoginAt: string
  hasPassword: boolean
  locked: boolean
}

export type MemberStatus = 'active' | 'invited' | 'locked'
export type RoleFilter = 'all' | 'member' | 'admin'
export type StatusFilter = 'all' | MemberStatus

export const memberStatus = (member: TableMember): MemberStatus =>
  member.locked ? 'locked' : member.hasPassword ? 'active' : 'invited'

/** Members whose address or name contains `query` (ignoring case) and that match both filters. */
export function filterMembers<T extends TableMember>(
  members: T[],
  query: string,
  role: RoleFilter,
  status: StatusFilter,
): T[] {
  const needle = query.trim().toLowerCase()
  return members.filter(
    (member) =>
      (role === 'all' || member.role === role) &&
      (status === 'all' || memberStatus(member) === status) &&
      (!needle || member.email.includes(needle) || member.name.toLowerCase().includes(needle)),
  )
}

// Fixed zone: the island renders on the server (UTC) and again in the browser, and both must print the same text.
const TIME_ZONE = 'Europe/Berlin'

export const formatDateTime = (iso: string, locale: string): string =>
  new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'de', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIME_ZONE,
  }).format(new Date(iso))

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 60],
  ['month', 30 * 24 * 60],
  ['week', 7 * 24 * 60],
  ['day', 24 * 60],
  ['hour', 60],
  ['minute', 1],
]

/** "Vor 20 Minuten", "Gestern", "Vor 3 Wochen": the largest whole unit between `iso` and `now`. */
export function relativeTime(iso: string, now: number, locale: string): string {
  const minutes = Math.max(0, Math.floor((now - Date.parse(iso)) / 60_000))
  const [unit, size] = UNITS.find(([, size]) => minutes >= size) ?? UNITS[UNITS.length - 1]
  const text = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-Math.floor(minutes / size), unit)
  return text[0].toUpperCase() + text.slice(1)
}

// Spreadsheet apps run cells that start with these as formulas.
const FORMULA_START = /^[=+\-@\t\r]/

const csvCell = (value: string): string => {
  const safe = FORMULA_START.test(value) ? `'${value}` : value
  return /[";,\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe
}

/**
 * CSV with a header row. German Excel splits on semicolons, English on commas. The byte order mark makes Excel read
 * umlauts as UTF-8.
 */
export function toCsv(rows: string[][], locale: string): string {
  const separator = locale === 'en' ? ',' : ';'
  return '﻿' + rows.map((row) => row.map(csvCell).join(separator)).join('\r\n') + '\r\n'
}
