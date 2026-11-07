/**
 * The Weekly, every Tuesday. It shows in the calendar of the members area only; the public /events page stays on Luma and
 * externalEvents.ts. A Tuesday without a Weekly goes into `skip` as YYYY-MM-DD. Title and room read the same in both
 * languages, so there is no English file.
 */
import type { EventSeries } from '../lib/eventSeries'

export const weekly: EventSeries = {
  id: 'weekly',
  title: 'Weekly',
  firstDay: '2026-11-10',
  time: '16:00',
  minutes: 60,
  location: 'C.40.254',
  skip: [],
}
