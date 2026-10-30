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

export function parseContact(input: unknown): ContactFields | null {
  const raw = fieldsOf(input)
  if (!raw) return null
  return parse<ContactFields>({
    name: text(raw.name, 100, true),
    organization: text(raw.organization, 120),
    role: text(raw.role, 120),
    flags: subset(raw.flags, CRM_FLAGS),
    email: email(raw.email),
    phone: phone(raw.phone),
    linkedin: linkedin(raw.linkedin),
    owner: text(raw.owner, 100),
    source: text(raw.source, 500, true),
    nextStep: text(raw.nextStep, 300),
    nextDue: day(raw.nextDue),
  })
}

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
  const alumni = parse<AlumniFields>({
    name: text(raw.name, 100, true),
    now: text(raw.now, 120),
    igniteFrom: year(raw.igniteFrom),
    igniteTo: year(raw.igniteTo),
    city: text(raw.city, 80),
    industry: choice(raw.industry, ALUMNI_INDUSTRIES),
    status: choice(raw.status, ALUMNI_STATUS),
    help: subset(raw.help, ALUMNI_HELP),
    about: text(raw.about, 600),
    linkedin: linkedin(raw.linkedin),
    email: email(raw.email),
    open: typeof raw.open === 'boolean' ? raw.open : INVALID,
  })
  if (alumni && alumni.igniteFrom !== null && alumni.igniteTo !== null && alumni.igniteTo < alumni.igniteFrom)
    return null
  return alumni
}

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
