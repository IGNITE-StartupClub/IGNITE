// 1. Import utilities from `astro:content`
import { defineCollection, z } from 'astro:content'

// 2. Import loader(s)
import { glob } from 'astro/loaders'

// 3. Define your collection(s)
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    author: z.string(),
    description: z.string(),
    date: z.date(),
    image: z.string(),
  }),
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


// 4. Export a single `collections` object to register you collection(s)
export const collections = { projects, events }
