// 1. Import utilities from `astro:content`
import { defineCollection, z } from 'astro:content'

// 2. Import loader(s)
import { glob } from 'astro/loaders'
import { editionProblems } from './lib/startupWeek.ts'

// 3. Define your collection(s)
const newsSchema = z.object({
  title: z.string(),
  author: z.string(),
  description: z.string(),
  date: z.date(),
  image: z.string(),
  video: z.object({ src: z.string(), poster: z.string() }).optional(),
  instagram: z.string().url().optional(),
})

// News articles. German files live in projects/, their English translations in projects/en/ under the same file name.
const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: newsSchema,
})

const projectsEn = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects/en' }),
  schema: newsSchema,
})

const events = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    image: z.string().optional(),
    author: z.string(),
    author_title: z.string(),
    avatar: z.string().optional(),
    date: z.string(), // Ideally ISO format
    time: z.string(),
    register_url: z.string().url().optional(),
  })
})


const materials = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/materials' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // Accept both quoted strings and unquoted YAML dates
    date: z.union([z.string(), z.date()]).transform((v) =>
      v instanceof Date ? v.toISOString().split('T')[0] : v
    ),
    tag: z.string().optional().default('Ressource'),
    image: z.string().optional(),
    author: z.string().optional(),
  }),
})

// "Deine Startup-Woche" (/startup-woche): one file per week, named after its Monday (2026-11-09.json).
// Each event carries its German and English text; links go straight to the registration.
const startupWeekText = z.object({
  title: z.string().min(1),
  text: z.string().min(1),
  place: z.string().min(1),
  note: z.string().min(1).optional(),
})
const startupWeek = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/startupWeek' }),
  schema: z
    .object({
      start: z.string(),
      events: z
        .array(
          z.object({
            date: z.string(),
            time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
            emoji: z.string().optional(),
            host: z.string().min(1),
            url: z.string().url(),
            de: startupWeekText,
            en: startupWeekText,
          }),
        )
        .min(1),
    })
    .superRefine((edition, context) => {
      for (const message of editionProblems(edition.start, edition.events.map((event) => event.date))) context.addIssue({ code: 'custom', message })
    }),
})

// 4. Export a single `collections` object to register you collection(s)
export const collections = { projects, projectsEn, events, materials, startupWeek }
