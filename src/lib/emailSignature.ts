/**
 * HTML of the opt-in member email signature, built by the SignatureGenerator island on the members area page.
 * No local imports, so emailSignature.test.ts can run under `node --test`.
 * Mail clients drop <style> blocks and most CSS layout, so the markup is tables with inline styles only.
 */

// Pasted signatures keep their URLs, so links and copied image sources point at the live site.
// The apex domain redirects to www.
export const LIVE_ORIGIN = 'https://www.ignite-startupclub.de'
// Public on purpose: recipients' mail clients load it without a member session.
export const BADGE_PATH = '/email/ignite-badge.png'

// Uploaded photos (api/members/photo.ts) are served publicly under this prefix (api/signature-photo/[id].ts).
const PHOTO_PREFIX = '/api/signature-photo/'

/** Photo ids are newToken() values: 32 random bytes as base64url, so nobody can guess another member's photo. */
export const isPhotoId = (id: string): boolean => /^[A-Za-z0-9_-]{43}$/.test(id)
export const photoPath = (id: string): string => `${PHOTO_PREFIX}${id}`

export interface SignatureFields {
  name: string
  role: string
  email: string
  phone: string
  /** Path of the uploaded photo (photoPath) or ''. */
  photo: string
}

/**
 * localStorage key for the generator's draft. One per account, because members share browsers: a single key showed the
 * previous account's inputs after switching accounts.
 */
export const signatureStorageKey = (account: string): string => `ignite-signature:${account}`

/** The text fields an admin stores for the invitations they send (/api/members/signature); the photo is stored apart. */
export type SavedSignature = Omit<SignatureFields, 'photo'>

const SAVED_FIELDS = ['name', 'role', 'email', 'phone'] as const
export const SIGNATURE_MAX_LENGTH = 120

/** The trimmed fields of a complete signature from a request body, or null when a field is missing or too long. */
export function parseSignature(input: unknown): SavedSignature | null {
  if (typeof input !== 'object' || input === null) return null
  const values = SAVED_FIELDS.map((key) => (input as Record<string, unknown>)[key])
  if (!values.every((value) => typeof value === 'string' && value.trim().length <= SIGNATURE_MAX_LENGTH)) return null
  const [name, role, email, phone] = (values as string[]).map((value) => value.trim())
  const signature = { name, role, email, phone }
  return isComplete({ ...signature, photo: '' }) ? signature : null
}

/** Locale-dependent text, from memberArea.signature.generator.signature. */
export interface SignatureText {
  tagline: string
  namePlaceholder: string
  rolePlaceholder: string
  emailPlaceholder: string
}

export interface SignatureLink {
  platform: string
  url: string
}

// A plain space after the dot lets long lines wrap on phones; the dot stays at the end of the line.
const DOT = '<span style="color:#9a9a9a;">&nbsp;· </span>'

export const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)

/** True when the fields the signature cannot do without are filled in. */
export const isComplete = (fields: SignatureFields): boolean =>
  [fields.name, fields.role, fields.email].every((value) => value.trim() !== '')

const link = (url: string, label: string, color: string) =>
  `<a href="${escapeHtml(url)}" style="color:${color};text-decoration:none;white-space:nowrap;">${escapeHtml(label)}</a>`

const row = (content: string, style: string) =>
  `<tr><td style="font-family:Arial,Helvetica,sans-serif;${style}">${content}</td></tr>`

/**
 * Signature markup. Empty fields fall back to the placeholders so the preview never collapses.
 * `assetOrigin` prefixes badge and photo: '' for the on-page preview, LIVE_ORIGIN for the copied signature.
 */
export function signatureHtml(
  fields: SignatureFields,
  text: SignatureText,
  links: SignatureLink[],
  assetOrigin: string,
): string {
  const name = fields.name.trim() || text.namePlaceholder
  const role = fields.role.trim() || text.rolePlaceholder
  const email = fields.email.trim() || text.emailPlaceholder
  const phone = fields.phone.trim()
  const photoId = fields.photo.startsWith(PHOTO_PREFIX) ? fields.photo.slice(PHOTO_PREFIX.length) : ''

  const contact = [link(`mailto:${email}`, email, '#555555')]
  if (phone) contact.push(link(`tel:${phone.replace(/[^\d+]/g, '')}`, phone, '#555555'))
  const web = [
    link(LIVE_ORIGIN, 'ignite-startupclub.de', '#5227ff'),
    ...links.map(({ platform, url }) => link(url, platform, '#5227ff')),
  ]

  // Only our own uploads, which the cropper has already cut square. Outlook for iOS forces `max-width: 100%` on
  // images and let the narrow column squeeze the photo to an oval under its fixed height: the cell's width keeps
  // the column wide, min-width outranks max-width, and `height:auto` keeps it round if a client narrows it anyway.
  const photoCell = isPhotoId(photoId)
    ? `<td valign="top" width="96" style="width:96px;min-width:96px;padding:0 18px 0 0;"><img src="${assetOrigin}${photoPath(photoId)}" width="96" height="96" alt="${escapeHtml(name)}" style="display:block;width:96px;min-width:96px;max-width:none;height:auto;border-radius:48px;object-fit:cover;border:0;"></td>`
    : ''

  const rows = [
    row(escapeHtml(name), 'font-size:15px;line-height:20px;font-weight:bold;color:#1a1a1a;'),
    row(
      `${escapeHtml(role)}${DOT}<span style="white-space:nowrap;">IGNITE Startup Club</span>`,
      'font-size:13px;line-height:18px;color:#5227ff;',
    ),
    row(contact.join(DOT), 'font-size:12px;line-height:18px;color:#555555;padding-top:8px;'),
    row(web.join(DOT), 'font-size:12px;line-height:18px;'),
    row(
      `<a href="${LIVE_ORIGIN}" style="text-decoration:none;"><img src="${assetOrigin}${BADGE_PATH}" width="152" height="44" alt="IGNITE" style="display:block;width:152px;height:44px;border:0;"></a>`,
      'padding-top:12px;',
    ),
    row(escapeHtml(text.tagline), 'font-size:11px;line-height:15px;color:#777777;padding-top:6px;'),
  ]

  // Width and layout inline, because host pages and some mail clients stretch tables to full width
  // (the site's reset sets `table { width: 100%; table-layout: fixed }`), which split photo and text in half.
  // The photo's `max-width:none` likewise keeps the reset's `img { max-width: 100% }` from shrinking it.
  const table = (content: string) =>
    `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:auto;table-layout:auto;border-collapse:collapse;color:#1a1a1a;">${content}</table>`

  return table(
    `<tr>${photoCell}<td valign="top" style="border-left:2px solid #311763;padding:0 0 0 14px;">${table(rows.join(''))}</td></tr>`,
  )
}
