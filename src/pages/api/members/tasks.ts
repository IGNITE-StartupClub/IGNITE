export const prerender = false

import type { APIRoute } from 'astro'
import { isJsonRequest } from '../../../lib/memberAuth'
import { saveName, saveTeam } from '../../../lib/members'
import { reply } from '../../../lib/memberSession'
import { addPrivateTask, removePrivateTask, restorePrivateTask, updatePrivateTask } from '../../../lib/privateTasksStore'
import { loadTaskEvents } from '../../../lib/taskEvents'
import {
  isRecordId,
  parseLessons,
  parseName,
  parseProject,
  parseProjectPatch,
  parseTask,
  parseTaskPatch,
  parseTeam,
  PROJECT_STATUSES,
  TITLE_MAX,
  type ProjectStatus,
} from '../../../lib/tasks'
import {
  addTask,
  archiveTemplate,
  createProject,
  deleteProject,
  keepEventApart,
  linkEvent,
  projectActivity,
  removeTask,
  reorderTasks,
  restoreTask,
  saveAsTemplate,
  saveLessons,
  sessionActor,
  setArchived,
  setStatus,
  templateTasks,
  unlinkEvent,
  updateProject,
  updateTask,
  workspaceChanges,
  workspaceRevision,
  workspaceState,
  type TemplateSource,
} from '../../../lib/tasksStore'

// Templates are not part of the changes, so these two answer with the whole state.
const TEMPLATE_ACTIONS = ['saveTemplate', 'archiveTemplate']

/**
 * What the TaskWorkspace island asks for without changing anything. ?revision=… is its regular check: the same revision
 * comes back while nothing changed, otherwise { changes }. This route runs most often of all, so its usual path reads
 * neither the member nor a project. ?activity=<project id> answers with { activity }, the project's log.
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const project = url.searchParams.get('activity')
    if (project !== null) {
      const activity = isRecordId(project) ? await projectActivity(project) : null
      return activity ? reply(200, { activity }) : reply(404, { code: 'unknown' })
    }
    const known = url.searchParams.get('revision')
    const revision = await workspaceRevision()
    if (known === revision) return reply(200, { revision })
    return reply(200, { changes: await workspaceChanges(sessionActor(locals.member!), known) })
  } catch (err) {
    console.error('Tasks read failed:', err)
    return reply(500, { code: 'error', message: 'Fehler bei den Aufgaben' })
  }
}

/**
 * The tasks module of the members area (TaskWorkspace island). Body: { action, revision?, … } with action
 * 'create' (project, status?, eventId?, template?, task?), 'update' (id, patch), 'status' (id, status),
 * 'archive' (id, archived), 'delete' (id), 'addTask' (id, task), 'updateTask' (id, taskId, patch),
 * 'removeTask' (id, taskId), 'restoreTask' (taskId), 'reorder' (id, order), 'lessons' (id, lessons),
 * 'saveTemplate' (id, name), 'archiveTemplate' (templateId), 'linkEvent' (id, eventId), 'keepEventApart' (id, eventId),
 * 'unlinkEvent' (id), 'name' (firstName, lastName), 'team' (team, the member's own), 'addPrivate' (task),
 * 'updatePrivate' (taskId, patch), 'removePrivate' (taskId) or 'restorePrivate' (taskId). Answers with { code, id?, changes } for the island's
 * `revision` and without either for a caller that sends none (the dashboard); a refused action comes with the whole
 * { state }, which is the island's rollback. Both carry the member's own private tasks. Every byte of an answer counts
 * as Fast Origin Transfer on Vercel. Rights: see tasksStore.ts and privateTasksStore.ts; every check runs here on the
 * server.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  if (!isJsonRequest(request.headers.get('content-type'))) {
    return reply(415, { message: 'Erwartet JSON.' })
  }
  try {
    const actor = sessionActor(locals.member!)
    let body: Record<string, unknown> = {}
    try {
      body = await request.json()
    } catch {
      // Unparsable JSON ends as the invalid request below.
    }
    const id = isRecordId(body.id) ? body.id : null
    const taskId = isRecordId(body.taskId) ? body.taskId : null
    const status = PROJECT_STATUSES.includes(body.status as ProjectStatus) ? (body.status as ProjectStatus) : null

    let code: string
    let createdId: string | null = null
    switch (body.action) {
      case 'create': {
        const fields = parseProject(body.project)
        if (!fields) return invalid()
        if (fields.type === 'event' && body.eventId === undefined && !fields.due) return invalid()
        const template = parseTemplateSource(body.template)
        if (template === undefined) return invalid()
        const task = fields.type === 'task' ? parseTask({ ...(body.task as object), title: fields.title }) : null
        if (fields.type === 'task' && !task) return invalid()
        let event = null
        if (body.eventId !== undefined) {
          if (fields.type !== 'event') return invalid()
          event = await publicEvent(body.eventId)
          if (!event) return reply(404, { code: 'unknown', state: await workspaceState(actor) })
        }
        const templateList = template && (await templateTasks(template))
        if (template && !templateList) return reply(404, { code: 'unknown', state: await workspaceState(actor) })
        const created = await createProject(actor, {
          fields,
          status: status ?? 'planned',
          event,
          template: templateList,
          task,
        })
        if (created === 'duplicate') return reply(409, { code: 'duplicate', state: await workspaceState(actor) })
        code = 'created'
        createdId = created.id
        break
      }
      case 'update': {
        const patch = parseProjectPatch(body.patch)
        if (!id || !patch) return invalid()
        code = await updateProject(actor, id, patch)
        break
      }
      case 'status':
        if (!id || !status) return invalid()
        code = await setStatus(actor, id, status)
        break
      case 'archive':
        if (!id || typeof body.archived !== 'boolean') return invalid()
        code = await setArchived(actor, id, body.archived)
        break
      case 'delete':
        if (!id) return invalid()
        code = await deleteProject(actor, id)
        break
      case 'addTask': {
        const task = parseTask(body.task)
        if (!id || !task) return invalid()
        code = await addTask(actor, id, task)
        break
      }
      case 'updateTask': {
        const patch = parseTaskPatch(body.patch)
        if (!id || !taskId || !patch) return invalid()
        code = await updateTask(actor, id, taskId, patch)
        break
      }
      case 'removeTask':
        if (!id || !taskId) return invalid()
        code = await removeTask(actor, id, taskId)
        break
      case 'restoreTask':
        if (!taskId) return invalid()
        code = await restoreTask(actor, taskId)
        break
      case 'linkEvent':
      case 'keepEventApart': {
        if (!id) return invalid()
        const event = await publicEvent(body.eventId)
        if (!event) return reply(404, { code: 'unknown', state: await workspaceState(actor) })
        code = body.action === 'linkEvent' ? await linkEvent(actor, id, event) : await keepEventApart(id, event.id)
        break
      }
      case 'unlinkEvent':
        if (!id) return invalid()
        code = await unlinkEvent(actor, id)
        break
      case 'reorder':
        if (!id || !Array.isArray(body.order) || !body.order.every(isRecordId)) return invalid()
        code = await reorderTasks(id, body.order)
        break
      case 'lessons': {
        const lessons = parseLessons(body.lessons)
        if (!id || !lessons) return invalid()
        code = await saveLessons(actor, id, lessons)
        break
      }
      case 'saveTemplate': {
        const name = typeof body.name === 'string' ? body.name.trim() : ''
        if (!id || !name || name.length > TITLE_MAX) return invalid()
        code = await saveAsTemplate(actor, id, name)
        break
      }
      case 'archiveTemplate':
        if (!isRecordId(body.templateId)) return invalid()
        code = await archiveTemplate(actor, body.templateId)
        break
      case 'addPrivate': {
        const task = parseTask(body.task)
        if (!task) return invalid()
        code = await addPrivateTask(actor.id, task)
        break
      }
      case 'updatePrivate': {
        const patch = parseTaskPatch(body.patch)
        if (!taskId || !patch || patch.assignees || patch.required !== undefined) return invalid()
        code = await updatePrivateTask(actor.id, taskId, patch)
        break
      }
      case 'removePrivate':
        if (!taskId) return invalid()
        code = await removePrivateTask(actor.id, taskId)
        break
      case 'restorePrivate':
        if (!taskId) return invalid()
        code = await restorePrivateTask(actor.id, taskId)
        break
      case 'name': {
        const name = parseName(body)
        if (!name) return invalid()
        await saveName(actor.email, name.firstName, name.lastName)
        code = 'ok'
        break
      }
      case 'team': {
        const team = parseTeam(body.team)
        if (team === null) return invalid()
        await saveTeam(actor.email, team)
        code = 'ok'
        break
      }
      default:
        return invalid()
    }
    const statusCode = { invalid: 400, unknown: 404, forbidden: 403, full: 409, privateFull: 409, crowded: 409, duplicate: 409 }[code] ?? 200
    if (statusCode !== 200 || TEMPLATE_ACTIONS.includes(body.action as string)) {
      return reply(statusCode, { code, id: createdId, state: await workspaceState(actor) })
    }
    return reply(200, {
      code,
      id: createdId,
      ...(typeof body.revision === 'string' && { changes: await workspaceChanges(actor, body.revision) }),
    })
  } catch (err) {
    console.error('Tasks action failed:', err)
    return reply(500, { code: 'error', message: 'Fehler bei den Aufgaben' })
  }
}

const publicEvent = async (id: unknown) => {
  const { events } = await loadTaskEvents('de')
  return events.find((event) => event.id === id) ?? null
}

/** null without a template, undefined when the given one is malformed. */
function parseTemplateSource(input: unknown): TemplateSource | null | undefined {
  if (input === undefined || input === null) return null
  if (typeof input !== 'object') return undefined
  const { kind, id, include } = input as Record<string, unknown>
  if ((kind !== 'template' && kind !== 'project') || !isRecordId(id)) return undefined
  if (include !== undefined && !(Array.isArray(include) && include.every((index) => Number.isInteger(index) && index >= 0))) {
    return undefined
  }
  return { kind, id, include: (include as number[] | undefined) ?? null }
}

const invalid = () => reply(400, { code: 'invalid', message: 'Ungültige Anfrage.' })

