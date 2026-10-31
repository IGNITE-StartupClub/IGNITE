export const prerender = false

import type { APIRoute } from 'astro'
import { isJsonRequest } from '../../../lib/memberAuth'
import { saveName } from '../../../lib/members'
import { currentMember, reply } from '../../../lib/memberSession'
import { loadTaskEvents } from '../../../lib/taskEvents'
import {
  isRecordId,
  parseLessons,
  parseName,
  parseProject,
  parseTask,
  parseTaskPatch,
  PROJECT_STATUSES,
  TITLE_MAX,
  type ProjectStatus,
} from '../../../lib/tasks'
import {
  addTask,
  archiveTemplate,
  createProject,
  deleteProject,
  removeTask,
  reorderTasks,
  saveAsTemplate,
  saveLessons,
  setArchived,
  setStatus,
  taskActor,
  templateTasks,
  updateProject,
  updateTask,
  workspaceState,
  type TemplateSource,
} from '../../../lib/tasksStore'

/**
 * The tasks module of the members area (TaskWorkspace island). Body: { action, … } with action
 * 'create' (project, status?, eventId?, template?, task?), 'update' (id, project), 'status' (id, status),
 * 'archive' (id, archived), 'delete' (id), 'addTask' (id, task), 'updateTask' (id, taskId, patch),
 * 'removeTask' (id, taskId), 'reorder' (id, order), 'lessons' (id, lessons), 'saveTemplate' (id, name),
 * 'archiveTemplate' (templateId) or 'name' (firstName, lastName). Answers with { code, id?, state } so the island
 * shows the current projects of everyone. Rights: see tasksStore.ts; every check runs here on the server.
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isJsonRequest(request.headers.get('content-type'))) {
    return reply(415, { message: 'Erwartet JSON.' })
  }
  try {
    const session = await currentMember(cookies)
    const actor = session && (await taskActor(session))
    if (!actor) return reply(401, { code: 'session', message: 'Nicht angemeldet.' })
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
        const template = parseTemplateSource(body.template)
        if (template === undefined) return invalid()
        const task = fields.type === 'task' ? parseTask({ ...(body.task as object), title: fields.title }) : null
        if (fields.type === 'task' && !task) return invalid()
        let event = null
        if (body.eventId !== undefined) {
          if (fields.type !== 'event' || typeof body.eventId !== 'string') return invalid()
          const { events } = await loadTaskEvents('de')
          event = events.find((item) => item.id === body.eventId) ?? null
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
        const fields = parseProject(body.project)
        if (!id || !fields) return invalid()
        code = await updateProject(actor, id, { title: fields.title, description: fields.description, due: fields.due, leads: fields.leads })
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
      case 'name': {
        const name = parseName(body)
        if (!name) return invalid()
        await saveName(actor.email, name.firstName, name.lastName)
        code = 'ok'
        break
      }
      default:
        return invalid()
    }
    const statusCode = { unknown: 404, forbidden: 403, full: 409 }[code] ?? 200
    return reply(statusCode, { code, id: createdId, state: await workspaceState(actor) })
  } catch (err) {
    console.error('Tasks action failed:', err)
    return reply(500, { code: 'error', message: 'Fehler bei den Aufgaben' })
  }
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

