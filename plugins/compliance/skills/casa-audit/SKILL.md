---
name: casa-audit
description: This skill should be used when user asks to "run CASA audit", "audit security for Google OAuth", "prepare for CASA Tier 2", "check Limited Use privacy policy", "audit web app security headers", or "set up weekly vulnerability and ZAP CI".
---

# CASA Tier 2 Audit

Run deterministic HTTP, repository, dependency, secret-hygiene, and Google Limited Use privacy checks against any OAuth web application before submitting for Google Trust & Safety restricted-scope verification or annual CASA Tier 2 (ADA Assurance Level 1 / OWASP ASVS v4.0.3 L2) assessment.

## Workflow

1. **Run the reusable CLI audit** from any repo or against any live HTTPS endpoint:
   ```bash
   node <plugin-root>/scripts/casa-audit.mjs \
     --url https://app.example.com \
     --repo /path/to/repo \
     --privacy-doc docs/privacy.md \
     --markdown
   ```
   - Use `--format json` (`--json`) for CI artifacts or `--fail-on high|medium|low|none` (default `high`).
   - Use `--skip-vuln` only during offline unit runs. Keep dependency scanning enabled in real audits so `govulncheck` and `npm audit --omit=dev` run automatically.
   - Never print secret values, API keys, cookies, or `.env` contents when reporting findings.
2. **Triage automated findings by severity**:
   - **High**: plaintext HTTP served without TLS redirect, missing `Strict-Transport-Security`, insecure `Set-Cookie` flags, arbitrary `Origin` reflection or credentialed wildcard CORS, exposed `/.env` or `/.git/config` or database files, tracked secrets, or confirmed vulnerable Go/npm packages.
   - **Medium**: missing `Content-Security-Policy`, clickjacking protection (`X-Frame-Options` / `frame-ancestors`), `X-Content-Type-Options: nosniff`, `Referrer-Policy`, missing token encryption at rest or revocation/deletion routes, root container `USER` in `Dockerfile`, or missing Google Limited Use privacy disclosures.
   - **Low / Info**: missing `Permissions-Policy` or versioned edge `Server` banners.
3. **Remediate before submitting to Google Cloud Console**:
   - Fix all **High** and **Medium** controls cleanly, re-run `casa-audit.mjs`, and verify zero High/Medium failures.
   - Do not enable unapproved restricted scopes on a verified OAuth client until hardening, demo video, and CASA readiness are complete.
4. **Add recurring weekly security CI** (OWASP ZAP baseline DAST + `govulncheck` + `npm audit`) using the templates in [CI integration](references/ci-integration.md).

## References

- [CASA Tier 2 checklist](references/casa-tier2-checklist.md): OWASP ASVS L2 / ADA AL1 control mapping across transport, sessions, cryptography, and containers.
- [Google OAuth & Limited Use](references/google-oauth-limited-use.md): restricted-scope review checklist, Limited Use policy clauses, demo video rules, and CASA Tier 2 sequencing.
- [CI integration](references/ci-integration.md): weekly scheduled workflows for OpenShip Actions and GitHub Actions (`govulncheck`, `npm audit`, `casa-audit.mjs`, and OWASP ZAP baseline).
