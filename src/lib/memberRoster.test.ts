import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BOARD_GROUP, rosterGroups, type RosterMember } from './memberRoster.ts'

const member = (name: string, team: string, position: RosterMember['position'] = 'member'): RosterMember => ({ name, photo: '', team, position })

test('lists teamleads first, then by name', () => {
  const groups = rosterGroups([member('Anna', 'a'), member('Zoe', 'a', 'teamlead'), member('Ärle', 'a')], ['a'])
  assert.deepEqual(groups.a.map(({ name }) => name), ['Zoe', 'Anna', 'Ärle'])
})

test('puts the board in its own group, even with a team left over', () => {
  const groups = rosterGroups([member('Ben', 'a', 'board')], ['a'])
  assert.deepEqual(groups[BOARD_GROUP].map(({ name }) => name), ['Ben'])
  assert.deepEqual(groups.a, [])
})

test('leaves out members without a team and keeps empty teams', () => {
  const groups = rosterGroups([member('Mia', '')], ['a'])
  assert.deepEqual(groups, { [BOARD_GROUP]: [], a: [] })
})
