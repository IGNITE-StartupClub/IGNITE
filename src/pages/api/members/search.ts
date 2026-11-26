export const prerender = false

import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { getCopy } from '../../../data/copy'
import { teamNames } from '../../../data/openTeams'
import { networkSearchSources } from '../../../lib/networkStore'
import { resolveLocale } from '../../../lib/i18n'
import { memberPagePath } from '../../../lib/memberAuth'
import { buildSearchIndex } from '../../../lib/memberSearch'
import { reply } from '../../../lib/memberSession'
import { loadTaskEvents } from '../../../lib/taskEvents'
import { isEvent } from '../../../lib/tasks'
import { sessionActor, workspaceState } from '../../../lib/tasksStore'
import { logError } from '../../../lib/errorLog'

/**
 * The index of the header search: what this member may see, once per opening (see src/lib/memberSearch.ts). Events are
 * missing from it while Luma is down, which only makes the search find less.
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const member = locals.member!
    const locale = resolveLocale(url.searchParams.get('locale') ?? undefined)
    const { memberArea, openTeams, listingPages } = getCopy(locale)
    const [workspace, { people, orgs }, { events }, materials] = await Promise.all([
      workspaceState(sessionActor(member)),
      networkSearchSources({ id: member.id, role: member.role, position: member.position }),
      loadTaskEvents(locale),
      getCollection('materials'),
    ])
    const names = teamNames(openTeams)
    const items = buildSearchIndex(
      {
        projects: workspace.projects,
        privateTasks: workspace.privateTasks,
        members: workspace.members,
        people,
        orgs,
        events: events.filter(isEvent),
        guides: materials.map(({ id, data }) => ({ id, title: data.title, description: data.description })),
      },
      {
        locale,
        paths: {
          tasks: memberPagePath('tasks', locale),
          network: memberPagePath('network', locale),
          organisations: memberPagePath('organisations', locale),
          guide: listingPages.materials.path,
        },
        teamNames: names,
        privateLabel: memberArea.search.private,
      },
    )
    return reply(200, { items, teams: Object.entries(names).map(([id, name]) => ({ id, name })) })
  } catch (err) {
    await logError('Search index failed', err)
    return reply(500, { code: 'error', message: 'Fehler bei der Suche' })
  }
}
