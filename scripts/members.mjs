/**
 * Maintains the members of the members area (MongoDB collection `members`, see src/lib/members.ts) from the command
 * line. Day to day, admins use the admin page (/mitglieder/verwaltung); this script sets up the first admin and helps
 * when nobody can sign in. Needs MONGODB_URI and MONGODB_DB, e.g. from a local .env pulled with `vercel env pull`.
 *
 *   node scripts/members.mjs list
 *   node scripts/members.mjs add max@leuphana.de [weitere@adressen.de ...] [--admin]
 *   node scripts/members.mjs role max@leuphana.de admin|member
 *   node scripts/members.mjs remove max@leuphana.de [...]
 *
 * `add` sends no invitation: the member requests a code on the login page ("Neu im Team?" → "Code anfordern").
 * `remove` also ends the open sessions and codes of that address.
 */

import { MongoClient } from 'mongodb'
import { config } from 'dotenv'

config()

for (const key of ['MONGODB_URI', 'MONGODB_DB']) {
  if (!process.env[key]) {
    console.error(`Missing environment variable: ${key}`)
    process.exit(1)
  }
}

const [command, ...rest] = process.argv.slice(2)
const asAdmin = rest.includes('--admin')
const args = rest.filter((arg) => arg !== '--admin')
const usage = 'Usage: node scripts/members.mjs list | add <email>... [--admin] | role <email> admin|member | remove <email>...'

const roleArg = command === 'role' ? args.pop() : null
const emails = args.map((arg) => arg.trim().toLowerCase())
const valid =
  ['list', 'add', 'remove', 'role'].includes(command) &&
  (command === 'list' || emails.length > 0) &&
  (command !== 'role' || (emails.length === 1 && ['admin', 'member'].includes(roleArg)))
if (!valid) {
  console.error(usage)
  process.exit(1)
}
const invalid = emails.filter((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
if (invalid.length > 0) {
  console.error(`Not an email address: ${invalid.join(', ')}`)
  process.exit(1)
}

const client = new MongoClient(process.env.MONGODB_URI)
try {
  await client.connect()
  const db = client.db(process.env.MONGODB_DB)
  const members = db.collection('members')

  if (command === 'list') {
    const all = await members.find({}, { sort: { email: 1 } }).toArray()
    for (const { email, role, addedAt, passwordHash } of all) {
      console.log(`${email}\t${role ?? 'member'}\t${passwordHash ? 'password set' : 'no password'}\t${addedAt.toISOString().slice(0, 10)}`)
    }
    console.log(`${all.length} members`)
  }

  if (command === 'add') {
    await members.createIndex({ email: 1 }, { unique: true })
    const role = asAdmin ? 'admin' : 'member'
    for (const email of emails) {
      const { upsertedCount } = await members.updateOne(
        { email },
        { $setOnInsert: { email, role, addedAt: new Date() } },
        { upsert: true },
      )
      console.log(upsertedCount ? `added    ${email} (${role})` : `exists   ${email}`)
    }
  }

  if (command === 'role') {
    const { matchedCount } = await members.updateOne({ email: emails[0] }, { $set: { role: roleArg } })
    console.log(matchedCount ? `role     ${emails[0]} -> ${roleArg}` : `unknown  ${emails[0]}`)
  }

  if (command === 'remove') {
    for (const email of emails) {
      const { deletedCount } = await members.deleteOne({ email })
      const sessions = await db.collection('member_sessions').deleteMany({ email })
      await db.collection('member_codes').deleteMany({ email })
      console.log(deletedCount ? `removed  ${email} (${sessions.deletedCount} sessions ended)` : `unknown  ${email}`)
    }
  }
} finally {
  await client.close()
}
