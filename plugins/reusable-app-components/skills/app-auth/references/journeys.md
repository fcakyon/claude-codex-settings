# Journey coverage

Use the project's tracked QA harness and saved test sessions. Capture analytics locally. Use disposable data for new-account and denied-account cases. Keep browsers headless unless the user requests their interactive browser.

| Starting state | Action | Observable outcome |
| --- | --- | --- |
| New email account | Email, password, verify | Account session, original action and automatic free access without a purchase confirmation |
| Existing email | Try signup, select login | Same email retained without duplicate account |
| Unverified email | Login, send code | Correct recipient, resend and retry, persisted verified session |
| Forgotten password | Email, code, new password | In-place reset, old password rejected and new password accepted |
| Invalid, expired or reused code | Verify | Visible retry path, no unauthorized session or reset |
| Valid app session | Protected deep link | Original action without login |
| Remembered Google account | Official button | Existing account session, intended action, no duplicate user |
| Multiple Google accounts | Use another account | Old hint cleared, chooser available |
| Popup blocked or GIS unavailable | Same-tab link | No new tab, real Google flow and app session on return |
| Pending exchange | Close auth surface | Request cancelled, no stale navigation or orphaned rejection |
| Rejected credential or rate limit | Retry | Safe visible error, working controls, no rejected session |
| Google cancellation | Return and retry | Localized login and original context |
| Root, locale root, query, fragment | Redirect completion | Exact allowed destination or documented landing redirect |
| Unsafe target, altered/expired state | Callback | No external redirect, session or action |
| Uninvited/disabled account | Either login path | Existing policy rejects access |
| Signed in | Logout, protected route | Session invalidation matches the app's model |
| Every locale, desktop/mobile | Login/signup switch and keyboard | Correct copy, focus, 44px controls, equal-width fields, no overflow |

Pair representative states and destinations. Put the full transport/security matrix at the owning backend boundary rather than duplicating it in every browser test. Treat API tokens and web sessions as separate contracts.

## Extraction checks

From the plugin directory:

```sh
npm ci
npm run check
npx playwright install chromium
npm test
```

`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` selects an installed Chrome executable. Tests use isolated headless browsers and local HTTP fixtures. The SDK substitute is only an event source. The email fixture exercises registration, code resend/rejection, email preservation, recovery and cancellation through local HTTP adapters. Backend code security and actual mail delivery require the adopting app’s tests. Tests prove component rendering, navigation, transport, failure and cancellation, not Google's account selection, token verification or a target app's access policy.

## App acceptance

Run the app's build, changed-file checks and affected tracked journeys. With the QA plugin, use `.agents/qa/suite.mjs` and `project-qa run --root . --filter <case>`.

Verify real Google session creation, returning-account behavior, switching accounts, redirect return and logout separately. Match the deployed origin/cookie topology. Localhost-to-production CORS failure is not proof of an auth defect. A candidate preview under its normal origin must forward cookies into server rendering and keep Google/API traffic real. Label it candidate-source evidence.

Strip query strings and omit raw browser titles from callback reports because both can contain OAuth codes. Never print credentials, cookies or provider payloads. Keep screenshots private unless publishing sanitized evidence is authorized.

Check DNS, TLS and HTTP before attributing failure to bot detection or OAuth. A failing Chrome Secure DNS path can break a profile while system HTTP and a clean profile work. Diagnose the actual resolver before proposing settings changes.

Deployment acceptance needs deployed revision, ready status, affected routes and actual session flow. Close task-owned tabs/sessions, stop previews, restore viewport/routing changes and preserve user tabs.
