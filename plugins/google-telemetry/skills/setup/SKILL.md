---
name: setup
description: This skill should be used when the user asks to "set up Google telemetry", "authenticate Google Analytics CLI", "connect Search Console CLI", "fix Google telemetry credentials", or a Google Analytics or Search Console reporting command fails because authentication or property access is missing.
---

# Set up Google telemetry

Make the requested Analytics or Search Console read command work. Inspect installed tools and existing access before involving the user. Setup for one service does not require access to the other.

## Check tools

CLI versions and help checked on 2026-10-26 with Node.js 22. These are third-party CLI wrappers using Google's official client libraries, not Google-supported products.

```bash
npm install --global google-analytics-cli@1.2.1
npm install --global google-search-console-cli@1.1.2
google-analytics-cli --version
google-search-console-cli --version
```

Sources: [Analytics CLI](https://github.com/Bin-Huang/google-analytics-cli), [Search Console CLI](https://github.com/Bin-Huang/google-search-console-cli). Recheck releases and help before upgrading.

## Existing access first

Check each installed CLI with `--help` before running commands. Install a missing CLI only when needed for the requested service.

Both CLIs accept `--credentials /private/path/key.json`, `GOOGLE_APPLICATION_CREDENTIALS`, or Application Default Credentials (ADC). GA also accepts named profiles. A desktop OAuth client JSON is configuration for login, not an authenticated credential and not a service-account key. Do not pass it to `--credentials`.

Inspect credential precedence from the installed CLI when diagnosing access. An explicit `--credentials` path wins. GA's selected `--profile` or `GA_CLI_PROFILE` wins over environment or default credentials. Otherwise `GOOGLE_APPLICATION_CREDENTIALS` wins over each CLI's `~/.config/<cli-name>/credentials.json`, followed by ADC. A stale higher-priority file can hide a working ADC login.

Check file presence, permissions and credential type without displaying secret fields. Never print credential JSON, tokens or private keys. Run `google-analytics-cli profiles` to discover profile names when relevant. A `gcloud auth login` session alone is not ADC.

Verify access with the requested service's aggregate discovery call:

```bash
google-analytics-cli accounts
google-search-console-cli sites
```

For Analytics, the Cloud project needs the Analytics Admin and Analytics Data APIs enabled. For Search Console, it needs the Search Console API enabled. An API key, GTM container ID or Measurement Protocol secret cannot read reports. A signed-in browser session also does not authenticate these CLIs.

For an auth error, keep the exit code and a redacted error message. Distinguish:

- Missing default credentials or a nonexistent file: identify the active credential source before choosing a login flow.
- Expired or revoked OAuth credentials (`invalid_grant`): renew the selected identity after approval.
- Insufficient authentication scopes: request only the missing read scope after consent.
- API disabled or quota-project errors: identify the Cloud project and API named in the error. Cloud IAM access and GA/Search Console property access are separate.
- Permission denied or an absent property: confirm the identity and exact property ID. A successful empty site/account list does not prove access to the requested app. Ask its administrator for the smallest missing read permission.
- A successful report with no rows: authentication worked. Check the dates, filters, property and processing delay instead of logging in again.

## If access must be configured

Explain the exact missing access after checking the available state. Prefer an existing authorized ADC setup or managed service identity. For a service account, request Viewer on the intended GA properties and the smallest Search Console role that supports the required read calls. Confirm the actual API calls work. Do not grant Owner or Editor for reporting or weaken a key-creation policy.

For user OAuth, reuse an approved desktop OAuth client. Request `analytics.readonly` for Analytics and `webmasters.readonly` for Search Console, including both only when both services are requested. If using `gcloud`, its ADC login additionally requires `cloud-platform`. Explain that extra scope before consent. Do not overwrite an existing shared ADC login without checking its users and scope. Creating credentials or granting a new tool persistent access requires the user's approval at that step.

For an approved gcloud setup covering both services, use the following login. Omit the unneeded service scope for a single-service setup:

```bash
gcloud auth application-default login \
  --client-id-file=/private/path/desktop-client.json \
  --scopes=https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/webmasters.readonly,https://www.googleapis.com/auth/cloud-platform
```

If no approved desktop client exists, guide the user to select a Cloud project, enable the requested APIs, configure Google Auth Platform's audience and test users where required, and create a Desktop app OAuth client. Ask for the local file path, never its secret contents. User sign-in and the Google consent screen remain with the user. Do not create credentials or weaken organization policy to bypass a block.

## Verify the requested access

After login, run discovery and one small report for each intended property using the [reporting recipes](../google-telemetry/references/commands.md). Use the discovered numeric GA property ID or exact Search Console site URL. Test only aggregate usage or search metrics. Do not query revenue or other personal financial data.

Report which service and property passed, or the exact remaining access gap. Do not describe setup as complete based only on login or an empty discovery result. Store credentials outside repositories with owner-only permissions. External OAuth apps in Testing can expire refresh tokens after seven days. Report this limitation rather than promising unattended long-term access. Never echo tokens, export unmasked credentials into reports or extract browser cookies as API credentials.

Google references: [ADC](https://cloud.google.com/docs/authentication/provide-credentials-adc), [Analytics authorization](https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart-client-libraries), [Search Console authorization](https://developers.google.com/webmaster-tools/v1/how-tos/authorizing).
