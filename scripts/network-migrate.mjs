/**
 * Moves the former CRM (`crm_contacts`) and alumni tab (`alumni`) into the Netzwerk (`network_people`,
 * `network_orgs`, see src/lib/networkStore.ts), and adds the partner of the former partner tab as an organisation.
 * Needs MONGODB_URI, MONGODB_DB and ENCRYPTION_SECRET, e.g. from a local .env pulled with `vercel env pull`.
 *
 *   node scripts/network-migrate.mjs            # shows what it would do, writes nothing
 *   node scripts/network-migrate.mjs --write    # writes
 *
 * Every sealed field is opened with its old binding (collection, record, field) and sealed again for
 * `network_people`, so the new collection holds no plain text either. People keep their ids, so running it twice
 * skips who is there already. Organisation names of contacts become organisations (one per name). Who created a record
 * or logged an entry was stored by address; that becomes the member id, or stays empty for people who left. A free-text
 * "Zuständig" that names a member becomes "Betreut von", otherwise it is kept as a note in the history.
 * The old collections stay untouched; drop them once the Netzwerk shows everything (db.crm_contacts.drop() etc.).
 */
import { randomUUID } from 'node:crypto'
import { MongoClient } from 'mongodb'
import { config } from 'dotenv'
import { fieldKeys, open, seal } from '../src/lib/fieldCrypto.ts'
import { SEED_TAGS, seedTagId, tagKey } from '../src/lib/network.ts'

config()

for (const key of ['MONGODB_URI', 'MONGODB_DB', 'ENCRYPTION_SECRET']) {
  if (!process.env[key]) {
    console.error(`Missing environment variable: ${key}`)
    process.exit(1)
  }
}

const write = process.argv.includes('--write')
const keys = fieldKeys(process.env.ENCRYPTION_SECRET)
const PEOPLE = 'network_people'
const TTL_MS = 3 * 365 * 24 * 3600 * 1000

/** The partner of the former partner tab (memberArea.partners.items), as an organisation. */
const PARTNERS = [
  {
    name: 'European Mentorship Network',
    relations: ['partner', 'mentor'],
    website: 'https://www.europeanmentorshipnetwork.com/',
    partnership: 'Kostenloses Mentoring mit Mentor:innen aus ganz Europa. Die IGNITE-Community hat dort einen eigenen Bereich.',
    partnershipUrl: 'https://www.europeanmentorshipnetwork.com/',
  },
]

/** Old alumni industries as the seeded industry tags. */
const INDUSTRY_TAGS = {
  sustainability: 'Nachhaltigkeit',
  fintech: 'Fintech',
  software: 'Software & SaaS',
  health: 'Health',
  hardware: 'Hardware',
  consulting: 'Consulting',
}

const unlock = (value, collection, id, field) => (value ? open(keys, value, collection, id, field) : '')
const lock = (value, id, field) => seal(keys, value, PEOPLE, id, field)
const splitName = (name) => {
  const [firstName = '', ...rest] = name.trim().split(/\s+/)
  return { firstName, lastName: rest.join(' ') }
}

const client = new MongoClient(process.env.MONGODB_URI)
try {
  await client.connect()
  const db = client.db(process.env.MONGODB_DB)
  const people = db.collection(PEOPLE)
  const orgs = db.collection('network_orgs')
  const tags = db.collection('network_tags')

  // Members by address and by name, to turn addresses and "Zuständig" texts into member ids.
  const members = await db.collection('members').find({}, { projection: { email: 1, firstName: 1, lastName: 1 } }).toArray()
  const idOfEmail = new Map(members.map((member) => [member.email, member._id.toHexString()]))
  const idOfName = new Map(
    members
      .filter((member) => member.firstName && member.lastName)
      .map((member) => [`${member.firstName} ${member.lastName}`.toLowerCase(), member._id.toHexString()]),
  )
  const memberId = (email) => idOfEmail.get(email) ?? ''

  // The seed tags, so industries can point at them. networkStore seeds the same ids and then marks the pool as seeded.
  const seeded = await db.collection('network_meta').findOne({ _id: 'tagsSeeded' })
  if (!seeded && write) {
    const epoch = new Date(0)
    for (const [category, labels] of Object.entries(SEED_TAGS)) {
      for (const label of labels) {
        await tags.updateOne(
          { _id: seedTagId(category, label) },
          { $setOnInsert: { category, label, key: tagKey(label), createdBy: 'seed', createdAt: epoch, updatedAt: epoch } },
          { upsert: true },
        )
      }
    }
    await db.collection('network_meta').updateOne({ _id: 'tagsSeeded' }, { $setOnInsert: { at: new Date() } }, { upsert: true })
  }

  // Organisations: existing ones by name, new ones collected here.
  const orgByName = new Map((await orgs.find({}, { projection: { name: 1, relations: 1 } }).toArray()).map((org) => [org.name.toLowerCase(), org]))
  const newOrgs = []
  const orgFor = (name, relations, createdBy, at) => {
    const known = orgByName.get(name.toLowerCase())
    if (known) {
      known.relations = [...new Set([...(known.relations ?? []), ...relations])]
      return known._id
    }
    const org = { _id: randomUUID(), name, relations, website: '', city: '', about: '', partnership: '', partnershipUrl: '', partnerSince: null, tags: [], createdBy, createdAt: at, updatedBy: createdBy, updatedAt: at, changedAt: at }
    orgByName.set(name.toLowerCase(), org)
    newOrgs.push(org)
    return org._id
  }
  for (const partner of PARTNERS) {
    if (!orgByName.has(partner.name.toLowerCase())) {
      const now = new Date()
      const org = { _id: randomUUID(), city: '', about: '', partnerSince: null, tags: [], ...partner, createdBy: '', createdAt: now, updatedBy: '', updatedAt: now, changedAt: now }
      orgByName.set(partner.name.toLowerCase(), org)
      newOrgs.push(org)
    }
  }

  const existing = new Set((await people.find({}, { projection: { _id: 1 } }).toArray()).map(({ _id }) => _id))
  const docs = []
  let skipped = 0

  for (const contact of await db.collection('crm_contacts').find().toArray()) {
    const id = contact._id
    if (existing.has(id)) {
      skipped += 1
      continue
    }
    const plain = (field) => unlock(contact[field], 'crm_contacts', id, field)
    const { firstName, lastName } = splitName(plain('name'))
    const createdBy = memberId(contact.createdBy)
    const organization = plain('organization')
    const relations = (contact.flags ?? []).filter((flag) => ['partner', 'sponsor', 'startup', 'investor', 'speaker', 'university'].includes(flag))
    const owner = plain('owner')
    const ownerId = owner ? idOfName.get(owner.toLowerCase()) : undefined
    const entries = (contact.entries ?? []).map((entry) => {
      const entryId = entry.id
      return {
        id: entryId,
        type: entry.type,
        date: entry.date,
        text: lock(unlock(entry.text, 'crm_contacts', id, `entries.${entryId}.text`), id, `entries.${entryId}.text`),
        by: memberId(entry.by),
        at: entry.at,
      }
    })
    if (owner && !ownerId) {
      const entryId = randomUUID()
      entries.push({ id: entryId, type: 'note', date: contact.createdAt.toISOString().slice(0, 10), text: lock(`Zuständig laut altem CRM: ${owner}`, id, `entries.${entryId}.text`), by: '', at: contact.createdAt })
    }
    docs.push({
      _id: id,
      kind: 'external',
      memberId: null,
      firstName: lock(firstName, id, 'firstName'),
      lastName: lock(lastName, id, 'lastName'),
      headline: lock(plain('role'), id, 'headline'),
      organizationId: organization ? orgFor(organization, relations, createdBy, contact.createdAt) : '',
      relations,
      email: lock(plain('email'), id, 'email'),
      emailHash: contact.emailHash ?? null,
      phone: lock(plain('phone'), id, 'phone'),
      linkedin: lock(plain('linkedin'), id, 'linkedin'),
      source: lock(plain('source'), id, 'source'),
      nextStep: lock(plain('nextStep'), id, 'nextStep'),
      nextDue: contact.nextDue ?? '',
      owners: ownerId ? [ownerId] : [],
      tags: [],
      vis: {},
      consent: null,
      entries,
      createdBy,
      createdAt: contact.createdAt,
      updatedBy: memberId(contact.updatedBy),
      updatedAt: contact.updatedAt,
      changedAt: contact.updatedAt,
      expiresAt: new Date(contact.updatedAt.getTime() + TTL_MS),
    })
  }

  for (const person of await db.collection('alumni').find().toArray()) {
    const id = person._id
    if (existing.has(id)) {
      skipped += 1
      continue
    }
    const plain = (field) => unlock(person[field], 'alumni', id, field)
    const { firstName, lastName } = splitName(plain('name'))
    const industry = INDUSTRY_TAGS[person.industry]
    docs.push({
      _id: id,
      kind: 'alumni',
      memberId: null,
      firstName: lock(firstName, id, 'firstName'),
      lastName: lock(lastName, id, 'lastName'),
      headline: lock(plain('now'), id, 'headline'),
      city: lock(plain('city'), id, 'city'),
      about: lock(plain('about'), id, 'about'),
      linkedin: lock(plain('linkedin'), id, 'linkedin'),
      email: lock(plain('email'), id, 'email'),
      emailHash: null,
      igniteFrom: person.igniteFrom ?? null,
      igniteTo: person.igniteTo ?? null,
      openFor: person.help ?? [],
      tags: industry ? [seedTagId('industries', industry)] : [],
      // The email of a profile that took no requests reached only admins and its creator; "Nicht anzeigen" keeps it there.
      vis: { email: person.open ? 'members' : 'hidden' },
      consent: null,
      listedAt: person.consentAt,
      entries: [],
      createdBy: memberId(person.createdBy),
      createdAt: person.createdAt,
      updatedBy: memberId(person.updatedBy),
      updatedAt: person.updatedAt,
      changedAt: person.updatedAt,
    })
  }

  console.log(`People to add: ${docs.length} (${docs.filter((doc) => doc.kind === 'external').length} contacts, ${docs.filter((doc) => doc.kind === 'alumni').length} alumni), already there: ${skipped}`)
  console.log(`Organisations to add: ${newOrgs.length} (${newOrgs.map((org) => org.name).join(', ') || '–'})`)
  if (!write) {
    console.log('Nothing written. Run again with --write.')
  } else {
    if (newOrgs.length) await orgs.insertMany(newOrgs)
    for (const org of orgByName.values()) {
      if (!newOrgs.includes(org)) await orgs.updateOne({ _id: org._id }, { $set: { relations: org.relations, updatedAt: new Date() } })
    }
    if (docs.length) await people.insertMany(docs)
    console.log('Done. The old collections crm_contacts and alumni are still there; drop them once everything shows.')
  }
} finally {
  await client.close()
}
