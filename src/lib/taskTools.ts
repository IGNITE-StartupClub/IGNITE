/**
 * The tools an AI assistant gets on the tasks module (served by pages/api/mcp.ts). Reading covers the member's tasks,
 * projects and events, writing only creating and changing tasks. Nothing deletes or archives, and tasks go to the member
 * alone, because task texts from other members reach the model and could steer it. Outcomes and input rules are the same
 * as on the board. Without database access: the route passes the store in, so node --test can load this module.
 */
import { ToolError, type McpTool } from './mcp.ts'
import {
  ALL_TEAMS,
  berlinDay,
  filterProjects,
  isRecordId,
  parseProject,
  parseTask,
  parseTaskPatch,
  PRIORITIES,
  progress,
  scopedTasks,
  sortTasks,
  TASK_STATUSES,
  type ProjectFields,
  type ProjectState,
  type TaskFields,
  type TaskPatch,
  type TaskState,
} from './tasks.ts'

type ToolProject = Omit<ProjectState, 'tasks'> & {
  description: string
  event: { id: string } | null
  tasks: (TaskState & { description: string })[]
}

interface ToolEvent {
  id: string
  title: string
  startAt: Date
  endAt: Date
  location: string | null
  url: string
}

export interface TaskToolStore {
  workspace(): Promise<{ projects: ToolProject[]; members: { id: string; name: string; team: string }[] }>
  events(): Promise<{ events: ToolEvent[]; complete: boolean }>
  addTask(projectId: string, task: TaskFields): Promise<string>
  updateTask(projectId: string, taskId: string, patch: TaskPatch): Promise<string>
  /** A task without a project is a card of its own on the board; returns the card's id. */
  createSingleTask(project: ProjectFields, task: TaskFields): Promise<string>
}

const READ = { readOnlyHint: true, openWorldHint: false }
const WRITE = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }

const NOT_FOUND = 'Projekt oder Aufgabe nicht gefunden. Hole die Kennungen mit my_tasks oder get_project.'
const INVALID_TASK = 'Die Angaben sind ungültig. Titel bis 200 Zeichen, Frist als YYYY-MM-DD.'

const field = (description: string, extra: Record<string, unknown> = {}) => ({ type: 'string', description, ...extra })
const schema = (properties: Record<string, unknown>, required: string[] = []) => ({
  type: 'object',
  properties,
  required,
  additionalProperties: false,
})

const DUE = field('Frist als YYYY-MM-DD, leer für keine Frist')
const PRIORITY = field('Priorität', { enum: PRIORITIES })

function recordId(value: unknown): string {
  if (!isRecordId(value)) throw new ToolError(NOT_FOUND)
  return value
}

function checkOutcome(outcome: string) {
  if (outcome === 'unknown') throw new ToolError(NOT_FOUND)
  if (outcome === 'full') throw new ToolError('Das Projekt hat schon die größtmögliche Zahl an Aufgaben.')
  if (outcome !== 'ok') throw new Error(`Unexpected task outcome: ${outcome}`)
}

export function taskTools(me: string, store: TaskToolStore, now: () => number = Date.now): McpTool[] {
  const today = () => berlinDay(now())

  return [
    {
      name: 'my_tasks',
      title: 'Meine Aufgaben',
      description:
        'Die offenen Aufgaben des Mitglieds ohne seine privaten Aufgaben, früheste Frist zuerst. group ist overdue (überfällig), week (diese Woche), later oder none (ohne Frist).',
      inputSchema: schema({}),
      annotations: READ,
      run: async () => {
        const { projects } = await store.workspace()
        const scope = { team: ALL_TEAMS, myTeam: '', onlyMine: true, query: '' }
        const tasks = sortTasks(scopedTasks(projects, scope, me, today()).filter((task) => !task.done))
        return {
          today: today(),
          tasks: tasks.map((task) => ({
            project_id: task.projectId,
            project: task.projectTitle,
            task_id: task.id,
            title: task.title,
            due: task.due,
            priority: task.priority,
            status: task.status,
            group: task.group,
          })),
        }
      },
    },
    {
      name: 'list_projects',
      title: 'Projekte',
      description:
        'Die laufenden Projekte des Clubs mit Status und Fortschritt, wahlweise nur die eigenen oder nach Stichwort gefiltert.',
      inputSchema: schema({
        query: field('Stichwort in Projekt- oder Aufgabentitel'),
        only_mine: { type: 'boolean', description: 'Nur Projekte, an denen das Mitglied beteiligt ist' },
      }),
      annotations: READ,
      run: async ({ query, only_mine }) => {
        const { projects } = await store.workspace()
        const filters = {
          team: ALL_TEAMS,
          myTeam: '',
          onlyMine: only_mine === true,
          query: typeof query === 'string' ? query : '',
          archived: false,
        }
        return {
          projects: filterProjects(projects, filters, me).map((project) => ({
            project_id: project.id,
            title: project.title,
            type: project.type,
            status: project.status,
            due: project.due,
            event_day: project.eventDay,
            progress: progress(project.tasks),
          })),
        }
      },
    },
    {
      name: 'get_project',
      title: 'Projekt ansehen',
      description: 'Ein Projekt mit Beschreibung, Verantwortlichen und allen Aufgaben.',
      inputSchema: schema({ project_id: field('Kennung des Projekts') }, ['project_id']),
      annotations: READ,
      run: async ({ project_id }) => {
        const id = recordId(project_id)
        const { projects, members } = await store.workspace()
        const project = projects.find((item) => item.id === id)
        if (!project) throw new ToolError(NOT_FOUND)
        const names = (ids: string[]) =>
          ids.flatMap((memberId) => members.find((member) => member.id === memberId)?.name ?? [])
        return {
          project_id: project.id,
          title: project.title,
          description: project.description,
          type: project.type,
          status: project.status,
          due: project.due,
          event_day: project.eventDay,
          leads: names(project.leads),
          tasks: project.tasks.map((task) => ({
            task_id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            due: task.due,
            priority: task.priority,
            assignees: names(task.assignees),
          })),
        }
      },
    },
    {
      name: 'upcoming_events',
      title: 'Kommende Events',
      description:
        'Die kommenden Events des Clubs, das nächste zuerst. project_id ist das Planungsprojekt, falls es eines gibt.',
      inputSchema: schema({}),
      annotations: READ,
      run: async () => {
        const [{ events, complete }, { projects }] = await Promise.all([store.events(), store.workspace()])
        if (!complete)
          throw new ToolError('Der Eventkalender ist gerade nicht erreichbar. Versuche es später noch einmal.')
        return {
          events: events
            .filter((event) => event.endAt.getTime() >= now())
            .map((event) => ({
              title: event.title,
              start: event.startAt.toISOString(),
              end: event.endAt.toISOString(),
              location: event.location,
              url: event.url,
              project_id: projects.find((project) => project.event?.id === event.id)?.id ?? null,
            })),
        }
      },
    },
    {
      name: 'create_task',
      title: 'Aufgabe anlegen',
      description:
        'Legt eine Aufgabe für das Mitglied an, mit project_id in diesem Projekt, sonst als einzelne Aufgabe.',
      inputSchema: schema(
        {
          title: field('Titel der Aufgabe'),
          description: field('Beschreibung'),
          due: DUE,
          priority: PRIORITY,
          project_id: field('Kennung des Projekts, wenn die Aufgabe in ein Projekt gehört'),
        },
        ['title'],
      ),
      annotations: WRITE,
      run: async ({ title, description, due, priority, project_id }) => {
        const task = parseTask({ title, description, due, priority, assignees: [me] })
        if (!task) throw new ToolError(INVALID_TASK)
        if (project_id !== undefined) {
          const id = recordId(project_id)
          checkOutcome(await store.addTask(id, task))
          return { created: task.title, project_id: id }
        }
        const { members } = await store.workspace()
        const project = parseProject({
          title: task.title,
          type: 'task',
          team: members.find((member) => member.id === me)?.team,
        })
        if (!project) throw new ToolError(INVALID_TASK)
        return { created: task.title, project_id: await store.createSingleTask(project, task) }
      },
    },
    {
      name: 'update_task',
      title: 'Aufgabe ändern',
      description: 'Ändert Titel, Beschreibung, Frist, Priorität oder Status einer Aufgabe. status done hakt sie ab.',
      inputSchema: schema(
        {
          project_id: field('Kennung des Projekts'),
          task_id: field('Kennung der Aufgabe'),
          title: field('Neuer Titel'),
          description: field('Neue Beschreibung'),
          due: DUE,
          priority: PRIORITY,
          status: field('Neuer Status', { enum: TASK_STATUSES }),
        },
        ['project_id', 'task_id'],
      ),
      annotations: WRITE,
      run: async ({ project_id, task_id, title, description, due, priority, status }) => {
        const changes = Object.entries({ title, description, due, priority, status }).filter(
          ([, value]) => value !== undefined,
        )
        const patch = parseTaskPatch(Object.fromEntries(changes))
        if (!patch) throw new ToolError(INVALID_TASK)
        checkOutcome(await store.updateTask(recordId(project_id), recordId(task_id), patch))
        return { updated: true, project_id, task_id }
      },
    },
  ]
}
