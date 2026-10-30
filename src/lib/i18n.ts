/**
 * Locale helpers. German is the default locale and has no URL prefix; English lives under /en/ (astro.config.mjs).
 * Page slugs that differ in English are listed in `englishSlugs` (German path -> English path segment).
 */
export const locales = ['de', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'de'

/** BCP 47 tags for Intl formatting. */
export const dateLocales: Record<Locale, string> = { de: 'de-DE', en: 'en-GB' }

const englishSlugs = new Map([
  ['mitmachen', 'join'],
  ['kontakt', 'contact'],
  ['materialien', 'materials'],
  ['mitglieder', 'members'],
  ['impressum', 'imprint'],
  ['datenschutz', 'privacy'],
  ['IGNITEWorkshops', 'workshops'],
])
const germanSlugs = new Map([...englishSlugs].map(([german, english]) => [english, german]))

export const resolveLocale = (value?: string): Locale => locales.find((locale) => locale === value) ?? defaultLocale

const replaceFirstSegment = (path: string, prefix: string, slugs: Map<string, string>) => {
  const [, first = '', ...rest] = path.split('/')
  return [prefix, slugs.get(first) ?? first, ...rest].join('/')
}

/** Maps a German site path (e.g. '/mitmachen') to the same page in `locale`. */
export const localizePath = (path: string, locale: Locale): string =>
  locale === defaultLocale ? path : replaceFirstSegment(path, '/en', englishSlugs)

/** Path of the equivalent page in `target`, derived from the current URL path. Detail pages with their own slugs need an explicit counterpart. */
export function switchLocalePath(pathname: string, target: Locale): string {
  const isEnglish = /^\/en(\/|$)/.test(pathname)
  const german = isEnglish ? replaceFirstSegment(pathname.replace(/^\/en/, '') || '/', '', germanSlugs) : pathname
  return localizePath(german, target)
}

export const formatDate = (date: Date | string, locale: Locale) =>
  new Date(date).toLocaleDateString(dateLocales[locale], { year: 'numeric', month: 'long', day: 'numeric' })
