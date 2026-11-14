/**
 * Parses the Guide request (POST /api/guide): the chosen knowledge packages and the person's details.
 * Pure and without local imports, so `node --test` can run guideRequest.test.ts. Package ids come from the caller.
 */

export const OCCUPATIONS = ['study', 'work', 'other'] as const
export type Occupation = (typeof OCCUPATIONS)[number]

export interface GuideRequest {
  packages: string[]
  name: string
  email: string
  occupation: Occupation | ''
  // Only set for `work`.
  company: string
  field: string
  // Only set for `study`.
  university: string
  program: string
  whatsapp: boolean
  locale: 'de' | 'en'
}

export type GuideParseResult = { ok: true; request: GuideRequest } | { ok: false; problem: string }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const NAME_MAX = 120
export const TEXT_MAX = 150

const text = (value: unknown, max: number): string | null => {
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') return null
  const trimmed = value.replace(/\s+/g, ' ').trim()
  return trimmed.length > max ? null : trimmed
}

export function parseGuideRequest(body: unknown, packageIds: readonly string[]): GuideParseResult {
  if (!body || typeof body !== 'object') return { ok: false, problem: 'body' }
  const data = body as Record<string, unknown>

  // Hidden field that people never see; bots fill every input.
  if (typeof data.website === 'string' && data.website.trim() !== '') return { ok: false, problem: 'honeypot' }

  if (!Array.isArray(data.packages)) return { ok: false, problem: 'packages' }
  const packages = packageIds.filter((id) => (data.packages as unknown[]).includes(id))
  if (packages.length === 0 || packages.length !== data.packages.length) return { ok: false, problem: 'packages' }

  const name = text(data.name, NAME_MAX)
  if (!name) return { ok: false, problem: 'name' }

  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : ''
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) return { ok: false, problem: 'email' }

  if (data.consent !== true) return { ok: false, problem: 'consent' }

  const occupation = data.occupation ?? ''
  if (occupation !== '' && !OCCUPATIONS.includes(occupation as Occupation)) return { ok: false, problem: 'occupation' }

  const company = text(data.company, TEXT_MAX)
  const field = text(data.field, TEXT_MAX)
  const university = text(data.university, TEXT_MAX)
  const program = text(data.program, TEXT_MAX)
  if (company === null || field === null || university === null || program === null) return { ok: false, problem: 'details' }

  return {
    ok: true,
    request: {
      packages,
      name,
      email,
      occupation: occupation as Occupation | '',
      // Details of the other choice stay behind when someone switches, so only the chosen one counts.
      company: occupation === 'work' ? company : '',
      field: occupation === 'work' ? field : '',
      university: occupation === 'study' ? university : '',
      program: occupation === 'study' ? program : '',
      whatsapp: data.whatsapp === true,
      locale: data.locale === 'en' ? 'en' : 'de',
    },
  }
}
