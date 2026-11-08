---
name: setup
description: This skill should be used when the user asks to "set up Google telemetry", "authenticate Google Analytics CLI", "connect Search Console CLI", "fix Google telemetry credentials", or a Google Analytics or Search Console reporting command fails because authentication or property access is missing.
---

# Set up Google telemetry

Make the requested Analytics or Search Console read command work. Inspect installed tools and existing access before involving the user. Setup for one service does not require access to the other.

## Check tools

These are third-party CLI wrappers around Google's official client libraries, not Google-supported products. Versions checked on 2026-11-08. Install only the CLI the requested service needs, and only when `--version` fails.

```bash
google-analytics-cli --version
google-search-console-cli --version
npm install --global google-analytics-cli@1.2.1
npm install --global google-search-console-cli@1.1.2
```

Sources: [Analytics CLI](https://github.com/Bin-Huang/google-analytics-cli), [Search Console CLI](https://github.com/Bin-Huang/google-search-console-cli). Recheck releases and help before upgrading.

## Existing access first

Run the requested service's discovery call before creating anything:

```bash
google-analytics-cli accounts
google-search-console-cli sites
```

`accounts` lists every GA account and property the identity can read. `sites` lists Search Console properties with the identity's permission level.

## Diagnose failures

Errors print as JSON on stderr with exit code 1. Report a redacted message.

- `Could not load the default credentials`: no credential source is set. Both CLIs read `--credentials <path>`, then GA's `--profile` or `GA_CLI_PROFILE`, then `GOOGLE_APPLICATION_CREDENTIALS`, then `~/.config/<cli-name>/credentials.json`, then Application Default Credentials (ADC). Look for an existing key or ADC login along that chain. Check file presence, permissions and the JSON `type` field (`service_account` or `authorized_user`) without displaying secret fields. A desktop OAuth client JSON (`installed`) is login configuration, not a credential. A stale higher-priority file can hide a working login.
- `invalid_grant`: the OAuth login expired or was revoked. Renew that identity after approval.
- Insufficient scopes: request only the missing read scope after consent.
- API disabled or quota project errors: enable the API named in the error in the Cloud project that owns the credential.
- GA `7 PERMISSION_DENIED` or Search Console `403 User does not have sufficient permission for site`: the identity works but the property is not shared with it, or the ID is wrong.
- An empty discovery list or report: authentication worked. Check sharing, dates, filters, property and processing delay instead of logging in again.

A `gcloud auth login` session, a browser session, an API key, a GTM container ID or a Measurement Protocol secret cannot read reports.

## Service account setup

Prefer a dedicated read-only service account. Its key does not expire and sees only what is shared with it. Creating the account, its key and each property grant requires the user's approval.

1. In the Google Cloud project that will own the identity, enable the APIs the request needs: Google Analytics Admin API and Google Analytics Data API for Analytics, Google Search Console API for Search Console.
2. Create a service account such as `google-telemetry-reader` with no project roles. Reporting access comes from GA and Search Console, not Cloud IAM.
3. Create a JSON key. If the organization policy `iam.disableServiceAccountKeyCreation` blocks it, use the user OAuth setup below instead of weakening the policy.
4. Move the key to a private path such as `~/.config/<org>/google-telemetry-sa.json` with mode 600, and point the CLIs at it with `GOOGLE_APPLICATION_CREDENTIALS`.
5. In GA Admin, open Account access management for each account, add the service account email as Viewer, tick No Cost Metrics and No Revenue Metrics, and untick Notify. An account-level grant covers its current and future properties. Granting requires the Administrator role. Google-managed accounts such as Chrome Web Store developer properties cannot be shared this way, so use user OAuth for them.
6. In Search Console, open Settings, then Users and permissions, for each property and add the service account email as Restricted. Restricted is enough for Search Analytics, sitemaps and URL inspection.

## User OAuth setup

Use this when a service account is not allowed or cannot be granted access. Reuse an approved desktop OAuth client. Request `analytics.readonly` for Analytics and `webmasters.readonly` for Search Console, both only when both services are needed. `gcloud` ADC login additionally requires `cloud-platform`, so explain that extra scope before consent. Do not overwrite an existing shared ADC login without checking its user and scopes.

```bash
gcloud auth application-default login \
  --client-id-file=/private/path/desktop-client.json \
  --scopes=https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/webmasters.readonly,https://www.googleapis.com/auth/cloud-platform
```

Without an approved desktop client, the user selects a Cloud project, enables the APIs, configures Google Auth Platform's audience and test users, and creates a Desktop app OAuth client. Ask for the local file path, never its contents. Sign-in and consent stay with the user. External OAuth apps in Testing can expire refresh tokens after seven days, so do not promise unattended long-term access.

## Verify the requested access

Rerun discovery without logging in again and confirm every intended property is listed. Then run one small report per service on a listed property using the [reporting recipes](../google-telemetry/references/commands.md), with the discovered numeric GA property ID or exact Search Console site URL. Test aggregate usage or search metrics only, never revenue or other personal financial data.

Report which service and property passed, or the exact remaining access gap. Do not call setup complete after only a login or an empty discovery result. Never print credential JSON, tokens or private keys, commit key files, or extract browser cookies as API credentials.

Google references: [ADC](https://cloud.google.com/docs/authentication/provide-credentials-adc), [service account keys](https://cloud.google.com/iam/docs/keys-create-delete), [Analytics access](https://support.google.com/analytics/answer/9305788), [Search Console permissions](https://support.google.com/webmasters/answer/2451999).
