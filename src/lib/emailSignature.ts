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

export interface SignatureFields {
  name: string
  role: string
  email: string
  phone: string
  photo: string
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

const DOT = '<span style="color:#9a9a9a;">&nbsp;·&nbsp;</span>'

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
 * `assetOrigin` prefixes the badge image: '' for the on-page preview, LIVE_ORIGIN for the copied signature.
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
  const photo = fields.photo.trim()

  const contact = [link(`mailto:${email}`, email, '#555555')]
  if (phone) contact.push(link(`tel:${phone.replace(/[^\d+]/g, '')}`, phone, '#555555'))
  const web = [
    link(LIVE_ORIGIN, 'ignite-startupclub.de', '#5227ff'),
    ...links.map(({ platform, url }) => link(url, platform, '#5227ff')),
  ]

  // Only https photos: mail clients block or warn on plain http images.
  const photoCell = /^https:\/\/\S+$/.test(photo)
    ? `<td valign="top" style="padding:0 18px 0 0;"><img src="${escapeHtml(photo)}" width="96" height="96" alt="${escapeHtml(name)}" style="display:block;width:96px;max-width:none;height:96px;border-radius:48px;object-fit:cover;border:0;"></td>`
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
