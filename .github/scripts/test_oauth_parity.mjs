import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import { test } from "node:test";
import {
  DEFAULT_IGNORED_OAUTH_COOKIES,
  MIN_STATE_MAX_AGE_SEC,
  UNSAFE_RETURN_TARGETS,
  checkOAuth,
} from "../../plugins/reusable-app-components/skills/app-auth/scripts/check-oauth.mjs";
import {
  DEFAULT_IGNORED_OAUTH_COOKIES as QA_IGNORED_OAUTH_COOKIES,
  MIN_STATE_MAX_AGE_SEC as QA_MIN_STATE_MAX_AGE_SEC,
  UNSAFE_RETURN_TARGETS as QA_UNSAFE_RETURN_TARGETS,
  checkOAuthRedirect,
} from "../../plugins/qa/scripts/auth.mjs";

function sanitizeReturnTo(raw) {
  if (!raw || typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\") || /%(?:2f|5c)/i.test(raw)) {
    return "/";
  }
  return raw;
}

async function serveParityOAuth(t, fault = null) {
  const transactions = new Map();
  let seq = 0;
  const server = createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const origin = url.origin;
    if (url.pathname === "/auth/start") {
      const rawReturnTo = url.searchParams.get("returnTo") ?? "/";
      if (fault === "same-origin-double-slash" && rawReturnTo.startsWith(origin)) {
        res.writeHead(302, {
          Location: rawReturnTo,
          "Cache-Control": "no-store",
          "Set-Cookie": "oauth_state=ignored; Path=/; HttpOnly; SameSite=Lax; Max-Age=900",
        }).end();
        return;
      }
      const safeReturnTo = fault === "open-redirect" ? rawReturnTo : sanitizeReturnTo(rawReturnTo);
      const state = `st-${++seq}`;
      const cookieVal = `tok-${seq}`;
      transactions.set(state, { cookieVal, returnTo: safeReturnTo });
      const provider = new URL("https://accounts.example/oauth/authorize");
      provider.searchParams.set("state", state);
      if (fault !== "missing-pkce") {
        provider.searchParams.set("code_challenge", "parity-challenge");
        provider.searchParams.set("code_challenge_method", "S256");
      }
      provider.searchParams.set("redirect_uri", `${origin}/auth/callback`);
      const hint = url.searchParams.get("login_hint");
      if (hint) provider.searchParams.set("login_hint", hint);
      res.writeHead(302, {
        Location: provider.href,
        "Cache-Control": "no-store",
        "Set-Cookie": [
          `oauth_state=${cookieVal}; Path=/; HttpOnly; SameSite=Lax; Max-Age=900`,
          "lang=en; Path=/; SameSite=Lax",
        ],
      }).end();
      return;
    }
    if (url.pathname === "/auth/callback") {
      const cookies = Object.fromEntries(
        (req.headers.cookie ?? "").split(";").map((c) => c.trim().split("=")).filter(([k]) => k)
      );
      const stateCookie = cookies.oauth_state;
      const state = url.searchParams.get("state") ?? "";
      const tx = transactions.get(state);
      const langCookie = "lang=en; Path=/; SameSite=Lax";
      if (!stateCookie) {
        if (fault === "raw-401") {
          res.writeHead(401, { "content-type": "application/json" }).end('{"error":"missing_state"}');
          return;
        }
        res.writeHead(302, { Location: `${origin}/en/login?error=state_expired`, "Set-Cookie": langCookie }).end();
        return;
      }
      if (!tx || tx.cookieVal !== stateCookie) {
        res.writeHead(302, {
          Location: `${origin}/en/login?error=state_mismatch`,
          "Set-Cookie": ["oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0", langCookie],
        }).end();
        return;
      }
      transactions.delete(state);
      const clear = "oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";
      if (url.searchParams.get("error") === "access_denied") {
        const dest = fault === "dropped-return-to"
          ? `${origin}/en/login?error=access_denied`
          : `${origin}/en/login?${new URLSearchParams({ error: "access_denied", returnTo: tx.returnTo })}`;
        const setCookie = fault === "session-on-cancel"
          ? [clear, "session_tok=forged; Path=/; HttpOnly"]
          : [clear, langCookie];
        res.writeHead(302, { Location: dest, "Set-Cookie": setCookie }).end();
        return;
      }
      res.writeHead(302, { Location: `${origin}${tx.returnTo}`, "Set-Cookie": clear }).end();
      return;
    }
    res.writeHead(404).end();
  }).listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => {
    server.closeAllConnections();
    server.close();
  });
  const origin = `http://127.0.0.1:${server.address().port}`;
  return { origin, start: `${origin}/auth/start`, callback: `${origin}/auth/callback` };
}

test("app-auth and qa OAuth checks share constants and agree on pass/fail outcomes", async (t) => {
  assert.equal(MIN_STATE_MAX_AGE_SEC, QA_MIN_STATE_MAX_AGE_SEC);
  assert.deepEqual(DEFAULT_IGNORED_OAUTH_COOKIES, QA_IGNORED_OAUTH_COOKIES);
  assert.deepEqual(UNSAFE_RETURN_TARGETS, QA_UNSAFE_RETURN_TARGETS);

  const okServer = await serveParityOAuth(t);
  const [appReport, qaReport] = await Promise.all([
    checkOAuth({ start: okServer.start, callback: okServer.callback, origin: okServer.origin, locales: ["en", "tr"] }),
    checkOAuthRedirect({ assert, config: { baseUrl: okServer.origin } }, { startUrl: "/auth/start", callbackUrl: "/auth/callback", locales: ["en", "tr"] }),
  ]);
  assert.equal(appReport.ok, true);
  assert.equal(appReport.probes.length, qaReport.probesPassed);

  for (const fault of ["missing-pkce", "open-redirect", "same-origin-double-slash", "raw-401", "dropped-return-to", "session-on-cancel"]) {
    const badServer = await serveParityOAuth(t, fault);
    const badApp = await checkOAuth({ start: badServer.start, callback: badServer.callback, origin: badServer.origin, locales: ["en"] });
    assert.equal(badApp.ok, false, `checkOAuth must fail on ${fault}`);
    await assert.rejects(
      checkOAuthRedirect({ assert, config: { baseUrl: badServer.origin } }, { startUrl: "/auth/start", callbackUrl: "/auth/callback", locales: ["en"] }),
    );
  }
});
