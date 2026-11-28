import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {mkdtemp, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {checkOAuthRedirect} from '../scripts/auth.mjs';
import {assertRequestBudget, command, openBrowser, resolveBrowserExecutable} from '../scripts/runtime.mjs';

function sanitizeReturnTo(raw) {
  if (!raw || typeof raw !== 'string' || !raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\') || /%(?:2f|5c)/i.test(raw)) return '/';
  return raw;
}

async function serveOAuth(t, fault = null) {
  const transactions = new Map();
  let seq = 0;
  const server = createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const origin = url.origin;
    if (url.pathname === '/auth/start') {
      const rawReturnTo = url.searchParams.get('returnTo') ?? '/';
      if (fault === 'same-origin-double-slash' && rawReturnTo.startsWith(origin)) {
        res.writeHead(302, {
          Location: rawReturnTo,
          'Cache-Control': 'no-store',
          'Set-Cookie': 'oauth_state=ignored; Path=/; HttpOnly; SameSite=Lax; Max-Age=900',
        }).end();
        return;
      }
      const safeReturnTo = fault === 'open-redirect' ? rawReturnTo : sanitizeReturnTo(rawReturnTo);
      const state = `qa-st-${++seq}`;
      const cookieVal = `qa-cookie-${seq}`;
      transactions.set(state, {cookieVal, returnTo: safeReturnTo});
      const provider = new URL('https://accounts.example/oauth/authorize');
      provider.searchParams.set('state', state);
      if (fault !== 'missing-pkce') {
        provider.searchParams.set('code_challenge', 'qa-challenge');
        provider.searchParams.set('code_challenge_method', 'S256');
      }
      provider.searchParams.set('redirect_uri', `${origin}/auth/callback`);
      const hint = url.searchParams.get('login_hint');
      if (hint) provider.searchParams.set('login_hint', hint);
      res.writeHead(302, {
        Location: provider.href,
        'Cache-Control': 'no-store',
        'Set-Cookie': [
          `oauth_state=${cookieVal}; Path=/; HttpOnly; SameSite=Lax; Max-Age=900`,
          'lang=tr; Path=/; SameSite=Lax',
        ],
      }).end();
      return;
    }
    if (url.pathname === '/auth/callback') {
      const cookies = Object.fromEntries((req.headers.cookie ?? '').split(';').map(c => c.trim().split('=')).filter(([k]) => k));
      const stateCookie = cookies.oauth_state;
      const state = url.searchParams.get('state') ?? '';
      const tx = transactions.get(state);
      const middlewareLang = 'lang=tr; Path=/; SameSite=Lax';
      if (!stateCookie) {
        if (fault === 'raw-401') {
          res.writeHead(401, {'content-type': 'application/json'}).end('{"error":"missing_state"}');
          return;
        }
        res.writeHead(302, {Location: `${origin}/en/login?error=state_expired`, 'Set-Cookie': middlewareLang}).end();
        return;
      }
      if (!tx || tx.cookieVal !== stateCookie) {
        res.writeHead(302, {
          Location: `${origin}/en/login?error=state_mismatch`,
          'Set-Cookie': ['oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0', middlewareLang],
        }).end();
        return;
      }
      transactions.delete(state);
      const clear = 'oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
      if (url.searchParams.get('error') === 'access_denied') {
        const dest = fault === 'dropped-return-to'
          ? `${origin}/en/login?error=access_denied`
          : `${origin}/en/login?${new URLSearchParams({error: 'access_denied', returnTo: tx.returnTo})}`;
        res.writeHead(302, {Location: dest, 'Set-Cookie': [clear, middlewareLang]}).end();
        return;
      }
      res.writeHead(302, {Location: `${origin}${tx.returnTo}`, 'Set-Cookie': clear}).end();
      return;
    }
    res.writeHead(404).end();
  }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); server.close(); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  return {origin, startUrl: `${origin}/auth/start`, callbackUrl: `${origin}/auth/callback`};
}

test('checkOAuthRedirect validates compliant OAuth endpoints and rejects regressions inside runSuite', async t => {
  const good = await serveOAuth(t);
  const root = await mkdtemp(path.join(tmpdir(), 'qa-oauth-contract-'));
  t.after(() => rm(root, {recursive: true, force: true}));
  await mkdir(path.join(root, '.agents/qa'), {recursive: true});
  await writeFile(path.join(root, '.agents/qa/config.json'), JSON.stringify({name: 'oauth-contract', baseUrl: good.origin}));
  await writeFile(path.join(root, '.agents/qa/suite.mjs'), `
    export const cases = [{
      id: 'oauth.redirect', surface: 'oauth',
      async run(qa) {
        const summary = await qa.checkOAuthRedirect({startUrl: '/auth/start', callbackUrl: '/auth/callback', locales: ['en', 'tr', 'ar']});
        qa.assert.equal(summary.probesPassed, 6);
      },
    }];
  `);
  const cli = fileURLToPath(new URL('../scripts/qa.mjs', import.meta.url));
  const result = await command(process.execPath, [cli, 'run', '--root', root, '--output', path.join(root, 'out')], {
    env: {...process.env, QA_STATE_DIR: path.join(root, 'private')},
  });
  assert.equal(result.code, 0, result.stdout + result.stderr);
  const report = JSON.parse(await readFile(path.join(root, 'out/report.json'), 'utf8'));
  assert.equal(report.results[0].status, 'pass');
  assert.ok(report.results[0].assertions > 10);

  for (const [fault, pattern] of [
    ['missing-pkce', /PKCE (?:code_challenge|S256)/],
    ['open-redirect', /evil\.example|stays on/],
    ['same-origin-double-slash', /evil\.example|\/\/ path/],
    ['raw-401', /missing-state recovers with 3xx/],
    ['dropped-return-to', /preserves returnTo/],
  ]) {
    const bad = await serveOAuth(t, fault);
    await assert.rejects(
      checkOAuthRedirect({assert, config: {baseUrl: bad.origin}}, {startUrl: '/auth/start', callbackUrl: '/auth/callback', locales: ['en', 'tr', 'ar']}),
      pattern,
    );
  }
});

test('assertRequestBudget enforces zero anonymous profile/identity calls and bounds 404 retries', async t => {
  const dir = await mkdtemp(path.join(tmpdir(), 'qa-budget-contract-'));
  t.after(() => rm(dir, {recursive: true, force: true}));
  const browserExecutable = await resolveBrowserExecutable({}, dir);
  if (!browserExecutable) {
    t.skip('No browser executable available for assertRequestBudget browser test');
    return;
  }

  let attempts = 0;
  const server = createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === '/user/profile' || url.pathname === '/support/identity') {
      res.writeHead(204).end();
      return;
    }
    if (url.pathname === '/api/stream') {
      attempts++;
      res.writeHead(404).end('expired');
      return;
    }
    if (url.pathname === '/clean') {
      res.setHeader('content-type', 'text/html');
      res.end('<!doctype html><title>Clean</title><button id="play" onclick="fetch(\'/api/stream\').then(() => fetch(\'/api/stream\'))">Play</button>');
      return;
    }
    if (url.pathname === '/noisy-guest') {
      res.setHeader('content-type', 'text/html');
      res.end('<!doctype html><script>fetch("/user/profile"); fetch("/support/identity");</script>');
      return;
    }
    if (url.pathname === '/retry-storm') {
      res.setHeader('content-type', 'text/html');
      res.end('<!doctype html><button id="play" onclick="for (let i = 0; i < 5; i++) fetch(\'/api/stream\')">Play</button>');
      return;
    }
    res.writeHead(404).end();
  }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); server.close(); });
  const base = `http://127.0.0.1:${server.address().port}`;

  const context = await openBrowser({root: dir, browser: {executablePath: browserExecutable, actionDelayMs: 0}}, dir, []);
  t.after(() => context.close());
  const page = await context.newPage();

  const ok = await assertRequestBudget(page, {
    forbidden: ['/user/profile', '/support/identity'],
    max: {'/api/stream': 2},
  }, async () => {
    await page.goto(`${base}/clean`);
    await page.click('#play');
    await page.waitForTimeout(100);
  });
  assert.deepEqual(ok.counts, {'/user/profile': 0, '/support/identity': 0, '/api/stream': 2});
  assert.equal(attempts, 2);

  await assert.rejects(
    assertRequestBudget(page, {forbidden: ['/user/profile', '/support/identity']}, async () => {
      await page.goto(`${base}/noisy-guest`);
      await page.waitForTimeout(100);
    }),
    /Forbidden request matched \/user\/profile/,
  );

  await assert.rejects(
    assertRequestBudget(page, {max: {'/api/stream': 2}}, async () => {
      await page.goto(`${base}/retry-storm`);
      await page.click('#play');
      await page.waitForTimeout(150);
    }),
    /Request budget exceeded for \/api\/stream: observed 5, limit 2/,
  );
});
