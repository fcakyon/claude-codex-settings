import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { auditPrivacyDoc, auditRepo, auditUrl, runCasaAudit } from "../scripts/casa-audit.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_PATH = path.resolve(__dirname, "../scripts/casa-audit.mjs");

async function startFixtureServer(t, handler) {
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const addr = server.address();
  return `http://127.0.0.1:${addr.port}`;
}

test("auditUrl passes hardened HTTP headers, isolates sensitive paths, and rejects CORS origin reflection", async (t) => {
  const url = await startFixtureServer(t, (req, res) => {
    if (req.url === "/.env" || req.url === "/.git/config" || req.url === "/pb_data/data.db" || req.url === "/server-status") {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("not found");
      return;
    }
    res.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
      "content-security-policy": "default-src 'self'; frame-ancestors 'self'; object-src 'none'",
      "x-content-type-options": "nosniff",
      "x-frame-options": "SAMEORIGIN",
      "referrer-policy": "strict-origin-when-cross-origin",
      "permissions-policy": "camera=(), microphone=(self)",
      "set-cookie": "sid=opaque; Path=/; HttpOnly; SameSite=Lax",
    });
    res.end("<!doctype html><html><body>ok</body></html>");
  });

  const findings = await auditUrl(url);
  const byId = Object.fromEntries(findings.map((f) => [f.id, f]));
  assert.equal(byId.csp.status, "PASS");
  assert.equal(byId.clickjacking.status, "PASS");
  assert.equal(byId.nosniff.status, "PASS");
  assert.equal(byId["referrer-policy"].status, "PASS");
  assert.equal(byId["permissions-policy"].status, "PASS");
  assert.equal(byId.cookies.status, "PASS");
  assert.equal(byId["cors-policy"].status, "PASS");
  assert.equal(byId["sensitive-paths"].status, "PASS");
});

test("auditUrl flags CORS reflection, insecure cookies, missing CSP, and exposed /.env", async (t) => {
  const url = await startFixtureServer(t, (req, res) => {
    if (req.url === "/.env") {
      res.writeHead(200, { "content-type": "text/plain" });
      res.end("SECRET_KEY=do_not_leak\n");
      return;
    }
    if (req.headers.origin) {
      res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
    res.writeHead(200, {
      "content-type": "text/html",
      "set-cookie": "weak=1; Path=/",
      "x-powered-by": "Express 4.18.0",
    });
    res.end("<html><body>unhardened</body></html>");
  });

  const findings = await auditUrl(url);
  const byId = Object.fromEntries(findings.map((f) => [f.id, f]));
  assert.equal(byId["cors-policy"].status, "FAIL");
  assert.equal(byId["cors-policy"].severity, "high");
  assert.equal(byId.cookies.status, "FAIL");
  assert.equal(byId.csp.status, "FAIL");
  assert.equal(byId.clickjacking.status, "FAIL");
  assert.equal(byId["sensitive-paths"].status, "FAIL");
  assert.equal(byId["sensitive-paths"].severity, "high");
  assert.equal(byId["server-banner"].status, "WARN");
});

test("auditRepo checks .gitignore hygiene, Dockerfile non-root USER, encryption, and CLI exit gate", (t) => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "casa-audit-repo-"));
  t.after(() => fs.rmSync(tmpRoot, { recursive: true, force: true }));

  fs.writeFileSync(path.join(tmpRoot, ".gitignore"), ".env\n");
  fs.writeFileSync(path.join(tmpRoot, ".env"), "API_KEY=fixture-only\n");
  fs.mkdirSync(path.join(tmpRoot, "server"), { recursive: true });
  fs.writeFileSync(
    path.join(tmpRoot, "server/crypto.go"),
    "package main\n// uses cipher.NewGCM and /oauth/revoke + DELETE /api/account\n",
  );
  fs.writeFileSync(path.join(tmpRoot, "Dockerfile"), "FROM alpine:3.23\nUSER appuser\n");
  fs.mkdirSync(path.join(tmpRoot, "docs"), { recursive: true });
  fs.writeFileSync(
    path.join(tmpRoot, "docs/privacy.md"),
    "Adheres to the Google API Services User Data Policy including Limited Use. Does not use data to train generalized AI models. Human access requires consent. Users can revoke and delete data.\n",
  );

  const repoFindings = Object.fromEntries(auditRepo(tmpRoot, { skipVuln: true }).map((f) => [f.id, f]));
  assert.equal(repoFindings["env-hygiene"].status, "PASS");
  assert.equal(repoFindings["token-encryption"].status, "PASS");
  assert.equal(repoFindings["revocation-and-deletion"].status, "PASS");
  assert.equal(repoFindings["dockerfile-hardening"].status, "PASS");

  const privacyFindings = auditPrivacyDoc("", { repoDir: tmpRoot });
  assert.ok(privacyFindings.every((f) => f.status === "PASS"));

  const okCli = spawnSync(process.execPath, [CLI_PATH, "--repo", tmpRoot, "--skip-vuln", "--json", "--fail-on", "high"], {
    encoding: "utf8",
  });
  assert.equal(okCli.status, 0);
  const parsed = JSON.parse(okCli.stdout);
  assert.equal(parsed.passed, true);

  // Introducing a root-running Dockerfile and hardcoded private key fails the CLI gate cleanly.
  fs.writeFileSync(path.join(tmpRoot, "Dockerfile"), "FROM alpine:3.23\n");
  fs.writeFileSync(path.join(tmpRoot, "server/leak.go"), "package main\nvar k = \"-----BEGIN EC PRIVATE KEY-----\"\n");
  const badCli = spawnSync(process.execPath, [CLI_PATH, "--repo", tmpRoot, "--skip-vuln", "--fail-on", "high"], {
    encoding: "utf8",
  });
  assert.equal(badCli.status, 1);
  assert.ok(!badCli.stdout.includes("fixture-only"));
});

test("runCasaAudit honors fail-on severity thresholds without failing on lower severities", async (t) => {
  const url = await startFixtureServer(t, (_req, res) => {
    res.writeHead(200, { "content-type": "text/html" });
    res.end("<html><body>no csp</body></html>");
  });
  const reportHigh = await runCasaAudit({ urls: [url], failOn: "high", skipVuln: true });
  assert.equal(reportHigh.passed, true);
  const reportMedium = await runCasaAudit({ urls: [url], failOn: "medium", skipVuln: true });
  assert.equal(reportMedium.passed, false);
});
