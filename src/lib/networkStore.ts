/**
 * MongoDB access for the Netzwerk of the members area (rules in network.ts). Collections:
 * - `network_people`: one document per person. Members and alumni with a login have the id `m-<member id>` and keep
 *   only their profile here; name, team, position and photo stay in their account (`members`, `member_photos`), so a
 *   member who never opened their profile still shows. People added by hand (external contacts, alumni without a
 *   login) have a UUID. An external contact carries `expiresAt`, three years after its last change, and a TTL index
 *   deletes it then, as the privacy policy says; nobody else expires.
 * - `network_orgs`: companies, startups, sponsors and partners, with the cooperation text of a partner.
 * - `network_tags`: the shared tag pool. The concept's first pool is seeded once by its own ids; members add to it,
 *   admins rename, merge and delete.
 * Every free-text field about a person is stored sealed (fieldCrypto.ts, bound to collection, record and field); ids,
 * choices, dates and visibility levels stay plain for queries and rights. Members are referenced by the hex id of their
 * `members` document, never by address, so no account address reaches the browser.
 */
import { randomUUID } from 'node:crypto'
import { ObjectId } from 'mongodb'
import { berlinDay } from './contacts'
import { emailFingerprint, fieldKeys, open, seal, type FieldKeys } from './fieldCrypto'
import { listRevision, revisionOf } from './liveUpdates'
import { database, displayName, setUpInBackground } from './members'
import { photoPath } from './emailSignature'
import { parseTeam } from './tasks'
import {
  allowedPatch,
  byName,
  currentSemester,
  isActive,
  levelOf,
  mayDelete,
  mayEdit,
  mayRecordConsent,
  mayView,
  parsePersonPatch,
  QUESTIONS,
  SEED_TAGS,
  seedTagId,
  tagKey,
  TAG_CATEGORIES,
  validIgniteTime,
  viewFor,
  type EntryFields,
  type EntryType,
  type Level,
  type OrgFields,
  type PersonFields,
  type PersonKind,
  type Position,
  type Question,
  type TagCategory,
  type Viewer,
  type VisibilityField,
} from './network'

const EXTERNAL_TTL_MS = 3 * 365 * 24 * 3600 * 1000
const PEOPLE = 'network_people'

interface Entry {
  id: string
  type: EntryType
  date: string
  text: string
  /** Member id. */
  by: string
  at: Date
}

/** Everything but the names is optional: a member's profile starts empty. Sealed fields hold `v1:` strings. */
interface PersonDoc {
  _id: string
  kind: PersonKind
  memberId: string | null
  firstName?: string
  lastName?: string
  headline?: string
  organizationId?: string
  city?: string
  tags?: string[]
  memberSince?: string
  major?: string
  minor?: string
  semester?: number | null
  /** The Berlin day the semester was entered, so it counts on by itself. */
  semesterOn?: string
  answers?: Partial<Record<Question, string>>
  email?: string
  emailHash?: string | null
  phone?: string
  linkedin?: string
  instagram?: string
  website?: string
  igniteFrom?: number | null
  igniteTo?: number | null
  igniteRole?: string
  engagement?: string
  about?: string
  /** Sealed JSON list of the career steps. */
  career?: string
  openFor?: string[]
  seeking?: string
  relations?: string[]
  source?: string
  introducedBy?: string
  introducedOn?: string
  owners?: string[]
  nextStep?: string
  nextDue?: string
  entries?: Entry[]
  vis?: Partial<Record<VisibilityField, Level>>
  /** Consent to the public website: when, recorded by which member, and how it was given (sealed). */
  consent?: { at: Date; by: string; note: string } | null
  /** When an alumnus without a login agreed to stand in the network (from the alumni tab). */
  listedAt?: Date
  createdBy: string
  createdAt: Date
  updatedBy: string
  updatedAt: Date
  /** The last saved change to the profile itself ("Zuletzt aktualisiert"); entries and logins leave it alone. */
  changedAt: Date
  expiresAt?: Date
}

interface OrgDoc extends Partial<OrgFields> {
  _id: string
  name: string
  createdBy: string
  createdAt: Date
  updatedBy: string
  updatedAt: Date
  changedAt: Date
}

interface TagDoc {
  _id: string
  category: TagCategory
  label: string
  key: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

interface MemberDoc {
  _id: ObjectId
  email: string
  firstName?: string
  lastName?: string
  signature?: import('./emailSignature').SavedSignature
  team?: string
  position?: Position
  addedAt: Date
}

let indexed = false

async function collections() {
  const db = await database()
  if (!indexed) {
    indexed = true
    setUpInBackground('network', async () => {
      await Promise.all([
        db.collection(PEOPLE).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
        db.collection(PEOPLE).createIndex({ updatedAt: -1 }),
        db.collection(PEOPLE).createIndex({ emailHash: 1 }),
        db.collection('network_orgs').createIndex({ updatedAt: -1 }),
        db.collection('network_tags').createIndex({ updatedAt: -1 }),
        db.collection('network_tags').createIndex({ category: 1, key: 1 }),
      ])
      await seedTags(db)
    })
  }
  return {
    people: db.collection<PersonDoc>(PEOPLE),
    orgs: db.collection<OrgDoc>('network_orgs'),
    tags: db.collection<TagDoc>('network_tags'),
    members: db.collection<MemberDoc>('members'),
    photos: db.collection<{ _id: string; email: string; createdAt: Date }>('member_photos'),
  }
}

/**
 * Seeds the concept's first pool once per database. A marker in `network_meta` records it, so a seed tag that admins
 * deleted or merged away does not come back with the next server instance.
 */
async function seedTags(db: import('mongodb').Db) {
  const { upsertedCount } = await db
    .collection<{ _id: string; at: Date }>('network_meta')
    .updateOne({ _id: 'tagsSeeded' }, { $setOnInsert: { at: new Date() } }, { upsert: true })
  if (!upsertedCount) return
  const epoch = new Date(0)
  await db.collection<TagDoc>('network_tags').bulkWrite(
    TAG_CATEGORIES.flatMap((category) =>
      SEED_TAGS[category].map((label) => ({
        updateOne: {
          filter: { _id: seedTagId(category, label) },
          update: { $setOnInsert: { category, label, key: tagKey(label), createdBy: 'seed', createdAt: epoch, updatedAt: epoch } },
          upsert: true,
        },
      })),
    ),
  )
}

// The fields that describe a person, sealed one by one. `answers` and `career` are handled below.
const SEALED = [
  'firstName',
  'lastName',
  'headline',
  'city',
  'major',
  'minor',
  'email',
  'phone',
  'linkedin',
  'instagram',
  'website',
  'igniteRole',
  'engagement',
  'about',
  'seeking',
  'source',
  'nextStep',
] as const
type SealedField = (typeof SEALED)[number]

let keys: FieldKeys | null = null
const cryptoKeys = () => (keys ??= fieldKeys(process.env.ENCRYPTION_SECRET))
const lock = (value: string, id: string, field: string) => seal(cryptoKeys(), value, PEOPLE, id, field)
const unlock = (value: string | undefined, id: string, field: string) => (value ? open(cryptoKeys(), value, PEOPLE, id, field) : '')
const entryField = (entryId: string) => `entries.${entryId}.text`

/** The stored form of the given plain fields as one $set, each sealed field bound to this person. */
function sealedSet(id: string, fields: Partial<PersonFields>): Record<string, unknown> {
  const set: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(fields)) {
    if ((SEALED as readonly string[]).includes(key)) set[key] = lock(String(value), id, key)
    else if (key === 'answers') {
      for (const [question, answer] of Object.entries(value as object)) set[`answers.${question}`] = lock(String(answer), id, `answers.${question}`)
    } else if (key === 'career') set.career = lock(JSON.stringify(value), id, 'career')
    else if (key === 'vis') {
      for (const [field, level] of Object.entries(value as object)) set[`vis.${field}`] = level
    } else if (key !== 'consent' && key !== 'team') set[key] = value
  }
  return set
}

/** The same fields as nested objects, for an insert: dotted keys only mean paths in an update. */
function nested(set: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(set)) {
    const [head, ...rest] = key.split('.')
    if (!rest.length) result[head] = value
    else result[head] = { ...((result[head] as object) ?? {}), [rest.join('.')]: value }
  }
  return result
}

/** The plain profile of a stored person. */
function openDoc(doc: PersonDoc): Partial<PersonFields> {
  const plain: Record<string, unknown> = {}
  for (const field of SEALED) plain[field] = unlock(doc[field], doc._id, field)
  plain.answers = Object.fromEntries(
    QUESTIONS.flatMap((question) => {
      const answer = unlock(doc.answers?.[question], doc._id, `answers.${question}`)
      return answer ? [[question, answer]] : []
    }),
  )
  plain.career = doc.career ? (JSON.parse(unlock(doc.career, doc._id, 'career')) as string[]) : []
  for (const key of ['organizationId', 'memberSince', 'introducedBy', 'introducedOn', 'nextDue'] as const) plain[key] = doc[key] ?? ''
  for (const key of ['tags', 'openFor', 'relations', 'owners'] as const) plain[key] = doc[key] ?? []
  for (const key of ['semester', 'igniteFrom', 'igniteTo'] as const) plain[key] = doc[key] ?? null
  return plain as Partial<PersonFields>
}

const memberPersonId = (memberId: string) => `m-${memberId}`
const memberIdOf = (personId: string) => (/^m-[0-9a-f]{24}$/.test(personId) ? personId.slice(2) : null)

/** Name of an account as other members see it; the address only serves the fallback. */
function accountNames(member: MemberDoc): { firstName: string; lastName: string } {
  if (member.firstName || member.lastName) return { firstName: member.firstName ?? '', lastName: member.lastName ?? '' }
  const [firstName = '', ...rest] = displayName(member).split(' ')
  return { firstName, lastName: rest.join(' ') }
}

/** A login's stored profile, or the empty one it has before its first save. */
function accountDoc(member: MemberDoc, doc: PersonDoc | undefined): PersonDoc {
  const memberId = member._id.toHexString()
  return (
    doc ?? {
      _id: memberPersonId(memberId),
      kind: 'member',
      memberId,
      createdBy: memberId,
      createdAt: member.addedAt,
      updatedBy: memberId,
      updatedAt: member.addedAt,
      changedAt: member.addedAt,
    }
  )
}

const kindOfAccount = (member: MemberDoc): PersonKind => (member.position === 'alumni' ? 'alumni' : 'member')

/** The viewer's level written as rights for the island: which actions to offer. The server checks again. */
function personSummary(doc: PersonDoc, viewer: Viewer, account: MemberDoc | null, photoId: string | undefined, today: string) {
  const plain = openDoc(doc)
  const kind = account ? kindOfAccount(account) : doc.kind
  const rights = { kind, memberId: doc.memberId, createdBy: doc.createdBy }
  const names = account ? accountNames(account) : { firstName: plain.firstName ?? '', lastName: plain.lastName ?? '' }
  const own = doc.memberId === viewer.id
  const showsPhoto = own || mayView(levelOf(doc.vis, 'photo'), viewer)
  const seen = viewFor(
    {
      ...plain,
      ...names,
      ...rights,
      vis: doc.vis ?? {},
      entries: (doc.entries ?? [])
        .map(({ at, ...entry }) => ({
          ...entry,
          text: unlock(entry.text, doc._id, entryField(entry.id)),
          at: at.toISOString(),
          mayDelete: entry.by === viewer.id || viewer.role === 'admin',
        }))
        .sort((a, b) => b.date.localeCompare(a.date) || b.at.localeCompare(a.at)),
    },
    viewer,
  )
  return {
    ...seen,
    id: doc._id,
    account: !!account,
    self: own,
    team: account?.team ?? '',
    position: account ? (account.position ?? 'member') : undefined,
    photo: account && photoId && showsPhoto ? photoPath(photoId) : '',
    // Shown as "Dabei seit": the month the member entered, else the month they were added to the members area.
    memberSince: plain.memberSince || (account && kind === 'member' ? account.addedAt.toISOString().slice(0, 7) : ''),
    semester: currentSemester(plain.semester ?? null, doc.semesterOn ?? today, today),
    vis: own || mayEdit(rights, viewer) ? (doc.vis ?? {}) : {},
    consent: doc.consent ? { at: doc.consent.at.toISOString(), by: doc.consent.by, note: own || mayEdit(rights, viewer) ? unlock(doc.consent.note, doc._id, 'consent.note') : '' } : null,
    createdBy: doc.createdBy,
    createdAt: doc.createdAt.toISOString(),
    changedAt: doc.changedAt.toISOString(),
    mayEdit: mayEdit(rights, viewer),
    mayDelete: mayDelete(rights, viewer),
    mayConsent: mayRecordConsent(rights, viewer, false),
  }
}
export type PersonSummary = ReturnType<typeof personSummary>

const orgSummary = (doc: OrgDoc, viewer: Viewer) => ({
  id: doc._id,
  name: doc.name,
  relations: doc.relations ?? [],
  website: doc.website ?? '',
  city: doc.city ?? '',
  about: doc.about ?? '',
  partnership: doc.partnership ?? '',
  partnershipUrl: doc.partnershipUrl ?? '',
  partnerSince: doc.partnerSince ?? null,
  tags: doc.tags ?? [],
  createdBy: doc.createdBy,
  changedAt: doc.changedAt.toISOString(),
  mayEdit: isActive(viewer),
  mayDelete: viewer.role === 'admin' || doc.createdBy === viewer.id,
})
export type OrgSummary = ReturnType<typeof orgSummary>

/** The revision of the whole Netzwerk: people, organisations and tags, one part each. */
const joinRevisions = (...parts: string[]) => parts.join('|')

export async function networkRevision(): Promise<string> {
  const { people, orgs, tags, members } = await collections()
  const part = async (collection: import('mongodb').Collection<any>) => {
    const [count, [latest]] = await Promise.all([
      collection.estimatedDocumentCount(),
      collection.find({}, { sort: { updatedAt: -1 }, limit: 1, projection: { _id: 0, updatedAt: 1 } }).toArray(),
    ])
    return revisionOf(count, latest?.updatedAt)
  }
  // Members come and go on the admin page; their count is enough to show a new or removed account.
  return joinRevisions(await part(people), await part(orgs), await part(tags), String(await members.estimatedDocumentCount()))
}

/** Everything the Netzwerk page shows, cut to what this viewer may see, and its revision. */
export async function networkState(viewer: Viewer) {
  const { people, orgs, tags, members, photos } = await collections()
  const [docs, orgDocs, tagDocs, accounts, photoList] = await Promise.all([
    people.find().toArray(),
    orgs.find().toArray(),
    tags.find().toArray(),
    members.find({}, { projection: { email: 1, firstName: 1, lastName: 1, signature: 1, team: 1, position: 1, addedAt: 1 } }).toArray(),
    photos.find({}, { projection: { _id: 1, email: 1 }, sort: { createdAt: 1 } }).toArray(),
  ])
  const today = berlinDay(Date.now())
  // Sorted oldest first, so the newest photo of an address wins, as in photoIdOf.
  const photoIds = new Map(photoList.map(({ _id, email }) => [email, _id]))
  const byId = new Map(docs.map((doc) => [doc._id, doc]))
  const accountIds = new Set(accounts.map((member) => memberPersonId(member._id.toHexString())))
  const list = [
    ...accounts.map((member) =>
      personSummary(accountDoc(member, byId.get(memberPersonId(member._id.toHexString()))), viewer, member, photoIds.get(member.email), today),
    ),
    // Profiles of removed accounts stay out; people added by hand come as they are.
    ...docs.filter((doc) => !doc.memberId && !accountIds.has(doc._id)).map((doc) => personSummary(doc, viewer, null, undefined, today)),
  ].sort(byName)
  return {
    revision: joinRevisions(listRevision(docs), listRevision(orgDocs), listRevision(tagDocs), String(accounts.length)),
    people: list,
    orgs: orgDocs.map((doc) => orgSummary(doc, viewer)).sort((a, b) => a.name.localeCompare(b.name, 'de')),
    tags: tagDocs
      .map(({ _id, category, label }) => ({ id: _id, category, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'de')),
  }
}
export type NetworkState = Awaited<ReturnType<typeof networkState>>

/** The stored person behind an id, the empty profile of an account without one, or null. */
async function findPerson(id: string): Promise<{ doc: PersonDoc; account: MemberDoc | null } | null> {
  const { people, members } = await collections()
  const memberId = memberIdOf(id)
  const [doc, account] = await Promise.all([
    people.findOne({ _id: id }),
    memberId ? members.findOne({ _id: new ObjectId(memberId) }) : null,
  ])
  if (memberId) return account ? { doc: accountDoc(account, doc ?? undefined), account } : null
  return doc ? { doc, account: null } : null
}

const emailTaken = async (emailHash: string, id: string) => {
  const { people } = await collections()
  return !!(await people.findOne({ emailHash, _id: { $ne: id } }, { projection: { _id: 1 } }))
}

/** Checks that the ids in a change point to something that exists, so no profile links into nowhere. */
async function knownReferences(fields: Partial<PersonFields>, selfId: string): Promise<boolean> {
  const { tags, orgs, members, people } = await collections()
  const checks: Promise<boolean>[] = []
  if (fields.tags?.length) checks.push(tags.countDocuments({ _id: { $in: fields.tags } }).then((n) => n === fields.tags!.length))
  if (fields.organizationId) checks.push(orgs.countDocuments({ _id: fields.organizationId }).then((n) => n === 1))
  if (fields.owners?.length) {
    const ids = fields.owners.filter((owner) => /^[0-9a-f]{24}$/.test(owner))
    if (ids.length !== fields.owners.length) return false
    checks.push(members.countDocuments({ _id: { $in: ids.map((owner) => new ObjectId(owner)) }, position: { $ne: 'alumni' } }).then((n) => n === ids.length))
  }
  if (fields.introducedBy) {
    if (fields.introducedBy === selfId) return false
    const memberId = memberIdOf(fields.introducedBy)
    checks.push(
      memberId
        ? members.countDocuments({ _id: new ObjectId(memberId) }).then((n) => n === 1)
        : people.countDocuments({ _id: fields.introducedBy }).then((n) => n === 1),
    )
  }
  return (await Promise.all(checks)).every(Boolean)
}

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)

type SaveResult = { code: 'saved' | 'unchanged'; id: string } | 'invalid' | 'unknown' | 'forbidden' | 'duplicate'

/**
 * Changes the given fields of a person. `raw` is checked against the person's kind here, because only the store
 * knows it. Fields the viewer may not see or write drop out (allowedPatch); of the rest only real changes are written,
 * so saving without a change leaves "Zuletzt aktualisiert" alone. A member's names and team go to their account.
 */
export async function savePerson(id: string, raw: unknown, viewer: Viewer): Promise<SaveResult> {
  const found = await findPerson(id)
  if (!found) return 'unknown'
  const { doc, account } = found
  const kind = account ? kindOfAccount(account) : doc.kind
  const rights = { kind, memberId: doc.memberId, createdBy: doc.createdBy }
  if (!mayEdit(rights, viewer)) return 'forbidden'
  const parsed = parsePersonPatch(raw, kind)
  if (!parsed) return 'invalid'
  const patch = allowedPatch(parsed, { ...rights, vis: doc.vis ?? {} }, viewer)
  if ('consent' in patch && !mayRecordConsent(rights, viewer, patch.consent === null)) delete patch.consent
  if (!(await knownReferences(patch, doc._id))) return 'invalid'
  if (patch.team !== undefined && (!account || account.position === 'board' || account.position === 'alumni' || parseTeam(patch.team) === null)) return 'invalid'

  // Only what differs from the stored profile.
  const stored = { ...openDoc(doc), ...(account ? accountNames(account) : {}), team: account?.team ?? '' }
  const changes: Partial<PersonFields> = {}
  for (const [key, value] of Object.entries(patch) as [keyof PersonFields, unknown][]) {
    if (key === 'vis') {
      const vis = Object.fromEntries(Object.entries(value as object).filter(([field, level]) => levelOf(doc.vis, field as VisibilityField) !== level))
      if (Object.keys(vis).length) changes.vis = vis
    } else if (key === 'answers') {
      const answers = Object.fromEntries(Object.entries(value as object).filter(([question, answer]) => !same(stored.answers?.[question as Question] ?? '', answer)))
      if (Object.keys(answers).length) changes.answers = answers
    } else if (key === 'consent') {
      if (!!value !== !!doc.consent || (value && (value as { note: string }).note !== unlock(doc.consent?.note, doc._id, 'consent.note'))) changes.consent = value as PersonFields['consent']
    } else if (!same(stored[key], value)) {
      ;(changes as Record<string, unknown>)[key] = value
    }
  }
  if (!validIgniteTime({ igniteFrom: changes.igniteFrom ?? stored.igniteFrom, igniteTo: changes.igniteTo ?? stored.igniteTo })) return 'invalid'
  if (!Object.keys(changes).length) return { code: 'unchanged', id: doc._id }

  const emailHash = changes.email ? emailFingerprint(cryptoKeys(), changes.email) : null
  if (emailHash && (await emailTaken(emailHash, doc._id))) return 'duplicate'

  const { people, members } = await collections()
  const now = new Date()
  const { firstName, lastName, team, ...profile } = changes
  if (account) {
    const names = { ...(firstName !== undefined && { firstName }), ...(lastName !== undefined && { lastName }) }
    if (Object.keys(names).length) await members.updateOne({ _id: account._id }, { $set: names })
    if (team !== undefined) await members.updateOne({ _id: account._id, position: { $nin: ['board', 'alumni'] } }, team ? { $set: { team } } : { $unset: { team: '' } })
  } else {
    Object.assign(profile, { ...(firstName !== undefined && { firstName }), ...(lastName !== undefined && { lastName }) })
  }
  const set: Record<string, unknown> = {
    ...sealedSet(doc._id, profile),
    ...(profile.email !== undefined && { emailHash }),
    ...(profile.semester !== undefined && { semesterOn: berlinDay(now.getTime()) }),
    ...(profile.consent !== undefined &&
      (profile.consent ? { consent: { at: now, by: viewer.id, note: lock(profile.consent.note, doc._id, 'consent.note') } } : { consent: null })),
    ...(kind === 'external' && { expiresAt: new Date(now.getTime() + EXTERNAL_TTL_MS) }),
    updatedBy: viewer.id,
    updatedAt: now,
    changedAt: now,
  }
  await people.updateOne(
    { _id: doc._id },
    {
      $set: set,
      $setOnInsert: { kind, memberId: doc.memberId, createdBy: doc.createdBy, createdAt: doc.createdAt },
    },
    { upsert: !!account },
  )
  return { code: 'saved', id: doc._id }
}

/** Adds an external contact or an alumnus without a login; parseNewPerson checked the fields. Active members only. */
export async function createPerson(kind: 'external' | 'alumni', fields: Partial<PersonFields>, viewer: Viewer): Promise<SaveResult> {
  if (!isActive(viewer)) return 'forbidden'
  const _id = randomUUID()
  const { consent, ...rest } = fields
  if (!(await knownReferences(rest, _id))) return 'invalid'
  const emailHash = rest.email ? emailFingerprint(cryptoKeys(), rest.email) : null
  if (emailHash && (await emailTaken(emailHash, ''))) return 'duplicate'
  const { people } = await collections()
  const now = new Date()
  await people.insertOne({
    _id,
    kind,
    memberId: null,
    vis: {},
    ...nested(sealedSet(_id, rest)),
    emailHash,
    ...(rest.semester != null && { semesterOn: berlinDay(now.getTime()) }),
    consent: consent ? { at: now, by: viewer.id, note: lock(consent.note, _id, 'consent.note') } : null,
    ...(kind === 'alumni' && { listedAt: now }),
    entries: [],
    createdBy: viewer.id,
    createdAt: now,
    updatedBy: viewer.id,
    updatedAt: now,
    changedAt: now,
    ...(kind === 'external' && { expiresAt: new Date(now.getTime() + EXTERNAL_TTL_MS) }),
  } as PersonDoc)
  return { code: 'saved', id: _id }
}

/** 'deleted', 'unknown' or 'forbidden': only people added by hand, by admins and whoever added them. */
export async function deletePerson(id: string, viewer: Viewer) {
  const { people } = await collections()
  const doc = await people.findOne({ _id: id }, { projection: { kind: 1, memberId: 1, createdBy: 1 } })
  if (!doc) return 'unknown'
  if (!mayDelete(doc, viewer)) return 'forbidden'
  await people.deleteOne({ _id: id })
  // Nobody keeps pointing at them as the one who brought someone in.
  await people.updateMany({ introducedBy: id }, { $set: { introducedBy: '', updatedAt: new Date() } })
  return 'deleted'
}

/** Logs a contact (mail, meeting, event, note) on an external contact or alumnus; active members only. */
async function pushEntry(id: string, entry: Omit<Entry, 'id' | 'by' | 'at'>, viewer: Viewer, completing?: string) {
  if (!isActive(viewer) || memberIdOf(id)) return false
  const { people } = await collections()
  const now = new Date()
  const entryId = randomUUID()
  const { matchedCount } = await people.updateOne(
    { _id: id, memberId: null, ...(completing !== undefined && { nextStep: completing }) },
    {
      $push: { entries: { ...entry, text: lock(entry.text, id, entryField(entryId)), id: entryId, by: viewer.id, at: now } },
      $set: {
        updatedBy: viewer.id,
        updatedAt: now,
        ...(completing !== undefined && { nextStep: lock('', id, 'nextStep'), nextDue: '' }),
      },
    },
  )
  // A logged contact keeps an external contact as long as a change would (privacy policy: three years after the last).
  if (matchedCount) await people.updateOne({ _id: id, kind: 'external' }, { $set: { expiresAt: new Date(now.getTime() + EXTERNAL_TTL_MS) } })
  return matchedCount === 1
}

export const addEntry = (id: string, entry: EntryFields, viewer: Viewer) => pushEntry(id, entry, viewer)

/** Logs the next step as done on `day` and clears it; false when it was done or changed in the meantime. */
export async function completeNextStep(id: string, day: string, viewer: Viewer): Promise<boolean> {
  const { people } = await collections()
  const doc = await people.findOne({ _id: id }, { projection: { nextStep: 1 } })
  const nextStep = doc && unlock(doc.nextStep, id, 'nextStep')
  if (!nextStep) return false
  return pushEntry(id, { type: 'done', date: day, text: nextStep }, viewer, doc.nextStep)
}

/** 'removed', 'unknown' or 'forbidden' (only admins and the author remove an entry). */
export async function removeEntry(id: string, entryId: string, viewer: Viewer) {
  const { people } = await collections()
  const doc = await people.findOne({ _id: id, 'entries.id': entryId }, { projection: { 'entries.$': 1 } })
  if (!doc?.entries?.[0]) return 'unknown'
  if (doc.entries[0].by !== viewer.id && viewer.role !== 'admin') return 'forbidden'
  await people.updateOne({ _id: id }, { $pull: { entries: { id: entryId } }, $set: { updatedBy: viewer.id, updatedAt: new Date() } })
  return 'removed'
}

// ---------------------------------------------------------------------------------------------------------------
// Organisations

export async function saveOrg(id: string | null, fields: Partial<OrgFields>, viewer: Viewer) {
  if (!isActive(viewer)) return 'forbidden'
  const { orgs, tags } = await collections()
  if (fields.tags?.length && (await tags.countDocuments({ _id: { $in: fields.tags } })) !== fields.tags.length) return 'invalid'
  const now = new Date()
  if (!id) {
    const _id = randomUUID()
    await orgs.insertOne({ _id, ...(fields as OrgFields), createdBy: viewer.id, createdAt: now, updatedBy: viewer.id, updatedAt: now, changedAt: now })
    return { id: _id }
  }
  const { matchedCount } = await orgs.updateOne({ _id: id }, { $set: { ...fields, updatedBy: viewer.id, updatedAt: now, changedAt: now } })
  return matchedCount ? { id } : 'unknown'
}

/** Admins and whoever added it; its people stay and lose the link. */
export async function deleteOrg(id: string, viewer: Viewer) {
  const { orgs, people } = await collections()
  const org = await orgs.findOne({ _id: id }, { projection: { createdBy: 1 } })
  if (!org) return 'unknown'
  if (viewer.role !== 'admin' && org.createdBy !== viewer.id) return 'forbidden'
  await orgs.deleteOne({ _id: id })
  await people.updateMany({ organizationId: id }, { $set: { organizationId: '', updatedAt: new Date() } })
  return 'deleted'
}

// ---------------------------------------------------------------------------------------------------------------
// Tags

/** Adds a tag to the pool, or returns the one with the same name in that category. Every signed-in person may. */
export async function createTag(category: TagCategory, label: string, viewer: Viewer): Promise<{ id: string }> {
  const { tags } = await collections()
  const key = tagKey(label)
  const now = new Date()
  const _id = randomUUID()
  const found = await tags.findOneAndUpdate(
    { category, key },
    { $setOnInsert: { _id, category, label, key, createdBy: viewer.id, createdAt: now, updatedAt: now } },
    { upsert: true, returnDocument: 'after', projection: { _id: 1 } },
  )
  return { id: found!._id }
}

/** Admins only: renames a tag; 'duplicate' when its category has that name already (merge them instead). */
export async function renameTag(id: string, label: string, viewer: Viewer) {
  if (viewer.role !== 'admin') return 'forbidden'
  const { tags } = await collections()
  const tag = await tags.findOne({ _id: id })
  if (!tag) return 'unknown'
  if (await tags.findOne({ category: tag.category, key: tagKey(label), _id: { $ne: id } })) return 'duplicate'
  await tags.updateOne({ _id: id }, { $set: { label, key: tagKey(label), updatedAt: new Date() } })
  return 'saved'
}

/**
 * Admins only: moves everyone from `from` to `into` and deletes `from`, for doubles like "KI" and "AI". Two updates,
 * because MongoDB refuses $addToSet and $pull on one field in one update.
 */
export async function mergeTag(from: string, into: string, viewer: Viewer) {
  if (viewer.role !== 'admin') return 'forbidden'
  if (from === into) return 'invalid'
  const { tags, people, orgs } = await collections()
  if ((await tags.countDocuments({ _id: { $in: [from, into] } })) !== 2) return 'unknown'
  const now = new Date()
  for (const collection of [people, orgs] as unknown as import('mongodb').Collection<{ tags?: string[]; updatedAt: Date }>[]) {
    await collection.updateMany({ tags: from }, { $addToSet: { tags: into }, $set: { updatedAt: now } })
    await collection.updateMany({ tags: from }, { $pull: { tags: from } })
  }
  await tags.deleteOne({ _id: from })
  await tags.updateOne({ _id: into }, { $set: { updatedAt: now } })
  return 'merged'
}

/** Admins only: removes a tag from the pool and from everyone who had it. */
export async function deleteTag(id: string, viewer: Viewer) {
  if (viewer.role !== 'admin') return 'forbidden'
  const { tags, people, orgs } = await collections()
  const { deletedCount } = await tags.deleteOne({ _id: id })
  if (!deletedCount) return 'unknown'
  const now = new Date()
  await people.updateMany({ tags: id }, { $pull: { tags: id }, $set: { updatedAt: now } })
  await orgs.updateMany({ tags: id }, { $pull: { tags: id }, $set: { updatedAt: now } })
  return 'deleted'
}

// ---------------------------------------------------------------------------------------------------------------
// Accounts

/**
 * A member became an alumnus (admin page): their profile keeps everything and gets the IGNITE years where they are
 * still empty, the start from "Dabei seit", the end this year. Names, photo and login stay in the account.
 */
export async function becameAlumni(memberId: string, actorId: string): Promise<void> {
  const { people, members } = await collections()
  const account = await members.findOne({ _id: new ObjectId(memberId) }, { projection: { addedAt: 1 } })
  if (!account) return
  const id = memberPersonId(memberId)
  const doc = await people.findOne({ _id: id }, { projection: { memberSince: 1, igniteFrom: 1, igniteTo: 1 } })
  const now = new Date()
  const since = doc?.memberSince || account.addedAt.toISOString().slice(0, 7)
  await people.updateOne(
    { _id: id },
    {
      $set: {
        kind: 'alumni',
        ...(doc?.igniteFrom == null && { igniteFrom: Number(since.slice(0, 4)) }),
        ...(doc?.igniteTo == null && { igniteTo: Number(berlinDay(now.getTime()).slice(0, 4)) }),
        updatedBy: actorId,
        updatedAt: now,
      },
      $setOnInsert: { memberId, createdBy: memberId, createdAt: account.addedAt, changedAt: now },
    },
    { upsert: true },
  )
}

/** A member was removed: their profile goes with the account, and nobody points at it any more. */
export async function forgetAccount(memberId: string): Promise<void> {
  const { people } = await collections()
  const id = memberPersonId(memberId)
  const now = new Date()
  await Promise.all([
    people.deleteOne({ _id: id }),
    people.updateMany({ introducedBy: id }, { $set: { introducedBy: '', updatedAt: now } }),
    people.updateMany({ owners: memberId }, { $pull: { owners: memberId }, $set: { updatedAt: now } }),
  ])
}

/** For the header search: name and a short line per person and organisation, nothing else. */
export async function networkSearchSources(viewer: Viewer) {
  const { people, orgs } = await networkState(viewer)
  const orgNames = new Map(orgs.map((org) => [org.id, org.name]))
  return {
    people: people.map((person) => ({
      id: person.id,
      kind: person.kind,
      name: [person.firstName, person.lastName].filter(Boolean).join(' '),
      line: [person.headline, person.organizationId ? orgNames.get(person.organizationId) : '', person.city].filter(Boolean).join(' · '),
      team: person.team,
      photo: person.photo,
    })),
    orgs: orgs.map((org) => ({ id: org.id, name: org.name, city: org.city })),
  }
}
