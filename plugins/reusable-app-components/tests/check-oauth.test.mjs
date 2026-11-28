import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import path from 'node:path';
import { test } from 'node:test';
import { promisify } from 'node:util';
import { checkOAuth } from '../skills/app-auth/scripts/check-oauth.mjs';

const exec = promisify(execFile);
const script = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../skills/app-auth/scripts/check-oauth.mjs');

function sanitizeReturnTo(raw) {
  if (!raw || typeof raw !== 'string' || !raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\') || /%(?:2f|5c)/i.test(raw)) return '/';
  return raw;
}

async function serveOAuth(t, fault = null) {
  const secretToken = 'secret-oauth-state-value';
  const transactions = new Map();
  let seq = 0;

  const server = createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const origin = url.origin;

    if (url.pathname === '/auth/google/login') {
      const rawReturnTo = url.searchParams.get('returnTo') ?? '/';
      if (fault === 'same-origin-double-slash' && rawReturnTo.startsWith(origin)) {
        res.writeHead(302, {
          Location: rawReturnTo,
          'Cache-Control': 'no-store',
          'Set-Cookie': 'oauth_state=ignored; Path=/; HttpOnly; SameSite=Lax; Max-Age=900',
        }).end();
        return;
      }
      if (fault === 'reject-unsafe-400' && sanitizeReturnTo(rawReturnTo) !== rawReturnTo && rawReturnTo !== '/') {
        res.writeHead(400, { 'content-type': 'application/json' }).end(JSON.stringify({ error: 'invalid_return_to' }));
        return;
      }
      const safeReturnTo = fault === 'open-redirect' ? rawReturnTo : sanitizeReturnTo(rawReturnTo);
      const state = `st-${++seq}`;
      const cookieVal = `${secretToken}-${seq}`;
      transactions.set(state, { cookieVal, returnTo: safeReturnTo });

      const provider = new URL('https://accounts.google.example/o/oauth2/v2/auth');
      provider.searchParams.set('state', state);
      if (fault !== 'missing-pkce') {
        provider.searchParams.set('code_challenge', 'challenge-s256');
        provider.searchParams.set('code_challenge_method', 'S256');
      }
      provider.searchParams.set('redirect_uri', `${origin}/auth/google/callback`);
      const hint = url.searchParams.get('login_hint');
      if (hint && fault !== 'missing-login-hint') provider.searchParams.set('login_hint', hint);

      const headers = { Location: provider.href };
      if (fault !== 'missing-no-store') headers['Cache-Control'] = 'no-store';
      const stateCookie = fault === 'bad-cookie-attrs'
        ? `oauth_state=${cookieVal}; Path=/; SameSite=None; Max-Age=300`
        : `oauth_state=${cookieVal}; Path=/; HttpOnly; SameSite=Lax; Max-Age=900`;
      headers['Set-Cookie'] = [stateCookie, 'lang=en; Path=/; SameSite=Lax'];
      res.writeHead(302, headers).end();
      return;
    }

    if (url.pathname === '/auth/google/callback') {
      const cookies = Object.fromEntries(
        (req.headers.cookie ?? '').split(';').map((c) => c.trim().split('=').map(decodeURIComponent)).filter(([k]) => k)
      );
      const stateCookie = cookies.oauth_state;
      const state = url.searchParams.get('state') ?? '';
      const error = url.searchParams.get('error');
      const tx = transactions.get(state);
      const middlewareLang = 'lang=en; Path=/; SameSite=Lax';

      if (!stateCookie) {
        if (fault === 'raw-401-json') {
          res.writeHead(401, { 'content-type': 'application/json' }).end(JSON.stringify({ error: 'missing_state' }));
          return;
        }
        res.writeHead(302, { Location: `${origin}/en/login?error=state_expired`, 'Set-Cookie': middlewareLang }).end();
        return;
      }

      if (!tx || tx.cookieVal !== stateCookie) {
        const headers = { Location: `${origin}/en/login?error=state_mismatch` };
        if (fault === 'session-on-mismatch') {
          headers['Set-Cookie'] = ['oauth_state=; Path=/; Max-Age=0', 'pb_auth=forged-session; Path=/; HttpOnly'];
        } else if (fault !== 'uncleared-mismatch-cookie') {
          headers['Set-Cookie'] = ['oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0', middlewareLang];
        }
        res.writeHead(302, headers).end();
        return;
      }

      transactions.delete(state);
      const clearState = 'oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';

      if (error === 'access_denied') {
        if (fault === 'session-on-cancel') {
          res.writeHead(302, {
            Location: `${origin}/en/login?error=access_denied`,
            'Set-Cookie': [clearState, 'pb_auth=leaked-session; Path=/; HttpOnly'],
          }).end();
          return;
        }
        const destination = fault === 'dropped-return-to'
          ? `${origin}/en/login?error=access_denied`
          : `${origin}/en/login?${new URLSearchParams({ error: 'access_denied', returnTo: tx.returnTo })}`;
        res.writeHead(302, { Location: destination, 'Set-Cookie': [clearState, middlewareLang] }).end();
        return;
      }

      res.writeHead(302, { Location: `${origin}${tx.returnTo}`, 'Set-Cookie': clearState }).end();
      return;
    }

    res.writeHead(404).end('Not found');
  }).listen(0, '127.0.0.1');

  await once(server, 'listening');
  t.after(() => {
    server.closeAllConnections();
    server.close();
  });
  const origin = `http://127.0.0.1:${server.address().port}`;
  return {
    origin,
    start: `${origin}/auth/google/login`,
    callback: `${origin}/auth/google/callback`,
    secretToken,
  };
}

test('check-oauth passes compliant OAuth handlers (sanitizing or 400-rejecting) without leaking cookie values', async (t) => {
  for (const mode of [null, 'reject-unsafe-400']) {
    const srv = await serveOAuth(t, mode);
    const report = await checkOAuth({
      start: srv.start,
      callback: srv.callback,
      origin: srv.origin,
      locales: ['en', 'tr', 'ar'],
    });
    assert.equal(report.ok, true, JSON.stringify(report));
    assert.equal(report.probes.length, 6);
    assert.equal(JSON.stringify(report).includes(srv.secretToken), false, 'Cookie values must never appear in report');
  }

  const cliSrv = await serveOAuth(t);
  const { stdout } = await exec(process.execPath, [
    script,
    '--start', cliSrv.start,
    '--callback', cliSrv.callback,
    '--origin', cliSrv.origin,
    '--locales', 'en,tr,ar',
    '--json',
  ]);
  const parsed = JSON.parse(stdout);
  assert.equal(parsed.ok, true);
  assert.equal(stdout.includes(cliSrv.secretToken), false);
});

for (const [fault, expectedProbe] of [
  ['missing-no-store', 'start-and-locales'],
  ['missing-pkce', 'start-and-locales'],
  ['bad-cookie-attrs', 'start-and-locales'],
  ['missing-login-hint', 'login-hint'],
  ['open-redirect', 'open-redirect'],
  ['same-origin-double-slash', 'open-redirect'],
  ['raw-401-json', 'missing-state-cookie'],
  ['uncleared-mismatch-cookie', 'mismatched-state-cookie'],
  ['session-on-mismatch', 'mismatched-state-cookie'],
  ['dropped-return-to', 'access-denied'],
  ['session-on-cancel', 'access-denied'],
]) {
  test(`check-oauth detects ${fault} failure in ${expectedProbe}`, async (t) => {
    const srv = await serveOAuth(t, fault);
    const report = await checkOAuth({
      start: srv.start,
      callback: srv.callback,
      origin: srv.origin,
      locales: ['en', 'tr', 'ar'],
    });
    assert.equal(report.ok, false);
    const failed = report.probes.find((p) => p.id === expectedProbe);
    assert.equal(failed.ok, false, `Expected probe ${expectedProbe} to fail for ${fault}`);
    assert.ok(failed.problems.length > 0);
  });
}

test('check-oauth CLI exits 1 on failing handler and 2 on invalid arguments', async (t) => {
  const srv = await serveOAuth(t, 'raw-401-json');
  await assert.rejects(
    exec(process.execPath, [script, '--start', srv.start, '--callback', srv.callback, '--origin', srv.origin]),
    (err) => err.code === 1 && err.stdout.includes('FAIL missing-state-cookie'),
  );
  await assert.rejects(
    exec(process.execPath, [script, '--start', srv.start]),
    (err) => err.code === 2,
  );
});
