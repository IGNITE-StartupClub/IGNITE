import assert from 'node:assert/strict'
import { afterEach, mock, test } from 'node:test'
import { calendarEvents, getEvents, importedEvent, loadEvents, lumaEventFromUrl, pageData } from './luma.ts'
import { isLumaCover, parseLumaUrl } from './lumaLink.ts'

const realFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = realFetch
  mock.timers.reset()
})

test('gives up on a hanging Luma, which would otherwise hold the request until the platform ends it', async () => {
  let request: RequestInit | undefined
  globalThis.fetch = async (_url, init) => {
    request = init
    return Response.json({ entries: [] })
  }
  await getEvents('de', 'future')
  assert.ok(request?.signal instanceof AbortSignal)
})

const countedFetch = (answer: () => Response) => {
  const calls = { count: 0 }
  globalThis.fetch = async () => {
    calls.count++
    return answer()
  }
  return calls
}

// The cache lives for the whole test file, so every test below sets the clock past the entries of the one before.
const startAt = (now: number) => mock.timers.enable({ apis: ['Date'], now })

test('asks Luma once per five minutes, also for requests arriving together', async () => {
  startAt(1_000_000_000)
  const calls = countedFetch(() => Response.json({ entries: [] }))
  await Promise.all([loadEvents('de', 'future'), loadEvents('de', 'future')])
  mock.timers.tick(4 * 60_000)
  await loadEvents('de', 'future')
  assert.equal(calls.count, 1)
  mock.timers.tick(60_000)
  await loadEvents('de', 'future')
  assert.equal(calls.count, 2)
})

test('keeps the languages apart, because the addresses differ', async () => {
  startAt(2_000_000_000)
  const calls = countedFetch(() => Response.json({ entries: [] }))
  await Promise.all([loadEvents('de', 'past'), loadEvents('en', 'past')])
  assert.equal(calls.count, 2)
})

test('tries again soon after a failure instead of keeping it for five minutes', async () => {
  startAt(3_000_000_000)
  mock.method(console, 'error', () => {})
  const calls = countedFetch(() => new Response('', { status: 429 }))
  assert.equal(await loadEvents('de', 'future'), null)
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(await loadEvents('de', 'future'), null)
  assert.equal(calls.count, 1)
  mock.timers.tick(30_000)
  await loadEvents('de', 'future')
  assert.equal(calls.count, 2)
})

// Shaped like Luma's answers of 2026-11-11, with made-up content: the repository is public.
const publicEvent = {
  api_id: 'evt-Pub1icEvent42',
  name: 'Founder Talk',
  url: 'founder-talk',
  cover_url: 'https://images.lumacdn.com/uploads/ab/cover.png',
  start_at: '2026-11-20T17:30:00.000Z',
  end_at: '2026-11-20T19:00:00.000Z',
  timezone: 'Europe/Berlin',
  location_type: 'offline',
  geo_address_info: {
    mode: 'shown',
    address: 'Universitätsallee 1',
    city: 'Lüneburg',
    full_address: 'Universitätsallee 1, 21335 Lüneburg, Germany',
    localized: { de: { address: 'Universitätsallee 1', city: 'Lüneburg', full_address: 'Universitätsallee 1, 21335 Lüneburg, Deutschland' } },
  },
}

// A private event of another calendar: not listed anywhere, but open to anyone with the link.
const privateEvent = {
  api_id: 'evt-Pr1vateDinner7',
  name: 'Internes Dinner',
  url: 'ab12cd34',
  cover_url: 'https://images.lumacdn.com/uploads/cd/dinner.png',
  start_at: '2026-11-24T17:00:00.000Z',
  end_at: '2026-11-24T21:00:00.000Z',
  timezone: 'Europe/Berlin',
  visibility: 'private',
  location_type: 'offline',
  geo_address_info: { mode: 'shown', address: 'Café am Markt', city: 'Lüneburg', full_address: 'Café am Markt, Am Markt 1, 21335 Lüneburg, Germany' },
}

const description = {
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'Willkommen!' }] },
    { type: 'paragraph' },
    { type: 'paragraph', content: [{ type: 'text', text: 'Wir ' }, { type: 'text', text: 'essen', marks: [{ type: 'bold' }] }, { type: 'text', text: ' zusammen.' }] },
    { type: 'bullet_list', content: [{ type: 'list_item', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Punkt eins' }] }] }] },
  ],
}

const answer = (event: object, extra: object = {}) => ({ kind: 'event', data: { event, description_mirror: description, ...extra } })

test('parseLumaUrl takes lu.ma and luma.com links in their usual forms', () => {
  const expected = { slug: 'ab12cd34', url: 'https://luma.com/ab12cd34' }
  for (const link of [
    'https://luma.com/ab12cd34',
    'https://lu.ma/ab12cd34',
    'https://www.luma.com/ab12cd34/',
    'http://lu.ma/ab12cd34',
    'luma.com/ab12cd34',
    ' https://luma.com/ab12cd34?tk=Invite123&utm_source=wa ',
    'https://LUMA.com/ab12cd34#top',
  ]) {
    assert.deepEqual(parseLumaUrl(link), expected, link)
  }
  assert.deepEqual(parseLumaUrl('https://lu.ma/Founder-Talk_2026'), { slug: 'Founder-Talk_2026', url: 'https://luma.com/Founder-Talk_2026' })
})

test('parseLumaUrl refuses other hosts, odd URLs and paths that are no event', () => {
  for (const link of [
    '',
    'kein Link',
    'https://evil.example/ab12cd34',
    'https://luma.com.evil.example/ab12cd34',
    'https://evil.example/?u=https://luma.com/ab12cd34',
    'https://api.lu.ma/url?url=ab12cd34',
    'https://luma.com:8443/ab12cd34',
    'https://user:pass@luma.com/ab12cd34',
    'ftp://luma.com/ab12cd34',
    'javascript:alert(1)',
    'https://luma.com/',
    'https://luma.com/user/someone',
    `https://luma.com/${'a'.repeat(101)}`,
    42,
    null,
  ]) {
    assert.equal(parseLumaUrl(link), null, String(link))
  }
})

test('importedEvent maps a public event in Berlin time', () => {
  assert.deepEqual(importedEvent(answer(publicEvent)), {
    lumaEventId: 'evt-Pub1icEvent42',
    lumaUrl: 'https://luma.com/founder-talk',
    title: 'Founder Talk',
    due: '2026-11-20',
    time: '18:30',
    endDue: '2026-11-20',
    endTime: '20:00',
    place: 'Universitätsallee 1, 21335 Lüneburg, Deutschland',
    description: 'Willkommen!\n\nWir essen zusammen.\nPunkt eins',
    coverUrl: 'https://images.lumacdn.com/uploads/ab/cover.png',
    hidden: [],
  })
})

test('importedEvent maps a private event of another calendar the same way', () => {
  const event = importedEvent(answer(privateEvent))
  assert.equal(event?.lumaEventId, 'evt-Pr1vateDinner7')
  assert.equal(event?.title, 'Internes Dinner')
  assert.deepEqual([event?.due, event?.time, event?.endDue, event?.endTime], ['2026-11-24', '18:00', '2026-11-24', '22:00'])
  assert.equal(event?.place, 'Café am Markt, Am Markt 1, 21335 Lüneburg, Germany')
  assert.deepEqual(event?.hidden, [])
})

test('importedEvent leaves out what Luma shows only to guests and names it', () => {
  const hiddenAddress = { ...privateEvent, geo_address_info: { mode: 'obfuscated', city: 'Lüneburg', city_state: 'Lüneburg, Germany' } }
  const atAddress = importedEvent(answer(hiddenAddress))
  assert.equal(atAddress?.place, '')
  assert.deepEqual(atAddress?.hidden, ['place'])
  const online = importedEvent(answer({ ...privateEvent, location_type: 'zoom', geo_address_info: null }))
  assert.equal(online?.place, '')
  assert.deepEqual(online?.hidden, ['online'])
})

test('importedEvent reads summer time, events over midnight and no end', () => {
  const summer = importedEvent(answer({ ...publicEvent, start_at: '2026-06-10T16:00:00.000Z', end_at: '2026-06-10T22:30:00.000Z' }))
  assert.deepEqual([summer?.time, summer?.endTime], ['18:00', '00:30'])
  assert.equal(summer?.endDue, '2026-06-11')
  const open = importedEvent(answer({ ...publicEvent, end_at: publicEvent.start_at }))
  assert.deepEqual([open?.endDue, open?.endTime], ['', ''])
})

test('importedEvent keeps covers from Luma only and clips long texts', () => {
  assert.equal(importedEvent(answer({ ...publicEvent, cover_url: 'https://evil.example/x.png' }))?.coverUrl, '')
  assert.equal(importedEvent(answer({ ...publicEvent, cover_url: null }))?.coverUrl, '')
  const long = importedEvent(answer({ ...publicEvent, name: 'x'.repeat(300) }))
  assert.equal(long?.title.length, 200)
  assert.ok(long?.title.endsWith('…'))
  assert.equal(isLumaCover('https://images.lumacdn.com/a.png'), true)
  assert.equal(isLumaCover('https://lumacdn.com.evil.example/a.png'), false)
})

test('importedEvent refuses answers that describe no event', () => {
  assert.equal(importedEvent({ kind: 'calendar', data: { event: publicEvent } }), null)
  assert.equal(importedEvent({ kind: 'event', data: {} }), null)
  assert.equal(importedEvent(answer({ ...publicEvent, api_id: 'cal-abc' })), null)
  assert.equal(importedEvent(answer({ ...publicEvent, start_at: 'soon' })), null)
})

test('pageData reads the data embedded in an event page', () => {
  const html = `<html><head><script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
    props: { pageProps: { initialData: answer(privateEvent) } },
  })}</script></head></html>`
  assert.equal(importedEvent(pageData(html))?.title, 'Internes Dinner')
  assert.equal(pageData('<html></html>'), null)
  assert.equal(pageData('<script id="__NEXT_DATA__" type="application/json">{broken</script>'), null)
})

test('calendarEvents keeps the mapping of the public calendar', () => {
  const entry = (event: typeof publicEvent, guests: number) => ({ guest_count: guests, ticket_info: { is_free: true }, event })
  const later = { ...publicEvent, api_id: 'evt-Later0000001', start_at: '2026-12-01T17:00:00.000Z', end_at: '2026-12-01T19:00:00.000Z' }
  const events = calendarEvents([entry(later, 3), entry(publicEvent, 12)], 'de', 'future')
  assert.deepEqual(events[0], {
    id: 'evt-Pub1icEvent42',
    name: 'Founder Talk',
    url: 'https://lu.ma/founder-talk',
    coverUrl: 'https://images.lumacdn.com/uploads/ab/cover.png',
    startAt: new Date('2026-11-20T17:30:00.000Z'),
    endAt: new Date('2026-11-20T19:00:00.000Z'),
    timezone: 'Europe/Berlin',
    location: 'Universitätsallee 1, Lüneburg',
    guestCount: 12,
    isFree: true,
    isSoldOut: false,
  })
  assert.deepEqual(
    calendarEvents([entry(publicEvent, 1), entry(later, 1)], 'de', 'past').map((event) => event.id),
    ['evt-Later0000001', 'evt-Pub1icEvent42'],
  )
})

afterEach(() => mock.restoreAll())

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

test('lumaEventFromUrl asks the API, and only Luma hosts', async () => {
  const fetched: string[] = []
  mock.method(globalThis, 'fetch', async (url: string, init: RequestInit) => {
    fetched.push(url)
    assert.equal(init.redirect, 'error')
    return json(answer(privateEvent))
  })
  const event = await lumaEventFromUrl('ab12cd34')
  assert.equal(event !== 'missing' && event.title, 'Internes Dinner')
  assert.deepEqual(new Set(fetched), new Set(['https://api.lu.ma/url?url=ab12cd34']))
})

test('lumaEventFromUrl falls back to the event page when the API fails', async () => {
  const fetched: string[] = []
  mock.method(globalThis, 'fetch', async (url: string) => {
    fetched.push(url)
    if (url.startsWith('https://api.lu.ma/')) return new Response('busy', { status: 500 })
    const data = JSON.stringify({ props: { pageProps: { initialData: answer(privateEvent) } } })
    return new Response(`<script id="__NEXT_DATA__" type="application/json">${data}</script>`, { status: 200 })
  })
  const event = await lumaEventFromUrl('ab12cd34')
  assert.equal(event !== 'missing' && event.lumaEventId, 'evt-Pr1vateDinner7')
  assert.deepEqual(fetched, ['https://api.lu.ma/url?url=ab12cd34', 'https://luma.com/ab12cd34'])
})

test('lumaEventFromUrl says missing for unknown slugs and non-events', async () => {
  mock.method(globalThis, 'fetch', async () => json({ message: 'not found' }, 404))
  assert.equal(await lumaEventFromUrl('gone1234'), 'missing')
  mock.restoreAll()
  mock.method(globalThis, 'fetch', async () => json({ kind: 'calendar', data: {} }))
  assert.equal(await lumaEventFromUrl('ignite-startupclub'), 'missing')
  assert.equal(await lumaEventFromUrl('../admin'), 'missing')
})

test('lumaEventFromUrl throws when Luma cannot be read at all', async () => {
  mock.method(globalThis, 'fetch', async () => {
    throw new TypeError('fetch failed')
  })
  await assert.rejects(lumaEventFromUrl('ab12cd34'), /fetch failed/)
  mock.restoreAll()
  mock.method(globalThis, 'fetch', async (url: string) =>
    url.startsWith('https://api.lu.ma/') ? new Response('busy', { status: 503 }) : new Response('<html>Wartung</html>', { status: 200 }),
  )
  await assert.rejects(lumaEventFromUrl('ab12cd34'), /holds no event data/)
})
