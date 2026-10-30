/**
 * Field encryption for personal data in the members area (CRM contacts and alumni profiles, contactsStore.ts).
 * Each value is sealed with AES-256-GCM under a key derived from ENCRYPTION_SECRET for this purpose only, so the
 * applicant data key (submit.ts) is never used directly. The record id and the field name are bound into the
 * ciphertext as additional data: a value copied into another record or field fails to open instead of showing up
 * there. Every sealed value names its key version ("v1:"), so the key can be rotated later.
 * Email addresses also get a keyed fingerprint (HMAC), which finds duplicates without storing the address in plain.
 * Only node:crypto imports, so node --test can load it directly.
 */
import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes } from 'node:crypto'

const VERSION = 'v1'
const IV_BYTES = 12

export interface FieldKeys {
  /** Key per version; `seal` uses VERSION. */
  encryption: Record<string, Buffer>
  fingerprint: Buffer
}

const derive = (secret: Buffer, purpose: string): Buffer =>
  Buffer.from(hkdfSync('sha256', secret, Buffer.alloc(0), purpose, 32))

/** The keys for `secret`, the 32-byte hex ENCRYPTION_SECRET. Throws when it is missing or malformed. */
export function fieldKeys(secret: string | undefined): FieldKeys {
  if (!secret || !/^[0-9a-f]{64}$/i.test(secret)) throw new Error('ENCRYPTION_SECRET must be 32 bytes as hex')
  const raw = Buffer.from(secret, 'hex')
  return {
    encryption: { [VERSION]: derive(raw, `ignite-contacts-encryption-${VERSION}`) },
    fingerprint: derive(raw, 'ignite-contacts-fingerprint'),
  }
}

/** Where a value belongs: collection, record id and field, e.g. "alumni:<id>:email". */
const context = (collection: string, id: string, field: string) => Buffer.from(`${collection}:${id}:${field}`)

/** "v1:<iv>:<ciphertext><tag>", all base64url. Empty strings are sealed too, so no field reveals whether it is set. */
export function seal(keys: FieldKeys, value: string, collection: string, id: string, field: string): string {
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv('aes-256-gcm', keys.encryption[VERSION], iv)
  cipher.setAAD(context(collection, id, field))
  const sealed = Buffer.concat([cipher.update(value, 'utf8'), cipher.final(), cipher.getAuthTag()])
  return `${VERSION}:${iv.toString('base64url')}:${sealed.toString('base64url')}`
}

/** The plain value; throws when the value was changed, belongs elsewhere or uses an unknown key version. */
export function open(keys: FieldKeys, sealed: string, collection: string, id: string, field: string): string {
  const [version, iv, data] = String(sealed).split(':')
  const key = keys.encryption[version]
  if (!key || !iv || !data) throw new Error(`Not a sealed value: ${collection}:${id}:${field}`)
  const bytes = Buffer.from(data, 'base64url')
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'))
  decipher.setAAD(context(collection, id, field))
  decipher.setAuthTag(bytes.subarray(bytes.length - 16))
  return Buffer.concat([decipher.update(bytes.subarray(0, bytes.length - 16)), decipher.final()]).toString('utf8')
}

/** Keyed fingerprint of an address (lowercased, trimmed); the same address always gives the same value. */
export const emailFingerprint = (keys: FieldKeys, email: string): string =>
  createHmac('sha256', keys.fingerprint).update(email.trim().toLowerCase()).digest('base64url')
