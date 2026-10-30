/**
 * Routing for the guide inside the members area (pages/mitglieder/guide/[...path].astro and
 * pages/en/members/guide/[...path].astro). The public guide is prerendered with paginate(); the members copy renders
 * on demand, so it builds the same page object itself. No imports, so node --test can load it directly.
 */

export const GUIDE_PAGE_SIZE = 9

/** The fields of Astro's paginate() page that MaterialsListPage and Pagination read. */
export interface GuidePage<T> {
  data: T[]
  start: number
  end: number
  size: number
  total: number
  currentPage: number
  lastPage: number
  url: {
    current: string
    prev: string | undefined
    next: string | undefined
    first: string | undefined
    last: string | undefined
  }
}

export type GuideRoute<T> = { kind: 'list'; page: GuidePage<T> } | { kind: 'material'; material: T } | null

/**
 * What `path` (the rest after the guide root) shows: '' and page numbers are list pages, anything else a material id.
 * Null for page numbers past the end and unknown ids; `materials` must already be sorted.
 */
export function resolveGuide<T extends { id: string }>(
  path: string | undefined,
  materials: T[],
  base: string,
): GuideRoute<T> {
  const segment = (path ?? '').replace(/\/$/, '')
  if (segment && !/^\d+$/.test(segment)) {
    const material = materials.find((item) => item.id === segment)
    return material ? { kind: 'material', material } : null
  }
  const currentPage = segment ? Number(segment) : 1
  const lastPage = Math.max(1, Math.ceil(materials.length / GUIDE_PAGE_SIZE))
  // "/guide/1" would duplicate the root, like paginate() does not create it either.
  if (currentPage < 1 || currentPage > lastPage || segment === '1') return null
  const start = (currentPage - 1) * GUIDE_PAGE_SIZE
  const pageUrl = (n: number) => (n === 1 ? base : `${base}/${n}`)
  return {
    kind: 'list',
    page: {
      data: materials.slice(start, start + GUIDE_PAGE_SIZE),
      start,
      end: Math.min(start + GUIDE_PAGE_SIZE, materials.length) - 1,
      size: GUIDE_PAGE_SIZE,
      total: materials.length,
      currentPage,
      lastPage,
      url: {
        current: pageUrl(currentPage),
        prev: currentPage > 1 ? pageUrl(currentPage - 1) : undefined,
        next: currentPage < lastPage ? pageUrl(currentPage + 1) : undefined,
        first: currentPage > 1 ? base : undefined,
        last: currentPage < lastPage ? pageUrl(lastPage) : undefined,
      },
    },
  }
}
