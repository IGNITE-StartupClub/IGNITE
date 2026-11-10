/**
 * The SharePoint links of the Ablage page (MemberStoragePage.astro): the whole site, one folder per team and a few
 * named folders for everyone. Admins keep them on the member management page (StorageSettings island,
 * /api/members/storage); settingsStore.ts stores them. They live in the database and not in the copy files, because
 * folders move and admins change them without a deploy. Only Leuphana SharePoint links pass (parseFolderUrl).
 */
import { parseFolderUrl, TEAM_IDS, type TeamId } from './tasks.ts'

export interface StorageFolder {
  name: string
  url: string
}

export interface StorageFolders {
  /** The site's start page, '' until an admin enters it. */
  root: string
  /** '' for a team without a link yet. */
  teams: Record<TeamId, string>
  general: StorageFolder[]
}

export const GENERAL_MAX = 8
export const FOLDER_NAME_MAX = 60

const noTeams = (): Record<TeamId, string> => Object.fromEntries(TEAM_IDS.map((team) => [team, ''])) as Record<TeamId, string>

/** What the page shows for a stored document, which may predate a team or miss parts. */
export function storedFolders(stored: Partial<StorageFolders> | undefined): StorageFolders {
  return {
    root: stored?.root ?? '',
    teams: { ...noTeams(), ...stored?.teams },
    general: stored?.general ?? [],
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)

/** The whole set as an admin saves it; null when any part is unknown, too long or points outside the SharePoint. */
export function parseStorageFolders(input: unknown): StorageFolders | null {
  if (!isRecord(input) || Object.keys(input).some((key) => !['root', 'teams', 'general'].includes(key))) return null
  const root = parseFolderUrl(input.root)
  if (root === null) return null

  const teams = noTeams()
  if (input.teams !== undefined) {
    if (!isRecord(input.teams)) return null
    for (const [team, value] of Object.entries(input.teams)) {
      const url = parseFolderUrl(value)
      if (!TEAM_IDS.includes(team as TeamId) || url === null) return null
      teams[team as TeamId] = url
    }
  }

  const general: StorageFolder[] = []
  if (input.general !== undefined) {
    if (!Array.isArray(input.general) || input.general.length > GENERAL_MAX) return null
    for (const entry of input.general) {
      if (!isRecord(entry) || typeof entry.name !== 'string') return null
      const name = entry.name.trim()
      const url = parseFolderUrl(entry.url)
      if (!name || name.length > FOLDER_NAME_MAX || !url) return null
      general.push({ name, url })
    }
  }
  return { root, teams, general }
}
