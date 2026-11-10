import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { createServer } from 'vite'
import { chromium } from 'playwright'

let server, browser, origin
before(async () => {
  server = await createServer({ root: new URL('../demo', import.meta.url).pathname, server: { host: '127.0.0.1', port: 0 } })
  await server.listen()
  origin = `http://127.0.0.1:${server.httpServer.address().port}`
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH })
})
after(async () => { await browser?.close(); await server?.close() })

test('remembered profiles survive reload, switch to generic login and navigate in the same tab', async () => {
  const context = await browser.newContext()
  const page = await context.newPage()
  try {
    await page.goto(origin)
    await page.getByRole('link', { name: 'Google', exact: true }).click()
    assert.equal(new URL(page.url()).searchParams.has('login_hint'), false)
    await page.getByRole('link', { name: 'Back to sign in' }).click()
    await page.getByRole('checkbox', { name: 'Save email and login method on this device' }).check()
    await page.getByRole('link', { name: 'Google', exact: true }).click()
    await page.getByRole('link', { name: 'jamie@example.test Continue' }).click()
    await page.getByRole('button', { name: 'Sign out', exact: true }).click()
    await page.reload()
    const saved = page.getByRole('link', { name: 'jamie@example.test', exact: true })
    assert.equal(new URL(await saved.getAttribute('href'), origin).searchParams.get('login_hint'), 'jamie@example.test')
    await page.getByRole('button', { name: 'Sign in with another profile' }).click()
    assert.equal(await page.getByRole('textbox', { name: 'Email', exact: true }).inputValue(), '')
    await page.getByRole('link', { name: 'GitHub', exact: true }).click()
    const url = new URL(page.url())
    assert.equal(url.searchParams.get('prompt'), 'select_account')
    assert.equal(url.searchParams.has('login_hint'), false)
    assert.equal(url.searchParams.get('returnTo'), '/workspace?view=projects#recent')
    assert.equal(context.pages().length, 1)
    await page.getByRole('link', { name: 'Back to sign in' }).click()
    await page.getByRole('button', { name: 'Forget saved profile', exact: true }).click()
    await page.reload()
    assert.equal(await page.getByRole('link', { name: 'jamie@example.test', exact: true }).count(), 0)
    assert.equal(await page.evaluate(() => localStorage.length), 0)
  } finally { await context.close() }
})

for (const width of [390, 1280]) test(`one to four configured providers fit at ${width}px`, async () => {
  const page = await browser.newPage({ viewport: { width, height: 900 } })
  try {
    await page.goto(origin)
    await page.getByText('Demo provider configuration', { exact: true }).click()
    for (const name of ['Apple', 'Hugging Face']) await page.getByRole('checkbox', { name, exact: true }).check()
    assert.equal(await page.locator('.app-social-sign-in a').count(), 4)
    await page.waitForFunction(() => [...document.querySelectorAll('.app-provider-logo')].length === 4 && [...document.querySelectorAll('.app-provider-logo')].every(image => image.complete && image.naturalWidth > 0))
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    for (const name of ['GitHub', 'Apple', 'Hugging Face']) await page.getByRole('checkbox', { name, exact: true }).uncheck()
    assert.equal(await page.locator('.app-social-sign-in a').count(), 1)
    const sizes = await page.locator('.app-social-sign-in').evaluate(element => [element.getBoundingClientRect().width, element.firstElementChild.getBoundingClientRect().width])
    assert.ok(Math.abs(sizes[0] - sizes[1]) < 1)
  } finally { await page.close() }
})
