import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { getEvents } from './luma.ts'

const realFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = realFetch
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
