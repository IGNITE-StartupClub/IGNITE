/**
 * Small date and name helpers of the members area islands, shared by the Netzwerk, the tasks module and the forms.
 * The rules of the Netzwerk itself live in network.ts. No imports, so node --test can load it directly.
 */

/** Today in Berlin as YYYY-MM-DD, so the server and the browser agree on what is due. */
export const berlinDay = (now: number): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date(now))

/** "24. Juni 2025" / "24 Jun 2025" for a YYYY-MM-DD day. */
export const formatDay = (value: string, locale: string): string =>
  new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'de', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`))

/** "AB" for "Anna Beispiel", "A" for "Anna". */
export const initials = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return words.length > 1 ? words[0][0] + words[words.length - 1][0] : (words[0]?.[0] ?? '?')
}
