/**
 * Switches of the members area that admins flip for everyone (AdminSettings island, /api/members/settings), stored by
 * settingsStore.ts. No imports, so node --test can load this module.
 */
export const SETTING_DEFAULTS = {
  /** The daily task digest mail (taskDigest.ts). */
  taskDigest: true,
  /** AI assistants and calendar subscriptions for every member, not only the pilot addresses (members.ts). */
  connections: false,
}
export type SettingId = keyof typeof SETTING_DEFAULTS
export type Settings = Record<SettingId, boolean>
export const SETTING_IDS = Object.keys(SETTING_DEFAULTS) as SettingId[]

/** The switches a request flips, e.g. { connections: true }; null unless it names at least one and only known ones. */
export function parseSettingsChange(input: unknown): Partial<Settings> | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null
  const entries = Object.entries(input)
  const valid = entries.every(([key, value]) => (SETTING_IDS as string[]).includes(key) && typeof value === 'boolean')
  return entries.length && valid ? (Object.fromEntries(entries) as Partial<Settings>) : null
}
