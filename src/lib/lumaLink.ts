/**
 * Luma links as members paste them, and the Luma values an own event stores (lumaUrl, lumaEventId, coverUrl). Used by
 * luma.ts, which reads the event behind a link, and by tasks.ts, which checks what the form sends. No imports, so
 * `node --test` can load it from either.
 */

const LUMA_HOSTS = ['lu.ma', 'www.lu.ma', 'luma.com', 'www.luma.com']
// Event slugs are short; this also keeps paths like /discover/… or /user/… out, which have a second part.
export const LUMA_SLUG = /^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/
export const LUMA_URL_MAX = 2000

/**
 * The event slug of a Luma link and its canonical address, or null for anything else. Takes lu.ma and luma.com with or
 * without www, scheme, query (`?tk=…` of an invitation) and fragment. Only the slug leaves this function: the server
 * builds every request URL itself, so a link can never make it fetch another host.
 */
export function parseLumaUrl(input: unknown): { slug: string; url: string } | null {
  if (typeof input !== 'string') return null
  const trimmed = input.trim()
  if (!trimmed || trimmed.length > LUMA_URL_MAX) return null
  let url: URL
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`)
  } catch {
    // Not a URL at all is a refused input like any other, not a failure.
    return null
  }
  if (!['https:', 'http:'].includes(url.protocol) || url.port || url.username || url.password) return null
  if (!LUMA_HOSTS.includes(url.hostname.toLowerCase())) return null
  const slug = url.pathname.replace(/^\/+|\/+$/g, '')
  return LUMA_SLUG.test(slug) ? { slug, url: `https://luma.com/${slug}` } : null
}

/** Luma's event ids, like "evt-uxwE4KqRRWSUgds". */
export const isLumaEventId = (value: unknown): value is string => typeof value === 'string' && /^evt-[A-Za-z0-9]{6,40}$/.test(value)

/** Only covers from Luma's own image host, so an imported event shows no image from anywhere else. */
export function isLumaCover(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > LUMA_URL_MAX) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && (url.hostname === 'lumacdn.com' || url.hostname.endsWith('.lumacdn.com'))
  } catch {
    // Not a URL: no cover.
    return false
  }
}
