/**
 * Pure rules of the Netzwerk, the people database of the members area: everyone around IGNITE in one list (active
 * members, alumni, contacts from companies, startups, sponsors and partners) plus the organisations they belong to.
 * Holds the allowed values, the parsing of what /api/members/network receives, the visibility levels and who may see
 * or change which field, the filters of the NetworkDirectory island and the automatic semester count.
 * No imports, so node --test can load it directly, and it runs in the browser as well.
 */

/** Where someone stands to IGNITE. Members and alumni with a login take it from their account (position). */
export const PERSON_KINDS = ['member', 'alumni', 'external'] as const
export type PersonKind = (typeof PERSON_KINDS)[number]

/** What an external contact or an organisation is to IGNITE; several can apply. */
export const RELATIONS = [
  'company',
  'startup',
  'sponsor',
  'partner',
  'investor',
  'speaker',
  'university',
  'mentor',
  'press',
  'other',
] as const
export type Relation = (typeof RELATIONS)[number]

/** The tag categories. Members choose from the shared pool and may add to it (decided 2026-11-24). */
export const TAG_CATEGORIES = ['interests', 'skills', 'hobbies', 'industries'] as const
export type TagCategory = (typeof TAG_CATEGORIES)[number]

/** The first pool from the concept (29 tags) plus industries. Seeded once; the team adds and merges from there. */
export const SEED_TAGS: Record<TagCategory, string[]> = {
  interests: [
    'Gründung',
    'Nachhaltigkeit',
    'Künstliche Intelligenz',
    'Marketing & Marken',
    'Finanzen & Investment',
    'Wirtschaftspsychologie',
    'Social Entrepreneurship',
    'Technologie & Innovation',
    'Unternehmensberatung',
    'Produktentwicklung',
  ],
  skills: [
    'Social Media',
    'Grafikdesign',
    'Fotografie & Video',
    'Texte schreiben',
    'Präsentieren & Pitchen',
    'Eventorganisation',
    'Projektmanagement',
    'Programmieren',
    'Datenanalyse',
  ],
  hobbies: [
    'Reisen',
    'Kochen & Backen',
    'Sport & Fitness',
    'Wandern & Natur',
    'Musik',
    'Lesen',
    'Kunst & Kultur',
    'Gaming',
    'Brettspiele',
    'Sprachen lernen',
  ],
  industries: ['Nachhaltigkeit', 'Fintech', 'Software & SaaS', 'Health', 'Hardware', 'Consulting', 'Handel & Konsum', 'Bildung', 'Medien'],
}

/** A stable id for a seeded tag, so seeding twice finds it again: "seed-interests-grundung". */
export const seedTagId = (category: TagCategory, label: string): string =>
  `seed-${category}-${label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`

/** The questions of the personal profile ("Freundebuch"), all optional, always offered. */
export const QUESTIONS = [
  'origin',
  'freeTime',
  'threeWords',
  'uselessTalent',
  'studentFood',
  'childhoodDream',
  'someday',
  'funFact',
  'motto',
] as const
export type Question = (typeof QUESTIONS)[number]

/** What alumni can be asked for; also a filter. */
export const OPEN_FOR = ['mentoring', 'pitch', 'funding', 'investors', 'tech', 'marketing', 'legal', 'jobs'] as const

/** What members log on a contact. `done` is added when a next step is marked as done. */
export const ENTRY_TYPES = ['mail', 'meeting', 'event', 'note'] as const
export type EntryType = (typeof ENTRY_TYPES)[number] | 'done'

/** The two areas of the teams (concept: Ressort). Team ids from openTeams.ts. */
export const DIVISIONS: Record<string, 'external' | 'internal'> = {
  'ignite-relations': 'external',
  'ignite-marketing': 'external',
  'ignite-hr': 'internal',
  'ignite-finance-legal': 'internal',
  'ignite-infrastructure': 'internal',
}

// ---------------------------------------------------------------------------------------------------------------
// Visibility

/**
 * Who sees a field, from the widest to the narrowest. `public` is only for the base fields and only takes effect with
 * a recorded consent; `hidden` ("Nicht anzeigen") leaves the field to the person and the admins.
 */
export const LEVELS = ['public', 'members', 'leads', 'board', 'hidden'] as const
export type Level = (typeof LEVELS)[number]
const LEVEL_RANK: Record<Level, number> = { public: 0, members: 1, leads: 2, board: 3, hidden: 4 }

/** Fields that may go on the public website once there is consent. */
export const BASE_FIELDS = ['photo', 'headline', 'organizationId', 'ignite', 'igniteRole', 'engagement'] as const
/** Ways to reach someone. */
export const CONTACT_FIELDS = ['email', 'phone', 'linkedin', 'instagram', 'website'] as const
/** Further information inside the network. */
export const EXTRA_FIELDS = ['city', 'about', 'career', 'openFor', 'seeking'] as const
export type VisibilityField = (typeof BASE_FIELDS)[number] | (typeof CONTACT_FIELDS)[number] | (typeof EXTRA_FIELDS)[number]
export const VISIBILITY_FIELDS: readonly VisibilityField[] = [...BASE_FIELDS, ...CONTACT_FIELDS, ...EXTRA_FIELDS]

/** The levels a field can take: the base fields may become public, contact data and extras stay internal. */
export const levelsFor = (field: VisibilityField): readonly Level[] =>
  (BASE_FIELDS as readonly string[]).includes(field) ? LEVELS : LEVELS.filter((level) => level !== 'public')

/** Without a setting a field is visible to every signed-in member, as the concept fixes it for member profiles. */
export const DEFAULT_LEVEL: Level = 'members'

export const levelOf = (vis: Partial<Record<VisibilityField, Level>> | undefined, field: VisibilityField): Level =>
  vis?.[field] ?? DEFAULT_LEVEL

/** The positions of the members area; `alumni` is a former member with a login limited to the Netzwerk. */
export type Position = 'member' | 'teamlead' | 'board' | 'alumni'

export interface Viewer {
  /** Hex id of the `members` document. */
  id: string
  role: 'member' | 'admin'
  position: Position
}

/**
 * How far a viewer sees. Admins see everything, so the database stays tidy (decided 2026-11-24); the board sees
 * "Nur Vorstand", teamleads "Vorstand und Teamleads", members and alumni the rest. The position alone decides, the
 * profile shows no free text that could grant anything.
 */
export function viewerRank(viewer: Pick<Viewer, 'role' | 'position'>): number {
  if (viewer.role === 'admin') return 5
  if (viewer.position === 'board') return LEVEL_RANK.board
  if (viewer.position === 'teamlead') return LEVEL_RANK.leads
  return LEVEL_RANK.members
}

export const mayView = (level: Level, viewer: Pick<Viewer, 'role' | 'position'>): boolean =>
  viewerRank(viewer) >= LEVEL_RANK[level]

/** Active members work in the initiative; alumni with a login only see the Netzwerk and keep their own profile. */
export const isActive = (viewer: Pick<Viewer, 'position'>): boolean => viewer.position !== 'alumni'

// ---------------------------------------------------------------------------------------------------------------
// Parsing

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

/** An https URL on one of `hosts` (or any host without), without credentials; "example.com" gets its scheme. */
function url(value: unknown, hosts: string[] | null): Parsed<string> {
  const raw = text(value, 300)
  if (raw === INVALID || !raw) return raw
  try {
    const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
    const host = parsed.hostname.toLowerCase()
    const allowed = !hosts || hosts.some((name) => host === name || host.endsWith(`.${name}`))
    const plain = !parsed.username && !parsed.password && host.includes('.')
    if (!allowed || !plain) return INVALID
    parsed.protocol = 'https:'
    return parsed.href
  } catch {
    return INVALID
  }
}

/** A LinkedIn profile or company page; "linkedin.com/in/x" without the scheme is accepted too. */
const linkedin = (value: unknown) => url(value, ['linkedin.com'])

/** "@name", "name" or an Instagram link, stored as the profile link. */
function instagram(value: unknown): Parsed<string> {
  const raw = text(value, 300)
  if (raw === INVALID || !raw) return raw
  const handle = raw.replace(/^@/, '')
  if (/^[A-Za-z0-9._]{1,30}$/.test(handle)) return `https://www.instagram.com/${handle}/`
  return url(raw, ['instagram.com'])
}

const website = (value: unknown) => url(value, null)

/** YYYY-MM-DD or ''. */
function day(value: unknown): Parsed<string> {
  const raw = text(value, 10)
  if (raw === INVALID || !raw) return raw
  const date = new Date(`${raw}T00:00:00Z`)
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) && !isNaN(date.getTime()) && date.toISOString().startsWith(raw) ? raw : INVALID
}

/** YYYY-MM or '' ("Dabei seit"). */
function month(value: unknown): Parsed<string> {
  const raw = text(value, 7)
  if (raw === INVALID || !raw) return raw
  return /^(20\d\d)-(0[1-9]|1[0-2])$/.test(raw) ? raw : INVALID
}

function year(value: unknown): Parsed<number | null> {
  if (value === undefined || value === null || value === '') return null
  const number = typeof value === 'string' ? Number(value) : value
  return Number.isInteger(number) && (number as number) >= 2000 && (number as number) <= 2100 ? (number as number) : INVALID
}

function semester(value: unknown): Parsed<number | null> {
  if (value === undefined || value === null || value === '') return null
  const number = typeof value === 'string' ? Number(value) : value
  return Number.isInteger(number) && (number as number) >= 1 && (number as number) <= 30 ? (number as number) : INVALID
}

function subset<T extends string>(value: unknown, allowed: readonly T[]): Parsed<T[]> {
  if (value === undefined) return []
  if (!Array.isArray(value) || !value.every((item) => allowed.includes(item))) return INVALID
  return allowed.filter((item) => value.includes(item))
}

/** Ids of tags, people, organisations or members: short, without spaces, at most `max`, no duplicates. */
function ids(value: unknown, max: number): Parsed<string[]> {
  if (value === undefined) return []
  if (!Array.isArray(value) || value.length > max) return INVALID
  if (!value.every((item) => typeof item === 'string' && /^[\w-]{1,64}$/.test(item))) return INVALID
  return [...new Set(value as string[])]
}

function id(value: unknown): Parsed<string> {
  if (value === undefined || value === null || value === '') return ''
  return typeof value === 'string' && /^[\w-]{1,64}$/.test(value) ? value : INVALID
}

function lines(value: unknown, max: number, each: number): Parsed<string[]> {
  if (value === undefined) return []
  if (!Array.isArray(value) || value.length > max) return INVALID
  const cleaned: string[] = []
  for (const item of value) {
    const line = text(item, each)
    if (line === INVALID) return INVALID
    if (line) cleaned.push(line)
  }
  return cleaned
}

function answers(value: unknown): Parsed<Partial<Record<Question, string>>> {
  if (value === undefined) return {}
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return INVALID
  const result: Partial<Record<Question, string>> = {}
  for (const [key, raw] of Object.entries(value)) {
    if (!QUESTIONS.includes(key as Question)) return INVALID
    const answer = text(raw, 300)
    if (answer === INVALID) return INVALID
    result[key as Question] = answer
  }
  return result
}

function visibility(value: unknown): Parsed<Partial<Record<VisibilityField, Level>>> {
  if (value === undefined) return {}
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return INVALID
  const result: Partial<Record<VisibilityField, Level>> = {}
  for (const [field, level] of Object.entries(value)) {
    if (!VISIBILITY_FIELDS.includes(field as VisibilityField)) return INVALID
    if (!levelsFor(field as VisibilityField).includes(level as Level)) return INVALID
    result[field as VisibilityField] = level as Level
  }
  return result
}

/** Consent to the public website: { note } records it now, null withdraws it. */
function consent(value: unknown): Parsed<{ note: string } | null> {
  if (value === null) return null
  if (typeof value !== 'object' || Array.isArray(value)) return INVALID
  const note = text((value as Record<string, unknown>).note, 300)
  return note === INVALID ? INVALID : { note }
}

/** Everything a person can carry. Which of it a form offers depends on the kind. */
export interface PersonFields {
  firstName: string
  lastName: string
  headline: string
  organizationId: string
  city: string
  tags: string[]
  // Member profile
  team: string
  memberSince: string
  major: string
  minor: string
  semester: number | null
  answers: Partial<Record<Question, string>>
  // Contact
  email: string
  phone: string
  linkedin: string
  instagram: string
  website: string
  // Alumni
  igniteFrom: number | null
  igniteTo: number | null
  igniteRole: string
  engagement: string
  about: string
  career: string[]
  openFor: (typeof OPEN_FOR)[number][]
  seeking: string
  // Relationship to IGNITE
  relations: Relation[]
  source: string
  introducedBy: string
  introducedOn: string
  owners: string[]
  nextStep: string
  nextDue: string
  vis: Partial<Record<VisibilityField, Level>>
  consent: { note: string } | null
}

type Parsers<T> = { [K in keyof T]: (value: unknown) => Parsed<T[K]> }

const PERSON_PARSERS: Parsers<PersonFields> = {
  firstName: (value) => text(value, 60, true),
  lastName: (value) => text(value, 60),
  headline: (value) => text(value, 120),
  organizationId: id,
  city: (value) => text(value, 80),
  tags: (value) => ids(value, 60),
  team: (value) => text(value, 40),
  memberSince: month,
  major: (value) => text(value, 100),
  minor: (value) => text(value, 100),
  semester,
  answers,
  email,
  phone,
  linkedin,
  instagram,
  website,
  igniteFrom: year,
  igniteTo: year,
  igniteRole: (value) => text(value, 120),
  engagement: (value) => text(value, 300),
  about: (value) => text(value, 1000),
  career: (value) => lines(value, 10, 160),
  openFor: (value) => subset(value, OPEN_FOR),
  seeking: (value) => text(value, 300),
  relations: (value) => subset(value, RELATIONS),
  source: (value) => text(value, 500),
  introducedBy: id,
  introducedOn: day,
  owners: (value) => ids(value, 10),
  nextStep: (value) => text(value, 300),
  nextDue: day,
  vis: visibility,
  consent,
}

/** The fields each kind of person has. Members keep team in their account; the CRM fields belong to externals. */
const COMMON = ['firstName', 'lastName', 'headline', 'organizationId', 'city', 'tags', 'email', 'phone', 'linkedin', 'instagram', 'website', 'vis', 'consent'] as const
const MEMBER_ONLY = ['team', 'memberSince', 'major', 'minor', 'semester', 'answers'] as const
const ALUMNI_ONLY = ['igniteFrom', 'igniteTo', 'igniteRole', 'engagement', 'about', 'career', 'openFor', 'seeking', 'major', 'answers'] as const
const EXTERNAL_ONLY = ['relations', 'about', 'source', 'introducedBy', 'introducedOn', 'owners', 'nextStep', 'nextDue'] as const
/** Where someone came from and who looks after them: every kind, so a member can say who brought them in. */
const ORIGIN = ['introducedBy', 'introducedOn'] as const

export const FIELDS_OF: Record<PersonKind, readonly (keyof PersonFields)[]> = {
  member: [...COMMON, ...MEMBER_ONLY, ...ORIGIN],
  alumni: [...COMMON, ...ALUMNI_ONLY, ...ORIGIN],
  external: [...COMMON, ...EXTERNAL_ONLY],
}

/** Fields only active members handle: the CRM side of a contact. Alumni with a login never get them. */
export const CRM_FIELDS: readonly (keyof PersonFields)[] = ['source', 'owners', 'nextStep', 'nextDue']

const fieldsOf = (input: unknown): Record<string, unknown> | null =>
  typeof input === 'object' && input !== null && !Array.isArray(input) ? (input as Record<string, unknown>) : null

/** A change to some fields of a person of `kind`; null when it changes nothing or a field is unknown or invalid. */
export function parsePersonPatch(input: unknown, kind: PersonKind): Partial<PersonFields> | null {
  const raw = fieldsOf(input)
  if (!raw) return null
  const allowed = FIELDS_OF[kind]
  const patch: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (!allowed.includes(key as keyof PersonFields) || value === undefined) return null
    const parsed = PERSON_PARSERS[key as keyof PersonFields](value)
    if (parsed === INVALID) return null
    patch[key] = parsed
  }
  if (!Object.keys(patch).length || !validIgniteTime(patch)) return null
  return patch as Partial<PersonFields>
}

/**
 * A new person added by hand: an external contact or an alumnus without a login. Members and alumni with a login
 * come from their account. An external contact needs `source` ("Woher wir sie kennen"), which documents the
 * legitimate interest of keeping the data (privacy policy); an alumnus needs `listed: true`, the agreement to stand in
 * the network, as the alumni tab asked before.
 */
export function parseNewPerson(input: unknown): { kind: 'external' | 'alumni'; fields: Partial<PersonFields> } | null {
  const raw = fieldsOf(input)
  if (!raw || (raw.kind !== 'external' && raw.kind !== 'alumni')) return null
  const kind = raw.kind
  const { kind: _, listed, ...rest } = raw
  if (kind === 'alumni' && listed !== true) return null
  const fields = parsePersonPatch(rest, kind)
  if (!fields || !fields.firstName) return null
  if (kind === 'external' && !fields.source) return null
  return { kind, fields }
}

/** The store checks this again after a patch, since the other year may only be known there. */
export const validIgniteTime = ({ igniteFrom, igniteTo }: Partial<Pick<PersonFields, 'igniteFrom' | 'igniteTo'>>): boolean =>
  igniteFrom == null || igniteTo == null || igniteTo >= igniteFrom

export interface EntryFields {
  type: (typeof ENTRY_TYPES)[number]
  date: string
  text: string
}

export function parseEntry(input: unknown): EntryFields | null {
  const raw = fieldsOf(input)
  if (!raw || !ENTRY_TYPES.includes(raw.type as EntryFields['type'])) return null
  const date = day(raw.date)
  const body = text(raw.text, 2000, true)
  if (date === INVALID || !date || body === INVALID) return null
  return { type: raw.type as EntryFields['type'], date, text: body }
}

export interface OrgFields {
  name: string
  relations: Relation[]
  website: string
  city: string
  about: string
  /** The cooperation text of a partner: what IGNITE members get from it. */
  partnership: string
  /** Where members use the cooperation, e.g. the partner's page for the IGNITE community. */
  partnershipUrl: string
  partnerSince: number | null
  tags: string[]
}

const ORG_PARSERS: Parsers<OrgFields> = {
  name: (value) => text(value, 120, true),
  relations: (value) => subset(value, RELATIONS),
  website,
  city: (value) => text(value, 80),
  about: (value) => text(value, 1000),
  partnership: (value) => text(value, 2000),
  partnershipUrl: website,
  partnerSince: year,
  tags: (value) => ids(value, 30),
}

/** A whole organisation (`create`) or the changed fields; null when a field is unknown or invalid. */
export function parseOrg(input: unknown, create: boolean): Partial<OrgFields> | null {
  const raw = fieldsOf(input)
  if (!raw) return null
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (!Object.hasOwn(ORG_PARSERS, key) || value === undefined) return null
    const parsed = ORG_PARSERS[key as keyof OrgFields](value)
    if (parsed === INVALID) return null
    result[key] = parsed
  }
  if (create ? !result.name : !Object.keys(result).length) return null
  return result as Partial<OrgFields>
}

/** A new tag: its category and a label of 2 to 40 characters. */
export function parseTag(input: unknown): { category: TagCategory; label: string } | null {
  const raw = fieldsOf(input)
  if (!raw || !TAG_CATEGORIES.includes(raw.category as TagCategory)) return null
  const label = text(raw.label, 40)
  if (label === INVALID || label.length < 2) return null
  return { category: raw.category as TagCategory, label: label.replace(/\s+/g, ' ') }
}

/** Compares labels the way people mean them: "KI", "ki " and "Ki" are one tag. */
export const tagKey = (label: string): string => label.trim().replace(/\s+/g, ' ').toLocaleLowerCase('de')

// ---------------------------------------------------------------------------------------------------------------
// Rights

/** What the rules need to know of a stored person. */
export interface PersonRights {
  kind: PersonKind
  /** Hex member id of an account behind the profile, or null for people added by hand. */
  memberId: string | null
  createdBy: string
}

/**
 * Who changes a person: members and alumni with a login their own profile, admins every profile. Alumni without a
 * login are kept by admins, the board and whoever added them; external contacts by every active member, as the CRM
 * was. Alumni with a login change nothing but their own profile.
 */
export function mayEdit(person: PersonRights, viewer: Viewer): boolean {
  if (viewer.role === 'admin' || person.memberId === viewer.id) return true
  if (!isActive(viewer) || person.memberId) return false
  if (person.kind === 'alumni') return viewer.position === 'board' || person.createdBy === viewer.id
  return true
}

/** Only people added by hand can be deleted, by admins and whoever added them. Accounts end on the admin page. */
export const mayDelete = (person: PersonRights, viewer: Viewer): boolean =>
  !person.memberId && (viewer.role === 'admin' || person.createdBy === viewer.id)

/**
 * Consent to the public website comes from the person. With a login only they give it (admins may withdraw it);
 * for people added by hand an active member records the consent they got, with a note on how.
 */
export const mayRecordConsent = (person: PersonRights, viewer: Viewer, withdraw: boolean): boolean =>
  person.memberId ? person.memberId === viewer.id || (withdraw && viewer.role === 'admin') : mayEdit(person, viewer)

/**
 * The part of a patch the viewer may write. Fields they cannot see stay as they are: the island was sent them empty,
 * so a change from it would overwrite the stored value with nothing. A visibility can only be set for a field the
 * viewer sees. CRM fields are for active members only.
 */
export function allowedPatch(
  patch: Partial<PersonFields>,
  stored: { vis: Partial<Record<VisibilityField, Level>> } & PersonRights,
  viewer: Viewer,
): Partial<PersonFields> {
  const own = stored.memberId === viewer.id
  const sees = (field: VisibilityField) => own || mayView(levelOf(stored.vis, field), viewer)
  const result: Partial<PersonFields> = {}
  for (const [key, value] of Object.entries(patch) as [keyof PersonFields, unknown][]) {
    if (CRM_FIELDS.includes(key) && !isActive(viewer)) continue
    if (VISIBILITY_FIELDS.includes(key as VisibilityField) && !sees(key as VisibilityField)) continue
    if (key === 'vis') {
      const vis = Object.fromEntries(Object.entries(value as object).filter(([field]) => sees(field as VisibilityField)))
      if (Object.keys(vis).length) result.vis = vis
      continue
    }
    ;(result as Record<string, unknown>)[key] = value
  }
  return result
}

/** The field a value belongs to for visibility: both IGNITE years count as one entry "Zeit bei IGNITE". */
export const visibilityFieldOf = (key: keyof PersonFields): VisibilityField | null => {
  if (key === 'igniteFrom' || key === 'igniteTo') return 'ignite'
  return VISIBILITY_FIELDS.includes(key as VisibilityField) ? (key as VisibilityField) : null
}

/**
 * Cuts a person down to what the viewer may see. Every field above the viewer's level is emptied and named in
 * `locked` with its level, so the island can say whom to ask; CRM fields leave for alumni viewers. The person and the
 * admins see everything. Runs on the server, so hidden values never reach the browser.
 */
export function viewFor<T extends Partial<PersonFields> & PersonRights & { vis: Partial<Record<VisibilityField, Level>> }>(
  person: T,
  viewer: Viewer,
): T & { locked: Partial<Record<VisibilityField, Level>> } {
  const own = person.memberId === viewer.id
  const copy = { ...person } as Record<string, unknown>
  const locked: Partial<Record<VisibilityField, Level>> = {}
  for (const key of Object.keys(person) as (keyof PersonFields)[]) {
    const field = visibilityFieldOf(key)
    if (!field || own) continue
    const level = levelOf(person.vis, field)
    if (mayView(level, viewer)) continue
    const value = copy[key]
    if (value !== '' && value !== null && !(Array.isArray(value) && !value.length)) locked[field] = level
    copy[key] = Array.isArray(value) ? [] : typeof value === 'number' || value === null ? null : ''
  }
  if (!isActive(viewer)) for (const key of [...CRM_FIELDS, 'entries']) delete copy[key]
  return { ...(copy as T), locked }
}

/**
 * What the public website may show of a person, for the planned public alumni pages: nothing without consent, and
 * with it only the base fields set to "Öffentlich", plus the name. Contact data and extras never leave.
 */
export function publicView(person: Partial<PersonFields> & { vis: Partial<Record<VisibilityField, Level>>; consentAt: string | null }) {
  if (!person.consentAt) return null
  const shows = (field: VisibilityField) => levelOf(person.vis, field) === 'public'
  return {
    firstName: person.firstName ?? '',
    lastName: person.lastName ?? '',
    photo: shows('photo'),
    headline: shows('headline') ? (person.headline ?? '') : '',
    organizationId: shows('organizationId') ? (person.organizationId ?? '') : '',
    igniteFrom: shows('ignite') ? (person.igniteFrom ?? null) : null,
    igniteTo: shows('ignite') ? (person.igniteTo ?? null) : null,
    igniteRole: shows('igniteRole') ? (person.igniteRole ?? '') : '',
    engagement: shows('engagement') ? (person.engagement ?? '') : '',
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Semester and dates

/** Semesters start on 1 April (summer) and 1 October (winter). How many began after `from` up to `to` (YYYY-MM-DD). */
export function semesterStartsBetween(from: string, to: string): number {
  if (!from || to <= from) return 0
  const [fromYear] = from.split('-').map(Number)
  const [toYear] = to.split('-').map(Number)
  let count = 0
  for (let year = fromYear; year <= toYear; year += 1) {
    for (const start of [`${year}-04-01`, `${year}-10-01`]) if (start > from && start <= to) count += 1
  }
  return count
}

/** The semester today, counted on from the one entered on `setOn` (automatic progression, concept section 3). */
export const currentSemester = (entered: number | null, setOn: string, today: string): number | null =>
  entered === null ? null : entered + semesterStartsBetween(setOn, today)

/** "03/2025" for "2025-03". */
export const monthLabel = (value: string): string => (value ? `${value.slice(5, 7)}/${value.slice(0, 4)}` : '')

/** "24.11.2026" for an ISO date, in Berlin. */
export const dateLabel = (iso: string): string =>
  new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Berlin' }).format(new Date(iso))

/** A contact whose next step is due today or earlier. `today` is YYYY-MM-DD in Berlin. */
export const isDue = (person: Partial<Pick<PersonFields, 'nextStep' | 'nextDue'>>, today: string): boolean =>
  !!person.nextStep && !!person.nextDue && person.nextDue <= today

// ---------------------------------------------------------------------------------------------------------------
// Listing

/** What the overview needs of a person to sort, filter and group. */
export interface ListedPerson {
  id: string
  kind: PersonKind
  firstName: string
  lastName: string
  headline?: string
  city?: string
  team?: string
  position?: Position
  major?: string
  organizationId?: string
  relations?: Relation[]
  tags?: string[]
  openFor?: string[]
  nextStep?: string
  nextDue?: string
}

/** Alphabetical by first name, then last name (concept section 2); no ranking by team or function. */
export const byName = (a: Pick<ListedPerson, 'firstName' | 'lastName'>, b: Pick<ListedPerson, 'firstName' | 'lastName'>): number =>
  a.firstName.localeCompare(b.firstName, 'de', { sensitivity: 'base' }) ||
  a.lastName.localeCompare(b.lastName, 'de', { sensitivity: 'base' })

export const fullName = (person: Pick<ListedPerson, 'firstName' | 'lastName'>): string =>
  [person.firstName, person.lastName].filter(Boolean).join(' ')

export interface PersonFilters {
  query: string
  kinds: string[]
  relations: string[]
  teams: string[]
  positions: string[]
  majors: string[]
  organizations: string[]
  openFor: string[]
  /** Selected tag ids per category. */
  tags: Partial<Record<TagCategory, string[]>>
  dueOnly: boolean
}

export const NO_FILTERS: PersonFilters = {
  query: '',
  kinds: [],
  relations: [],
  teams: [],
  positions: [],
  majors: [],
  organizations: [],
  openFor: [],
  tags: {},
  dueOnly: false,
}

/** True when any filter narrows the list (the search text included). */
export const filtersActive = (filters: PersonFilters): boolean =>
  !!filters.query.trim() ||
  filters.dueOnly ||
  [filters.kinds, filters.relations, filters.teams, filters.positions, filters.majors, filters.organizations, filters.openFor].some(
    (list) => list.length,
  ) ||
  Object.values(filters.tags).some((list) => list?.length)

const anyOf = (selected: string[], values: (string | undefined)[]) =>
  !selected.length || values.some((value) => value !== undefined && selected.includes(value))

/**
 * People matching every filter. Within one filter one match is enough (two teams show both, two tags of a category
 * show who has either, decided 2026-11-24); different filters all have to match. The search looks at name, headline,
 * city, study, organisation and tag names.
 */
export function filterPeople<T extends ListedPerson>(
  people: T[],
  filters: PersonFilters,
  context: { tagLabels: Record<string, string>; orgNames: Record<string, string>; today: string },
): T[] {
  const needle = filters.query.trim().toLocaleLowerCase('de')
  const categories = Object.entries(filters.tags).filter(([, selected]) => selected?.length) as [TagCategory, string[]][]
  return people.filter((person) => {
    if (!anyOf(filters.kinds, [person.kind])) return false
    if (!anyOf(filters.relations, person.relations ?? [])) return false
    if (!anyOf(filters.teams, [person.team])) return false
    if (!anyOf(filters.positions, [person.position])) return false
    if (!anyOf(filters.majors, [person.major])) return false
    if (!anyOf(filters.organizations, [person.organizationId])) return false
    if (!anyOf(filters.openFor, person.openFor ?? [])) return false
    if (!categories.every(([, selected]) => anyOf(selected, person.tags ?? []))) return false
    if (filters.dueOnly && !isDue(person, context.today)) return false
    if (!needle) return true
    const haystack = [
      fullName(person),
      person.headline,
      person.city,
      person.major,
      person.organizationId ? context.orgNames[person.organizationId] : '',
      ...(person.tags ?? []).map((tag) => context.tagLabels[tag]),
    ]
    return haystack.some((value) => value?.toLocaleLowerCase('de').includes(needle))
  })
}

export const GROUPINGS = ['alpha', 'team', 'kind'] as const
export type Grouping = (typeof GROUPINGS)[number]

/**
 * Orders the matches into sections. Grouping only rearranges what the filters let through, it never drops anyone
 * (concept section 2): by team, the board comes first, then the teams in `teamOrder`, then alumni, contacts and
 * whoever has no team; by kind, members, alumni and contacts.
 */
export function groupPeople<T extends ListedPerson>(
  people: T[],
  grouping: Grouping,
  teamOrder: readonly string[],
): { key: string; people: T[] }[] {
  const sorted = [...people].sort(byName)
  if (grouping === 'alpha') return [{ key: 'all', people: sorted }]
  const keyOf = (person: T): string => {
    if (grouping === 'kind') return person.kind
    if (person.kind === 'member') return person.position === 'board' ? 'board' : person.team || 'noTeam'
    return person.kind
  }
  const order = grouping === 'kind' ? [...PERSON_KINDS] : ['board', ...teamOrder, 'noTeam', 'alumni', 'external']
  const groups = new Map<string, T[]>()
  for (const person of sorted) {
    const key = keyOf(person)
    groups.set(key, [...(groups.get(key) ?? []), person])
  }
  const rank = (key: string) => (order.includes(key) ? order.indexOf(key) : order.length)
  return [...groups.entries()].sort(([a], [b]) => rank(a) - rank(b)).map(([key, list]) => ({ key, people: list }))
}

/** The distinct values of a field across people, sorted, for the "Studiengang" filter. */
export const distinctValues = (people: ListedPerson[], pick: (person: ListedPerson) => string | undefined): string[] =>
  [...new Set(people.map(pick).filter((value): value is string => !!value))].sort((a, b) => a.localeCompare(b, 'de'))
