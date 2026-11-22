#!/usr/bin/env node
/**
 * Reusable CASA Tier 2 (ADA AL1 / OWASP ASVS L2) pre-submission audit CLI.
 * Designed to run against any web/OAuth repository and/or public HTTPS URL with zero external dependencies.
 */

import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { SEVERITY_RANK, makeFinding } from "./checks/common.mjs";
import { auditUrl } from "./checks/http.mjs";
import { auditRepo } from "./checks/repo.mjs";
import { auditPrivacyDoc } from "./checks/privacy.mjs";

export { auditUrl, auditRepo, auditPrivacyDoc };

function parseArgs(argv) {
  const opts = {
    urls: [],
    repo: "",
    privacyDoc: "",
    format: "text",
    failOn: "high",
    skipVuln: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--url" && argv[i + 1]) opts.urls.push(argv[++i]);
    else if (arg === "--repo" && argv[i + 1]) opts.repo = argv[++i];
    else if (arg === "--privacy-doc" && argv[i + 1]) opts.privacyDoc = argv[++i];
    else if (arg === "--format" && argv[i + 1]) opts.format = argv[++i];
    else if (arg === "--json") opts.format = "json";
    else if (arg === "--markdown") opts.format = "markdown";
    else if (arg === "--fail-on" && argv[i + 1]) opts.failOn = argv[++i];
    else if (arg === "--skip-vuln") opts.skipVuln = true;
    else if (arg === "-h" || arg === "--help") opts.help = true;
    else throw new Error(`Unknown or incomplete argument: ${arg}`);
  }
  if (!Object.hasOwn(SEVERITY_RANK, opts.failOn)) {
    throw new Error(`Invalid --fail-on value "${opts.failOn}". Expected high|medium|low|none.`);
  }
  if (!opts.urls.length && !opts.repo && !opts.privacyDoc) {
    opts.repo = process.cwd();
  }
  return opts;
}

function manualChecks() {
  return [
    makeFinding(
      "manual-casa-lab",
      "manual",
      "MANUAL",
      "none",
      "Authorized CASA Tier 2 lab assessment",
      "Run annual authorized CASA Tier 2 lab scan and obtain Letter of Validation (LOV) after Trust & Safety triggers CASA.",
    ),
    makeFinding(
      "manual-demo-video",
      "manual",
      "MANUAL",
      "none",
      "OAuth consent and feature demo video",
      "Record unlisted demo showing client_id on consent screen, requested scopes, end-user flow, and disconnect/revocation.",
    ),
    makeFinding(
      "manual-reviewer-account",
      "manual",
      "MANUAL",
      "none",
      "Google Trust & Safety test account instructions",
      "Verify reviewer login path uses an isolated test allowlist/demo account before submitting Cloud Console review.",
    ),
  ];
}

/** Run the selected HTTP, repository, and privacy checks and summarize pass/fail counts. */
export async function runCasaAudit(opts) {
  const findings = [];
  for (const url of opts.urls || []) {
    findings.push(...(await auditUrl(url)));
  }
  if (opts.repo) {
    findings.push(...auditRepo(opts.repo, { skipVuln: Boolean(opts.skipVuln) }));
  }
  if (opts.privacyDoc || opts.repo) {
    findings.push(...auditPrivacyDoc(opts.privacyDoc, { repoDir: opts.repo }));
  }
  findings.push(...manualChecks());

  const counts = { pass: 0, warn: 0, fail: 0, skip: 0, manual: 0 };
  const threshold = SEVERITY_RANK[opts.failOn || "high"];
  let exceedsThreshold = false;
  for (const f of findings) {
    counts[f.status.toLowerCase()] = (counts[f.status.toLowerCase()] || 0) + 1;
    if (f.status === "FAIL" && threshold > 0 && (SEVERITY_RANK[f.severity] || 0) >= threshold) {
      exceedsThreshold = true;
    }
  }
  return {
    tool: "casa-audit",
    failOn: opts.failOn || "high",
    passed: !exceedsThreshold,
    counts,
    findings,
  };
}

function formatMarkdown(report) {
  const lines = [
    "# CASA Tier 2 Audit Report",
    "",
    `- **Result**: ${report.passed ? "PASS" : "FAIL"} (\`--fail-on ${report.failOn}\`)`,
    `- **Counts**: PASS=${report.counts.pass}, WARN=${report.counts.warn}, FAIL=${report.counts.fail}, SKIP=${report.counts.skip}, MANUAL=${report.counts.manual}`,
    "",
    "| Status | Severity | Check | Detail |",
    "| --- | --- | --- | --- |",
  ];
  for (const f of report.findings) {
    const cleanDetail = String(f.detail || "").replaceAll("|", "\\|").replaceAll("\n", " ");
    lines.push(`| ${f.status} | ${f.severity} | ${f.title} (\`${f.id}\`) | ${cleanDetail} |`);
  }
  return lines.join("\n") + "\n";
}

function formatText(report) {
  const lines = report.findings.map((f) => `[${f.status}${f.severity !== "none" ? `/${f.severity}` : ""}] ${f.id}: ${f.title} — ${f.detail}`);
  lines.push(`Summary: pass=${report.counts.pass} warn=${report.counts.warn} fail=${report.counts.fail} skip=${report.counts.skip} manual=${report.counts.manual} result=${report.passed ? "PASS" : "FAIL"}`);
  return lines.join("\n") + "\n";
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    process.stdout.write(
      "Usage: casa-audit.mjs [--url <https://...>] [--repo <dir>] [--privacy-doc <file>] [--format json|markdown|text] [--fail-on high|medium|low|none] [--skip-vuln]\n",
    );
    return;
  }
  const report = await runCasaAudit(opts);
  if (opts.format === "json") process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  else if (opts.format === "markdown") process.stdout.write(formatMarkdown(report));
  else process.stdout.write(formatText(report));
  process.exitCode = report.passed ? 0 : 1;
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    process.stderr.write(`casa-audit error: ${err.message}\n`);
    process.exitCode = 2;
  });
}
