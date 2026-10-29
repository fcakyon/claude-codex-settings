# One product, multiple clients

Status: shared contract for future backend/native implementations. The supplied runnable code is the React Google web adapter and optional panel. Android, iOS, TV pairing and additional social-provider integrations are not implemented or device-tested by this plugin.

One product can serve web, Android, iOS and Android TV from the same PocketBase + Go backend, users, linked identities, permissions and entitlements. Separate products share a versioned auth library and deployment conventions, with separate user data and secrets by default. Cross-product SSO is a separate product decision.

## Sessions

Use the same opaque session records and revocation checks for all clients. Generate high-entropy random tokens, store only their hashes with user, creation/expiry, platform label and throttled last-seen metadata. One indexed lookup resolves the session and current user access. Treat device labels as display metadata rather than proof of identity.

| Client | Sign-in entry | App session transport |
| --- | --- | --- |
| Browser | Provider button when supported, always-available same-tab server redirect | HttpOnly, Secure cookie with explicit SameSite and CSRF policy |
| Android/iOS | Current provider SDK or system browser using authorization code and PKCE | Opaque bearer session over HTTPS, stored in platform secure storage |
| Android TV | Short-lived code/QR pairing confirmed on a signed-in browser or phone | Its own revocable bearer session in platform secure storage |

Native storage means iOS Keychain and Android storage protected with Keystore-backed keys. Never put secrets in source, plain preferences, URLs or analytics. Native clients are public clients and cannot keep an OAuth client secret. Provider sessions/tokens are inputs to login, not substitutes for the app's own session.

Maintain a server-side registration for each allowed client: provider client IDs/audiences, relevant authorized-party checks and exact redirect URIs. Configure native Google SDKs to request an ID token for the intended server audience. Verify every token server-side. A supplied `platform` field or plain Google user ID is not proof of an allowed client or identity.

Cookie-mutating web requests require the app's CSRF contract. Native bearer requests use a separate issuance/transport contract, so absence of Origin must not become a bypass for cookie-authenticated writes. Reject an invalid supplied bearer token instead of silently falling back to an ambient cookie. Keep service/CLI API tokens distinct from user device sessions.

Let the authenticated account list its own sessions, revoke a selected device, revoke all other sessions and sign out. Never expose token hashes or session secrets in that list. Enforce ownership server-side. Account disablement and the chosen password-reset policy must invalidate access across clients. Existing expiration requirements remain explicit app configuration, with shared defaults in the runtime library.

## Native browser flow

Use the platform's system authentication browser, not an embedded WebView. Bind a single-use app authorization operation to its registered client, PKCE verifier/challenge, provider state/nonce and exact app return URI. Prefer verified HTTPS app/universal links where supported. After login, deliver only a short-lived one-time code through the app callback, then redeem it over HTTPS with the bound verifier for the app session. Never send a reusable session token in a deep link.

A native provider SDK may instead return a verifiable provider credential for backend exchange. Both paths use the same account-linking, allowlist and session-creation owner. Keep platform-specific SDK initialization in the native app, not in the React component.

## TV pairing

Implement a small app-owned pairing flow within the same backend, using the device-flow semantics in RFC 8628. This does not require an independent OAuth server or Google's TV device grant.

1. The TV requests a short-lived pending operation. The backend returns a high-entropy device secret, a separate short user code, verification URL, expiry and polling interval.
2. Display the code and a QR verification URL. Put only the user code in the QR, never the device secret or session token.
3. The phone/browser uses an existing app session or any supported social login. Show the code and device label and require an explicit confirmation to connect that TV. Opening a QR alone does not approve it.
4. The TV polls with the device secret at the supplied interval. Return pending, slow-down, denial or expiry states explicitly. Rate-limit code guesses and polling.
5. Atomically consume an approved operation and issue a separate TV session. Expired, denied and already-consumed operations cannot mint another session.

The short code is not an authentication token. Approval must be bound to the signed-in user and protected against CSRF. Use one small expiring record type and the existing database, without queues, Redis or realtime subscriptions unless measurements later justify them.

## Adding social providers

Normalize a verified provider response to its provider name, stable subject and verified profile claims. Store the unique link by `(provider, subject)`. Keep email policy and account linking explicit, especially for private relay or non-authoritative email addresses. Linking another provider to an existing account requires that account's authenticated authorization or a separately proven recovery process.

A provider adapter owns its authorization URL, code/credential verification, keys, scopes and callback checks. Common code owns users, access policy, session creation, logout, devices, email and return navigation. Add one adapter and provider button when needed, without cloning the session system. Use each provider's official SDK/branding rules. The current Google-specific component remains an adapter, not a generic implementation of Apple or other providers.

## Acceptance matrix

Web acceptance includes current Chrome, Edge, Firefox and Safari, mobile Safari/Chrome, popup denial, unavailable FedCM/script, multiple accounts, cancellation and session expiry. In-app browsers may require an explicit system-browser handoff. A normal redirect cannot overcome blocked provider access or broken DNS.

Native acceptance covers real package/bundle and signing registrations, cold/warm app callbacks, wrong audience/nonce/verifier, cancelled sign-in, secure-store persistence, device revocation and expiry. TV acceptance covers confirmation, wrong/expired/reused codes, polling backoff, rejection, two concurrent TVs and cross-user ownership. Verify common entitlements on two platforms without charging production accounts just to test auth.

Use [RFC 8252](https://www.rfc-editor.org/rfc/rfc8252) for native OAuth and [RFC 8628](https://www.rfc-editor.org/rfc/rfc8628) for device authorization. Provider references: [Google Android backend auth](https://developers.google.com/identity/sign-in/android/backend-auth), [Google iOS backend auth](https://developers.google.com/identity/sign-in/ios/backend-auth). Recheck current SDK guidance before implementation.
