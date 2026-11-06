/**
 * The people of the team tab in the Netzwerk section: the board and each team, teamleads first, then by name. Free of
 * local imports, so node --test runs it. Members without a team are not listed.
 */

export const BOARD_GROUP = 'board'

export interface RosterMember {
  name: string
  photo: string
  team: string
  position: 'member' | 'teamlead' | 'board'
}

export function rosterGroups<T extends RosterMember>(members: T[], teamIds: readonly string[]): Record<string, T[]> {
  const sorted = [...members].sort(
    (a, b) => Number(b.position === 'teamlead') - Number(a.position === 'teamlead') || a.name.localeCompare(b.name, 'de'),
  )
  return Object.fromEntries(
    [BOARD_GROUP, ...teamIds].map((id) => [
      id,
      sorted.filter((member) => (id === BOARD_GROUP ? member.position === 'board' : member.position !== 'board' && member.team === id)),
    ]),
  )
}
