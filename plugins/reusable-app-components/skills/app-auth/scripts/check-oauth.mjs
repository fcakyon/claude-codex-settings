#!/usr/bin/env node

import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const DEFAULT_TIMEOUT_MS = 15_000;
export const MIN_STATE_MAX_AGE_SEC = 600;
export const DEFAULT_IGNORED_OAUTH_COOKIES = ["lang", "__cf_bm", "cf_clearance", "_cfuvid", "NEXT_LOCALE"];
export const UNSAFE_RETURN_TARGETS = [
  "https://evil.example/phish",
  "//evil.example/phish",
  "/\\evil.example/phish",
  "\\evil.example/phish",
  "/%5cevil.example/phish",
  "javascript:alert(1)",
];

function parseCookies(headers) {
  const raw = headers.getSetCookie?.() ?? [];
  const now = Date.now();
  return raw
    .map((line) => {
      const parts = line.split(";").map((part) => part.trim());
      const eq = parts[0]?.indexOf("=") ?? -1;
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
        if (lower === "httponly") httpOnly = true;
        else if (lower === "secure") secure = true;
        else if (lower.startsWith("samesite=")) sameSite = lower.slice("samesite=".length).trim();
        else if (lower.startsWith("max-age=")) {
          const parsed = Number(lower.slice("max-age=".length).trim());
          if (Number.isFinite(parsed)) maxAge = parsed;
        } else if (lower.startsWith("expires=")) {
          const parsed = Date.parse(attr.slice("expires=".length).trim());
          if (!Number.isNaN(parsed)) expiresAt = parsed;
        }
      }
      const cleared =
        value === "" ||
        (maxAge !== null && maxAge <= 0) ||
        (expiresAt !== null && expiresAt <= now);
      return { name, value, httpOnly, secure, sameSite, maxAge, expiresAt, cleared };
    })
    .filter(Boolean);
}

function summarizeCookies(cookies) {
  return cookies.map(({ name, httpOnly, secure, sameSite, maxAge, cleared }) => ({
    name,
    httpOnly,
    secure,
    sameSite,
    maxAge,
    cleared,
  }));
}

function cookieHeader(cookies) {
  return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
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
  if (rawLocation?.startsWith("//") || loc.pathname.startsWith("//")) return true;
  return loc.href.toLowerCase().includes("evil.example");
}

async function manualGet(url, { cookie, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const headers = {};
  if (cookie) headers.cookie = cookie;
  const response = await fetch(url, {
    method: "GET",
    headers,
    redirect: "manual",
    signal: AbortSignal.timeout(timeoutMs),
  });
  await response.body?.cancel();
  return {
    status: response.status,
    cacheControl: response.headers.get("cache-control") ?? "",
    location: response.headers.get("location"),
    cookies: parseCookies(response.headers),
  };
}

function validateStartResponse(res, startUrl, expectedOrigin, returnTo, ignoredCookies) {
  const problems = [];
  if (res.status < 300 || res.status >= 400 || !res.location) {
    problems.push(`start(${returnTo}) expected 3xx redirect with Location, got HTTP ${res.status}`);
    return { problems, loc: null, state: null, stateCookies: [] };
  }
  if (!/\bno-store\b/i.test(res.cacheControl)) {
    problems.push(`start(${returnTo}) missing Cache-Control: no-store`);
  }
  const loc = resolveLocation(res.location, startUrl);
  if (!loc) {
    problems.push(`start(${returnTo}) returned unparseable Location`);
    return { problems, loc: null, state: null, stateCookies: [] };
  }
  const state = loc.searchParams.get("state");
  const challenge = loc.searchParams.get("code_challenge");
  const method = loc.searchParams.get("code_challenge_method");
  if (!state) problems.push(`start(${returnTo}) Location missing state parameter`);
  if (!challenge || method !== "S256") {
    problems.push(`start(${returnTo}) Location missing PKCE S256 challenge`);
  }
  const redirectUri = loc.searchParams.get("redirect_uri");
  if (redirectUri) {
    const parsedRedirect = resolveLocation(redirectUri, expectedOrigin);
    if (!parsedRedirect || parsedRedirect.origin !== expectedOrigin) {
      problems.push(`start(${returnTo}) redirect_uri leaves ${expectedOrigin}`);
    }
  }
  const activeCookies = res.cookies.filter((cookie) => !cookie.cleared && !ignoredCookies.has(cookie.name));
  if (!activeCookies.length) {
    problems.push(`start(${returnTo}) set no active state cookie`);
  }
  const isHttps = startUrl.protocol === "https:";
  const now = Date.now();
  for (const cookie of activeCookies) {
    if (!cookie.httpOnly) problems.push(`cookie ${cookie.name} missing HttpOnly`);
    if (cookie.sameSite !== "lax") {
      problems.push(`cookie ${cookie.name} expected SameSite=Lax, got ${cookie.sameSite ?? "none"}`);
    }
    if (isHttps && !cookie.secure) problems.push(`cookie ${cookie.name} missing Secure on HTTPS`);
    const ttlSeconds = cookie.maxAge ?? (cookie.expiresAt !== null ? Math.round((cookie.expiresAt - now) / 1000) : null);
    if (ttlSeconds === null || ttlSeconds < MIN_STATE_MAX_AGE_SEC) {
      problems.push(`cookie ${cookie.name} Max-Age must be >= ${MIN_STATE_MAX_AGE_SEC}s`);
    }
  }
  return { problems, loc, state, stateCookies: activeCookies };
}

function assertErrorRedirect({ res, callbackUrl, expectedOrigin, expectedClearedNames, ignoredCookies, label }) {
  const problems = [];
  if (res.status < 300 || res.status >= 400 || !res.location) {
    problems.push(`${label} expected 3xx redirect to ${expectedOrigin}, got HTTP ${res.status}`);
    return { problems, loc: null };
  }
  const loc = resolveLocation(res.location, callbackUrl);
  if (!loc || loc.origin !== expectedOrigin || hasUnsafeRedirectTarget(loc, res.location)) {
    problems.push(`${label} redirected outside ${expectedOrigin}`);
  }
  const nonCleared = res.cookies.filter((cookie) => !cookie.cleared && !ignoredCookies.has(cookie.name));
  if (nonCleared.length) {
    problems.push(
      `${label} emitted non-cleared cookie(s): ${nonCleared.map((cookie) => cookie.name).join(", ")}`
    );
  }
  for (const name of expectedClearedNames) {
    const cleared = res.cookies.some((cookie) => cookie.name === name && cookie.cleared);
    if (!cleared) problems.push(`${label} did not clear state cookie ${name}`);
  }
  return { problems, loc };
}

function returnToPreserved(loc, probeReturnTo) {
  if (!loc) return false;
  const expected = new URL(probeReturnTo, loc.origin);
  if (
    loc.pathname === expected.pathname &&
    [...expected.searchParams.entries()].every(([k, v]) => loc.searchParams.get(k) === v)
  ) {
    return true;
  }
  for (const param of ["returnTo", "redirect", "next"]) {
    if (loc.searchParams.get(param) === probeReturnTo) return true;
  }
  return false;
}

/**
 * Run the six zero-credential OAuth redirect and state-recovery probes.
 *
 * @param {{start: string, callback: string, origin?: string, locales?: string[], loginHint?: string, ignoreCookies?: string[], timeoutMs?: number}} options
 */
export async function checkOAuth(options) {
  if (!options?.start || !options?.callback) {
    throw new Error("Both --start and --callback URLs are required.");
  }
  const startUrl = new URL(options.start);
  const callbackUrl = new URL(options.callback);
  const expectedOrigin = new URL(options.origin || startUrl.origin).origin;
  const locales = (options.locales ?? []).map((l) => l.trim().replace(/^\/+|\/+$/g, "")).filter(Boolean);
  const ignoredCookies = new Set([...DEFAULT_IGNORED_OAUTH_COOKIES, ...(options.ignoreCookies ?? [])]);
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const loginHint = options.loginHint ?? "viewer@example.test";

  const startTargets = locales.length ? locales.map((locale) => `/${locale}`) : ["/"];
  const unsafeTargets = [...UNSAFE_RETURN_TARGETS, `${expectedOrigin}//evil.example/phish`];
  const startTransaction = async (returnTo, extraParams = {}) => {
    const url = new URL(startUrl);
    url.searchParams.set("returnTo", returnTo);
    for (const [k, v] of Object.entries(extraParams)) url.searchParams.set(k, v);
    const res = await manualGet(url, { timeoutMs });
    return { res, ...validateStartResponse(res, startUrl, expectedOrigin, returnTo, ignoredCookies) };
  };

  const probes = await Promise.all([
    // 1. Start + locales + Cache-Control: no-store + PKCE S256 + state cookie attributes
    (async () => {
      const checks = await Promise.all(
        startTargets.map(async (returnTo) => ({
          returnTo,
          check: await startTransaction(returnTo, { prompt: "select_account" }),
        }))
      );
      const problems = checks.flatMap(({ check }) => check.problems);
      const details = checks.map(({ returnTo, check }) => ({
        returnTo,
        status: check.res.status,
        cacheControl: check.res.cacheControl,
        cookies: summarizeCookies(check.res.cookies),
      }));
      return { id: "start-and-locales", ok: problems.length === 0, problems, details };
    })(),

    // 2. login_hint propagation
    (async () => {
      const check = await startTransaction(startTargets[0], { login_hint: loginHint });
      if (check.loc && check.loc.searchParams.get("login_hint") !== loginHint) {
        check.problems.push(`start did not forward login_hint=${loginHint}`);
      }
      return { id: "login-hint", ok: check.problems.length === 0, problems: check.problems };
    })(),

    // 3. Open-redirect negative controls
    (async () => {
      const targetProblems = await Promise.all(
        unsafeTargets.map(async (unsafe) => {
          const problems = [];
          const url = new URL(startUrl);
          url.searchParams.set("returnTo", unsafe);
          const res = await manualGet(url, { timeoutMs });
          if (res.status >= 400 && res.status < 500) {
            if (res.cookies.some((c) => !c.cleared && !ignoredCookies.has(c.name))) {
              problems.push(`unsafe returnTo (${unsafe}) set non-cleared cookie on ${res.status}`);
            }
            return problems;
          }
          if (res.status >= 300 && res.status < 400 && res.location) {
            const loc = resolveLocation(res.location, startUrl);
            if (hasUnsafeRedirectTarget(loc, res.location)) {
              problems.push(`unsafe returnTo (${unsafe}) leaked into start Location`);
              return problems;
            }
            const state = loc.searchParams.get("state");
            const stateCookies = res.cookies.filter((c) => !c.cleared && !ignoredCookies.has(c.name));
            if (loc.origin !== expectedOrigin && state && stateCookies.length) {
              const cbUrl = new URL(callbackUrl);
              cbUrl.searchParams.set("error", "access_denied");
              cbUrl.searchParams.set("state", state);
              const cbRes = await manualGet(cbUrl, {
                cookie: cookieHeader(stateCookies),
                timeoutMs,
              });
              const cbLoc = resolveLocation(cbRes.location, callbackUrl);
              if (!cbLoc || cbLoc.origin !== expectedOrigin || hasUnsafeRedirectTarget(cbLoc, cbRes.location)) {
                problems.push(`unsafe returnTo (${unsafe}) survived into callback Location`);
              }
            }
            return problems;
          }
          problems.push(`unsafe returnTo (${unsafe}) returned unexpected status ${res.status}`);
          return problems;
        })
      );
      const problems = targetProblems.flat();
      return { id: "open-redirect", ok: problems.length === 0, problems };
    })(),

    // 4. Missing/expired state cookie -> 0 session cookies + 3xx redirect to <origin>
    (async () => {
      const url = new URL(callbackUrl);
      url.searchParams.set("state", "missing-probe-state");
      url.searchParams.set("code", "probe-invalid-code");
      const res = await manualGet(url, { timeoutMs });
      const { problems } = assertErrorRedirect({
        res,
        callbackUrl,
        expectedOrigin,
        expectedClearedNames: [],
        ignoredCookies,
        label: "missing-state-cookie",
      });
      return { id: "missing-state-cookie", ok: problems.length === 0, status: res.status, problems };
    })(),

    // 5. Mismatched state cookie -> 0 session cookies + cleared state cookie + 3xx redirect
    (async () => {
      const startCheck = await startTransaction(startTargets[0]);
      const problems = [...startCheck.problems];
      if (startCheck.state && startCheck.stateCookies.length) {
        const cbUrl = new URL(callbackUrl);
        cbUrl.searchParams.set("state", `${startCheck.state}-mismatch`);
        cbUrl.searchParams.set("code", "probe-invalid-code");
        const cbRes = await manualGet(cbUrl, {
          cookie: cookieHeader(startCheck.stateCookies),
          timeoutMs,
        });
        const check = assertErrorRedirect({
          res: cbRes,
          callbackUrl,
          expectedOrigin,
          expectedClearedNames: startCheck.stateCookies.map((c) => c.name),
          ignoredCookies,
          label: "mismatched-state-cookie",
        });
        problems.push(...check.problems);
      }
      return { id: "mismatched-state-cookie", ok: problems.length === 0, problems };
    })(),

    // 6. error=access_denied -> 0 session cookies + cleared state cookie + returnTo preserved
    (async () => {
      const probeReturnTo = `${startTargets[0]}?oauth_probe=cancel`;
      const startCheck = await startTransaction(probeReturnTo);
      const problems = [...startCheck.problems];
      if (startCheck.state && startCheck.stateCookies.length) {
        const cbUrl = new URL(callbackUrl);
        cbUrl.searchParams.set("error", "access_denied");
        cbUrl.searchParams.set("state", startCheck.state);
        const cbRes = await manualGet(cbUrl, {
          cookie: cookieHeader(startCheck.stateCookies),
          timeoutMs,
        });
        const check = assertErrorRedirect({
          res: cbRes,
          callbackUrl,
          expectedOrigin,
          expectedClearedNames: startCheck.stateCookies.map((c) => c.name),
          ignoredCookies,
          label: "access-denied",
        });
        problems.push(...check.problems);
        if (check.loc && !returnToPreserved(check.loc, probeReturnTo)) {
          problems.push(`access-denied did not preserve returnTo (${probeReturnTo})`);
        }
      }
      return { id: "access-denied", ok: problems.length === 0, problems };
    })(),
  ]);

  const ok = probes.every((probe) => probe.ok);
  return { ok, origin: expectedOrigin, locales: startTargets, probes };
}

if (process.argv[1] && realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1])) {
  try {
    const { values } = parseArgs({
      allowPositionals: false,
      options: {
        start: { type: "string" },
        callback: { type: "string" },
        origin: { type: "string" },
        locales: { type: "string", default: "" },
        "ignore-cookies": { type: "string", default: "" },
        json: { type: "boolean", default: false },
        help: { type: "boolean", short: "h", default: false },
      },
    });
    if (values.help) {
      console.log(
        "Usage: node scripts/check-oauth.mjs --start <url> --callback <url> [--origin <origin>] [--locales en,tr,ar] [--ignore-cookies c1,c2] [--json]"
      );
      process.exit(0);
    }
    if (!values.start || !values.callback) {
      throw new Error(
        "Usage: node scripts/check-oauth.mjs --start <url> --callback <url> [--origin <origin>] [--locales en,tr,ar] [--ignore-cookies c1,c2] [--json]"
      );
    }
    const locales = values.locales
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const ignoreCookies = values["ignore-cookies"]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const result = await checkOAuth({
      start: values.start,
      callback: values.callback,
      origin: values.origin,
      locales,
      ignoreCookies,
    });
    if (values.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      for (const probe of result.probes) {
        console.log(`${probe.ok ? "PASS" : "FAIL"} ${probe.id}`);
        for (const problem of probe.problems) console.log(`  - ${problem}`);
      }
    }
    process.exitCode = result.ok ? 0 : 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
