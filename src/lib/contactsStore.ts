/**
 * MongoDB access for the CRM and the alumni network of the members area. Collections:
 * - `crm_contacts`: partners, sponsors, startups and other contact persons with their logged entries. A TTL index
 *   deletes a contact three years after its last change (privacy policy), so stale data does not pile up.
 * - `alumni`: profiles of former IGNITE members who agreed to be listed (consentAt).
 * Every free-text field about a person is stored sealed (fieldCrypto.ts, bound to collection, record and field);
 * flags, dates, the choice fields and the members' own addresses (createdBy, by) stay plain for queries and rights.
 * Contacts carry a keyed fingerprint of their email address, so a second contact with the same address is refused.
 * Every signed-in member can read and change both; deleting is up to admins and whoever created the record, and only
 * they decide whether a closed alumni profile takes requests (which would show its email to everyone).
 */
import { randomUUID } from 'node:crypto'
import type { MemberRole } from './memberAuth'
import { database } from './members'
import { validIgniteTime, type AlumniFields, type ContactFields, type EntryFields, type EntryType } from './contacts'
import { emailFingerprint, fieldKeys, open, seal, type FieldKeys } from './fieldCrypto'
import { collectionRevision } from './liveUpdates'

const CONTACT_TTL_SECONDS = 3 * 365 * 24 * 3600

interface Entry {
  id: string
  type: EntryType
  date: string
  text: string
  by: string
  at: Date
}

interface ContactDoc extends ContactFields {
  _id: string
  /** emailFingerprint of `email`, or null without one. */
  emailHash: string | null
  entries: Entry[]
  createdBy: string
  createdAt: Date
  updatedBy: string
  updatedAt: Date
}

interface AlumniDoc extends AlumniFields {
  _id: string
  /** When the person's consent was recorded, by `createdBy`. */
  consentAt: Date
  createdBy: string
  createdAt: Date
  updatedBy: string
  updatedAt: Date
}

interface Actor {
  email: string
  role: MemberRole
}

let indexes: Promise<unknown> | null = null

async function collections() {
  const db = await database()
  indexes ??= Promise.all([
    db.collection('crm_contacts').createIndex({ updatedAt: 1 }, { expireAfterSeconds: CONTACT_TTL_SECONDS }),
    db.collection('crm_contacts').createIndex({ emailHash: 1 }),
    db.collection('alumni').createIndex({ updatedAt: -1 }),
  ]).catch((err) => {
    indexes = null
    throw err
  })
  await indexes
  return {
    contacts: db.collection<ContactDoc>('crm_contacts'),
    alumni: db.collection<AlumniDoc>('alumni'),
  }
}

// The fields that describe a person. Everything else is a fixed choice, a date or a member's own address.
const CONTACT_SEALED = [
  'name',
  'organization',
  'role',
  'email',
  'phone',
  'linkedin',
  'owner',
  'source',
  'nextStep',
] as const
const ALUMNI_SEALED = ['name', 'now', 'city', 'about', 'linkedin', 'email'] as const

let keys: FieldKeys | null = null
const cryptoKeys = () => (keys ??= fieldKeys(process.env.ENCRYPTION_SECRET))

function sealFields<T extends object>(record: T, fields: readonly string[], collection: string, id: string): T {
  const copy = { ...record } as Record<string, unknown>
  for (const field of fields) {
    if (field in copy) copy[field] = seal(cryptoKeys(), String(copy[field]), collection, id, field)
  }
  return copy as T
}

function openFields<T extends object>(record: T, fields: readonly string[], collection: string, id: string): T {
  const copy = { ...record } as Record<string, unknown>
  for (const field of fields) copy[field] = open(cryptoKeys(), String(copy[field]), collection, id, field)
  return copy as T
}

const entryField = (entryId: string) => `entries.${entryId}.text`
const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'de')

const mayDelete = (record: { createdBy: string }, actor: Actor) =>
  actor.role === 'admin' || record.createdBy === actor.email

/** What the islands get: plain values, ids as strings, dates as ISO strings, and what the member may delete. */
function contactSummary(doc: ContactDoc, actor: Actor) {
  const { _id, entries, createdAt, updatedAt, emailHash, ...fields } = openFields(
    doc,
    CONTACT_SEALED,
    'crm_contacts',
    doc._id,
  )
  return {
    ...fields,
    id: _id,
    entries: entries
      .map(({ at, ...entry }) => ({
        ...entry,
        text: open(cryptoKeys(), entry.text, 'crm_contacts', _id, entryField(entry.id)),
        at: at.toISOString(),
        mayDelete: entry.by === actor.email || actor.role === 'admin',
      }))
      .sort((a, b) => b.date.localeCompare(a.date) || b.at.localeCompare(a.at)),
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    mayDelete: mayDelete({ createdBy: fields.createdBy }, actor),
  }
}
export type ContactSummary = ReturnType<typeof contactSummary>

/** Who sees a profile's email: everyone while it takes requests, otherwise only admins and its creator. */
const seesEmail = (person: Pick<AlumniDoc, 'open' | 'createdBy'>, actor: Actor) =>
  person.open || mayDelete(person, actor)

function alumniSummary(doc: AlumniDoc, actor: Actor) {
  const { _id, consentAt, createdAt, updatedAt, ...fields } = openFields(doc, ALUMNI_SEALED, 'alumni', doc._id)
  return {
    ...fields,
    email: seesEmail(fields, actor) ? fields.email : '',
    id: _id,
    updatedAt: updatedAt.toISOString(),
    mayDelete: mayDelete({ createdBy: fields.createdBy }, actor),
  }
}
export type AlumniSummary = ReturnType<typeof alumniSummary>

export async function contactsRevision(): Promise<string> {
  const { contacts } = await collections()
  return collectionRevision(contacts)
}

/** The list and the revision it stands for, read first so a change during the read still counts as new. */
export async function contactState(actor: Actor): Promise<{ revision: string; contacts: ContactSummary[] }> {
  const { contacts } = await collections()
  const revision = await contactsRevision()
  const list = await contacts.find().toArray()
  return { revision, contacts: list.map((contact) => contactSummary(contact, actor)).sort(byName) }
}

const emailTaken = async (emailHash: string, id: string) => {
  const { contacts } = await collections()
  return !!(await contacts.findOne({ emailHash, _id: { $ne: id } }, { projection: { _id: 1 } }))
}

/** Returns the id, or 'duplicate' when another contact has the same email address. */
export async function createContact(fields: ContactFields, actor: Actor) {
  const { contacts } = await collections()
  const emailHash = fields.email ? emailFingerprint(cryptoKeys(), fields.email) : null
  if (emailHash && (await emailTaken(emailHash, ''))) return 'duplicate'
  const now = new Date()
  const _id = randomUUID()
  await contacts.insertOne({
    _id,
    ...sealFields(fields, CONTACT_SEALED, 'crm_contacts', _id),
    emailHash,
    entries: [],
    createdBy: actor.email,
    createdAt: now,
    updatedBy: actor.email,
    updatedAt: now,
  })
  return { id: _id }
}

/** Changes the given fields only, so two members editing a contact keep each other's work. */
export async function updateContact(id: string, patch: Partial<ContactFields>, actor: Actor) {
  const { contacts } = await collections()
  const emailHash = patch.email ? emailFingerprint(cryptoKeys(), patch.email) : null
  if (emailHash && (await emailTaken(emailHash, id))) return 'duplicate'
  const { matchedCount } = await contacts.updateOne(
    { _id: id },
    {
      $set: {
        ...sealFields(patch, CONTACT_SEALED, 'crm_contacts', id),
        ...(patch.email !== undefined && { emailHash }),
        updatedBy: actor.email,
        updatedAt: new Date(),
      },
    },
  )
  return matchedCount ? { id } : 'unknown'
}

/** 'deleted', 'unknown' or 'forbidden' (only admins and the creator delete). */
export async function deleteContact(id: string, actor: Actor) {
  const { contacts } = await collections()
  const contact = await contacts.findOne({ _id: id }, { projection: { createdBy: 1 } })
  if (!contact) return 'unknown'
  if (!mayDelete(contact, actor)) return 'forbidden'
  await contacts.deleteOne({ _id: id })
  return 'deleted'
}

/** With `completing`, the sealed next step just read, the update only hits that step and clears it. */
async function pushEntry(id: string, entry: Omit<Entry, 'id' | 'by' | 'at'>, actor: Actor, completing?: string) {
  const { contacts } = await collections()
  const now = new Date()
  const entryId = randomUUID()
  const text = seal(cryptoKeys(), entry.text, 'crm_contacts', id, entryField(entryId))
  const { matchedCount } = await contacts.updateOne(
    { _id: id, ...(completing !== undefined && { nextStep: completing }) },
    {
      $push: { entries: { ...entry, text, id: entryId, by: actor.email, at: now } },
      $set: {
        updatedBy: actor.email,
        updatedAt: now,
        ...(completing !== undefined ? { ...sealFields({ nextStep: '' }, CONTACT_SEALED, 'crm_contacts', id), nextDue: '' } : {}),
      },
    },
  )
  return matchedCount === 1
}

export const addEntry = (id: string, entry: EntryFields, actor: Actor) => pushEntry(id, entry, actor)

/**
 * Logs the next step as done on `day` and clears it. False when the contact is unknown, has no next step or someone
 * completed or changed that step in the meantime, so two clicks never log it twice. Every seal gets a new IV, which
 * makes the stored value unique to this version of the step.
 */
export async function completeNextStep(id: string, day: string, actor: Actor): Promise<boolean> {
  const { contacts } = await collections()
  const contact = await contacts.findOne({ _id: id }, { projection: { nextStep: 1 } })
  const nextStep = contact && open(cryptoKeys(), contact.nextStep, 'crm_contacts', id, 'nextStep')
  if (!nextStep) return false
  return pushEntry(id, { type: 'done', date: day, text: nextStep }, actor, contact.nextStep)
}

/** 'removed', 'unknown' or 'forbidden' (only admins and the author remove an entry). */
export async function removeEntry(id: string, entryId: string, actor: Actor) {
  const { contacts } = await collections()
  const contact = await contacts.findOne({ _id: id, 'entries.id': entryId }, { projection: { 'entries.$': 1 } })
  if (!contact) return 'unknown'
  if (contact.entries[0].by !== actor.email && actor.role !== 'admin') return 'forbidden'
  await contacts.updateOne(
    { _id: id },
    { $pull: { entries: { id: entryId } }, $set: { updatedBy: actor.email, updatedAt: new Date() } },
  )
  return 'removed'
}

export async function alumniRevision(): Promise<string> {
  const { alumni } = await collections()
  return collectionRevision(alumni)
}

/** The list and the revision it stands for, read first so a change during the read still counts as new. */
export async function alumniState(actor: Actor): Promise<{ revision: string; alumni: AlumniSummary[] }> {
  const { alumni } = await collections()
  const revision = await alumniRevision()
  const list = await alumni.find().toArray()
  return { revision, alumni: list.map((person) => alumniSummary(person, actor)).sort(byName) }
}

/** parseAlumni checked the consent. */
export async function createAlumni(fields: AlumniFields, actor: Actor): Promise<void> {
  const { alumni } = await collections()
  const now = new Date()
  const _id = randomUUID()
  await alumni.insertOne({
    _id,
    ...sealFields(fields, ALUMNI_SEALED, 'alumni', _id),
    consentAt: now,
    createdBy: actor.email,
    createdAt: now,
    updatedBy: actor.email,
    updatedAt: now,
  })
}

/** Changes the given fields only: 'saved', 'unknown', or 'invalid' when the IGNITE time would end before it starts. */
export async function updateAlumni(id: string, patch: Partial<AlumniFields>, actor: Actor) {
  const { alumni } = await collections()
  const stored = await alumni.findOne({ _id: id }, { projection: { open: 1, createdBy: 1, igniteFrom: 1, igniteTo: 1 } })
  if (!stored) return 'unknown'
  if (!validIgniteTime({ ...stored, ...patch })) return 'invalid'
  // Only admins and the creator open a closed profile, since that shows its email to everyone. Others were sent the
  // email of a closed profile empty, so a change from them must not touch the stored one.
  const { email, open: takesRequests, ...rest } = patch
  const open = takesRequests !== undefined && mayDelete(stored, actor) ? { open: takesRequests } : {}
  const address = email !== undefined && seesEmail(stored, actor) ? { email } : {}
  const update = { ...rest, ...open, ...address }
  const rightsMatter = 'open' in update || 'email' in update
  // The filter repeats what the rights were checked against, so a change in between makes the update miss.
  const { matchedCount } = await alumni.updateOne(
    { _id: id, ...(rightsMatter && { open: stored.open, createdBy: stored.createdBy }) },
    { $set: { ...sealFields(update, ALUMNI_SEALED, 'alumni', id), updatedBy: actor.email, updatedAt: new Date() } },
  )
  return matchedCount ? 'saved' : 'unknown'
}

/** 'deleted', 'unknown' or 'forbidden' (only admins and the creator delete). */
export async function deleteAlumni(id: string, actor: Actor) {
  const { alumni } = await collections()
  const person = await alumni.findOne({ _id: id }, { projection: { createdBy: 1 } })
  if (!person) return 'unknown'
  if (!mayDelete(person, actor)) return 'forbidden'
  await alumni.deleteOne({ _id: id })
  return 'deleted'
}
