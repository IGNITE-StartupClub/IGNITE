export const prerender = false

import type { APIRoute } from 'astro'
import { berlinDay } from '../../../lib/contacts'
import { isJsonRequest } from '../../../lib/memberAuth'
import { reply } from '../../../lib/memberSession'
import { parseEntry, parseNewPerson, parseOrg, parseTag, type OrgFields, type Viewer } from '../../../lib/network'
import {
  addEntry,
  completeNextStep,
  createPerson,
  createTag,
  deleteOrg,
  deletePerson,
  deleteTag,
  mergeTag,
  networkRevision,
  networkState,
  removeEntry,
  renameTag,
  saveOrg,
  savePerson,
} from '../../../lib/networkStore'
import { logError } from '../../../lib/errorLog'

const viewerOf = (member: App.Locals['member']): Viewer => ({ id: member!.id, role: member!.role, position: member!.position })

/** The island's regular check: the same revision comes back while nothing changed, otherwise the whole state. */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const revision = await networkRevision()
    if (url.searchParams.get('revision') === revision) return reply(200, { revision })
    return reply(200, await networkState(viewerOf(locals.member)))
  } catch (err) {
    await logError('Network read failed', err)
    return reply(500, { code: 'error', message: 'Fehler im Netzwerk' })
  }
}

const STATUS: Record<string, number> = { invalid: 400, forbidden: 403, unknown: 404, duplicate: 409 }

/**
 * The Netzwerk of the members area (NetworkDirectory island). Body: { action, ... }:
 * - 'create' { person }: an external contact or an alumnus without a login (parseNewPerson)
 * - 'save' { id, person }: the changed fields of a person; the store checks them against the person's kind and rights
 * - 'delete' { id }, 'entry' { id, entry }, 'removeEntry' { id, entryId }, 'done' { id }: as the CRM had them
 * - 'saveOrg' { id?, org }, 'deleteOrg' { id }
 * - 'tag' { tag: { category, label } }: adds to the pool (or finds the tag of that name) and answers its id
 * - 'renameTag' { id, label }, 'mergeTag' { id, into }, 'deleteTag' { id }: admins only
 * Answers with { code, id?, ...networkState } so the island shows the current state. What a viewer may not see never
 * leaves the server (network.ts viewFor).
 */
export const POST: APIRoute = async ({ request, locals }) => {
  if (!isJsonRequest(request.headers.get('content-type'))) {
    return reply(415, { message: 'Erwartet JSON.' })
  }
  try {
    const viewer = viewerOf(locals.member)
    let body: Record<string, unknown> = {}
    try {
      body = await request.json()
    } catch {
      // Unparsable JSON ends as the invalid request below.
    }
    const { action } = body
    const id = typeof body.id === 'string' && body.id ? body.id : null

    let code: string
    let savedId: string | null = null
    const take = (result: string | { id: string; code?: string }, fallback: string) => {
      if (typeof result === 'string') return result
      savedId = result.id
      return result.code ?? fallback
    }
    if (action === 'create') {
      const parsed = parseNewPerson(body.person)
      if (!parsed) return invalid()
      code = take(await createPerson(parsed.kind, parsed.fields, viewer), 'saved')
    } else if (action === 'save' && id) {
      code = take(await savePerson(id, body.person, viewer), 'saved')
    } else if (action === 'delete' && id) {
      code = await deletePerson(id, viewer)
    } else if (action === 'entry' && id) {
      const entry = parseEntry(body.entry)
      if (!entry) return invalid()
      code = (await addEntry(id, entry, viewer)) ? 'entryAdded' : 'unknown'
    } else if (action === 'done' && id) {
      code = (await completeNextStep(id, berlinDay(Date.now()), viewer)) ? 'done' : 'unknown'
    } else if (action === 'removeEntry' && id && typeof body.entryId === 'string') {
      code = await removeEntry(id, body.entryId, viewer)
    } else if (action === 'saveOrg') {
      const org = parseOrg(body.org, !id)
      if (!org) return invalid()
      code = take(await saveOrg(id, org as Partial<OrgFields>, viewer), 'orgSaved')
    } else if (action === 'deleteOrg' && id) {
      code = await deleteOrg(id, viewer)
      if (code === 'deleted') code = 'orgDeleted'
    } else if (action === 'tag') {
      const tag = parseTag(body.tag)
      if (!tag) return invalid()
      code = take(await createTag(tag.category, tag.label, viewer), 'tagAdded')
    } else if (action === 'renameTag' && id) {
      const tag = parseTag({ category: 'skills', label: body.label })
      if (!tag) return invalid()
      code = await renameTag(id, tag.label, viewer)
      if (code === 'saved') code = 'tagRenamed'
    } else if (action === 'mergeTag' && id && typeof body.into === 'string') {
      code = await mergeTag(id, body.into, viewer)
    } else if (action === 'deleteTag' && id) {
      code = await deleteTag(id, viewer)
      if (code === 'deleted') code = 'tagDeleted'
    } else {
      return invalid()
    }
    return reply(STATUS[code] ?? 200, { code, id: savedId, ...(await networkState(viewer)) })
  } catch (err) {
    await logError('Network action failed', err)
    return reply(500, { code: 'error', message: 'Fehler im Netzwerk' })
  }
}

const invalid = () => reply(400, { code: 'invalid', message: 'Ungültige Anfrage.' })
