/**
 * Pure rules for the CRM and the alumni network of the members area: the allowed values, the parsing of the form
 * input that /api/members/crm and /api/members/alumni receive, and the search and filters of the islands
 * (CrmBoard.jsx, AlumniDirectory.jsx). No imports, so node --test can load it directly.
 */

export const CRM_FLAGS = ['partner', 'sponsor', 'startup', 'investor', 'speaker', 'university'] as const
export type CrmFlag = (typeof CRM_FLAGS)[number]

/** What members can log on a contact. `done` is added by the API when a next step is marked as done. */
export const ENTRY_TYPES = ['mail', 'meeting', 'event', 'note'] as const
export type EntryType = (typeof ENTRY_TYPES)[number] | 'done'

export const ALUMNI_HELP = ['mentoring', 'pitch', 'funding', 'investors', 'tech', 'marketing', 'legal', 'jobs'] as const
export const ALUMNI_INDUSTRIES = [
  'sustainability',
  'fintech',
  'software',
  'health',
  'hardware',
  'consulting',
  'other',
] as const
export const ALUMNI_STATUS = ['founder', 'employed', 'investor', 'other'] as const

export interface ContactFields {
  name: string
  organization: string
  role: string
  flags: CrmFlag[]
  email: string
  phone: string
  linkedin: string
  /** Who at IGNITE looks after the contact, as free text. */
  owner: string
  /** Why IGNITE keeps the data. Required: it documents the legitimate interest (privacy policy). */
  source: string
  nextStep: string
  /** YYYY-MM-DD or ''. */
  nextDue: string
}

export interface EntryFields {
  type: (typeof ENTRY_TYPES)[number]
  /** YYYY-MM-DD. */
  date: string
  text: string
}

export interface AlumniFields {
  name: string
  /** Current position, e.g. "Gründerin, Fairtrail". */
  now: string
  igniteFrom: number | null
  igniteTo: number | null
  city: string
  industry: (typeof ALUMNI_INDUSTRIES)[number] | ''
  status: (typeof ALUMNI_STATUS)[number] | ''
  help: (typeof ALUMNI_HELP)[number][]
  about: string
  linkedin: string
  email: string
  /** Takes requests from members right now. */
  open: boolean
}

// Marks an invalid field inside the parsers; never leaves this module.
const INVALID = Symbol('invalid')
type Parsed<T> = T | typeof INVALID

function text(value: unknown, max: number, required = false): Parsed<string> {
  if (value === undefined || value === null) return required ? INVALID : ''
  if (typeof value !== 'string') return INVALID
  const trimmed = value.trim()
  return trimmed.length > max || (required && !trimmed) ? INVALID : trimmed
}

function email(value: unknown): Parsed<string> {
  const address = text(value, 254)
  if (address === INVALID || !address) return address
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) ? address.toLowerCase() : INVALID
}

function phone(value: unknown): Parsed<string> {
  const number = text(value, 40)
  return number === INVALID || /^[\d\s+()/.-]*$/.test(number) ? number : INVALID
}

/** A LinkedIn profile or company page; "linkedin.com/in/x" without the scheme is accepted too. */
function linkedin(value: unknown): Parsed<string> {
  const raw = text(value, 300)
  if (raw === INVALID || !raw) return raw
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
    const host = url.hostname.toLowerCase()
    const isLinkedin = host === 'linkedin.com' || host.endsWith('.linkedin.com')
    return isLinkedin && url.protocol === 'https:' && !url.username && !url.password ? url.href : INVALID
  } catch {
    // Not a URL at all: the same invalid input as a URL of another site.
    return INVALID
  }
}

function day(value: unknown, required = false): Parsed<string> {
  const raw = text(value, 10, required)
  if (raw === INVALID || !raw) return raw
  const date = new Date(`${raw}T00:00:00Z`)
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) && !isNaN(date.getTime()) && date.toISOString().startsWith(raw) ? raw : INVALID
}

function subset<T extends string>(value: unknown, allowed: readonly T[]): Parsed<T[]> {
  if (value === undefined) return []
  if (!Array.isArray(value) || !value.every((item) => allowed.includes(item))) return INVALID
  return allowed.filter((item) => value.includes(item))
}

function choice<T extends string>(value: unknown, allowed: readonly T[]): Parsed<T | ''> {
  if (value === undefined || value === '') return ''
  return allowed.includes(value as T) ? (value as T) : INVALID
}

function year(value: unknown): Parsed<number | null> {
  if (value === undefined || value === null || value === '') return null
  const number = typeof value === 'string' ? Number(value) : value
  return Number.isInteger(number) && (number as number) >= 2000 && (number as number) <= 2100
    ? (number as number)
    : INVALID
}

const fieldsOf = (input: unknown): Record<string, unknown> | null =>
  typeof input === 'object' && input !== null && !Array.isArray(input) ? (input as Record<string, unknown>) : null

/** Returns the parsed object, or null when any field is missing, too long or not allowed. */
function parse<T>(values: { [K in keyof T]: Parsed<T[K]> }): T | null {
  return Object.values(values).includes(INVALID) ? null : (values as T)
}

const CONTACT_PARSERS: { [K in keyof ContactFields]: (value: unknown) => Parsed<ContactFields[K]> } = {
  name: (value) => text(value, 100, true),
  organization: (value) => text(value, 120),
  role: (value) => text(value, 120),
  flags: (value) => subset(value, CRM_FLAGS),
  email,
  phone,
  linkedin,
  owner: (value) => text(value, 100),
  source: (value) => text(value, 500, true),
  nextStep: (value) => text(value, 300),
  nextDue: (value) => day(value),
}

const ALUMNI_PARSERS: { [K in keyof AlumniFields]: (value: unknown) => Parsed<AlumniFields[K]> } = {
  name: (value) => text(value, 100, true),
  now: (value) => text(value, 120),
  igniteFrom: year,
  igniteTo: year,
  city: (value) => text(value, 80),
  industry: (value) => choice(value, ALUMNI_INDUSTRIES),
  status: (value) => choice(value, ALUMNI_STATUS),
  help: (value) => subset(value, ALUMNI_HELP),
  about: (value) => text(value, 600),
  linkedin,
  email,
  open: (value) => (typeof value === 'boolean' ? value : INVALID),
}

function parseAll<T extends object>(raw: Record<string, unknown>, parsers: { [K in keyof T]: (value: unknown) => Parsed<T[K]> }): T | null {
  const keys = Object.keys(parsers) as (keyof T)[]
  return parse<T>(Object.fromEntries(keys.map((key) => [key, parsers[key](raw[key as string])])) as { [K in keyof T]: Parsed<T[K]> })
}

/** A change to some fields; null when it changes nothing or any given field is unknown or invalid. */
function parsePatch<T extends object>(input: unknown, parsers: { [K in keyof T]: (value: unknown) => Parsed<T[K]> }): Partial<T> | null {
  const raw = fieldsOf(input)
  if (!raw) return null
  const patch: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (!Object.hasOwn(parsers, key) || value === undefined) return null
    const parsed = parsers[key as keyof T](value)
    if (parsed === INVALID) return null
    patch[key] = parsed
  }
  return Object.keys(patch).length ? (patch as Partial<T>) : null
}

export function parseContact(input: unknown): ContactFields | null {
  const raw = fieldsOf(input)
  return raw && parseAll<ContactFields>(raw, CONTACT_PARSERS)
}

export const parseContactPatch = (input: unknown) => parsePatch<ContactFields>(input, CONTACT_PARSERS)

export function parseEntry(input: unknown): EntryFields | null {
  const raw = fieldsOf(input)
  if (!raw) return null
  return parse<EntryFields>({
    type: ENTRY_TYPES.includes(raw.type as EntryFields['type']) ? (raw.type as EntryFields['type']) : INVALID,
    date: day(raw.date, true),
    text: text(raw.text, 2000, true),
  })
}

/** Null as well when `consent` is not true: nobody appears in the alumni network without agreeing to it. */
export function parseAlumni(input: unknown): AlumniFields | null {
  const raw = fieldsOf(input)
  if (!raw || raw.consent !== true) return null
  const alumni = parseAll<AlumniFields>(raw, ALUMNI_PARSERS)
  return alumni && validIgniteTime(alumni) ? alumni : null
}

/** The store checks this again after a patch, since the other year may only be known there. */
export const validIgniteTime = ({ igniteFrom, igniteTo }: Pick<AlumniFields, 'igniteFrom' | 'igniteTo'>): boolean =>
  igniteFrom === null || igniteTo === null || igniteTo >= igniteFrom

/** Changes to a listed profile. Its consent was recorded when it was added, so a patch does not carry one. */
export const parseAlumniPatch = (input: unknown) => parsePatch<AlumniFields>(input, ALUMNI_PARSERS)

const contains = (needle: string, ...values: string[]) => values.some((value) => value.toLowerCase().includes(needle))

/** A contact whose next step is due today or earlier. `today` is YYYY-MM-DD (berlinDay). */
export const isDue = (contact: Pick<ContactFields, 'nextStep' | 'nextDue'>, today: string): boolean =>
  !!contact.nextStep && !!contact.nextDue && contact.nextDue <= today

/**
 * Contacts matching `query` (name, organisation, role, next step or a logged entry) that carry at least one of
 * `flags` (all when empty) and, with `dueOnly`, have a due next step.
 */
export function filterContacts<T extends ContactFields & { entries: { text: string }[] }>(
  contacts: T[],
  query: string,
  flags: string[],
  dueOnly: boolean,
  today: string,
): T[] {
  const needle = query.trim().toLowerCase()
  return contacts.filter(
    (contact) =>
      (!flags.length || contact.flags.some((flag) => flags.includes(flag))) &&
      (!dueOnly || isDue(contact, today)) &&
      (!needle ||
        contains(needle, contact.name, contact.organization, contact.role, contact.nextStep) ||
        contact.entries.some((entry) => contains(needle, entry.text))),
  )
}

export interface AlumniFilters {
  help: string[]
  industry: string[]
  status: string[]
}

/**
 * Alumni matching `query` (name, position or city) and every filter group. Inside a group one match is enough:
 * "Mentoring" and "Finanzierung" shows alumni who help with either.
 */
export function filterAlumni<T extends AlumniFields>(alumni: T[], query: string, filters: AlumniFilters): T[] {
  const needle = query.trim().toLowerCase()
  const inGroup = (selected: string[], values: string[]) => !selected.length || values.some((v) => selected.includes(v))
  return alumni.filter(
    (person) =>
      inGroup(filters.help, person.help) &&
      inGroup(filters.industry, [person.industry]) &&
      inGroup(filters.status, [person.status]) &&
      (!needle || contains(needle, person.name, person.now, person.city)),
  )
}

/** Today in Berlin as YYYY-MM-DD, so the server and the browser agree on what is due. */
export const berlinDay = (now: number): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date(now))

/** "24. Juni 2025" / "24 Jun 2025" for a YYYY-MM-DD day. */
export const formatDay = (value: string, locale: string): string =>
  new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'de', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`))

/** "AB" for "Anna Beispiel", "A" for "Anna". */
export const initials = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return words.length > 1 ? words[0][0] + words[words.length - 1][0] : (words[0]?.[0] ?? '?')
}
