import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { build } from 'esbuild'
import { chromium } from 'playwright'

const root = path.dirname(path.dirname(new URL(import.meta.url).pathname))
let temporary, server, browser, origin, identityStarted, releaseIdentity, failNextIdentity, holdNextIdentity, delayNextScript, scriptStarted, releaseScript
// This SDK fixture models identify's merge, on('open') events, and shutdown's teardown, not server authentication.
const sdk = `(() => {
  const pending = window.opendesk.q
  let account = {}
  const listeners = {}
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
  const open = document.createElement('button')
  open.textContent = 'Open chat'
  open.onclick = () => { for (const fn of listeners.open || []) fn() }
  const visitor = document.createElement('p')
  visitor.setAttribute('role', 'status')
  host.append(visitor, transcript, input, send, open)
  document.body.append(host)
  window.opendesk = (command, value, arg) => {
    if (command === 'identify') { Object.assign(account, value) }
    if (command === 'locale') { host.lang = value }
    if (command === 'on' && typeof arg === 'function') { (listeners[value] ??= []).push(arg) }
    if (command === 'open') { for (const fn of listeners.open || []) fn() }
    if (command === 'shutdown') { host.remove() }
    visitor.textContent = account.name || 'Guest'
  }
  for (const args of pending) window.opendesk(...args)
})()`
before(async () => {
  temporary = await mkdtemp(path.join(root, '.test-opendesk-'))
  await Promise.all([
    build({ entryPoints: [path.join(root, 'tests/opendesk-fixture.tsx')], bundle: true, outfile: path.join(temporary, 'fixture.js'), jsx: 'automatic' }),
    build({
      stdin: {
        contents: `import { supportWidget } from './skills/opendesk-support/assets/support-widget'; window.supportWidget = supportWidget;`,
        resolveDir: root,
        loader: 'ts',
      },
      bundle: true,
      outfile: path.join(temporary, 'support-widget.js'),
    }),
  ])
  server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost')
    if (url.pathname === '/fixture.js' || url.pathname === '/support-widget.js' || url.pathname === '/widget/v1.js') {
      if (url.pathname === '/widget/v1.js' && delayNextScript) {
        delayNextScript = false
        scriptStarted?.()
        await releaseScript
      }
      res.setHeader('content-type', 'text/javascript')
      res.end(url.pathname === '/widget/v1.js' ? sdk : await readFile(path.join(temporary, url.pathname.slice(1))))
      return
    }
    if (url.pathname === '/widget-only') {
      res.setHeader('content-type', 'text/html')
      res.end('<!doctype html><div id="root"></div><script src="/support-widget.js"></script>')
      return
    }
    if (url.pathname === '/identity') {
      const account = /fixture-account=([ab])/.exec(req.headers.cookie || '')?.[1]
      if (holdNextIdentity) {
        holdNextIdentity = false
        identityStarted?.()
        await releaseIdentity
      } else if (account && url.searchParams.has('delay')) {
        identityStarted?.()
        await new Promise(resolve => setTimeout(resolve, 250))
      }
      if (url.searchParams.has('fail') || failNextIdentity) {
        failNextIdentity = false
        res.writeHead(503).end('private backend data')
        return
      }
      res.setHeader('content-type', 'application/json')
      res.setHeader('cache-control', 'private, no-store')
      if (!account) {
        res.writeHead(204).end()
        return
      }
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
  if (server) {
    server.closeAllConnections()
    await new Promise(resolve => server.close(resolve))
  }
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

test('guests skip identity on mount and focus, while signed-in mounts once and throttles focus', async () => {
  const page = await browser.newPage()
  const identityCalls = []
  page.on('request', req => { if (new URL(req.url()).pathname === '/identity') identityCalls.push(req.url()) })
  await page.addInitScript(() => {
    let shift = 0
    const realNow = Date.now
    Date.now = () => realNow() + shift
    window.__advanceTime = ms => { shift += ms }
  })
  try {
    await page.goto(origin)
    await page.getByRole('status').filter({ hasText: 'Guest' }).waitFor()
    await page.evaluate(() => { window.dispatchEvent(new Event('focus')) })
    await page.waitForTimeout(100)
    assert.equal(identityCalls.length, 0, 'Guest mount and focus must not request /identity')

    await page.goto(`${origin}/?account=a`)
    await page.getByRole('status').filter({ hasText: 'Account A' }).waitFor()
    await page.waitForTimeout(100)
    assert.equal(identityCalls.length, 1, 'Signed-in mount must request /identity once, not twice')

    await page.evaluate(() => { window.dispatchEvent(new Event('focus')) })
    await page.waitForTimeout(100)
    assert.equal(identityCalls.length, 1, 'Focus within 30s must be throttled')

    await page.evaluate(() => {
      window.__advanceTime(30_000)
      window.dispatchEvent(new Event('focus'))
    })
    await page.waitForTimeout(100)
    assert.equal(identityCalls.length, 2, 'Signed-in focus after >= 30s must refresh identity')
  } finally { await page.close() }
})

test('opening chat forces cross-tab identity verification for login, account switch, and logout', async () => {
  const page = await browser.newPage()
  const identityCalls = []
  page.on('request', req => { if (new URL(req.url()).pathname === '/identity') identityCalls.push(req.url()) })
  try {
    await page.goto(origin)
    await page.getByRole('status').filter({ hasText: 'Guest' }).waitFor()
    assert.equal(identityCalls.length, 0)

    await page.getByLabel('Message', { exact: true }).fill('Guest draft')
    await page.getByRole('button', { name: 'Send', exact: true }).click()
    await page.evaluate(() => { document.cookie = 'fixture-account=a' })
    await page.getByRole('button', { name: 'Open chat', exact: true }).click()
    await page.getByRole('status').filter({ hasText: 'Account A' }).waitFor()
    assert.equal(identityCalls.length, 1)
    assert.equal(await page.getByRole('log').innerText(), '')

    await page.getByLabel('Message', { exact: true }).fill('Account A private')
    await page.getByRole('button', { name: 'Send', exact: true }).click()
    await page.evaluate(() => { document.cookie = 'fixture-account=b' })
    await page.getByRole('button', { name: 'Open chat', exact: true }).click()
    await page.getByRole('status').filter({ hasText: 'Account B' }).waitFor()
    assert.equal(await page.getByRole('log').innerText(), '')

    await page.evaluate(() => { document.cookie = 'fixture-account=' })
    await page.getByRole('button', { name: 'Open chat', exact: true }).click()
    await page.getByRole('status').filter({ hasText: 'Guest' }).waitFor()
    assert.equal(await page.getByRole('log').innerText(), '')
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
  } finally {
    identityStarted = undefined
    await page.close()
  }
})

test('identity errors expose no backend details or partially identified widget', async () => {
  const page = await browser.newPage()
  const errors = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  try {
    await page.goto(`${origin}/?account=a&fail`)
    await page.waitForFunction(() => document.querySelector('main'))
    await page.waitForTimeout(200)
    assert.equal(await page.locator('[data-opendesk-widget]').count(), 0)
    assert(errors.includes('Support chat could not connect.'))
    assert.equal(errors.join('').includes('private backend data'), false)
  } finally { await page.close() }
})

async function installFakeClock(page) {
  await page.addInitScript(() => {
    let shift = 0
    const realNow = Date.now
    Date.now = () => realNow() + shift
    window.__advanceTime = ms => { shift += ms }
  })
}

test('guest cross-tab login followed by focus detects cross-tab logout after 30s', async () => {
  const page = await browser.newPage()
  const identityCalls = []
  page.on('request', req => { if (new URL(req.url()).pathname === '/identity') identityCalls.push(req.url()) })
  await installFakeClock(page)
  try {
    await page.goto(origin)
    await page.getByRole('status').filter({ hasText: 'Guest' }).waitFor()
    assert.equal(identityCalls.length, 0)

    await page.evaluate(() => { document.cookie = 'fixture-account=a' })
    await page.getByRole('button', { name: 'Open chat', exact: true }).click()
    await page.getByRole('status').filter({ hasText: 'Account A' }).waitFor()
    assert.equal(identityCalls.length, 1)

    await page.evaluate(() => {
      document.cookie = 'fixture-account='
      window.dispatchEvent(new Event('focus'))
    })
    await page.waitForTimeout(100)
    assert.equal(identityCalls.length, 1)
    assert.equal(await page.getByRole('status').innerText(), 'Account A')

    await page.evaluate(() => {
      window.__advanceTime(30_000)
      window.dispatchEvent(new Event('focus'))
    })
    await page.getByRole('status').filter({ hasText: 'Guest' }).waitFor()
    assert.equal(identityCalls.length, 2)
  } finally { await page.close() }
})

test('initial identity 503 recovers on focus after 30s and throttles rapid focus bursts while in flight', async () => {
  const page = await browser.newPage()
  const identityCalls = []
  page.on('request', req => { if (new URL(req.url()).pathname === '/identity') identityCalls.push(req.url()) })
  await installFakeClock(page)
  failNextIdentity = true
  try {
    await page.goto(`${origin}/?account=a`)
    await page.waitForFunction(() => document.querySelector('main'))
    await page.waitForTimeout(150)
    assert.equal(identityCalls.length, 1)
    assert.equal(await page.locator('[data-opendesk-widget]').count(), 0)

    await page.evaluate(() => { window.dispatchEvent(new Event('focus')) })
    await page.waitForTimeout(100)
    assert.equal(identityCalls.length, 1, 'Focus within 30s after failed fetch must stay throttled')

    await page.evaluate(() => {
      window.__advanceTime(30_000)
      window.dispatchEvent(new Event('focus'))
    })
    await page.getByRole('status').filter({ hasText: 'Account A' }).waitFor()
    assert.equal(identityCalls.length, 2)

    await page.goto(`${origin}/?account=a&delay`)
    await page.getByRole('status').filter({ hasText: 'Account A' }).waitFor()
    const beforeBurst = identityCalls.length
    await page.evaluate(() => {
      window.__advanceTime(30_000)
      window.dispatchEvent(new Event('focus'))
      window.dispatchEvent(new Event('focus'))
      window.dispatchEvent(new Event('focus'))
    })
    await page.waitForTimeout(350)
    assert.equal(identityCalls.length, beforeBurst + 1, 'Rapid focus burst while fetch is in flight must send only 1 request')
  } finally {
    failNextIdentity = false
    await page.close()
  }
})

test('queued sync(true) aborted by sync(false) preserves reset', async () => {
  const page = await browser.newPage()
  try {
    await page.goto(`${origin}/widget-only`)
    await page.evaluate(() => {
      document.cookie = 'fixture-account=a'
      window.__chat = window.supportWidget({
        key: 'public-fixture-key',
        url: location.origin,
        identityUrl: () => '/identity',
        context: () => ({ accountKey: 'a', language: 'en', hidden: false }),
      })
    })
    await page.getByRole('status').filter({ hasText: 'Account A' }).waitFor()
    await page.getByLabel('Message', { exact: true }).fill('Private A draft')
    await page.getByRole('button', { name: 'Send', exact: true }).click()
    assert.equal(await page.getByRole('log').innerText(), 'Private A draft')

    holdNextIdentity = true
    const inFlight = new Promise(resolve => { identityStarted = resolve })
    let releaseFetch
    releaseIdentity = new Promise(resolve => { releaseFetch = resolve })
    await page.evaluate(() => { window.__chat.sync(false) })
    await inFlight

    await page.evaluate(() => {
      window.__chat.sync(true)
      window.__chat.sync(false)
    })
    releaseFetch()
    await page.waitForFunction(() => document.querySelector('[role=log]')?.textContent === '')
    assert.equal(await page.getByRole('status').innerText(), 'Account A')
  } finally {
    holdNextIdentity = false
    identityStarted = undefined
    releaseIdentity = undefined
    await page.evaluate(() => { window.__chat?.destroy() })
    await page.close()
  }
})

test('destroy mid-script-load removes script without mounting widget', async () => {
  const page = await browser.newPage()
  delayNextScript = true
  const scriptLoading = new Promise(resolve => { scriptStarted = resolve })
  let finishScript
  releaseScript = new Promise(resolve => { finishScript = resolve })
  const errors = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  try {
    const nav = page.goto(`${origin}/?account=a`)
    await scriptLoading
    await nav
    assert.equal(await page.locator('script[data-key]').count(), 1)
    await page.getByRole('button', { name: 'Unmount chat', exact: true }).click()
    finishScript()
    await page.waitForTimeout(150)
    assert.equal(await page.locator('script[data-key]').count(), 0)
    assert.equal(await page.locator('[data-opendesk-widget]').count(), 0)
    assert.deepEqual(errors, [])
  } finally {
    delayNextScript = false
    scriptStarted = undefined
    releaseScript = undefined
    await page.close()
  }
})
