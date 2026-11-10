---
name: app-auth
description: This skill should be used when the user asks to "standardize app authentication", "share login across web, mobile and TV", "reuse the Google login flow", "simplify signup", "fix password recovery", or "fix popup-blocked login". Use shared account/session contracts, email and Google web adapters, and an optional auth panel. Native and TV flows are integration contracts awaiting device validation.
---

# App authentication

Use full-page, same-tab social login by default and offer the last successfully used profile when the user chose to remember it. Google and the browser decide whether account selection or reauthentication is required. Do not promise silent login or call a flow fastest without measurements.

1. Inspect login, signup, email verification, recovery, session, logout, account linking and authorization. Identify the selected action, locales, design system and registered Google callback.
2. Read [integration](references/integration.md). For React 19.2+, adapt [GoogleSignIn.tsx](assets/GoogleSignIn.tsx) and its [styles](assets/google-sign-in.css). Use the optional [AuthPanel](assets/AuthPanel.tsx) with [panel styles](assets/auth-panel.css) for a minimal auth shell. Other frameworks should implement the same contract using their own lifecycle primitives.
3. Use [login.ts](assets/login.ts) for framework-independent navigation and opt-in profile storage. React hosts can wrap their existing forms in [RememberedLogin](assets/RememberedLogin.tsx). Run `npm run dev` in the plugin directory for the Vite demo. Its provider and email flows are simulations.
4. For email/password flows, adapt [EmailAuth.tsx](assets/EmailAuth.tsx) and [email styles](assets/email-auth.css). Read the email adapter section in the integration contract. Use [email-design](../email-design/SKILL.md) for messages sent by those flows.
5. Use GoogleSignIn with `label`, `redirectEndpoint` and `returnTo` for full-page login without GIS. The old credential adapter remains available for existing popup integrations. A saved email may be a provider hint only. The provider still verifies identity. “Sign in with another profile” opens all configured methods and uses `prompt=select_account` without a hint.
6. Resolve return navigation in the auth owner. Both paths must use the same account/session policy, then resume the action once. Only the backend verifies identity and authorizes access.
7. Run the applicable [journeys](references/journeys.md) through the project's existing QA harness. Keep fixture results, real Google evidence and deployed behavior distinct.
8. Record the app commit, runtime versions and actual evidence in its existing tracked guidance. Change the shared recipe only when new evidence changes a shared rule.

The app owns script loading, public client configuration, sessions, error reporting and navigation. The component owns rendering, pending/error UI and cancelling its credential operation when the auth surface closes.

For architecture standardization, read [backend standard](references/backend-standard.md). It is a proposed target, not an implemented Go dependency or completed migration.

For web/native/TV clients or another social provider, read [platforms and providers](references/platforms.md). Use one identity store and revocation model per product across its clients. Keep browser cookies and native secure-storage transport distinct.

## Curation

Read [provenance](references/provenance.md) before claiming production coverage. Distinguish a shipped reference, a tested extraction and a pending app integration. Add future components as focused skills with code, integration contracts and behavior tests when an actual app supplies the evidence. Do not add empty catalogs or treat a component PR as permission to deploy another app.
