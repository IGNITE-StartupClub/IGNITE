/**
 * MongoDB access for the CRM and the alumni network of the members area. Collections:
 * - `crm_contacts`: partners, sponsors, startups and other contact persons with their logged entries. A TTL index
 *   deletes a contact three years after its last change (privacy policy), so stale data does not pile up.
 * - `alumni`: profiles of former IGNITE members who agreed to be listed (consentAt).
 * Every signed-in member can read and change both; deleting is up to admins and whoever created the record.
 */
import { randomUUID } from 'node:crypto'
import type { MemberRole } from './memberAuth'
import { database } from './members'
import type { AlumniFields, ContactFields, EntryFields, EntryType } from './contacts'

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
  indexes ??= db
    .collection('crm_contacts')
    .createIndex({ updatedAt: 1 }, { expireAfterSeconds: CONTACT_TTL_SECONDS })
    .catch((err) => {
      indexes = null
      throw err
    })
  await indexes
  return {
    contacts: db.collection<ContactDoc>('crm_contacts'),
    alumni: db.collection<AlumniDoc>('alumni'),
  }
}

const mayDelete = (record: { createdBy: string }, actor: Actor) =>
  actor.role === 'admin' || record.createdBy === actor.email

/** What the islands get: ids as strings, dates as ISO strings, and whether the signed-in member may delete. */
const contactSummary = ({ _id, entries, createdAt, updatedAt, ...fields }: ContactDoc, actor: Actor) => ({
  ...fields,
  id: _id,
  entries: entries
    .map(({ at, ...entry }) => ({
      ...entry,
      at: at.toISOString(),
      mayDelete: entry.by === actor.email || actor.role === 'admin',
    }))
    .sort((a, b) => b.date.localeCompare(a.date) || b.at.localeCompare(a.at)),
  createdAt: createdAt.toISOString(),
  updatedAt: updatedAt.toISOString(),
  mayDelete: mayDelete({ createdBy: fields.createdBy }, actor),
})
export type ContactSummary = ReturnType<typeof contactSummary>

const alumniSummary = ({ _id, consentAt, createdAt, updatedAt, ...fields }: AlumniDoc, actor: Actor) => ({
  ...fields,
  id: _id,
  updatedAt: updatedAt.toISOString(),
  mayDelete: mayDelete({ createdBy: fields.createdBy }, actor),
})
export type AlumniSummary = ReturnType<typeof alumniSummary>

export async function contactSummaries(actor: Actor): Promise<ContactSummary[]> {
  const { contacts } = await collections()
  const list = await contacts.find({}, { sort: { name: 1 }, collation: { locale: 'de' } }).toArray()
  return list.map((contact) => contactSummary(contact, actor))
}

/** Creates a contact (no `id`) or replaces the fields of one; false when `id` is unknown. Returns the id. */
export async function saveContact(id: string | null, fields: ContactFields, actor: Actor): Promise<string | null> {
  const { contacts } = await collections()
  const now = new Date()
  if (!id) {
    const _id = randomUUID()
    await contacts.insertOne({
      _id,
      ...fields,
      entries: [],
      createdBy: actor.email,
      createdAt: now,
      updatedBy: actor.email,
      updatedAt: now,
    })
    return _id
  }
  const { matchedCount } = await contacts.updateOne(
    { _id: id },
    { $set: { ...fields, updatedBy: actor.email, updatedAt: now } },
  )
  return matchedCount ? id : null
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

async function pushEntry(id: string, entry: Omit<Entry, 'id' | 'by' | 'at'>, actor: Actor, unset = false) {
  const { contacts } = await collections()
  const now = new Date()
  const { matchedCount } = await contacts.updateOne(
    { _id: id },
    {
      $push: { entries: { ...entry, id: randomUUID(), by: actor.email, at: now } },
      $set: { updatedBy: actor.email, updatedAt: now, ...(unset ? { nextStep: '', nextDue: '' } : {}) },
    },
  )
  return matchedCount === 1
}

export const addEntry = (id: string, entry: EntryFields, actor: Actor) => pushEntry(id, entry, actor)

/** Logs the next step as done on `day` and clears it. False when the contact is unknown or has no next step. */
export async function completeNextStep(id: string, day: string, actor: Actor): Promise<boolean> {
  const { contacts } = await collections()
  const contact = await contacts.findOne({ _id: id }, { projection: { nextStep: 1 } })
  if (!contact?.nextStep) return false
  return pushEntry(id, { type: 'done', date: day, text: contact.nextStep }, actor, true)
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

export async function alumniSummaries(actor: Actor): Promise<AlumniSummary[]> {
  const { alumni } = await collections()
  const list = await alumni.find({}, { sort: { name: 1 }, collation: { locale: 'de' } }).toArray()
  return list.map((person) => alumniSummary(person, actor))
}

/** Creates a profile (no `id`) or replaces its fields; null when `id` is unknown. parseAlumni checked the consent. */
export async function saveAlumni(id: string | null, fields: AlumniFields, actor: Actor): Promise<string | null> {
  const { alumni } = await collections()
  const now = new Date()
  if (!id) {
    const _id = randomUUID()
    await alumni.insertOne({
      _id,
      ...fields,
      consentAt: now,
      createdBy: actor.email,
      createdAt: now,
      updatedBy: actor.email,
      updatedAt: now,
    })
    return _id
  }
  const { matchedCount } = await alumni.updateOne(
    { _id: id },
    { $set: { ...fields, updatedBy: actor.email, updatedAt: now } },
  )
  return matchedCount ? id : null
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
