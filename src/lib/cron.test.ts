import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isCronAuthorized, rejectCron } from './cron.ts'

test('isCronAuthorized accepts only the exact bearer header', () => {
  assert.equal(isCronAuthorized('Bearer geheim', 'geheim'), true)
  for (const header of [null, '', 'geheim', 'Bearer geheim2', 'Bearer Geheim', 'bearer geheim', 'Bearer  geheim']) {
    assert.equal(isCronAuthorized(header, 'geheim'), false, String(header))
  }
})

test('isCronAuthorized refuses every request without a configured secret', () => {
  for (const secret of [undefined, '']) {
    assert.equal(isCronAuthorized('Bearer ', secret), false)
    assert.equal(isCronAuthorized('Bearer undefined', secret), false)
  }
})

test('rejectCron answers 401 unless the request carries CRON_SECRET', () => {
  const previous = process.env.CRON_SECRET
  process.env.CRON_SECRET = 'geheim'
  try {
    const request = (authorization?: string) =>
      new Request('https://example.test/api/cron/health', authorization ? { headers: { authorization } } : {})
    assert.equal(rejectCron(request('Bearer geheim')), null)
    assert.equal(rejectCron(request())?.status, 401)
    assert.equal(rejectCron(request('Bearer falsch'))?.status, 401)
  } finally {
    if (previous === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = previous
  }
})
