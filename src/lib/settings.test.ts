import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseSettingsChange, SETTING_DEFAULTS } from './settings.ts'

test('connections stay limited to the pilot until an admin opens them, the digest is on', () => {
  assert.deepEqual(SETTING_DEFAULTS, { taskDigest: true, connections: false })
})

test('a settings change names known switches with boolean values', () => {
  assert.deepEqual(parseSettingsChange({ connections: true }), { connections: true })
  assert.deepEqual(parseSettingsChange({ taskDigest: false, connections: true }), { taskDigest: false, connections: true })
})

test('a settings change without a switch, with an unknown one or a non-boolean value is refused', () => {
  for (const body of [null, [], 'connections', {}, { connections: 'true' }, { connections: true, admin: true }, { mcp: true }]) {
    assert.equal(parseSettingsChange(body), null, JSON.stringify(body))
  }
})
