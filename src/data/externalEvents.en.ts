/**
 * English version of the external events on /en/events. Everything except the location comes from externalEvents.ts.
 */
import { externalEvents as germanEvents, type ExternalEvent } from './externalEvents'

const locations: Record<string, string> = {
  'leuphana-ai-hackathon-2026': 'Library foyer, Universitätsallee 1, Lüneburg',
}

export const externalEvents: ExternalEvent[] = germanEvents.map((event) => {
  const location = locations[event.id]
  if (event.location && !location) throw new Error(`Missing English location for external event "${event.id}"`)
  return { ...event, location: location ?? null }
})
