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

The email/password component is an extraction with local HTTP fixture evidence. Its MuviSafe integration is a separate local candidate until that app is released. The email-design skill supplies a shared layout and review workflow, not a new delivery provider.

The server reference uses `tokeninfo`. That is provenance, not a recommendation for new production verifiers. Follow the production-library guidance in the integration contract.

| App | Inspected starting point | Pending work |
| --- | --- | --- |
| MyAIPatient | Next/React, GIS, PocketBase Google route, HttpOnly cookie | Redirect transport and shared completion policy |
| Fast Rational | Next/React, GIS and PocketBase SDK | Session ownership, redirect recovery and return intent |
| Orchestrator | Next/React, libSQL file DB, code flow, custom sessions and allowlist | Optional fast path, preserved access rules, separate PocketBase migration |

These are source observations, not completed migrations. Read the [proposed backend standard](backend-standard.md) for auth, email and deployment reuse. Inventory additional apps before expanding rollout scope.

On 2026-11-10, the TypeScript/Vite candidate passed 22 local Chromium tests, TypeScript checking and a production demo build. New checks cover remembered-profile opt-in, reload, forgetting, same-tab navigation, account switching and one/four provider layouts at 390px and 1280px. Google, GitHub, Apple and Hugging Face routes in this demo are simulations. No adopting app or real provider callback was deployed or verified by this change.

Bundled logo sources: [Google](https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg), [Hugging Face](https://huggingface.co/front/assets/huggingface_logo-noborder.svg), [GitHub](https://github.com/simple-icons/simple-icons/blob/develop/icons/github.svg) and [Apple](https://github.com/simple-icons/simple-icons/blob/develop/icons/apple.svg). GitHub and Apple paths come from Simple Icons. Brand marks remain subject to their owners’ usage rules. SVGs are served locally with the component.

Typography uses the locally bundled [Inter variable font](https://github.com/rsms/inter/blob/master/docs/font-files/InterVariable.woff2) with its [SIL Open Font License](https://github.com/rsms/inter/blob/master/LICENSE.txt), retained in assets/fonts/OFL.txt.

The optional PocketBase discovery mapper follows the official js-sdk AuthMethodsList fields. A local contract test covers enabled methods, custom provider names, email identity support and exclusion of transient OAuth fields. This is SDK-shape and UI-contract evidence, not a live PocketBase authentication or session test.
