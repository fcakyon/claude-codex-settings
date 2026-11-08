# Self-hosted deployment

Inspect the existing fork, branch, Compose files, deployed commit and environment ownership first. Preserve persistent volumes and credentials across releases. Prefer the project's existing automatic deployment path after its required checks pass.

The current Akyon Labs installation uses `fcakyon/opendesk`, branch `fatih/openship`, with `openship.json`, `compose.openship.yml` and a Caddy HTTP proxy in `deploy/openship/`. The public host is `desk.akyonlabs.com` and OpenShip project is `proj_lhIHdT91C4ODHH60`. Read current configuration before reusing these values elsewhere.

## Service boundaries

OpenDesk has a Go application with embedded NATS, an Elixir/Phoenix realtime gateway, and PostgreSQL with pgvector. Its upstream `compose.external-proxy.yml` is an override, not a standalone deployment file. The OpenShip fork has a dedicated standalone Compose file to avoid importing optional upstream profiles unintentionally.

Route `/socket` and `/socket/*` to realtime port 4000 and other requests to the app port 8080. The small proxy exposes port 80 to OpenShip, which owns public TLS and Cloudflare DNS. Preserve the trusted proxy chain and verify visitor IP handling against the actual topology. Do not copy `TRUSTED_PROXY_HOPS` blindly to a different chain.

Keep database credentials, `AUTH_SECRET`, `CREDENTIALS_KEY`, NATS credentials, realtime secrets and provider keys in server secrets. Back up `CREDENTIALS_KEY` with PostgreSQL and retained uploads. Losing it can make stored credentials unreadable. Pass the AI key only to the backend service that calls the provider.

For OpenShip, follow the instance's existing deployment and DNS conventions. Verify the configured branch, automatic deploy setting, workflow gate, service health, deployed commit, certificate, domain target port, widget asset and realtime connection. Environment changes need the platform's service apply or a redeploy. A successful build alone does not verify the running service.

## Branding

As verified on the Akyon Labs fork on 2026-11-08, the embedded widget's "Powered by opendesk" footer was hardcoded, with no built-in white-label toggle. The fork removes its footer markup, styles and locale strings. Inspect the current SDK for a supported option before carrying that patch through an upgrade. Preserve license notices. Widget footer removal is distinct from dashboard branding.

## Release checks

Use the normal autodeploy branch and inspect CI and service logs without exposing environment values. Check health, login, the public widget script, a real chat, AI provider response, human handoff and workspace isolation. Confirm browser assets and responses contain no management or provider credentials. Remove test origins, synthetic test conversations and temporary browser sessions after verification.
