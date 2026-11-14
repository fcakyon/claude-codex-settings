import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const run = promisify(execFile)
const script = new URL('../skills/opendesk-support/scripts/sync-support.mjs', import.meta.url).pathname

test('knowledge publishing keeps old facts on failure and replaces only owned sources after readiness', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'opendesk-sync-'))
  const sources = [{ id: 'old', name: 'Repository knowledge old', status: 'ready' }, { id: 'gone', name: 'Repository knowledge gone', status: 'ready' }, { id: 'manual', name: 'Public website', status: 'ready' }]
  let indexing = 'error'
  let instructions = 'Old instructions'
  let handoffMessage = ''
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
      const personality = JSON.parse(body).personality
      instructions = personality.instructions
      if (personality.handoff_message !== undefined) handoffMessage = personality.handoff_message
      res.end('{}')
    } else if (req.method === 'DELETE') {
      const index = sources.findIndex(source => req.url.endsWith('/' + source.id))
      if (index === -1 || req.url.endsWith('/gone')) { res.writeHead(404).end('{}'); return }
      sources.splice(index, 1)
      res.writeHead(204).end()
    } else { res.writeHead(404).end('{}') }
  }).listen(0, '127.0.0.1')
  await once(server, 'listening')
  try {
    await mkdir(path.join(root, 'support'))
    await writeFile(path.join(root, 'support/opendesk.json'), JSON.stringify({ url: `http://127.0.0.1:${server.address().port}`, workspaceId: 'workspace-fixture', botId: 'bot-fixture', handoffMessage: 'Forwarded to our team.' }))
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
    assert.deepEqual(sources.map(source => source.id), ['gone', 'manual', 'upload-1'])
    assert.equal(instructions, 'Answer only for this product')
    assert.equal(handoffMessage, 'Forwarded to our team.')
    await writeFile(path.join(root, 'support/knowledge.txt'), 'Changed public product facts')
    await run(process.execPath, [script, root], { env })
    assert.deepEqual(sources.map(source => source.id), ['gone', 'manual', 'upload-2'])
  } finally {
    server.closeAllConnections()
    await new Promise(resolve => server.close(resolve))
    await rm(root, { recursive: true, force: true })
  }
})

test('CI workflow templates sync only on main pushes and serialize workspace updates', async () => {
  const workflows = await Promise.all(
    ['support-openship.yml', 'support-github.yml'].map((name) =>
      readFile(new URL(`../skills/opendesk-support/assets/${name}`, import.meta.url), 'utf8')
    )
  )
  for (const workflow of workflows) {
    assert.match(workflow, /\bpush:/)
    assert.match(workflow, /\bbranches:\s*\[main\]/)
    assert.match(workflow, /support\/\*\*/)
    assert.match(workflow, /scripts\/sync-support\.mjs/)
    assert.match(workflow, /\bworkflow_dispatch:/)
    assert.doesNotMatch(workflow, /\bpull_request\b/)
    assert.match(workflow, /cancel-in-progress:\s*false/)
    assert.match(workflow, /node scripts\/sync-support\.mjs \./)
    assert.match(workflow, /secrets\.OPENDESK_API_KEY/)
  }
})

test('--test supports single-turn question and multi-turn messages payloads', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'opendesk-sync-test-'))
  const playgroundPayloads = []
  const server = createServer(async (req, res) => {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const body = Buffer.concat(chunks).toString()
    res.setHeader('content-type', 'application/json')
    if (req.url === '/v1/ai/knowledge' && req.method === 'GET') {
      res.end(JSON.stringify({ data: [] }))
    } else if (req.url === '/v1/ai/knowledge/files') {
      res.end(JSON.stringify({ id: 'src-1', status: 'ready' }))
    } else if (req.url === '/v1/bots/bot-fixture' && req.method === 'PATCH') {
      res.end('{}')
    } else if (req.url === '/v1/ai/agent/playground' && req.method === 'POST') {
      playgroundPayloads.push(JSON.parse(body))
      res.end(JSON.stringify({ handoff: true, text_html: '<p>Forwarded</p>' }))
    } else {
      res.writeHead(404).end('{}')
    }
  }).listen(0, '127.0.0.1')
  await once(server, 'listening')
  try {
    await mkdir(path.join(root, 'support'))
    await writeFile(path.join(root, 'support/opendesk.json'), JSON.stringify({ url: `http://127.0.0.1:${server.address().port}`, workspaceId: 'workspace-fixture', botId: 'bot-fixture' }))
    await writeFile(path.join(root, 'support/knowledge.txt'), 'Facts')
    await writeFile(path.join(root, 'support/instructions.txt'), 'Instructions')
    await writeFile(path.join(root, 'support/questions.json'), JSON.stringify([
      { id: 'single', question: 'Single turn?', expected: 'Answer' },
      { id: 'multi', messages: [{ role: 'visitor', text: 'Tried /requests' }, { role: 'agent', text: 'Okay' }, { role: 'visitor', text: 'Expand to 170' }], expected: 'Handoff' }
    ]))
    const env = { ...process.env, OPENDESK_API_KEY: 'fixture-management-key' }
    const { stdout } = await run(process.execPath, [script, root, '--test'], { env })
    assert.equal(playgroundPayloads.length, 2)
    assert.deepEqual(playgroundPayloads.map(p => p.messages), [
      [{ role: 'visitor', text: 'Single turn?' }],
      [{ role: 'visitor', text: 'Tried /requests' }, { role: 'agent', text: 'Okay' }, { role: 'visitor', text: 'Expand to 170' }]
    ])
    assert.match(stdout, /"id":"multi".*"question":"Expand to 170"/)
  } finally {
    server.closeAllConnections()
    await new Promise(resolve => server.close(resolve))
    await rm(root, { recursive: true, force: true })
  }
})
