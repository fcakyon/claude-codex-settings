import {after, before, test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createServer} from 'node:http';
import {mkdir, mkdtemp, readFile, rm, stat, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createMediaChecks} from '../scripts/media.mjs';
import {command, openBrowser} from '../scripts/runtime.mjs';

const hasMediaTools = spawnSync('ffmpeg', ['-version'], {stdio: 'ignore'}).status === 0
  && spawnSync('ffprobe', ['-version'], {stdio: 'ignore'}).status === 0;

let sharedDir;
let sharedGoodClip;
let sharedShortClip;
let sharedSparseClip;

async function makeClip(filePath, {gop, faststart, duration = 4}) {
  const args = [
    '-y',
    '-f', 'lavfi', '-i', `testsrc2=size=160x90:rate=24:duration=${duration}`,
    '-f', 'lavfi', '-i', `sine=frequency=440:duration=${duration}`,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
    '-g', String(gop), '-keyint_min', String(gop), '-sc_threshold', '0',
    '-c:a', 'aac',
    ...(faststart ? ['-movflags', '+faststart'] : []),
    filePath,
  ];
  const result = await command('ffmpeg', args);
  assert.equal(result.code, 0, result.stderr);
}

before(async () => {
  if (!hasMediaTools) return;
  sharedDir = await mkdtemp(path.join(tmpdir(), 'qa-media-fixtures-'));
  sharedGoodClip = path.join(sharedDir, 'good.mp4');
  sharedShortClip = path.join(sharedDir, 'short.mp4');
  sharedSparseClip = path.join(sharedDir, 'sparse.mp4');
  await Promise.all([
    makeClip(sharedGoodClip, {gop: 24, faststart: true, duration: 4}),
    makeClip(sharedShortClip, {gop: 24, faststart: true, duration: 1.5}),
    makeClip(sharedSparseClip, {gop: 240, faststart: false, duration: 4}),
  ]);
});

after(async () => {
  if (sharedDir) await rm(sharedDir, {recursive: true, force: true});
});

async function startMediaServer(t, routesMap, {goodClip = sharedGoodClip, shortClip = sharedShortClip} = {}) {
  const routes = new Map(Object.entries(routesMap));
  const files = new Map([
    ['/good.mp4', goodClip],
    ['/short.mp4', shortClip],
  ]);
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (url.pathname === '/no-range.mp4' || url.pathname === '/fallback.mp4') {
      const body = url.pathname === '/fallback.mp4' ? Buffer.from('<!doctype html><p>SPA</p>') : await readFile(goodClip);
      res.writeHead(200, {'content-type': url.pathname === '/fallback.mp4' ? 'text/html' : 'video/mp4', 'content-length': body.length});
      res.end(body);
      return;
    }
    if (url.pathname === '/oversized-200.mp4') {
      res.writeHead(200, {'content-type': 'video/mp4', 'content-length': 10 * 1024 * 1024});
      res.write(Buffer.alloc(65536));
      return;
    }
    if (files.has(url.pathname)) {
      const file = files.get(url.pathname);
      const total = (await stat(file)).size;
      const bytes = await readFile(file);
      const match = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || '');
      if (match) {
        const start = Number(match[1]);
        const end = match[2] ? Math.min(Number(match[2]), total - 1) : total - 1;
        res.writeHead(206, {
          'content-type': 'video/mp4',
          'accept-ranges': 'bytes',
          'content-range': `bytes ${start}-${end}/${total}`,
          'content-length': end - start + 1,
        });
        res.end(bytes.subarray(start, end + 1));
      } else {
        res.writeHead(200, {'content-type': 'video/mp4', 'accept-ranges': 'bytes', 'content-length': total});
        res.end(bytes);
      }
      return;
    }
    if (routes.has(url.pathname)) {
      res.writeHead(200, {'content-type': 'text/html'}).end(routes.get(url.pathname));
      return;
    }
    res.writeHead(404).end('not found');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => {
    server.closeAllConnections?.();
    return new Promise(resolve => server.close(resolve));
  });
  return `http://127.0.0.1:${server.address().port}`;
}

test('probeMediaAsset enforces keyframe cadence and faststart atom ordering', {skip: !hasMediaTools}, async () => {
  const media = createMediaChecks();
  const inspected = await media.probeMediaAsset(sharedGoodClip, {maxKeyframeIntervalSec: 2, requireFaststart: true, requireAudio: true});
  assert.ok(inspected.maxKeyframeGapSec <= 1.2, `expected <= 1.2s gap, got ${inspected.maxKeyframeGapSec}`);
  assert.equal(inspected.faststart, true);
  assert.equal(inspected.hasAudio, true);
  assert.equal(inspected.width, 160);
  assert.equal(inspected.height, 90);

  await assert.rejects(
    media.probeMediaAsset(sharedSparseClip, {maxKeyframeIntervalSec: 2}),
    /Max keyframe gap/,
  );
  await assert.rejects(
    media.probeMediaAsset(sharedSparseClip, {maxKeyframeIntervalSec: 10, requireFaststart: true}),
    /MP4 moov atom must precede mdat/,
  );
});

test('assertRangeSupport validates headers before reading body and rejects non-206 or HTML responses', {skip: !hasMediaTools}, async t => {
  const base = await startMediaServer(t, {});
  const media = createMediaChecks();

  const ok = await media.assertRangeSupport(`${base}/good.mp4`);
  assert.equal(ok.status, 206);
  assert.equal(ok.contentType, 'video/mp4');
  assert.ok(ok.bytesRead > 0);
  await assert.rejects(media.assertRangeSupport(`${base}/no-range.mp4`), /returned HTTP 200/);
  await assert.rejects(media.assertRangeSupport(`${base}/fallback.mp4`), /returned HTTP 200/);
  await assert.rejects(media.assertRangeSupport(`${base}/oversized-200.mp4`, {timeoutMs: 2000}), /returned HTTP 200/);
});

test('assertPlaybackStability handles synced unmute, short loops, dynamic play actions, and rejects regressions', {skip: !process.env.QA_BROWSER_EXECUTABLE || !hasMediaTools}, async t => {
  const dir = await mkdtemp(path.join(tmpdir(), 'qa-media-stability-'));
  t.after(() => rm(dir, {recursive: true, force: true}));
  const pageHtml = script => `<!doctype html>
    <video id="a" src="/good.mp4" autoplay muted loop playsinline></video>
    <video id="b" src="/good.mp4" autoplay muted loop playsinline></video>
    <button id="unmute">Unmute</button>
    <script>
      const [a, b] = [document.getElementById('a'), document.getElementById('b')];
      document.getElementById('unmute').onclick = () => { ${script} };
    </script>`;
  const base = await startMediaServer(t, {
    '/healthy': pageHtml('b.muted = false;'),
    '/short-loop': `<!doctype html><video src="/short.mp4" autoplay muted loop playsinline></video>`,
    '/lazy-start': `<!doctype html><video id="v" src="/good.mp4" preload="none" muted playsinline></video><button id="play" onclick="document.getElementById('v').play()">Play</button>`,
    '/seek-storm': pageHtml('b.muted = false; setInterval(() => { b.currentTime = a.currentTime; }, 180);'),
    '/drift': pageHtml('b.muted = false; a.currentTime = 0.2; b.currentTime = 1.6;'),
    '/warped-rate': pageHtml('b.muted = false; b.playbackRate = 1.1;'),
  });
  const context = await openBrowser({root: dir, browser: {actionDelayMs: 0}}, dir, []);
  t.after(() => context.close());
  const page = await context.newPage();
  const media = createMediaChecks();

  await page.goto(`${base}/healthy`);
  const healthy = await media.assertPlaybackStability(page, {
    expectedCount: 2, durationMs: 1200, minAdvanceSec: 0.5,
    action: () => page.click('#unmute'),
  });
  assert.equal(healthy.count, 2);
  assert.ok(healthy.maxDriftSec < 0.25);

  await page.goto(`${base}/short-loop`);
  const shortLoop = await media.assertPlaybackStability(page, {
    expectedCount: 1, durationMs: 1700, minAdvanceSec: 1.0,
  });
  assert.ok(shortLoop.videos[0].advancedSec >= 1.0);

  await page.goto(`${base}/lazy-start`);
  const started = await media.assertPlaybackStability(page, {
    expectedCount: 1, durationMs: 900, minAdvanceSec: 0.4,
    action: () => page.click('#play'),
  });
  assert.equal(started.count, 1);

  await page.goto(`${base}/seek-storm`);
  await assert.rejects(
    media.assertPlaybackStability(page, {
      expectedCount: 2, durationMs: 1200, minAdvanceSec: 0.2,
      action: () => page.click('#unmute'),
    }),
    /seeking count/,
  );

  await page.goto(`${base}/drift`);
  await assert.rejects(
    media.assertPlaybackStability(page, {
      expectedCount: 2, durationMs: 900, minAdvanceSec: 0.3,
      action: () => page.click('#unmute'),
    }),
    /Video sync drift/,
  );

  await page.goto(`${base}/warped-rate`);
  await assert.rejects(
    media.assertPlaybackStability(page, {
      expectedCount: 2, durationMs: 900, minAdvanceSec: 0.3,
      action: () => page.click('#unmute'),
    }),
    /unmuted playbackRate must stay 1/,
  );
});

test('counts media checks as explicit outcomes in an actual project QA run', {skip: !process.env.QA_BROWSER_EXECUTABLE || !hasMediaTools}, async t => {
  const root = await mkdtemp(path.join(tmpdir(), 'qa-media-run-'));
  t.after(() => rm(root, {recursive: true, force: true}));
  const base = await startMediaServer(t, {
    '/': '<!doctype html><video src="/good.mp4" autoplay muted loop playsinline></video><button id="unmute" onclick="document.querySelector(\'video\').muted=false">Unmute</button>',
  });
  await mkdir(path.join(root, '.agents/qa'), {recursive: true});
  await writeFile(path.join(root, '.agents/qa/config.json'), JSON.stringify({name: 'media-contract', baseUrl: base, browser: {actionDelayMs: 0}}));
  await writeFile(path.join(root, '.agents/qa/suite.mjs'), `export const cases = [{id: 'media.check', surface: 'website/video', async run(qa) {
    await qa.media.probeMediaAsset(${JSON.stringify(sharedGoodClip)}, {maxKeyframeIntervalSec: 2, requireFaststart: true});
    await qa.media.assertRangeSupport(qa.config.baseUrl + '/good.mp4');
    const page = await (await qa.browser()).newPage();
    try {
      await page.goto(qa.config.baseUrl + '/');
      await qa.media.assertPlaybackStability(page, {expectedCount: 1, durationMs: 900, minAdvanceSec: 0.4, action: () => page.click('#unmute')});
    } finally { await page.close(); }
  }}];`);
  const result = await command(process.execPath, [new URL('../scripts/qa.mjs', import.meta.url).pathname, 'run', '--root', root, '--output', path.join(root, 'results')], {
    env: {...process.env, QA_STATE_DIR: path.join(root, 'private')},
  });
  assert.equal(result.code, 0, result.stdout + result.stderr);
  const report = JSON.parse(await readFile(path.join(root, 'results/report.json'), 'utf8'));
  assert.equal(report.results[0].status, 'pass');
  assert.ok(report.results[0].assertions >= 15);
});
