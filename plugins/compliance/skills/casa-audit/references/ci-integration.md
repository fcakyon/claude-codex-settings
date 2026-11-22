# Weekly Security & CASA CI Integration

Run automated dependency scanning, CASA policy checks, and passive DAST weekly so security regressions surface continuously rather than right before annual CASA Tier 2 re-certification.

## OpenShip Actions Example (`.openship/workflows/security.yml`)

```yaml
name: Security
on:
  schedule:
    - cron: "0 4 * * 1"
  workflow_dispatch:
permissions:
  contents: read
jobs:
  go-vuln:
    runs-on: [self-hosted, openship, linux]
    container: golang:1.27.4-alpine3.23
    defaults:
      run:
        working-directory: server
    steps:
      - run: apk add --no-cache git nodejs
        working-directory: /
      - uses: actions/checkout@v7
      - name: Run govulncheck
        run: go run golang.org/x/vuln/cmd/govulncheck@latest ./...
  npm-audit:
    runs-on: [self-hosted, openship, linux]
    container: node:24-bookworm
    steps:
      - uses: actions/checkout@v7
      - name: Audit production npm dependencies
        working-directory: apps/web
        run: npm audit --omit=dev --audit-level=moderate
  dast-zap:
    runs-on: [self-hosted, openship, linux]
    container: ghcr.io/zaproxy/zaproxy:stable
    timeout-minutes: 15
    steps:
      - name: Run passive OWASP ZAP baseline scan
        run: |
          mkdir -p /tmp/zap-wrk
          cd /tmp/zap-wrk
          zap-baseline.py -t https://app.example.com -m 2 -T 10 -I
```

> [!NOTE]
> The official `ghcr.io/zaproxy/zaproxy:stable` container does not include Node.js for JavaScript checkout actions (`actions/checkout`). Keep `dast-zap` self-contained without `actions/checkout`, or mount a ZAP rules file inside a Node-enabled runner image.

## GitHub Actions Usage with `casa-audit.mjs`

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 22
- name: Run CASA audit
  run: |
    node path/to/plugins/compliance/scripts/casa-audit.mjs \
      --url https://app.example.com \
      --repo . \
      --fail-on high \
      --markdown
```
