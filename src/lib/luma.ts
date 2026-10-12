/**
 * Upcoming events of the IGNITE Luma calendar (https://lu.ma/ignite-startupclub).
 * Uses the public endpoint behind Luma's own calendar pages. The official API needs Luma Plus,
 * which the calendar does not have, so this endpoint is undocumented and may change.
 */
const CALENDAR_ID = 'cal-TIeGyFakEbk5q6K'
const ITEMS_URL = `https://api.lu.ma/calendar/get-items?calendar_api_id=${CALENDAR_ID}&period=future&pagination_limit=50`

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

interface LumaEntry {
  guest_count: number
  ticket_info?: { is_free?: boolean; is_sold_out?: boolean }
  event: {
    api_id: string
    name: string
    url: string
    cover_url: string | null
    start_at: string
    end_at: string
    timezone: string
    geo_address_info?: { address?: string; city?: string; localized?: { de?: { address?: string; city?: string } } } | null
  }
}

const formatLocation = (geo: LumaEntry['event']['geo_address_info']) => {
  const place = geo?.localized?.de ?? geo
  if (!place?.address) return null
  return place.city && !place.address.includes(place.city) ? `${place.address}, ${place.city}` : place.address
}

export async function getUpcomingEvents(): Promise<LumaEvent[]> {
  const response = await fetch(ITEMS_URL)
  if (!response.ok) throw new Error(`Luma calendar request failed: ${response.status} ${response.statusText}`)
  const { entries } = (await response.json()) as { entries: LumaEntry[] }

  return entries
    .map(({ event, guest_count, ticket_info }) => ({
      id: event.api_id,
      name: event.name,
      url: `https://lu.ma/${event.url}`,
      coverUrl: event.cover_url,
      startAt: new Date(event.start_at),
      endAt: new Date(event.end_at),
      timezone: event.timezone,
      location: formatLocation(event.geo_address_info),
      guestCount: guest_count,
      isFree: ticket_info?.is_free ?? false,
      isSoldOut: ticket_info?.is_sold_out ?? false,
    }))
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
}
