import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { parseEnv } from 'node:util'
import { setTimeout } from 'node:timers/promises'

const root = resolve(process.argv[2] || '.')
const config = JSON.parse(await readFile(resolve(root, 'support/opendesk.json'), 'utf8'))
const env = process.env.OPENDESK_API_KEY ? process.env : parseEnv(await readFile(resolve(root, '.env'), 'utf8'))
const instructions = await readFile(resolve(root, 'support/instructions.txt'), 'utf8')
const knowledge = await readFile(resolve(root, 'support/knowledge.txt'), 'utf8')
if (!env.OPENDESK_API_KEY) throw Error('OPENDESK_API_KEY is required in the environment or repository .env')
if (instructions.length > 4000) throw Error('Bot instructions exceed OpenDesk’s 4000-character limit')

async function api(path, method = 'GET', body) {
  const response = await fetch(`${config.url}/v1${path}`, {
    method,
    headers: { Authorization: `Bearer ${env.OPENDESK_API_KEY}`, 'OD-Workspace': config.workspaceId, ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }) },
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body)
  })
  if (!response.ok) throw Error(`OpenDesk ${method} ${path} failed (${response.status})`)
  return response.status === 204 ? null : response.json()
}

const name = `Repository knowledge ${createHash('sha256').update(knowledge).digest('hex').slice(0, 12)}`
const { data: sources } = await api('/ai/knowledge')
let source = sources.find(item => item.name === name)
if (!source) {
  const form = new FormData()
  form.append('file', new Blob([knowledge], { type: 'text/plain' }), 'knowledge.txt')
  form.append('name', name)
  source = await api('/ai/knowledge/files', 'POST', form)
}
for (let attempt = 0; source.status !== 'ready' && attempt < 60; attempt++) {
  if (source.status === 'error') throw Error('Knowledge indexing failed')
  await setTimeout(1000)
  source = await api(`/ai/knowledge/${source.id}`)
}
if (source.status !== 'ready') throw Error('Knowledge indexing did not complete within 60 seconds')
await api(`/bots/${config.botId}`, 'PATCH', { personality: { instructions } })
for (const previous of sources.filter(item => item.name.startsWith('Repository knowledge ') && item.id !== source.id)) {
  await api(`/ai/knowledge/${previous.id}`, 'DELETE')
}
console.log(`Published ${name} and bot instructions for ${config.workspaceId}`)

if (process.argv.includes('--test')) {
  const questions = JSON.parse(await readFile(resolve(root, 'support/questions.json'), 'utf8'))
  for (let start = 0; start < questions.length; start += 3) {
    const results = await Promise.all(questions.slice(start, start + 3).map(async ({ id, question, expected }) => ({
      id, question, expected,
      answer: await api('/ai/agent/playground', 'POST', { settings: { bot_id: config.botId }, messages: [{ role: 'visitor', text: question }] })
    })))
    for (const result of results) console.log(JSON.stringify(result))
  }
}
