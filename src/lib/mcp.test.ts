import assert from 'node:assert/strict'
import { test } from 'node:test'
import { handleMessage, isAllowedOrigin, isSupportedVersion, ToolError, type McpTool } from './mcp.ts'

const tool: McpTool = {
  name: 'echo',
  title: 'Echo',
  description: 'Gibt die Eingabe zurück.',
  inputSchema: { type: 'object' },
  annotations: { readOnlyHint: true },
  run: async (args) => {
    if (args.fail === 'tool') throw new ToolError('Das ging nicht.')
    if (args.fail === 'bug') throw new Error('kaputt')
    return { args }
  },
}

const call = (method: string, params?: unknown, id: unknown = 1) =>
  handleMessage({ jsonrpc: '2.0', id, method, params }, [tool])

test('negotiates a supported version and offers the newest otherwise', async () => {
  const known = (await call('initialize', { protocolVersion: '2025-06-18' })) as { result: Record<string, unknown> }
  assert.equal(known.result.protocolVersion, '2025-06-18')
  assert.deepEqual(known.result.capabilities, { tools: {} })
  const unknown = (await call('initialize', { protocolVersion: '1900-01-01' })) as { result: Record<string, unknown> }
  assert.equal(unknown.result.protocolVersion, '2025-11-25')
})

test('checks the version header and allows it to be missing', () => {
  assert.equal(isSupportedVersion(null), true)
  assert.equal(isSupportedVersion('2025-11-25'), true)
  assert.equal(isSupportedVersion('2026-07-28'), false)
})

test('allows requests without Origin, from the site and from the apps only', () => {
  const site = 'https://www.ignite-startupclub.de'
  assert.equal(isAllowedOrigin(null, site), true)
  assert.equal(isAllowedOrigin(site, site), true)
  assert.equal(isAllowedOrigin('https://claude.ai', site), true)
  assert.equal(isAllowedOrigin('https://chatgpt.com', site), true)
  assert.equal(isAllowedOrigin('https://evil.example', site), false)
  assert.equal(isAllowedOrigin('http://claude.ai', site), false)
})

test('lists tools without their handlers', async () => {
  const answer = (await call('tools/list')) as { result: { tools: Record<string, unknown>[] } }
  assert.equal(answer.result.tools[0].name, 'echo')
  assert.equal('run' in answer.result.tools[0], false)
})

test('returns a tool result as text and as structured content', async () => {
  const answer = (await call('tools/call', { name: 'echo', arguments: { a: 1 } })) as {
    result: { content: { text: string }[]; structuredContent: unknown; isError?: boolean }
  }
  assert.deepEqual(answer.result.structuredContent, { args: { a: 1 } })
  assert.deepEqual(JSON.parse(answer.result.content[0].text), { args: { a: 1 } })
  assert.equal(answer.result.isError, undefined)
})

test('reports a tool problem as a result the model can read', async () => {
  const answer = (await call('tools/call', { name: 'echo', arguments: { fail: 'tool' } })) as {
    result: { content: { text: string }[]; isError: boolean }
  }
  assert.equal(answer.result.isError, true)
  assert.equal(answer.result.content[0].text, 'Das ging nicht.')
})

test('lets a bug reach the route instead of hiding it in a result', async () => {
  await assert.rejects(call('tools/call', { name: 'echo', arguments: { fail: 'bug' } }), /kaputt/)
})

test('answers unknown tools and methods with protocol errors', async () => {
  const noTool = (await call('tools/call', { name: 'nope' })) as { error: { code: number } }
  assert.equal(noTool.error.code, -32602)
  const noMethod = (await call('resources/list')) as { error: { code: number } }
  assert.equal(noMethod.error.code, -32601)
})

test('answers ping, keeps the request id and treats tool calls without arguments as empty', async () => {
  assert.deepEqual(await call('ping', undefined, 'abc'), { jsonrpc: '2.0', id: 'abc', result: {} })
  const answer = (await call('tools/call', { name: 'echo' })) as { result: { structuredContent: unknown } }
  assert.deepEqual(answer.result.structuredContent, { args: {} })
})

test('gives notifications and client responses no answer', async () => {
  assert.equal(await handleMessage({ jsonrpc: '2.0', method: 'notifications/initialized' }, [tool]), null)
  assert.equal(await handleMessage({ jsonrpc: '2.0', id: 1, result: {} }, [tool]), null)
})

test('refuses batches and anything that is no JSON-RPC 2.0 message', async () => {
  for (const message of [
    [{ jsonrpc: '2.0', id: 1, method: 'ping' }],
    { id: 1, method: 'ping' },
    { jsonrpc: '2.0', id: 1 },
    null,
    'ping',
  ]) {
    const answer = (await handleMessage(message, [tool])) as { error: { code: number } }
    assert.equal(answer.error.code, -32600, JSON.stringify(message))
  }
})
