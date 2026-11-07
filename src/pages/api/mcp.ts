export const prerender = false

import type { APIRoute } from 'astro'
import { bearerChallenge, mcpResource } from '../../lib/connections'
import { connectedMember } from '../../lib/connectionsStore'
import { handleMessage, isAllowedOrigin, isSupportedVersion } from '../../lib/mcp'
import { isJsonRequest } from '../../lib/memberAuth'
import { loadTaskEvents } from '../../lib/taskEvents'
import { addTask, createProject, sessionActor, updateTask, workspaceState, type TaskActor } from '../../lib/tasksStore'
import { taskTools, type TaskToolStore } from '../../lib/taskTools'

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })

const rpcError = (status: number, code: number, message: string, id: unknown = null) =>
  json(status, { jsonrpc: '2.0', id, error: { code, message } })

const toolStore = (actor: TaskActor, team: string): TaskToolStore => ({
  team,
  workspace: () => workspaceState(actor),
  events: () => loadTaskEvents('de'),
  addTask: (id, fields) => addTask(actor, id, fields),
  updateTask: (id, taskId, patch) => updateTask(actor, id, taskId, patch),
  createSingleTask: async (fields, task) => {
    const created = await createProject(actor, { fields, status: 'planned', event: null, template: null, task })
    if (created === 'duplicate') throw new Error('A single task has no event, so it cannot be a duplicate')
    return created.id
  },
})

/**
 * The MCP endpoint for AI assistants: Streamable HTTP without sessions, every POST is answered on its own with JSON.
 * The access token is checked first, so a client without one gets the 401 that starts the sign-in, whatever it sent.
 */
export const ALL: APIRoute = async ({ request, url }) => {
  let message: unknown = null
  try {
    const token = /^Bearer (\S+)$/i.exec(request.headers.get('authorization') ?? '')?.[1]
    const member = token ? await connectedMember(token, mcpResource(url.origin)) : null
    if (!member) {
      return new Response(null, { status: 401, headers: { 'WWW-Authenticate': bearerChallenge(url.origin, !!token) } })
    }
    const actor = sessionActor(member)
    if (!isAllowedOrigin(request.headers.get('origin'), url.origin)) return rpcError(403, -32000, 'Origin not allowed')
    if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } })
    if (!isSupportedVersion(request.headers.get('mcp-protocol-version'))) {
      return rpcError(400, -32000, 'Unsupported protocol version')
    }
    if (!isJsonRequest(request.headers.get('content-type'))) return rpcError(415, -32000, 'Expected JSON')
    try {
      message = await request.json()
    } catch {
      return rpcError(400, -32700, 'Parse error')
    }
    const answer = await handleMessage(message, taskTools(actor.id, toolStore(actor, member.team ?? '')))
    return answer ? json(200, answer) : new Response(null, { status: 202 })
  } catch (err) {
    console.error('MCP request failed:', err)
    return rpcError(500, -32603, 'Internal error', (message as { id?: unknown } | null)?.id ?? null)
  }
}
