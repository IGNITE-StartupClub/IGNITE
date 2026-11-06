import assert from 'node:assert/strict'
import { afterEach, mock, test } from 'node:test'
import { getEvents, loadEvents } from './luma.ts'

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
