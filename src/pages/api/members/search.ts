export const prerender = false

import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { getCopy } from '../../../data/copy'
import { teamNames } from '../../../data/openTeams'
import { alumniState, contactState } from '../../../lib/contactsStore'
import { resolveLocale } from '../../../lib/i18n'
import { memberPagePath } from '../../../lib/memberAuth'
import { buildSearchIndex } from '../../../lib/memberSearch'
import { reply } from '../../../lib/memberSession'
import { loadTaskEvents } from '../../../lib/taskEvents'
import { sessionActor, workspaceState } from '../../../lib/tasksStore'

/**
 * The index of the header search: what this member may see, once per opening (see src/lib/memberSearch.ts). Events are
 * missing from it while Luma is down, which only makes the search find less.
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const member = locals.member!
    const locale = resolveLocale(url.searchParams.get('locale') ?? undefined)
    const { memberArea, openTeams, listingPages } = getCopy(locale)
    const [workspace, { contacts }, { alumni }, { events }, materials] = await Promise.all([
      workspaceState(sessionActor(member)),
      contactState(member),
      alumniState(member),
      loadTaskEvents(locale),
      getCollection('materials'),
    ])
    const names = teamNames(openTeams)
    const items = buildSearchIndex(
      {
        projects: workspace.projects,
        privateTasks: workspace.privateTasks,
        members: workspace.members,
        contacts,
        alumni,
        events,
        guides: materials.map(({ id, data }) => ({ id, title: data.title, description: data.description })),
      },
      {
        locale,
        paths: {
          tasks: memberPagePath('tasks', locale),
          crm: memberPagePath('crm', locale),
          alumni: memberPagePath('alumni', locale),
          guide: listingPages.materials.path,
        },
        teamNames: names,
        privateLabel: memberArea.search.private,
      },
    )
    return reply(200, { items, teams: Object.entries(names).map(([id, name]) => ({ id, name })) })
  } catch (err) {
    console.error('Search index failed:', err)
    return reply(500, { code: 'error', message: 'Fehler bei der Suche' })
  }
}
