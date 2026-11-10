export const prerender = false

import type { APIRoute } from 'astro'
import { berlinDay, parseContact, parseContactPatch, parseEntry, type ContactFields } from '../../../lib/contacts'
import {
  addEntry,
  completeNextStep,
  contactsRevision,
  contactState,
  createContact,
  deleteContact,
  removeEntry,
  updateContact,
} from '../../../lib/contactsStore'
import { isJsonRequest } from '../../../lib/memberAuth'
import { currentMember, reply } from '../../../lib/memberSession'
import { logError } from '../../../lib/errorLog'

/** The island's regular check: the same revision comes back while nothing changed, otherwise the list. */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const revision = await contactsRevision()
    if (url.searchParams.get('revision') === revision) return reply(200, { revision })
    return reply(200, await contactState(locals.member!))
  } catch (err) {
    await logError('CRM read failed', err)
    return reply(500, { code: 'error', message: 'Fehler im CRM' })
  }
}

/**
 * The CRM of the members area (CrmBoard island). Body: { action, id?, contact?, entry?, entryId? } with action
 * 'save' (a whole contact without id, otherwise only the changed fields), 'delete', 'entry' (log a mail, meeting, event
 * or note), 'removeEntry' or 'done' (log the next step as done and clear it). Answers with { code, revision, contacts,
 * id? } so the island shows the current list.
 * Every member may use it; deleting a contact or an entry is up to admins and whoever created it. A second contact
 * with an email address that is already in the CRM is refused with 409 'duplicate'.
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isJsonRequest(request.headers.get('content-type'))) {
    return reply(415, { message: 'Erwartet JSON.' })
  }
  try {
    const member = await currentMember(cookies)
    if (!member) {
      return reply(401, { code: 'session', message: 'Nicht angemeldet.' })
    }
    let body: Record<string, unknown> = {}
    try {
      body = await request.json()
    } catch {
      // Unparsable JSON ends as the invalid request below.
    }
    const { action } = body
    const id = typeof body.id === 'string' && body.id ? body.id : null

    let status = 200
    let code: string
    let savedId: string | null = null
    if (action === 'save') {
      const contact = id ? parseContactPatch(body.contact) : parseContact(body.contact)
      if (!contact) return invalid()
      const saved = id ? await updateContact(id, contact, member) : await createContact(contact as ContactFields, member)
      code = typeof saved === 'string' ? saved : 'saved'
      savedId = typeof saved === 'string' ? null : saved.id
    } else if (action === 'entry' && id) {
      const entry = parseEntry(body.entry)
      if (!entry) return invalid()
      code = (await addEntry(id, entry, member)) ? 'entryAdded' : 'unknown'
    } else if (action === 'done' && id) {
      code = (await completeNextStep(id, berlinDay(Date.now()), member)) ? 'done' : 'unknown'
    } else if (action === 'removeEntry' && id && typeof body.entryId === 'string') {
      code = await removeEntry(id, body.entryId, member)
    } else if (action === 'delete' && id) {
      code = await deleteContact(id, member)
    } else {
      return invalid()
    }
    if (code === 'unknown') status = 404
    if (code === 'forbidden') status = 403
    if (code === 'duplicate') status = 409
    return reply(status, { code, id: savedId, ...(await contactState(member)) })
  } catch (err) {
    await logError('CRM action failed', err)
    return reply(500, { code: 'error', message: 'Fehler im CRM' })
  }
}

const invalid = () => reply(400, { code: 'invalid', message: 'Ungültige Anfrage.' })
