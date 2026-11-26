/**
 * Runs the website on this computer with its own test database, for trying the members area without Vercel access,
 * without a .env file and without installing MongoDB:
 *
 *   npm run dev:local
 *
 * It starts a MongoDB of its own (mongodb-memory-server; the first start downloads it once), keeps its data in
 * `.local-dev/` (ignored by git), seeds test accounts and example data on the first start and then runs `astro dev`
 * against that database. The live database is never touched: the server gets every setting from here, and dotenv does
 * not override what is set already. Mails cannot be sent locally.
 *
 * Test accounts (same password for all, reset on every start): see ACCOUNTS below and the output on start.
 * Delete `.local-dev/` to start over with fresh example data.
 */
import { spawn } from 'node:child_process'
import { randomBytes, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const [major, minor] = process.versions.node.split('.').map(Number)
if (major < 22 || (major === 22 && minor < 18)) {
  console.error(`npm run dev:local needs Node 22.18 or newer (this is ${process.versions.node}), like npm test.`)
  process.exit(1)
}

const { MongoMemoryServer } = await import('mongodb-memory-server')
const { MongoClient } = await import('mongodb')
const { hashPassword, passwordKey } = await import('../src/lib/memberAuth.ts')
const { emailFingerprint, fieldKeys, seal } = await import('../src/lib/fieldCrypto.ts')
const { SEED_TAGS, seedTagId, tagKey } = await import('../src/lib/network.ts')

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const home = join(root, '.local-dev')
const dbPath = join(home, 'db')
mkdirSync(dbPath, { recursive: true })

// One secret per checkout, kept beside the data, so sealed fields and passwords still open after a restart.
const secretFile = join(home, 'encryption-secret.txt')
if (!existsSync(secretFile)) writeFileSync(secretFile, randomBytes(32).toString('hex'))
const secret = readFileSync(secretFile, 'utf8').trim()

const PASSWORD = 'IgniteTest2026'
const ACCOUNTS = [
  { email: 'admin@ignite.local', role: 'admin', position: 'member', firstName: 'Test', lastName: 'Admin', team: 'ignite-infrastructure' },
  { email: 'vorstand@ignite.local', role: 'member', position: 'board', firstName: 'Vera', lastName: 'Vorstand' },
  { email: 'teamlead@ignite.local', role: 'member', position: 'teamlead', firstName: 'Lena', lastName: 'Lead', team: 'ignite-marketing' },
  { email: 'mitglied@ignite.local', role: 'member', position: 'member', firstName: 'Max', lastName: 'Mitglied', team: 'ignite-hr' },
  { email: 'alumni@ignite.local', role: 'member', position: 'alumni', firstName: 'Ali', lastName: 'Alumni', team: 'ignite-relations' },
]

const server = await MongoMemoryServer.create({ instance: { dbPath, storageEngine: 'wiredTiger' } })
const env = {
  ...process.env,
  MONGODB_URI: server.getUri(),
  MONGODB_DB: 'ignite-local',
  ENCRYPTION_SECRET: secret,
  // Placeholders: the mail client refuses to start without a key, and nothing is sent locally.
  RESEND_API_KEY: 're_local_placeholder',
  EMAIL_RECIPIENT_1: 'stud.initiative.ignite@leuphana.de',
  CRON_SECRET: 'local-only',
}

const client = new MongoClient(env.MONGODB_URI)
await client.connect()
const db = client.db(env.MONGODB_DB)
const firstStart = (await db.collection('members').countDocuments()) === 0

// The accounts, with the known password every time, so a changed or locked test login works again after a restart.
const pepper = passwordKey(secret)
const ids = {}
for (const { email, ...account } of ACCOUNTS) {
  const { _id } = await db.collection('members').findOneAndUpdate(
    { email },
    {
      $set: { ...account, passwordHash: await hashPassword(PASSWORD, pepper), passwordSetAt: new Date(), failedLogins: 0 },
      $unset: { lockedUntil: '' },
      $setOnInsert: { email, addedAt: new Date('2025-04-01') },
    },
    { upsert: true, returnDocument: 'after', projection: { _id: 1 } },
  )
  ids[email] = _id.toHexString()
}

if (firstStart) await seedExamples(db, ids)
await client.close()

console.log(`
  Lokaler Mitgliederbereich mit Testdaten (nur auf diesem Rechner)
  Anmelden: http://localhost:4321/mitglieder/login   Passwort für alle: ${PASSWORD}
${ACCOUNTS.map(({ email, role, position }) => `    ${email.padEnd(24)} ${role === 'admin' ? 'Admin' : position}`).join('\n')}
`)

const astro = spawn(process.execPath, [join(root, 'node_modules', 'astro', 'astro.js'), 'dev', ...process.argv.slice(2)], {
  cwd: root,
  env,
  stdio: 'inherit',
})
let stopping = false
const stop = async (code) => {
  if (stopping) return
  stopping = true
  // Keep the data folder, so the next start finds the same database.
  await server.stop({ doCleanup: false }).catch(() => {})
  process.exit(code ?? 0)
}
astro.on('exit', (code) => stop(code))
process.on('SIGINT', () => astro.kill('SIGINT'))
process.on('SIGTERM', () => astro.kill('SIGTERM'))

/** Example people and organisations for the Netzwerk, stored as networkStore.ts stores them (sealed, by member id). */
async function seedExamples(database, memberIds) {
  const keys = fieldKeys(secret)
  const PEOPLE = 'network_people'
  const now = new Date()
  const lock = (id, fields) => Object.fromEntries(Object.entries(fields).map(([field, value]) => [field, seal(keys, value, PEOPLE, id, field)]))
  const tag = (category, label) => seedTagId(category, label)
  const admin = memberIds['admin@ignite.local']

  // The tag pool, marked as seeded like networkStore does.
  const epoch = new Date(0)
  for (const [category, labels] of Object.entries(SEED_TAGS)) {
    for (const label of labels) {
      await database
        .collection('network_tags')
        .updateOne({ _id: tag(category, label) }, { $setOnInsert: { category, label, key: tagKey(label), createdBy: 'seed', createdAt: epoch, updatedAt: epoch } }, { upsert: true })
    }
  }
  await database.collection('network_meta').updateOne({ _id: 'tagsSeeded' }, { $setOnInsert: { at: now } }, { upsert: true })

  const emn = randomUUID()
  const sparkasse = randomUUID()
  const solarwerk = randomUUID()
  const org = (_id, fields) => ({ _id, relations: [], website: '', city: '', about: '', partnership: '', partnershipUrl: '', partnerSince: null, tags: [], createdBy: admin, createdAt: now, updatedBy: admin, updatedAt: now, changedAt: now, ...fields })
  await database.collection('network_orgs').insertMany([
    org(emn, {
      name: 'European Mentorship Network',
      relations: ['partner', 'mentor'],
      website: 'https://www.europeanmentorshipnetwork.com/',
      partnership: 'Kostenloses Mentoring mit Mentor:innen aus ganz Europa. Die IGNITE-Community hat dort einen eigenen Bereich.',
      partnershipUrl: 'https://www.europeanmentorshipnetwork.com/',
      partnerSince: 2025,
    }),
    org(sparkasse, { name: 'Beispiel-Sparkasse', relations: ['sponsor', 'company'], city: 'Lüneburg', tags: [tag('industries', 'Fintech')] }),
    org(solarwerk, { name: 'Solarwerk (Beispiel)', relations: ['startup'], city: 'Hamburg', about: 'Fiktives Startup für die Testdaten.', tags: [tag('industries', 'Nachhaltigkeit')] }),
  ])

  const profile = (email, fields, plain) => {
    const memberId = memberIds[email]
    const _id = `m-${memberId}`
    return {
      _id,
      kind: 'member',
      memberId,
      ...lock(_id, fields),
      answers: Object.fromEntries(Object.entries(plain.answers ?? {}).map(([q, a]) => [q, seal(keys, a, PEOPLE, _id, `answers.${q}`)])),
      tags: plain.tags ?? [],
      memberSince: plain.memberSince ?? '',
      semester: plain.semester ?? null,
      semesterOn: now.toISOString().slice(0, 10),
      vis: {},
      consent: null,
      entries: [],
      createdBy: memberId,
      createdAt: now,
      updatedBy: memberId,
      updatedAt: now,
      changedAt: now,
    }
  }
  const byHand = (kind, fields, plain) => {
    const _id = randomUUID()
    return {
      _id,
      kind,
      memberId: null,
      ...lock(_id, fields),
      emailHash: fields.email ? emailFingerprint(keys, fields.email) : null,
      tags: [],
      relations: [],
      owners: [],
      openFor: [],
      organizationId: '',
      introducedBy: '',
      introducedOn: '',
      nextDue: '',
      vis: {},
      consent: null,
      entries: [],
      createdBy: admin,
      createdAt: now,
      updatedBy: admin,
      updatedAt: now,
      changedAt: now,
      ...(kind === 'external' && { expiresAt: new Date(now.getTime() + 3 * 365 * 24 * 3600 * 1000) }),
      ...(kind === 'alumni' && { listedAt: now }),
      ...plain,
    }
  }

  const lead = memberIds['teamlead@ignite.local']
  await database.collection(PEOPLE).insertMany([
    profile(
      'teamlead@ignite.local',
      { major: 'Kulturwissenschaften', instagram: 'https://www.instagram.com/ignite.lueneburg/' },
      {
        memberSince: '2024-10',
        semester: 5,
        tags: [tag('skills', 'Social Media'), tag('skills', 'Grafikdesign'), tag('interests', 'Marketing & Marken'), tag('hobbies', 'Musik')],
        answers: { origin: 'Hamburg', threeWords: 'neugierig, laut, kreativ', motto: 'Einfach machen.' },
      },
    ),
    profile(
      'mitglied@ignite.local',
      { major: 'BWL', minor: 'Nachhaltigkeit', email: 'mitglied@example.com' },
      { memberSince: '2026-04', semester: 2, tags: [tag('interests', 'Gründung'), tag('interests', 'Nachhaltigkeit'), tag('hobbies', 'Wandern & Natur')], answers: { studentFood: 'Nudeln mit Pesto' } },
    ),
    {
      ...profile('alumni@ignite.local', { headline: 'Gründer', city: 'Hamburg', about: 'Fiktiver Alumnus für die Testdaten.', igniteRole: 'Relations' }, { tags: [tag('interests', 'Gründung')] }),
      kind: 'alumni',
      organizationId: solarwerk,
      igniteFrom: 2021,
      igniteTo: 2024,
      openFor: ['mentoring', 'funding'],
    },
    byHand(
      'external',
      { firstName: 'Eva', lastName: 'Beispiel', headline: 'Leitung Firmenkunden', email: 'eva@example.com', phone: '+49 4131 000000', source: 'Testdaten: Pitch Night, will über Sponsoring sprechen', nextStep: 'Angebot schicken' },
      {
        organizationId: sparkasse,
        relations: ['sponsor'],
        tags: [tag('industries', 'Fintech')],
        vis: { phone: 'board', email: 'leads' },
        owners: [lead],
        introducedBy: `m-${lead}`,
        introducedOn: '2026-03-12',
        nextDue: now.toISOString().slice(0, 10),
      },
    ),
    byHand(
      'external',
      { firstName: 'Mara', lastName: 'Mentorin', headline: 'Community Lead', website: 'https://www.europeanmentorshipnetwork.com/', source: 'Testdaten: Partnerschaft EMN' },
      { organizationId: emn, relations: ['partner', 'mentor'] },
    ),
    byHand(
      'alumni',
      { firstName: 'Cara', lastName: 'Kunz', headline: 'Investorin (fiktiv)', city: 'Berlin', about: 'Alumna ohne eigenen Zugang, für die Testdaten.' },
      { igniteFrom: 2018, igniteTo: 2020, openFor: ['investors', 'pitch'] },
    ),
  ])
}
