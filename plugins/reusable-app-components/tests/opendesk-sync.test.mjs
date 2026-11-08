import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const run = promisify(execFile)
const script = new URL('../skills/opendesk-support/scripts/sync-support.mjs', import.meta.url).pathname

test('knowledge publishing keeps old facts on failure and replaces only owned sources after readiness', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'opendesk-sync-'))
  const sources = [{ id: 'old', name: 'Repository knowledge old', status: 'ready' }, { id: 'manual', name: 'Public website', status: 'ready' }]
  let indexing = 'error'
  let instructions = 'Old instructions'
  let uploaded = 0
  const server = createServer(async (req, res) => {
    assert.equal(req.headers.authorization, 'Bearer fixture-management-key')
    assert.equal(req.headers['od-workspace'], 'workspace-fixture')
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const body = Buffer.concat(chunks).toString()
    res.setHeader('content-type', 'application/json')
    if (req.url === '/v1/ai/knowledge' && req.method === 'GET') res.end(JSON.stringify({ data: sources }))
    else if (req.url === '/v1/ai/knowledge/files') {
      const name = /Repository knowledge [0-9a-f]{12}/.exec(body)[0]
      const source = { id: `upload-${++uploaded}`, name, status: indexing }
      sources.push(source)
      res.end(JSON.stringify(source))
    } else if (req.url === '/v1/bots/bot-fixture' && req.method === 'PATCH') {
      instructions = JSON.parse(body).personality.instructions
      res.end('{}')
    } else if (req.method === 'DELETE') {
      const index = sources.findIndex(source => req.url.endsWith('/' + source.id))
      sources.splice(index, 1)
      res.writeHead(204).end()
    } else { res.writeHead(404).end('{}') }
  }).listen(0, '127.0.0.1')
  await once(server, 'listening')
  try {
    await mkdir(path.join(root, 'support'))
    await writeFile(path.join(root, 'support/opendesk.json'), JSON.stringify({ url: `http://127.0.0.1:${server.address().port}`, workspaceId: 'workspace-fixture', botId: 'bot-fixture' }))
    await writeFile(path.join(root, 'support/knowledge.txt'), 'Current public product facts')
    await writeFile(path.join(root, 'support/instructions.txt'), 'Answer only for this product')
    const env = { ...process.env, OPENDESK_API_KEY: 'fixture-management-key' }
    await assert.rejects(run(process.execPath, [script, root], { env }), /Knowledge indexing failed/)
    assert(sources.some(source => source.id === 'old'))
    assert.equal(instructions, 'Old instructions')
    sources.find(source => source.id === 'upload-1').status = 'ready'
    indexing = 'ready'
    await run(process.execPath, [script, root], { env })
    await run(process.execPath, [script, root], { env })
    assert.equal(uploaded, 1)
    assert.deepEqual(sources.map(source => source.id), ['manual', 'upload-1'])
    assert.equal(instructions, 'Answer only for this product')
    await writeFile(path.join(root, 'support/knowledge.txt'), 'Changed public product facts')
    await run(process.execPath, [script, root], { env })
    assert.deepEqual(sources.map(source => source.id), ['manual', 'upload-2'])
  } finally {
    server.closeAllConnections()
    await new Promise(resolve => server.close(resolve))
    await rm(root, { recursive: true, force: true })
  }
})
