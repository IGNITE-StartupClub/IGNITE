/**
 * Search engine metadata: canonical address, meta description and JSON-LD structured data.
 * Used by DefaultLayout.astro, HomePage.astro and EventsPage.astro. No extensionless local imports, so node --test
 * can load it.
 */

/** Google cuts meta descriptions at about this many characters. */
export const DESCRIPTION_MAX = 160

/**
 * The one address search engines should index for a page. Vercel answers both "/events" and "/events/", so the
 * canonical always ends in a slash, the form of the sitemap and of the navigation links.
 */
export function canonicalUrl(pathname: string, site: URL | string): string {
  return new URL(pathname.replace(/\/*$/, '/'), site).href
}

/** The members area needs a session and the styleguide is internal: neither belongs in the sitemap. */
export const PRIVATE_PREFIXES = ['/mitglieder/', '/en/members/', '/styleguide/']

export function isListed(pathname: string): boolean {
  const path = pathname.replace(/\/*$/, '/')
  return !PRIVATE_PREFIXES.some((prefix) => path.startsWith(prefix))
}

/** Shortens text to `max` characters at a word boundary, with an ellipsis, so no word is cut in half. */
export function metaDescription(text: string, max = DESCRIPTION_MAX): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–-]+$/, '')}…`
}

export interface OrganizationInfo {
  name: string
  url: string
  logo: string
  description: string
  email: string
  sameAs: string[]
}

export function organizationJsonLd(info: OrganizationInfo) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: info.name,
    url: info.url,
    logo: info.logo,
    description: info.description,
    email: info.email,
    sameAs: info.sameAs,
  }
}

export interface EventInfo {
  name: string
  url: string
  startAt: Date
  endAt: Date
  location: string | null
  coverUrl: string | null
  isFree: boolean
}

/**
 * One schema.org Event per event. Luma hides the address of some events until registration (location null);
 * those get no location rather than a guessed one. Relative cover paths are resolved against the site.
 */
export function eventsJsonLd(events: EventInfo[], organizer: { name: string; url: string }, site: URL | string) {
  return events.map((event) => ({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    url: event.url,
    startDate: event.startAt.toISOString(),
    endDate: event.endAt.toISOString(),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    ...(event.location ? { location: { '@type': 'Place', name: event.location, address: event.location } } : {}),
    ...(event.coverUrl ? { image: [new URL(event.coverUrl, site).href] } : {}),
    isAccessibleForFree: event.isFree,
    organizer: { '@type': 'Organization', name: organizer.name, url: organizer.url },
  }))
}

/**
 * JSON for a <script type="application/ld+json"> element. Event names come from Luma, so "<" is escaped: a name
 * containing "</script>" would otherwise end the element and inject markup.
 */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
