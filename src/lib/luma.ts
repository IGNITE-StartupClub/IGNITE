/**
 * Everything the site reads from Luma, in one place:
 * - the upcoming and past events of the IGNITE Luma calendar (https://lu.ma/ignite-startupclub) for /events and the
 *   tasks module, from the endpoint `calendar/get-items` behind Luma's own calendar pages;
 * - single events by their link (`lumaEventFromUrl`), for the form of own events in the members area. That also reads
 *   private events of other calendars, which anyone with the link may open but no calendar list shows, like an internal
 *   dinner run from another Luma account. It asks `api.lu.ma/url`, the endpoint behind Luma's event pages, and falls
 *   back to the data embedded in the event page itself (`__NEXT_DATA__`; the page has no JSON-LD).
 * The official API needs Luma Plus, which the calendar does not have, so both endpoints are undocumented and may change.
 * Both describe an event in the same shape (LumaEventData), which `mapEvent` turns into ours.
 * No local imports without extension, so `node --test` can load this module (luma.test.ts).
 */
import type { Locale } from './i18n'
import { isLumaCover, isLumaEventId, LUMA_SLUG } from './lumaLink.ts'
import { berlinClock, berlinDay, TEXT_MAX, TITLE_MAX } from './tasks.ts'

const CALENDAR_ID = 'cal-TIeGyFakEbk5q6K'
const itemsUrl = (period: EventPeriod) =>
  `https://api.lu.ma/calendar/get-items?calendar_api_id=${CALENDAR_ID}&period=${period}&pagination_limit=50`
// Luma answers 429 to the default User-Agents of Node's fetch and curl (seen 2026-10-14), any other one passes.
const requestHeaders = { 'User-Agent': 'IGNITE-Website (+https://ignite-startupclub.de)' }
// Luma usually answers within a second; without a limit a hanging request lasts until Vercel ends the function.
const REQUEST_TIMEOUT_MS = 5000
// Every members page with events and /events read this, and Luma answers slower than everything else on those pages.
const CACHE_MS = 5 * 60_000
// A failure stays short: the pages say the calendar is incomplete and the calendar feed answers 503 meanwhile.
const FAILURE_CACHE_MS = 30_000
// An event page measured 170 KB (2026-11-11); anything far larger is not an event page.
const PAGE_MAX_BYTES = 2_000_000

export type EventPeriod = 'future' | 'past'

export const lumaCalendarUrl = 'https://lu.ma/ignite-startupclub'

export interface LumaEvent {
  id: string
  name: string
  url: string
  coverUrl: string | null
  startAt: Date
  endAt: Date
  timezone: string
  location: string | null
  guestCount: number
  isFree: boolean
  isSoldOut: boolean
}

interface GeoInfo {
  address?: string
  city?: string
  full_address?: string
  /** "obfuscated" while Luma shows the address only to registered guests. */
  mode?: string
  localized?: Record<string, { address?: string; city?: string; full_address?: string }>
}

/** An event as both Luma endpoints describe it. */
interface LumaEventData {
  api_id: string
  name: string
  url: string
  cover_url: string | null
  start_at: string
  end_at: string
  timezone: string
  location_type?: string
  geo_address_info?: GeoInfo | null
}

interface LumaEntry {
  guest_count: number
  ticket_info?: { is_free?: boolean; is_sold_out?: boolean }
  event: LumaEventData
}

/** The answer of `api.lu.ma/url` and the `initialData` of an event page. */
interface LumaPageData {
  kind?: string
  data?: {
    event?: LumaEventData
    /** The description as a ProseMirror document. */
    description_mirror?: unknown
  }
}

const formatLocation = (geo: GeoInfo | null | undefined, locale: Locale) => {
  const place = geo?.localized?.[locale] ?? geo
  if (!place?.address) return null
  return place.city && !place.address.includes(place.city) ? `${place.address}, ${place.city}` : place.address
}

/** Ours from Luma's description of an event; shared by the calendar and the import of single events. */
function mapEvent(event: LumaEventData, locale: Locale) {
  return {
    id: event.api_id,
    name: event.name,
    url: `https://lu.ma/${event.url}`,
    coverUrl: event.cover_url,
    startAt: new Date(event.start_at),
    endAt: new Date(event.end_at),
    timezone: event.timezone,
    location: formatLocation(event.geo_address_info, locale),
  }
}

/** The calendar's answer as LumaEvents: upcoming ones soonest first, past ones newest first. */
export function calendarEvents(entries: LumaEntry[], locale: Locale, period: EventPeriod): LumaEvent[] {
  return entries
    .map(({ event, guest_count, ticket_info }) => ({
      ...mapEvent(event, locale),
      guestCount: guest_count,
      isFree: ticket_info?.is_free ?? false,
      isSoldOut: ticket_info?.is_sold_out ?? false,
    }))
    .sort((a, b) => (period === 'future' ? 1 : -1) * (a.startAt.getTime() - b.startAt.getTime()))
}

const lumaFetch = (url: string) =>
  // The URLs are built here, never taken from input, and a redirect could lead anywhere, so none is followed.
  fetch(url, { headers: requestHeaders, redirect: 'error', signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })

/**
 * Events of the calendar: upcoming ones soonest first, past ones newest first.
 * `locale` picks Luma's localized address where it has one.
 */
export async function getEvents(locale: Locale, period: EventPeriod): Promise<LumaEvent[]> {
  const response = await lumaFetch(itemsUrl(period))
  if (!response.ok) throw new Error(`Luma calendar request failed: ${response.status} ${response.statusText}`)
  const { entries } = (await response.json()) as { entries: LumaEntry[] }
  return calendarEvents(entries, locale, period)
}

async function fetchEvents(locale: Locale, period: EventPeriod): Promise<LumaEvent[] | null> {
  try {
    return await getEvents(locale, period)
  } catch (error) {
    console.error(`Loading ${period} Luma events failed`, error)
    return null
  }
}

const cache = new Map<string, { until: number; events: Promise<LumaEvent[] | null> }>()

/**
 * Like getEvents, but returns null when Luma is unreachable so a page can link to the calendar instead of failing.
 * Kept per instance for CACHE_MS, and requests arriving together share one call.
 */
export function loadEvents(locale: Locale, period: EventPeriod): Promise<LumaEvent[] | null> {
  const key = `${locale}:${period}`
  const cached = cache.get(key)
  if (cached && Date.now() < cached.until) return cached.events
  const entry = { until: Date.now() + CACHE_MS, events: fetchEvents(locale, period) }
  cache.set(key, entry)
  void entry.events.then((events) => {
    if (!events) entry.until = Date.now() + FAILURE_CACHE_MS
  })
  return entry.events
}

/* Single events by link ---------------------------------------------------------------------------------------- */

/** A field Luma shows only to registered guests, which the form asks to fill in by hand. */
export type HiddenField = 'place' | 'online'

/** What the form of own events takes over from a Luma event. Every field stays editable. */
export interface ImportedEvent {
  lumaEventId: string
  lumaUrl: string
  title: string
  /** Start and end in Berlin, "2026-11-24" and "18:00". */
  due: string
  time: string
  endDue: string
  endTime: string
  place: string
  description: string
  coverUrl: string
  /** Fields left empty because Luma hides them until registration. */
  hidden: HiddenField[]
}

/** Plain text of a ProseMirror document: one line per paragraph or list item, blank lines kept short. */
function plainText(node: unknown): string {
  const lines: string[] = []
  let line = ''
  const walk = (value: unknown) => {
    if (typeof value !== 'object' || value === null) return
    const { type, text, content } = value as { type?: string; text?: unknown; content?: unknown }
    if (type === 'text' && typeof text === 'string') line += text
    else if (type === 'hard_break') line += '\n'
    if (Array.isArray(content)) content.forEach(walk)
    if (type === 'paragraph' || type === 'heading') {
      lines.push(line)
      line = ''
    }
  }
  walk(node)
  if (line) lines.push(line)
  return lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const clip = (value: string, max: number) => (value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value)

/**
 * An event page's data as our own event, or null when it describes no event (a calendar, a profile). Times are read in
 * Berlin, whatever the event's own time zone, because the calendar of the members area shows Berlin time.
 */
export function importedEvent(answer: unknown): ImportedEvent | null {
  // Luma's answer is outside input: every field read below is checked first.
  const page = (typeof answer === 'object' && answer !== null ? answer : {}) as LumaPageData
  const event = page.kind === 'event' ? page.data?.event : undefined
  if (!event || !isLumaEventId(event.api_id) || typeof event.name !== 'string' || !LUMA_SLUG.test(String(event.url))) return null
  const start = Date.parse(String(event.start_at))
  const end = Date.parse(String(event.end_at))
  if (isNaN(start)) return null
  const geo = event.geo_address_info
  const addressHidden = geo?.mode === 'obfuscated'
  // "offline" is a place; Luma names online events by their service ("zoom", "online", …).
  const online = !!event.location_type && event.location_type !== 'offline'
  const place = addressHidden ? '' : (geo?.localized?.de?.full_address ?? geo?.full_address ?? formatLocation(geo, 'de') ?? '')
  const hidden: HiddenField[] = []
  if (addressHidden) hidden.push('place')
  // The meeting link of an online event is only for guests, so the form asks for it in the place field.
  if (online) hidden.push('online')
  const ends = !isNaN(end) && end > start
  return {
    lumaEventId: event.api_id,
    lumaUrl: `https://luma.com/${event.url}`,
    title: clip(event.name.trim(), TITLE_MAX),
    due: berlinDay(start),
    time: berlinClock(start),
    endDue: ends ? berlinDay(end) : '',
    endTime: ends ? berlinClock(end) : '',
    place: clip(place, TITLE_MAX),
    description: clip(plainText(page.data?.description_mirror), TEXT_MAX),
    coverUrl: isLumaCover(event.cover_url) ? event.cover_url : '',
    hidden,
  }
}

/** The `initialData` embedded in an event page, or null when the page has none. */
export function pageData(html: string): LumaPageData | null {
  const match = /<script id="__NEXT_DATA__" type="application\/json"[^>]*>([\s\S]*?)<\/script>/.exec(html)
  if (!match) return null
  try {
    return (JSON.parse(match[1]) as { props?: { pageProps?: { initialData?: LumaPageData } } }).props?.pageProps?.initialData ?? null
  } catch {
    // A page whose embedded data does not parse holds no event we could read.
    return null
  }
}

async function readPage(response: Response): Promise<string> {
  const length = Number(response.headers.get('content-length'))
  if (length > PAGE_MAX_BYTES) throw new Error(`Luma event page too large: ${length} bytes`)
  const html = await response.text()
  if (html.length > PAGE_MAX_BYTES) throw new Error(`Luma event page too large: ${html.length} characters`)
  return html
}

/**
 * The event behind a slug from parseLumaUrl. 'missing' when Luma knows no event under it (deleted, mistyped, a
 * calendar or profile); throws when Luma cannot be read. Tries the API first and the event page second, because either
 * may change without notice.
 */
export async function lumaEventFromUrl(slug: string): Promise<ImportedEvent | 'missing'> {
  if (!LUMA_SLUG.test(slug)) return 'missing'
  let apiFailure: unknown = null
  try {
    const response = await lumaFetch(`https://api.lu.ma/url?url=${encodeURIComponent(slug)}`)
    if (response.status === 404) return 'missing'
    if (!response.ok) throw new Error(`Luma event request failed: ${response.status} ${response.statusText}`)
    const page = (await response.json()) as LumaPageData
    // Another kind (a calendar, a profile) is no event; the page would say the same.
    if (page.kind && page.kind !== 'event') return 'missing'
    const event = importedEvent(page)
    if (event) return event
    throw new Error('Luma event answer has an unknown shape')
  } catch (err) {
    apiFailure = err
  }
  const response = await lumaFetch(`https://luma.com/${encodeURIComponent(slug)}`)
  if (response.status === 404) return 'missing'
  if (!response.ok) throw new Error(`Luma event page failed: ${response.status} ${response.statusText}`, { cause: apiFailure })
  const page = pageData(await readPage(response))
  if (!page) throw new Error('Luma event page holds no event data', { cause: apiFailure })
  return importedEvent(page) ?? 'missing'
}
