# Evidence and adoption

Recorded on 2026-10-28. A reference deployment does not certify every extraction or browser configuration.

| Layer | Evidence | Scope |
| --- | --- | --- |
| Muvisafe frontend | [Fallback](https://github.com/fcakyon/muvisafe/commit/c0da047), [homepage retry](https://github.com/fcakyon/muvisafe/commit/915b37c) | Next 16.4.3, React 19.2.8, HeroUI 2.8.10 |
| Server reference | [Redirect](https://github.com/viddexa/safevideo-backend/commit/7b5a9d6), [homepage regression](https://github.com/viddexa/safevideo-backend/commit/37d805d) | PocketBase/Go account and session owners |
| Reference source checks | Build, changed-file lint with existing warnings, Go vet/tests | Source and backend contracts |
| Reference browser QA | 18 candidate fallback assertions, 27 production login/logout assertions | English/Turkish, desktop/mobile, hints, retry context and same-tab navigation |
| Interactive Chrome | Remembered-account login and Google redirect returned to signed-in home | Existing account, not every browser/account |
| Extraction | TypeScript and local browser tests | Portable component with SDK substitute and HTTP fixtures |

Cancellation, invalid state and unsafe destinations were backend contract tests, not all real Google consent-screen journeys. No conversion or latency benchmark was performed. The extraction removes router, modal, API-client and HeroUI dependencies and adds operation cancellation. Validate each app integration before marking it deployed.

The server reference uses `tokeninfo`. That is provenance, not a recommendation for new production verifiers. Follow the production-library guidance in the integration contract.

| App | Inspected starting point | Pending work |
| --- | --- | --- |
| MyAIPatient | Next/React, GIS, PocketBase Google route, HttpOnly cookie | Redirect transport and shared completion policy |
| Fast Rational | Next/React, GIS and PocketBase SDK | Session ownership, redirect recovery and return intent |
| Orchestrator | Next/React, libSQL file DB, code flow, custom sessions and allowlist | Optional fast path, preserved access rules, separate PocketBase migration |

These are source observations, not completed migrations. Read the [proposed backend standard](backend-standard.md) for auth, email and deployment reuse. Inventory additional apps before expanding rollout scope.
