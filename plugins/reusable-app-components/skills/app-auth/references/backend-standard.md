# Proposed PocketBase + Go app standard

Status: future architecture target. This plugin supplies no shared Go runtime, config generator or completed database migration yet.

Use Next.js/React plus one PocketBase-backed Go service per app when a single-node SQLite deployment fits. Keep users, databases, secrets, domains and authorization separate. Share behavior through a versioned runtime library, with recipes and evidence in this plugin. The plugin must not become a production runtime dependency.

PocketBase is pre-1.0 with no full backward-compatibility guarantee. Pin versions, review migration notes and rehearse restoration. It is a useful default for these apps, not a fit for every future workload or availability requirement.

| Shared behavior | App-owned policy/configuration |
| --- | --- |
| Google verification, state, PKCE and nonce handling | Client registration, callback, domain and linking policy |
| Sessions, cookies, CSRF, logout and rate limits | Names, lifetimes, origins, roles, invitations and allowlists |
| Verification/reset mail and safe localized templates | Sender, reply-to, branding and app links |
| Migrations, health checks and backup verification | Collections, domain tables, indexes, buckets and retention |
| Build/deployment conventions | Project IDs, domains, ports, volumes, workers and resource sizes |

Use PocketBase's mail client and SMTP configuration for auth email instead of duplicating transports in Next and Go. Confirm sender verification and SPF/DKIM/DMARC. Use [email-design](../../email-design/SKILL.md) for the shared HTML/text theme while preserving app-specific wording, links and sender settings. Keep marketing consent separate. Share implementation without silently sharing credentials or introducing one cross-app mail queue.

Use the [common opaque-session contract](platforms.md#sessions) across clients. Browsers carry the session in HttpOnly, Secure cookies. Logout deletes the server session before clearing its cookie. This needs no Redis or browser refresh-token store.

PocketBase native API tokens are stateless and have no traditional server-session logout endpoint. They remain an internal or explicitly separate client contract, not the shared browser login mechanism. Do not expose a native-token route that bypasses app access rules. Migrate existing API tokens without silently invalidating or exposing them.

Move Orchestrator's Nodemailer transport into the shared Go mail path while preserving its per-user preferences, alert deduplication and record-after-success behavior. Test deliveries through a local mail sink before an authorized production mail check.

## OpenShip convention

Use a small common deployment profile plus app values. Keep a concrete, reviewable `openship.json` in each app. If a generator is introduced later, version it, make output deterministic and run `openship config validate` in CI. Avoid runtime dependence on a mutable remote template.

Standardize web/API/optional-worker service roles, app-specific persistent `pb_data`, explicit public ports, pinned runtimes, health checks and path-based auto-deploy. Keep secrets in the secret store. Preserve live project IDs, domains, volumes, bindings and GitHub App deployment paths during migration.

Fast Rational currently embeds its PocketBase Dockerfile, entrypoint and Google hook in an OpenShip app JSON. Move executable logic into tracked Go/source files and let deployment config describe how to build and run them. MyAIPatient already separates its web and PocketBase projects, while Orchestrator has a Tailscale sidecar and SSH-mounted collector access. Preserve those working bindings during adoption.

Choose one stack versus separate web/API projects explicitly. Do not move a live hostname or volume merely to make JSON identical. Collectors and GPU jobs remain app workloads rather than auth infrastructure.

## Adoption order

1. Inventory source, deployed configuration, auth policy, mail, data and clients.
2. Extract the smallest confirmed Go auth/session/mail behavior into a versioned library. Keep mature provider-library checks and test each dependency upgrade.
3. Adopt the login contract through current adapters. This can precede database migration.
4. Move backend ownership on disposable data, compare API/data results, test permissions and restore a backup.
5. Prepare isolated staging, a bounded ingestion pause, final copy, one-writer cutover and rollback. Obtain applicable production-cutover authorization.
6. Verify deployed revisions, session/denial/token/email flows and domain behavior, then delete replaced implementations.

For Orchestrator, preserve run IDs, lineage, compound metric keys, aggregates, alert deduplication and collector ownership. PocketBase auth collections plus Go-owned domain tables can retain indexed SQL without forcing every metric into a generic collection model. Remove frontend database writes when Go takes ownership. Do not interrupt training jobs for this migration.

Sources: [PocketBase stability](https://pocketbase.io/docs/), [authentication](https://pocketbase.io/docs/authentication/), [Go migrations](https://pocketbase.io/docs/go-migrations/), [production and backups](https://pocketbase.io/docs/going-to-production/).
