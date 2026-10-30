/**
 * Maintains the allowlist of the members area (MongoDB collection `members`, see src/lib/members.ts).
 * Needs MONGODB_URI and MONGODB_DB, e.g. from a local .env pulled with `vercel env pull`.
 *
 *   node scripts/members.mjs list
 *   node scripts/members.mjs add max@leuphana.de [weitere@adressen.de ...]
 *   node scripts/members.mjs remove max@leuphana.de [...]
 *
 * `remove` also ends the open sessions of that address.
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

const [command, ...args] = process.argv.slice(2)
const emails = args.map((arg) => arg.trim().toLowerCase())
const usage = 'Usage: node scripts/members.mjs list | add <email>... | remove <email>...'

if (!['list', 'add', 'remove'].includes(command) || (command !== 'list' && emails.length === 0)) {
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
    for (const { email, addedAt } of all) console.log(`${email}\t${addedAt.toISOString().slice(0, 10)}`)
    console.log(`${all.length} members`)
  }

  if (command === 'add') {
    await members.createIndex({ email: 1 }, { unique: true })
    for (const email of emails) {
      const { upsertedCount } = await members.updateOne({ email }, { $setOnInsert: { email, addedAt: new Date() } }, { upsert: true })
      console.log(upsertedCount ? `added    ${email}` : `exists   ${email}`)
    }
  }

  if (command === 'remove') {
    for (const email of emails) {
      const { deletedCount } = await members.deleteOne({ email })
      const sessions = await db.collection('member_sessions').deleteMany({ email })
      await db.collection('member_login_tokens').deleteMany({ email })
      console.log(deletedCount ? `removed  ${email} (${sessions.deletedCount} sessions ended)` : `unknown  ${email}`)
    }
  }
} finally {
  await client.close()
}
