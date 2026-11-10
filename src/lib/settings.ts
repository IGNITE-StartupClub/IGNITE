/**
 * Switches of the members area that admins flip for everyone (AdminSettings island, /api/members/settings), stored by
 * settingsStore.ts, and the ones each admin flips for themselves. No imports, so node --test can load this module.
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

/**
 * Switches each admin flips only for themselves, stored on their own member document (members.ts), on the page
 * "Systemzustand" (ErrorBoard island) through the same endpoint.
 */
export const PERSONAL_DEFAULTS = {
  /** The daily report of server errors (errorReportMail.ts). Off, so nobody gets technical mails unasked. */
  errorMails: false,
}
export type PersonalSettingId = keyof typeof PERSONAL_DEFAULTS
export type PersonalSettings = Record<PersonalSettingId, boolean>
export const PERSONAL_SETTING_IDS = Object.keys(PERSONAL_DEFAULTS) as PersonalSettingId[]

function parseSwitches<T extends string>(input: unknown, ids: readonly T[]): Partial<Record<T, boolean>> | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null
  const entries = Object.entries(input)
  const valid = entries.every(([key, value]) => (ids as readonly string[]).includes(key) && typeof value === 'boolean')
  return entries.length && valid ? (Object.fromEntries(entries) as Partial<Record<T, boolean>>) : null
}

/** The switches a request flips, e.g. { connections: true }; null unless it names at least one and only known ones. */
export const parseSettingsChange = (input: unknown): Partial<Settings> | null => parseSwitches(input, SETTING_IDS)

/** The admin's own switches a request flips, e.g. { errorMails: true }; null like parseSettingsChange. */
export const parsePersonalChange = (input: unknown): Partial<PersonalSettings> | null =>
  parseSwitches(input, PERSONAL_SETTING_IDS)
