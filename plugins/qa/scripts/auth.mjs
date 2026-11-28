import assert from 'node:assert/strict';

export const MIN_STATE_MAX_AGE_SEC = 600;
export const DEFAULT_IGNORED_OAUTH_COOKIES = ['lang', '__cf_bm', 'cf_clearance', '_cfuvid', 'NEXT_LOCALE'];
export const UNSAFE_RETURN_TARGETS = [
  'https://evil.example/phish',
  '//evil.example/phish',
  '/\\evil.example/phish',
  '\\evil.example/phish',
  '/%5cevil.example/phish',
  'javascript:alert(1)',
];

function parseCookies(headers) {
  const now = Date.now();
  return (headers.getSetCookie?.() ?? [])
    .map(line => {
      const parts = line.split(';').map(part => part.trim());
      const eq = parts[0]?.indexOf('=') ?? -1;
      if (eq <= 0) return null;
      const name = parts[0].slice(0, eq).trim();
      const value = parts[0].slice(eq + 1);
      let httpOnly = false;
      let secure = false;
      let sameSite = null;
      let maxAge = null;
      let expiresAt = null;
      for (const attr of parts.slice(1)) {
        const lower = attr.toLowerCase();
        if (lower === 'httponly') httpOnly = true;
        else if (lower === 'secure') secure = true;
        else if (lower.startsWith('samesite=')) sameSite = lower.slice('samesite='.length).trim();
        else if (lower.startsWith('max-age=')) {
          const parsed = Number(lower.slice('max-age='.length).trim());
          if (Number.isFinite(parsed)) maxAge = parsed;
        } else if (lower.startsWith('expires=')) {
          const parsed = Date.parse(attr.slice('expires='.length).trim());
          if (!Number.isNaN(parsed)) expiresAt = parsed;
        }
      }
      const cleared = value === '' || (maxAge !== null && maxAge <= 0) || (expiresAt !== null && expiresAt <= now);
      return {name, value, httpOnly, secure, sameSite, maxAge, expiresAt, cleared};
    })
    .filter(Boolean);
}

function cookieHeader(cookies) {
  return cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
}

function resolveLocation(location, base) {
  if (!location) return null;
  try {
    return new URL(location, base);
  } catch {
    return null;
  }
}

function hasUnsafeRedirectTarget(loc, rawLocation) {
  if (!loc || !/^https?:$/i.test(loc.protocol)) return true;
  if (rawLocation?.startsWith('//') || loc.pathname.startsWith('//')) return true;
  return loc.href.toLowerCase().includes('evil.example');
}

async function manualGet(url, {cookie, timeoutMs} = {}) {
  const response = await fetch(url, {
    method: 'GET',
    ...(cookie ? {headers: {cookie}} : {}),
    redirect: 'manual',
    signal: AbortSignal.timeout(timeoutMs),
  });
  await response.body?.cancel();
  return {
    status: response.status,
    cacheControl: response.headers.get('cache-control') ?? '',
    location: response.headers.get('location'),
    cookies: parseCookies(response.headers),
  };
}

function assertStartResponse(check, res, startUrl, expectedOrigin, returnTo, ignoredCookies) {
  check.ok(res.status >= 300 && res.status < 400 && Boolean(res.location), `OAuth start(${returnTo}) returns 3xx redirect with Location`);
  check.match(res.cacheControl, /\bno-store\b/i, `OAuth start(${returnTo}) sets Cache-Control: no-store`);
  const loc = resolveLocation(res.location, startUrl);
  check.ok(loc, `OAuth start(${returnTo}) returns a valid Location URL`);
  const state = loc.searchParams.get('state');
  check.ok(state, `OAuth start(${returnTo}) sets state query param`);
  check.ok(loc.searchParams.get('code_challenge'), `OAuth start(${returnTo}) sets PKCE code_challenge`);
  check.equal(loc.searchParams.get('code_challenge_method'), 'S256', `OAuth start(${returnTo}) sets PKCE S256`);
  const redirectUri = loc.searchParams.get('redirect_uri');
  if (redirectUri) {
    const parsedRedirect = resolveLocation(redirectUri, expectedOrigin);
    check.equal(parsedRedirect?.origin, expectedOrigin, `OAuth start(${returnTo}) redirect_uri stays on ${expectedOrigin}`);
  }
  const activeCookies = res.cookies.filter(cookie => !cookie.cleared && !ignoredCookies.has(cookie.name));
  check.ok(activeCookies.length > 0, `OAuth start(${returnTo}) sets at least one transient state cookie`);
  const isHttps = startUrl.protocol === 'https:';
  const now = Date.now();
  for (const cookie of activeCookies) {
    check.equal(cookie.httpOnly, true, `OAuth cookie ${cookie.name} sets HttpOnly`);
    check.equal(cookie.sameSite, 'lax', `OAuth cookie ${cookie.name} sets SameSite=Lax`);
    if (isHttps) check.equal(cookie.secure, true, `OAuth cookie ${cookie.name} sets Secure on HTTPS`);
    const ttlSeconds = cookie.maxAge ?? (cookie.expiresAt !== null ? Math.round((cookie.expiresAt - now) / 1000) : null);
    check.ok(ttlSeconds !== null && ttlSeconds >= MIN_STATE_MAX_AGE_SEC, `OAuth cookie ${cookie.name} Max-Age >= ${MIN_STATE_MAX_AGE_SEC}s`);
  }
  return {loc, state, stateCookies: activeCookies};
}

function assertErrorRecovery(check, {res, callbackUrl, expectedOrigin, expectedClearedNames, ignoredCookies, label}) {
  check.ok(res.status >= 300 && res.status < 400 && Boolean(res.location), `${label} recovers with 3xx redirect`);
  const loc = resolveLocation(res.location, callbackUrl);
  check.equal(loc?.origin, expectedOrigin, `${label} redirects within ${expectedOrigin}`);
  check.equal(hasUnsafeRedirectTarget(loc, res.location), false, `${label} does not leak unsafe redirect location`);
  const nonCleared = res.cookies.filter(cookie => !cookie.cleared && !ignoredCookies.has(cookie.name));
  check.deepEqual(nonCleared.map(cookie => cookie.name), [], `${label} mints zero non-cleared cookies`);
  for (const name of expectedClearedNames) {
    check.ok(res.cookies.some(cookie => cookie.name === name && cookie.cleared), `${label} clears state cookie ${name}`);
  }
  return loc;
}

function returnToPreserved(loc, probeReturnTo) {
  const expected = new URL(probeReturnTo, loc.origin);
  if (loc.pathname === expected.pathname && [...expected.searchParams.entries()].every(([k, v]) => loc.searchParams.get(k) === v)) {
    return true;
  }
  return ['returnTo', 'redirect', 'next'].some(param => loc.searchParams.get(param) === probeReturnTo);
}

export async function signIn(qa, page) {
  const {auth} = qa.config;
  if (!auth) throw new qa.Blocked('Configure the project sign-in journey');
  const username = await qa.secret(auth.usernameEnv);
  const context = page.context();
  const current = await context.request.get(auth.profileUrl);
  const profile = current.ok() ? await current.json() : null;
  if (profile?.[auth.identityField] === username) return {reused: true};
  if (profile) throw new qa.Blocked('The QA profile contains a different signed-in account. Use the configured QA account.');
  await page.goto(auth.loginUrl);
  await page.locator(auth.usernameSelector).fill(username);
  await page.locator(auth.passwordSelector).fill(await qa.secret(auth.passwordEnv));
  const response = page.waitForResponse(result => new URL(result.url()).pathname === new URL(auth.loginEndpoint).pathname && result.request().method() === 'POST');
  await page.locator(auth.submitSelector).click();
  const login = await response;
  if (login.status() === 429) throw new qa.Blocked('Login is rate-limited. Wait for the server cooldown before another login attempt.');
  qa.assert.ok(login.ok(), 'Login request failed');
  await page.waitForURL(auth.successUrl, {timeout: 30000});
  const result = await context.request.get(auth.profileUrl);
  qa.assert.equal(result.status(), 200, 'Signed-in profile request failed');
  qa.assert.equal((await result.json())?.[auth.identityField], username, 'Login did not create a session for the QA account');
  return {reused: false};
}

/**
 * Run zero-credential HTTP checks against OAuth start and callback endpoints.
 */
export async function checkOAuthRedirect(qa, opts = {}) {
  const check = qa?.assert ?? assert;
  const startRaw = opts.startUrl ?? opts.start;
  const callbackRaw = opts.callbackUrl ?? opts.callback;
  check.ok(startRaw && callbackRaw, 'checkOAuthRedirect requires startUrl and callbackUrl');
  const base = qa?.config?.baseUrl ?? undefined;
  const startUrl = new URL(startRaw, base);
  const callbackUrl = new URL(callbackRaw, base);
  const expectedOrigin = new URL(opts.origin || startUrl.origin, base).origin;
  const locales = (opts.locales ?? []).map(locale => String(locale).trim().replace(/^\/+|\/+$/g, '')).filter(Boolean);
  const ignoredCookies = new Set([...DEFAULT_IGNORED_OAUTH_COOKIES, ...(opts.ignoreCookies ?? [])]);
  const timeoutMs = opts.timeoutMs ?? 30_000;
  const loginHint = opts.loginHint ?? 'viewer@example.test';
  const targets = locales.length ? locales.map(locale => `/${locale}`) : ['/'];
  const unsafeTargets = [...UNSAFE_RETURN_TARGETS, `${expectedOrigin}//evil.example/phish`];
  const stateCookieNames = new Set();
  const startTransaction = async (returnTo, extraParams = {}) => {
    const url = new URL(startUrl);
    url.searchParams.set('returnTo', returnTo);
    for (const [k, v] of Object.entries(extraParams)) url.searchParams.set(k, v);
    const res = await manualGet(url, {timeoutMs});
    return assertStartResponse(check, res, startUrl, expectedOrigin, returnTo, ignoredCookies);
  };

  await Promise.all([
    // 1. Start + locales + Cache-Control: no-store + PKCE S256 + state cookie attrs
    Promise.all(targets.map(async returnTo => {
      const {stateCookies} = await startTransaction(returnTo, {prompt: 'select_account'});
      for (const cookie of stateCookies) stateCookieNames.add(cookie.name);
    })),

    // 2. login_hint forwarding
    (async () => {
      const {loc} = await startTransaction(targets[0], {login_hint: loginHint});
      check.equal(loc.searchParams.get('login_hint'), loginHint, 'OAuth start forwards login_hint');
    })(),

    // 3. Open-redirect negative controls
    Promise.all(unsafeTargets.map(async unsafe => {
      const url = new URL(startUrl);
      url.searchParams.set('returnTo', unsafe);
      const res = await manualGet(url, {timeoutMs});
      if (res.status >= 400 && res.status < 500) {
        check.deepEqual(
          res.cookies.filter(c => !c.cleared && !ignoredCookies.has(c.name)).map(c => c.name),
          [],
          `Unsafe returnTo (${unsafe}) sets no cookies on ${res.status}`,
        );
        return;
      }
      check.ok(res.status >= 300 && res.status < 400 && Boolean(res.location), `Unsafe returnTo (${unsafe}) either rejects 4xx or redirects safely`);
      const loc = resolveLocation(res.location, startUrl);
      check.equal(hasUnsafeRedirectTarget(loc, res.location), false, `Unsafe returnTo (${unsafe}) does not leak evil.example or // path into start Location`);
      const state = loc.searchParams.get('state');
      const active = res.cookies.filter(c => !c.cleared && !ignoredCookies.has(c.name));
      if (loc.origin !== expectedOrigin && state && active.length) {
        const cbUrl = new URL(callbackUrl);
        cbUrl.searchParams.set('error', 'access_denied');
        cbUrl.searchParams.set('state', state);
        const cbRes = await manualGet(cbUrl, {cookie: cookieHeader(active), timeoutMs});
        const cbLoc = resolveLocation(cbRes.location, callbackUrl);
        check.equal(cbLoc?.origin, expectedOrigin, `Unsafe returnTo (${unsafe}) callback redirect stays on ${expectedOrigin}`);
        check.equal(hasUnsafeRedirectTarget(cbLoc, cbRes.location), false, `Unsafe returnTo (${unsafe}) does not leak evil.example or // path into callback redirect`);
      }
    })),

    // 4. Missing/expired state cookie -> 0 session cookies + 3xx redirect to <origin>
    (async () => {
      const url = new URL(callbackUrl);
      url.searchParams.set('state', 'missing-probe-state');
      url.searchParams.set('code', 'probe-invalid-code');
      const res = await manualGet(url, {timeoutMs});
      assertErrorRecovery(check, {
        res,
        callbackUrl,
        expectedOrigin,
        expectedClearedNames: [],
        ignoredCookies,
        label: 'OAuth callback missing-state',
      });
    })(),

    // 5. Mismatched state cookie -> 0 session cookies + cleared state cookie + 3xx redirect
    (async () => {
      const {state, stateCookies} = await startTransaction(targets[0]);
      const cbUrl = new URL(callbackUrl);
      cbUrl.searchParams.set('state', `${state}-mismatch`);
      cbUrl.searchParams.set('code', 'probe-invalid-code');
      const cbRes = await manualGet(cbUrl, {cookie: cookieHeader(stateCookies), timeoutMs});
      assertErrorRecovery(check, {
        res: cbRes,
        callbackUrl,
        expectedOrigin,
        expectedClearedNames: stateCookies.map(c => c.name),
        ignoredCookies,
        label: 'OAuth callback mismatched-state',
      });
    })(),

    // 6. error=access_denied -> 0 session cookies + cleared state cookie + returnTo preserved
    (async () => {
      const probeReturnTo = `${targets[0]}?oauth_probe=cancel`;
      const {state, stateCookies} = await startTransaction(probeReturnTo);
      const cbUrl = new URL(callbackUrl);
      cbUrl.searchParams.set('error', 'access_denied');
      cbUrl.searchParams.set('state', state);
      const cbRes = await manualGet(cbUrl, {cookie: cookieHeader(stateCookies), timeoutMs});
      const loc = assertErrorRecovery(check, {
        res: cbRes,
        callbackUrl,
        expectedOrigin,
        expectedClearedNames: stateCookies.map(c => c.name),
        ignoredCookies,
        label: 'OAuth callback access_denied',
      });
      check.ok(returnToPreserved(loc, probeReturnTo), `OAuth callback access_denied preserves returnTo (${probeReturnTo})`);
    })(),
  ]);

  return {origin: expectedOrigin, locales: targets, stateCookieNames: [...stateCookieNames], probesPassed: 6};
}
