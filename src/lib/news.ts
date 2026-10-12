/**
 * News articles per locale. German articles live in the `projects` collection, English translations in `projectsEn`
 * (src/content/projects/en, same file name as the German original).
 */
import { getCollection, type CollectionEntry } from 'astro:content'
import { getCopy } from '../data/copy'
import type { Locale } from './i18n'

export type NewsEntry = CollectionEntry<'projects'> | CollectionEntry<'projectsEn'>

const collections = { de: 'projects', en: 'projectsEn' } as const

/** Articles of one locale, newest first. */
export async function getNews(locale: Locale): Promise<NewsEntry[]> {
  const entries = await getCollection(collections[locale])
  return entries.sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
}

const fileName = (entry: NewsEntry) => entry.filePath?.split('/').pop()

/** Static paths of the article detail route: the article plus the path of its translation (null if there is none). */
export async function getNewsArticlePaths(locale: Locale, otherLocale: Locale) {
  const translations = await getNews(otherLocale)
  const otherPath = getCopy(otherLocale).listingPages.news.path
  return (await getNews(locale)).map((project) => {
    const translation = translations.find((candidate) => fileName(candidate) === fileName(project))
    return {
      params: { project: project.id },
      props: { project, alternatePath: translation ? `${otherPath}/${translation.id}` : null },
    }
  })
}
