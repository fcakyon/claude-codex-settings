# CASA Tier 2 (ADA Assurance Level 1 / OWASP ASVS L2) Checklist

Google Cloud App Defense Alliance (ADA) CASA Tier 2 evaluates web applications requesting restricted Google OAuth scopes against OWASP ASVS Level 2 controls.

## 1. Transport & Edge Headers (Automated via `--url`)

| Control                  | Expected Behavior                                                                                                              | Severity on Failure |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | ------------------- |
| HTTPS enforcement        | Endpoint uses HTTPS, and plain `http://` redirects (`301`/`302`/`307`/`308`) to `https://` without serving app content         | High                |
| HSTS                     | `Strict-Transport-Security` header with `max-age >= 15552000` (`31536000; includeSubDomains` recommended)                      | High                |
| Content Security Policy  | `Content-Security-Policy` present on HTML responses, restricting `object-src 'none'` and `base-uri 'self'`                     | Medium              |
| Clickjacking protection  | `X-Frame-Options: DENY`/`SAMEORIGIN` or CSP `frame-ancestors` present (strict `frame-ancestors 'none'` on OAuth consent pages) | Medium              |
| MIME sniffing            | `X-Content-Type-Options: nosniff`                                                                                              | Medium              |
| Referrer leakage         | `Referrer-Policy` (such as `strict-origin-when-cross-origin` or `no-referrer`)                                                 | Medium              |
| Feature restriction      | `Permissions-Policy` restricts unused powerful APIs (`camera=()`, `geolocation=()`, `payment=()`)                              | Low                 |
| Cookie attributes        | Auth/state cookies carry `Secure`, `HttpOnly`, and `SameSite=Lax` or `Strict`                                                  | High                |
| CORS policy              | Never reflect arbitrary `Origin` or combine `Access-Control-Allow-Origin: *` with `Access-Control-Allow-Credentials: true`     | High                |
| Sensitive path isolation | `/.env`, `/.git/config`, backups, and DB paths (`*.db`, `/pb_data/`) are unreachable (`404`/`403`)                             | High                |

## 2. Secrets, Dependencies & Storage (Automated via `--repo`)

- **No tracked secrets**: `.env` is gitignored and untracked, with zero private keys or API key prefixes in tracked source.
- **Vulnerability hygiene**: `govulncheck ./...` (including stdlib patch versions such as Go `net/http` fixes) and `npm audit --omit=dev` report zero unpatched high/medium advisories.
- **Token encryption at rest**: Google OAuth `access_token` and `refresh_token` records are encrypted at rest with an authenticated cipher (such as AES-256-GCM) keyed from a dedicated server environment secret, never returned to clients or logged.
- **Least-privilege runtime**: Container builds switch to a non-root `USER` and never bake runtime secrets into `ENV`/`ARG`.
- **Revocation & deletion**: Users can disconnect external accounts, revoke OAuth/MCP grants immediately, and trigger deletion of synced data.

## 3. Manual Lab Verification Items (`MANUAL`)

- Authenticated business-logic review (IDOR / tenant isolation across user IDs, OAuth state/PKCE binding).
- Annual authorized CASA Tier 2 lab scan & Remediation Review leading to the ADA Letter of Validation (LOV).
- Database backup encryption & access control outside the application process.
