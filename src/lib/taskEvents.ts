/**
 * The events of the tasks module: the same sources as the public /events page, the Luma calendar (luma.ts) plus
 * the hand-listed events of externalEvents.ts, read live on every page load. Nothing is copied into the database
 * except the snapshot a planning project keeps of its event (tasksStore.syncEvents).
 */
import { getCopy } from '../data/copy'
import type { Locale } from './i18n'
import { loadEvents } from './luma'

export interface TaskEvent {
  id: string
  title: string
  startAt: Date
  endAt: Date
  location: string | null
  url: string
  source: 'luma' | 'external'
}

/**
 * Upcoming and past events, soonest first. `complete` is false when Luma could not be reached, so the caller knows a
 * missing event may just be missing from this response.
 */
export async function loadTaskEvents(locale: Locale): Promise<{ events: TaskEvent[]; complete: boolean }> {
  const [future, past] = await Promise.all([loadEvents(locale, 'future'), loadEvents(locale, 'past')])
  const luma = [...(future ?? []), ...(past ?? [])].map(
    (event): TaskEvent => ({
      id: event.id,
      title: event.name,
      startAt: event.startAt,
      endAt: event.endAt,
      location: event.location,
      url: event.url,
      source: 'luma',
    }),
  )
  const external = getCopy(locale).externalEvents.map(
    (event): TaskEvent => ({
      id: event.id,
      title: event.name,
      startAt: event.startAt,
      endAt: event.endAt,
      location: event.location,
      url: event.registerUrl,
      source: 'external',
    }),
  )
  const byId = new Map([...luma, ...external].map((event) => [event.id, event]))
  return {
    events: [...byId.values()].sort((a, b) => a.startAt.getTime() - b.startAt.getTime()),
    complete: future !== null && past !== null,
  }
}
