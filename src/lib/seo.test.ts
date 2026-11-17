import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canonicalUrl, eventsJsonLd, isListed, jsonLdScript, metaDescription, organizationJsonLd } from './seo.ts'

const site = new URL('https://www.ignite-startupclub.de')

test('canonicalUrl gives every path one trailing slash, like the sitemap', () => {
  assert.equal(canonicalUrl('/', site), 'https://www.ignite-startupclub.de/')
  assert.equal(canonicalUrl('/events', site), 'https://www.ignite-startupclub.de/events/')
  assert.equal(canonicalUrl('/events/', site), 'https://www.ignite-startupclub.de/events/')
  assert.equal(canonicalUrl('/en', site), 'https://www.ignite-startupclub.de/en/')
  assert.equal(canonicalUrl('/news/openweekly2026//', site), 'https://www.ignite-startupclub.de/news/openweekly2026/')
})

test('canonicalUrl keeps the host of the configured site', () => {
  assert.equal(canonicalUrl('/kontakt', 'https://www.ignite-startupclub.de/'), 'https://www.ignite-startupclub.de/kontakt/')
})

test('canonicalUrl never leaves the site host', () => {
  assert.equal(canonicalUrl('//evil.example/', site), 'https://www.ignite-startupclub.de/evil.example/')
  assert.equal(canonicalUrl('///evil.example/x', site), 'https://www.ignite-startupclub.de/evil.example/x/')
  assert.equal(new URL(canonicalUrl('/\\evil.example', site)).host, 'www.ignite-startupclub.de')
  assert.equal(canonicalUrl('', site), 'https://www.ignite-startupclub.de/')
})

test('isListed leaves the members area and the styleguide out of the sitemap', () => {
  for (const path of ['/mitglieder/', '/mitglieder', '/mitglieder/login/', '/en/members/tasks/', '/styleguide/']) {
    assert.equal(isListed(path), false, path)
  }
  for (const path of ['/', '/events/', '/en/', '/mitmachen/', '/en/join/', '/news/kickoff/']) {
    assert.equal(isListed(path), true, path)
  }
})

test('metaDescription keeps short text and collapses whitespace', () => {
  assert.equal(metaDescription('  Nimm   Kontakt\nmit uns auf. '), 'Nimm Kontakt mit uns auf.')
})

test('metaDescription cuts long text at a word boundary within the limit', () => {
  const text = 'Wir freuen uns auf dich im Team von IGNITE, deinem Startup-Netzwerk in Lüneburg.'
  const result = metaDescription(text, 40)
  assert.equal(result, 'Wir freuen uns auf dich im Team von…')
  assert.ok(result.length <= 40)
})

test('metaDescription drops trailing punctuation before the ellipsis', () => {
  assert.equal(metaDescription('Eins zwei, drei vier fünf', 12), 'Eins zwei…')
})

test('metaDescription cuts a single long word hard', () => {
  assert.equal(metaDescription('Donaudampfschifffahrt', 8), 'Donauda…')
})

test('organizationJsonLd describes the club', () => {
  const data = organizationJsonLd({
    name: 'IGNITE Startup Club Lüneburg',
    url: 'https://www.ignite-startupclub.de/',
    logo: 'https://www.ignite-startupclub.de/favicon-512.png',
    description: 'Studentische Initiative',
    email: 'stud.initiative.ignite@leuphana.de',
    sameAs: ['https://www.instagram.com/ignite.lueneburg/'],
  })
  assert.equal(data['@type'], 'Organization')
  assert.equal(data['@context'], 'https://schema.org')
  assert.deepEqual(data.sameAs, ['https://www.instagram.com/ignite.lueneburg/'])
})

const organizer = { name: 'IGNITE Startup Club Lüneburg', url: 'https://www.ignite-startupclub.de/' }

test('eventsJsonLd writes dates, place and an absolute image', () => {
  const [event] = eventsJsonLd(
    [
      {
        name: 'Open Weekly',
        url: 'https://lu.ma/abc',
        startAt: new Date('2026-11-24T17:00:00Z'),
        endAt: new Date('2026-11-24T19:00:00Z'),
        location: 'Universitätsallee 1, Lüneburg',
        coverUrl: '/img/events/weekly.jpg',
        isFree: true,
      },
    ],
    organizer,
    site,
  )
  assert.equal(event['@type'], 'Event')
  assert.equal(event.startDate, '2026-11-24T17:00:00.000Z')
  assert.equal(event.endDate, '2026-11-24T19:00:00.000Z')
  assert.deepEqual(event.location, { '@type': 'Place', name: 'Universitätsallee 1, Lüneburg', address: 'Universitätsallee 1, Lüneburg' })
  assert.deepEqual(event.image, ['https://www.ignite-startupclub.de/img/events/weekly.jpg'])
  assert.equal(event.organizer.name, organizer.name)
})

test('eventsJsonLd leaves out a hidden location and a missing cover', () => {
  const [event] = eventsJsonLd(
    [
      {
        name: 'Pitch Night',
        url: 'https://lu.ma/def',
        startAt: new Date('2026-12-01T18:00:00Z'),
        endAt: new Date('2026-12-01T21:00:00Z'),
        location: null,
        coverUrl: null,
        isFree: false,
      },
    ],
    organizer,
    site,
  )
  assert.equal('location' in event, false)
  assert.equal('image' in event, false)
  assert.equal(event.isAccessibleForFree, false)
})

test('jsonLdScript escapes "<" so a name cannot close the script element', () => {
  const json = jsonLdScript({ name: 'Talk </script><script>alert(1)</script>' })
  assert.equal(json.includes('<'), false)
  assert.deepEqual(JSON.parse(json), { name: 'Talk </script><script>alert(1)</script>' })
})
