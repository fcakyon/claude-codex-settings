import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtemp, mkdir, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {openBrowser} from '../scripts/runtime.mjs';

test('fresh extension runs preserve login state without delivering startup telemetry', {skip: !process.env.QA_BROWSER_EXECUTABLE}, async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'qa-browser-contract-'));
  let hits = 0;
  const server = createServer((req, res) => { if (req.url === '/sendToGA') hits++; res.end('<html><body>Session fixture</body></html>'); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const endpoint = `http://127.0.0.1:${server.address().port}/sendToGA`;
  const extension = path.join(dir, 'extension');
  await mkdir(extension);
  await writeFile(path.join(extension, 'manifest.json'), JSON.stringify({manifest_version: 3, name: 'QA transport contract', version: '1.0.0', host_permissions: ['http://127.0.0.1/*'], background: {service_worker: 'background.js'}}));
  await writeFile(path.join(extension, 'background.js'), `chrome.runtime.onInstalled.addListener(() => fetch(${JSON.stringify(endpoint)}, {method:'POST',body:'{"events":[{"name":"fixture"}]}'}));`);
  let context;
  try {
    const config = {root: dir, extension: 'extension', telemetry: {urls: ['**/sendToGA']}};
    for (let run = 0; run < 2; run++) {
      const events = [];
      context = await openBrowser(config, dir, events);
      const deadline = Date.now() + 10000;
      while (!events.length && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 50));
      assert.equal(events.filter(item => item.events.some(event => event.name === 'fixture')).length, 1);
      assert.equal(hits, 0);
      assert.ok(context.qaExtensionId);
      const page = await context.newPage();
      await page.goto(new URL('/', endpoint).href);
      if (!run) {
        await context.addCookies([{name:'qa_session',value:'retained',domain:'example.test',path:'/'}]);
        await page.evaluate(async () => {
          localStorage.setItem('login-token', 'fixture-token');
          const key = await crypto.subtle.generateKey({name:'AES-GCM',length:128}, false, ['encrypt']);
          await new Promise((resolve, reject) => {
            const request = indexedDB.open('provider-player', 1);
            request.onupgradeneeded = () => request.result.createObjectStore('state');
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
              const tx = request.result.transaction('state', 'readwrite');
              tx.objectStore('state').put(key, 'session-key');
              tx.oncomplete = () => { request.result.close(); resolve(); };
              tx.onerror = () => reject(tx.error);
            };
          });
        });
      } else {
        assert.equal((await context.cookies('https://example.test/')).find(cookie=>cookie.name==='qa_session')?.value, 'retained');
        assert.equal(await page.evaluate(() => localStorage.getItem('login-token')), 'fixture-token');
        assert.deepEqual(await page.evaluate(async () => (await indexedDB.databases()).map(db => db.name)), [], 'Provider databases must not be replayed into a fresh browser');
      }
      await context.qaSave();
      await context.close();
      context = null;
    }
  } finally {
    if (context) await context.close();
    await new Promise(resolve => server.close(resolve));
    await rm(dir, {recursive: true, force: true});
  }
});

test('cookie recovery scopes origins and closes only its temporary source tab', {skip: !process.env.QA_BROWSER_EXECUTABLE}, async () => {
  const {chromium} = await import('playwright-core');
  const {readFile} = await import('node:fs/promises');
  const {importCookies} = await import('../scripts/session.mjs');
  const dir = await mkdtemp(path.join(tmpdir(), 'qa-source-contract-'));
  const source = await chromium.launchPersistentContext(dir, {executablePath: process.env.QA_BROWSER_EXECUTABLE, headless: true, args: ['--remote-debugging-port=0']});
  try {
    await source.addCookies([{name:'authorized',value:'fixture',domain:'provider.test',path:'/'},{name:'unrelated',value:'private-fixture',domain:'elsewhere.test',path:'/'}]);
    const original = source.pages();
    const before = original.length;
    const [port, endpoint] = (await readFile(path.join(dir, 'DevToolsActivePort'), 'utf8')).trim().split('\n');
    for (const address of [`http://127.0.0.1:${port}`, `ws://127.0.0.1:${port}${endpoint}`]) {
      const closed = source.waitForEvent('page').then(page => page.waitForEvent('close'));
      const [imported] = await Promise.all([importCookies(address, ['https://provider.test/']), closed]);
      assert.deepEqual(imported.map(cookie => cookie.name), ['authorized']);
    }
    assert.equal(source.pages().length, before);
    assert.ok(original.every(page => !page.isClosed()));
    assert.equal((await source.cookies('https://elsewhere.test/')).length, 1);
  } finally { await source.close(); await rm(dir, {recursive: true, force: true}); }
});

test('cookie recovery reports unavailable HTTP discovery', async () => {
  const {importCookies} = await import('../scripts/session.mjs');
  const server = createServer((req, res) => res.writeHead(404).end());
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    await assert.rejects(importCookies(`http://127.0.0.1:${server.address().port}`, ['https://provider.test/']), /Browser discovery is unavailable/);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
