import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtemp, mkdir, readFile, stat, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {command, openBrowser} from '../scripts/runtime.mjs';

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

test('network capture exports and stops after success or journey failure', {skip: !process.env.QA_BROWSER_EXECUTABLE || !process.env.BROWSER_NETWORK_CLI}, async () => {
  const {chromium} = await import('playwright-core');
  const {withNetwork} = await import('../scripts/network.mjs');
  const dir = await mkdtemp(path.join(tmpdir(), 'qa-network-contract-'));
  const server = createServer((req, res) => res.end('fixture'));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const profile = path.join(dir, 'browser');
  const source = await chromium.launchPersistentContext(profile, {executablePath: process.env.QA_BROWSER_EXECUTABLE, headless: true, args: ['--remote-debugging-port=0']});
  const exports = [];
  try {
    const page = await source.newPage();
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    const [port, endpoint] = (await readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).trim().split('\n');
    for (const fail of [false, true]) {
      const result = withNetwork({outputDir: dir, evidence: (name, value) => exports.push(value)}, ['--cdp', `ws://127.0.0.1:${port}${endpoint}`, '--host', '127.0.0.1'], async network => {
        const targets = await network('targets');
        assert.equal(targets.length, 1);
        await page.evaluate(() => fetch('/probe', {method: 'POST'}));
        const request = await network('wait', ['--contains', '/probe', '--method', 'POST', '--status', '200']);
        assert.equal(request.target.id, targets[0].id);
        if (fail) throw new Error('Expected journey failure');
      });
      if (fail) await assert.rejects(result, /Expected journey failure/);
      else await result;
      const report = JSON.parse(await readFile(exports.at(-1), 'utf8'));
      assert.ok(report.entries.some(entry => entry.url.endsWith('/probe') && entry.status === 200));
      assert.equal((await stat(exports.at(-1))).mode & 0o777, 0o600);
      for (const file of ['state.json', 'state.json.lock']) await assert.rejects(stat(path.join(path.dirname(exports.at(-1)), file)), {code: 'ENOENT'});
      assert.equal(page.isClosed(), false);
    }
  } finally {
    await source.close();
    await new Promise(resolve => server.close(resolve));
    await rm(dir, {recursive: true, force: true});
  }
});

test('touch gestures report mid-gesture state and browser scroll takeover', {skip: !process.env.QA_BROWSER_EXECUTABLE}, async () => {
  const {emulateTouch, gestures, touchGesture} = await import('../scripts/touch.mjs');
  const dir = await mkdtemp(path.join(tmpdir(), 'qa-touch-contract-'));
  // A hold engages the box and blocks scrolling, like a photo loupe. Unengaged vertical swipes scroll its container.
  const page = frame => `<!doctype html><meta name="viewport" content="width=device-width"><body style="margin:0">${frame}<script>
let hold;
box.addEventListener('pointerdown', () => { hold = setTimeout(() => (box.dataset.engaged = 'yes'), 250); });
box.addEventListener('pointermove', () => clearTimeout(hold));
for (const type of ['pointerup', 'pointercancel']) box.addEventListener(type, () => { clearTimeout(hold); delete box.dataset.engaged; });
box.addEventListener('touchmove', event => box.dataset.engaged && event.preventDefault(), {passive: false});
</script>`;
  const box = '<div id="box" style="margin-top:400px;height:300px;background:#888;touch-action:pan-y"></div>';
  const pages = {'/': page(`<div style="height:4000px">${box}</div>`), '/inner': page(`<main style="position:fixed;inset:0;overflow:auto"><div style="height:4000px">${box}</div></main>`)};
  const server = createServer((req, res) => res.end(pages[req.url]));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const context = await openBrowser({root: dir, browser: {actionDelayMs: 0}}, dir, []);
  try {
    const tab = await context.newPage();
    await emulateTouch(tab);
    const observe = element => element.dataset.engaged === 'yes';
    const run = async (steps, route = '/') => {
      await tab.goto(`http://127.0.0.1:${server.address().port}${route}`);
      return touchGesture(tab, '#box', steps, {observe});
    };
    const hold = await run(gestures.hold);
    assert.equal(hold.during.state, true, 'A held finger is observed before release');
    assert.equal(hold.after.state, false);
    await tab.screenshot();
    assert.deepEqual(await tab.evaluate(() => [innerWidth, matchMedia('(pointer: coarse)').matches]), [390, true], 'Screenshots keep the phone emulation');
    for (const route of ['/', '/inner']) {
      const drag = await run(gestures.holdThenDragUp, route);
      assert.equal(drag.during.state, true);
      assert.deepEqual(drag.after.scrolled, {x: 0, y: 0}, `An engaged drag must not scroll ${route}`);
      assert.ok(!drag.after.events.includes('pointercancel'));
      const swipe = await run(gestures.swipeUp, route);
      assert.ok(swipe.after.scrolled.y > 0, `An unengaged vertical swipe scrolls ${route}`);
      assert.ok(swipe.after.events.includes('pointercancel'), 'The browser cancels the pointer when it takes the gesture over');
    }
    const sideways = await run(gestures.swipeRight);
    assert.equal(sideways.during.state, false);
    assert.deepEqual(sideways.after.events, ['pointerdown', 'pointermove', 'pointerup']);
    await assert.rejects(touchGesture(tab, '#box', gestures.tap, {observe: () => { throw new Error('observe failed'); }}), /observe failed/);
    assert.deepEqual((await touchGesture(tab, '#box', gestures.tap)).after.events, ['pointerdown', 'pointerup'], 'A failed gesture does not break the next one');
  } finally {
    await context.close();
    await new Promise(resolve => server.close(resolve));
    await rm(dir, {recursive: true, force: true});
  }
});

test('failures name the pages a case opened and capture the open ones', {skip: !process.env.QA_BROWSER_EXECUTABLE}, async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'qa-pages-contract-'));
  const server = createServer((req, res) => res.end('<title>fixture</title>'));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await mkdir(path.join(root, '.agents/qa'), {recursive: true});
    await writeFile(path.join(root, '.agents/qa/config.json'), JSON.stringify({name: 'pages-contract', baseUrl: base, browser: {actionDelayMs: 0}}));
    await writeFile(path.join(root, '.agents/qa/suite.mjs'), `export const cases = [{id: 'pages', surface: 'website', async run(qa) {
      const context = await qa.browser();
      const closed = await context.newPage();
      await closed.goto(qa.config.baseUrl + '/login?code=private');
      await closed.close();
      const open = await context.newPage();
      await open.goto(qa.config.baseUrl + '/dashboard#tab');
      await open.getByText('Saved').waitFor({timeout: 100});
    }}];`);
    const result = await command(process.execPath, [new URL('../scripts/qa.mjs', import.meta.url).pathname, 'run', '--root', root, '--output', path.join(root, 'results')], {env: {...process.env, QA_STATE_DIR: path.join(root, 'private')}});
    assert.equal(result.code, 1, result.stdout);
    const {pages} = JSON.parse(await readFile(path.join(root, 'results/report.json'), 'utf8')).results[0];
    assert.deepEqual(pages.map(page => page.url), [`${base}/login`, `${base}/dashboard`], 'Pages keep their last address without the query');
    assert.equal(pages[0].screenshot, undefined, 'A closed page has no screenshot');
    assert.ok((await stat(pages[1].screenshot)).size > 0, 'An open page is captured at the failure');
    assert.match(result.stdout, new RegExp(`page ${base}/dashboard ${pages[1].screenshot}`));
  } finally {
    await new Promise(resolve => server.close(resolve));
    await rm(root, {recursive: true, force: true});
  }
});

test('scripted microphone speaks clips on demand and the meter hears played audio', {skip: !process.env.QA_BROWSER_EXECUTABLE}, async () => {
  const {captureAudio} = await import('../scripts/audio.mjs');
  const dir = await mkdtemp(path.join(tmpdir(), 'qa-audio-contract-'));
  // Half a second of a 440 Hz tone as 16-bit mono WAV.
  const rate = 16000;
  const pcm = Buffer.alloc(rate / 2 * 2);
  for (let i = 0; i < rate / 2; i++) pcm.writeInt16LE(Math.round(Math.sin(2 * Math.PI * 440 * i / rate) * 12000), i * 2);
  const header = Buffer.alloc(44);
  header.write('RIFF', 0); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22); header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28); header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34); header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
  const clip = path.join(dir, 'clip.wav');
  await writeFile(clip, Buffer.concat([header, pcm]));
  // A tone straight to the speakers, and one through an <audio> element as WebRTC players do.
  const html = `<!doctype html><button id=mic>mic</button><button id=speaker>speaker</button><button id=element>element</button><audio id=player></audio><script>
window.heard = 0;
const tone = (context, target) => { const oscillator = context.createOscillator(); oscillator.connect(target); oscillator.start(); oscillator.stop(context.currentTime + 0.4); };
mic.onclick = async () => {
  const context = new AudioContext();
  const analyser = context.createAnalyser();
  context.createMediaStreamSource(await navigator.mediaDevices.getUserMedia({audio: {echoCancellation: true}})).connect(analyser);
  const samples = new Float32Array(analyser.fftSize);
  setInterval(() => { analyser.getFloatTimeDomainData(samples); window.heard = Math.max(window.heard, ...samples.map(Math.abs)); }, 20);
  window.listening = true;
};
speaker.onclick = () => { const context = new AudioContext(); tone(context, context.destination); };
element.onclick = () => { const context = new AudioContext(); const stream = context.createMediaStreamDestination(); tone(context, stream); player.srcObject = stream.stream; player.play(); };
</script>`;
  const server = createServer((req, res) => res.end(html));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const context = await openBrowser({root: dir, browser: {actionDelayMs: 0}}, dir, []);
  try {
    const page = await context.newPage();
    const audio = await captureAudio(page);
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    assert.ok(await page.evaluate(async () => (await navigator.mediaDevices.enumerateDevices()).some(device => device.kind === 'audioinput')), 'The page can list a microphone');
    await assert.rejects(audio.say(clip), /has not opened the microphone/);
    await page.click('#mic');
    await page.waitForFunction(() => window.listening);
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => window.heard), 0, 'The microphone is silent until a clip is said');
    const started = Date.now();
    await audio.say(clip);
    assert.ok(Date.now() - started >= 450, 'Saying a clip waits for it to finish');
    assert.ok(await page.evaluate(() => window.heard) > 0.1, 'The page hears the clip through its microphone');
    assert.deepEqual(await audio.output(), {peak: 0, activeMs: 0}, 'A clip on the microphone is not counted as played audio');
    for (const button of ['#speaker', '#element']) {
      const before = (await audio.output()).activeMs;
      await page.click(button);
      await page.waitForFunction(before => window.__qaAudio.activeMs >= before + 200, before);
      await page.waitForTimeout(400);
      const quiet = (await audio.output()).activeMs;
      await page.waitForTimeout(300);
      assert.equal((await audio.output()).activeMs, quiet, `Audible time stops when the ${button.slice(1)} tone ends`);
    }
    assert.ok((await audio.output()).peak > 0.1, 'Played audio reaches the meter');
  } finally {
    await context.close();
    await new Promise(resolve => server.close(resolve));
    await rm(dir, {recursive: true, force: true});
  }
});

test('uncaught page errors fail a case unless it allows them, and overflow names the wide elements', {skip: !process.env.QA_BROWSER_EXECUTABLE}, async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'qa-errors-contract-'));
  const pages = {
    '/error?code=private': '<title>fixture</title><script>throw new Error("boom")</script>',
    '/fits': '<body style="margin:0"><div style="overflow-x:auto"><div style="width:3000px">strip</div></div></body>',
    '/wide': '<body style="margin:0"><div id="wide" class="strip row" style="width:2000px">wide</div></body>',
  };
  const server = createServer((req, res) => res.end(pages[req.url]));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await mkdir(path.join(root, '.agents/qa'), {recursive: true});
    await writeFile(path.join(root, '.agents/qa/config.json'), JSON.stringify({name: 'errors-contract', baseUrl: base, browser: {actionDelayMs: 0}}));
    await writeFile(path.join(root, '.agents/qa/suite.mjs'), `const error = async qa => {
      const page = await (await qa.browser()).newPage();
      await Promise.all([page.waitForEvent('pageerror'), page.goto(qa.config.baseUrl + '/error?code=private')]);
      qa.assert.equal(await page.title(), 'fixture');
      await page.close();
    };
    export const cases = [
      {id: 'error', surface: 'website', run: error},
      {id: 'allowed', surface: 'website', allowPageErrors: true, run: error},
      {id: 'overflow', surface: 'website', async run(qa) {
        const page = await (await qa.browser()).newPage();
        await page.goto(qa.config.baseUrl + '/fits');
        qa.assert.deepEqual(await qa.overflow(page), [], 'A scrolling strip fits');
        await page.goto(qa.config.baseUrl + '/wide');
        qa.assert.deepEqual(await qa.overflow(page), [], 'The page fits');
      }},
    ];`);
    const result = await command(process.execPath, [new URL('../scripts/qa.mjs', import.meta.url).pathname, 'run', '--root', root, '--output', path.join(root, 'results')], {env: {...process.env, QA_STATE_DIR: path.join(root, 'private')}});
    assert.equal(result.code, 1, result.stdout);
    const [error, allowed, overflow] = JSON.parse(await readFile(path.join(root, 'results/report.json'), 'utf8')).results;
    assert.equal(error.status, 'fail');
    assert.equal(error.reason, 'Uncaught page error: boom');
    assert.deepEqual(error.pageErrors, [{url: `${base}/error`, message: 'boom'}], 'Errors keep their page address without the query');
    assert.match(result.stdout, new RegExp(`^ {2}pageerror ${base}/error boom$`, 'm'));
    assert.equal(allowed.status, 'pass');
    assert.equal(overflow.reason, `AssertionError: The page fits (actual [ 'div#wide.strip.row right=2000' ], expected [])`);
  } finally {
    await new Promise(resolve => server.close(resolve));
    await rm(root, {recursive: true, force: true});
  }
});
