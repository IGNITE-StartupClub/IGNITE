/**
 * Upcoming events that are not in the IGNITE Luma calendar, for example events of partners. They appear on /events
 * next to the Luma events and drop off by themselves once `endAt` has passed.
 * The English location lives in externalEvents.en.ts under the same id.
 */
import type { LumaEvent } from '../lib/luma'

export interface ExternalEvent extends Omit<LumaEvent, 'guestCount' | 'isSoldOut'> {
  /** Registration page; the register button links here instead of opening the Luma embed. */
  registerUrl: string
}

export const externalEvents: ExternalEvent[] = [
  {
    id: 'leuphana-ai-hackathon-2026',
    name: 'Leuphana AI Hackathon',
    url: 'https://www.leuphana.de/kooperationen/leuphana-entrepreneurship-center/gruendungsunterstuetzung/leuphana-ai-hackathon.html',
    registerUrl: 'https://eveeno.com/leuphana-ai-hackathon',
    coverUrl: null,
    startAt: new Date('2026-11-05T08:30:00+01:00'),
    endAt: new Date('2026-11-06T19:00:00+01:00'),
    timezone: 'Europe/Berlin',
    location: 'Bibliotheksfoyer, Universitätsallee 1, Lüneburg',
    isFree: true,
  },
]
