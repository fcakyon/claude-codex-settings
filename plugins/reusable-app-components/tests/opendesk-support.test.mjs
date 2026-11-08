import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { build } from 'esbuild'
import { chromium } from 'playwright'

const root = path.dirname(path.dirname(new URL(import.meta.url).pathname))
let temporary, server, browser, origin, identityStarted
// This SDK fixture models identify's merge and shutdown's teardown, not server authentication.
const sdk = `(() => {
  const pending = window.opendesk.q
  let account = {}
  const host = document.createElement('section')
  host.dataset.opendeskWidget = ''
  host.setAttribute('aria-label', 'Support chat')
  const transcript = document.createElement('div')
  transcript.setAttribute('role', 'log')
  const input = document.createElement('input')
  input.setAttribute('aria-label', 'Message')
  const send = document.createElement('button')
  send.textContent = 'Send'
  send.onclick = () => { transcript.append(input.value) }
  const visitor = document.createElement('p')
  visitor.setAttribute('role', 'status')
  host.append(visitor, transcript, input, send)
  document.body.append(host)
  window.opendesk = (command, value) => {
    if (command === 'identify') { Object.assign(account, value) }
    if (command === 'locale') { host.lang = value }
    if (command === 'shutdown') { host.remove() }
    visitor.textContent = account.name || 'Guest'
  }
  for (const args of pending) window.opendesk(...args)
})()`
before(async () => {
  temporary = await mkdtemp(path.join(root, '.test-opendesk-'))
  await build({ entryPoints: [path.join(root, 'tests/opendesk-fixture.tsx')], bundle: true, outfile: path.join(temporary, 'fixture.js'), jsx: 'automatic' })
  server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost')
    if (url.pathname === '/fixture.js' || url.pathname === '/widget/v1.js') {
      res.setHeader('content-type', 'text/javascript')
      res.end(url.pathname === '/fixture.js' ? await readFile(path.join(temporary, 'fixture.js')) : sdk)
      return
    }
    if (url.pathname === '/identity') {
      const account = /fixture-account=([ab])/.exec(req.headers.cookie || '')?.[1]
      if (account && url.searchParams.has('delay')) {
        identityStarted?.()
        await new Promise(resolve => setTimeout(resolve, 250))
      }
      if (url.searchParams.has('fail')) { res.writeHead(503).end('private backend data')
        return }
      res.setHeader('content-type', 'application/json')
      res.setHeader('cache-control', 'private, no-store')
      if (!account) { res.writeHead(204).end()
        return }
      res.end(JSON.stringify({ user_id: account, user_hash: 'fixture-signature', name: `Account ${account.toUpperCase()}` }))
      return
    }
    res.setHeader('content-type', 'text/html')
    res.end('<!doctype html><div id="root"></div><script src="/fixture.js"></script>')
  }).listen(0, '127.0.0.1')
  await once(server, 'listening')
  origin = `http://127.0.0.1:${server.address().port}`
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, headless: true })
})
after(async () => {
  await browser?.close()
  if (server) { server.closeAllConnections()
    await new Promise(resolve => server.close(resolve)) }
  if (temporary) await rm(temporary, { recursive: true, force: true })
})

test('account changes clear old conversations and preserve locale and route visibility', async () => {
  const page = await browser.newPage()
  try {
    await page.goto(origin)
    await page.getByRole('status').filter({ hasText: 'Guest' }).waitFor()
    for (const name of ['Account A', 'Account B', 'Log out']) {
      await page.getByLabel('Message', { exact: true }).fill('Previous private conversation')
      await page.getByRole('button', { name: 'Send', exact: true }).click()
      await page.getByRole('button', { name, exact: true }).click()
      await page.getByRole('status').filter({ hasText: name === 'Log out' ? 'Guest' : name }).waitFor()
      assert.equal(await page.getByRole('log').innerText(), '')
      assert.equal(await page.getByLabel('Support chat', { exact: true }).count(), 1)
    }
    await page.getByRole('button', { name: 'Arabic', exact: true }).click()
    await page.waitForFunction(() => document.querySelector('[data-opendesk-widget]')?.lang === 'ar')
    await page.getByRole('button', { name: 'Toggle hidden', exact: true }).click()
    await page.getByLabel('Support chat', { exact: true }).waitFor({ state: 'hidden' })
    await page.getByRole('button', { name: 'Account A', exact: true }).click()
    await page.waitForFunction(() => document.querySelector('[role=status]')?.textContent === 'Account A')
    assert.equal(await page.getByLabel('Support chat', { exact: true }).isVisible(), false)
    await page.getByRole('button', { name: 'Toggle hidden', exact: true }).click()
    await page.getByLabel('Support chat', { exact: true }).waitFor({ state: 'visible' })
  } finally { await page.close() }
})

for (const action of ['Log out', 'Unmount chat']) test(`late identity cannot restore an account after ${action}`, async () => {
  const page = await browser.newPage()
  try {
    await page.goto(`${origin}/?delay`)
    await page.getByRole('status').filter({ hasText: 'Guest' }).waitFor()
    const started = new Promise(resolve => { identityStarted = resolve })
    await page.getByRole('button', { name: 'Account A', exact: true }).click()
    await started
    await page.getByRole('button', { name: action, exact: true }).click()
    await page.waitForTimeout(400)
    assert.equal(await page.getByText('Account A', { exact: true }).count(), 1)
    assert.equal(await page.locator('[data-opendesk-widget]').count(), action === 'Log out' ? 1 : 0)
  } finally { identityStarted = undefined
    await page.close() }
})

test('identity errors expose no backend details or partially identified widget', async () => {
  const page = await browser.newPage()
  const errors = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  try {
    await page.goto(`${origin}/?fail`)
    await page.waitForFunction(() => document.querySelector('main'))
    await page.waitForTimeout(200)
    assert.equal(await page.locator('[data-opendesk-widget]').count(), 0)
    assert(errors.includes('Support chat could not connect.'))
    assert.equal(errors.join('').includes('private backend data'), false)
  } finally { await page.close() }
})
