# Integration contract

## Dependencies and adapters

The component needs React and React DOM 19.2+ for `useEffectEvent`. It has no Next.js, HeroUI, PocketBase or routing dependency. Copy the TSX and CSS together. The optional AuthPanel and its CSS provide a Muvisafe-inspired dark panel without coupling auth to a design system. The plugin package.json is for validating the extraction, not for installation in every deployed app.

Load `https://accounts.google.com/gsi/client` once in the auth shell. Pass `google.accounts.id` as `identity` when ready, or null while unavailable. Supply the public client ID from existing public configuration or server rendering, outside credential-attempt rate limits. Mount only the active login/signup surface because GIS initialization is global to the page.

| Input | App responsibility |
| --- | --- |
| `clientId`, `nonce`, `locale`, `theme` | Public client, optional server-issued challenge, language and official Google button theme |
| `accountHint`, `onUseAnotherAccount` | Remember the successful Google account and clear it on an explicit switch |
| `redirectEndpoint`, `returnTo` | Existing start endpoint without a query string and an app-relative destination |
| `onCredential(credential, signal)` | Submit to the backend with the supplied cancellation signal, return its authenticated user |
| `onAuthenticated(user)` | Remember the verified Google account, update/reload the session and resume the action |
| `onFailure(error)` | Report redacted diagnostics and return a localized safe message, including rate-limit guidance |
| `initialError`, `copy` | Retry feedback and localized control labels |

Never display arbitrary provider payloads or `error.message`. Bound credential requests at the transport owner. Closing the surface aborts its operation and ignores that cancelled callback. It cannot undo a session already created by the server, so the next visit must resolve the actual session.

The hint is not authentication proof. Store no credential, session token or code in localStorage. Remember the successful Google identity on redirect completion too, including when Google authenticated an existing local account. The user's registration method does not necessarily identify their last sign-in method.

```tsx
<GoogleSignIn
  identity={googleIdentity}
  clientId={publicGoogleClientId}
  locale={locale}
  accountHint={lastGoogleAccount}
  redirectEndpoint="/auth/google/login"
  returnTo={selectedAction.returnTo}
  copy={loginCopy}
  onCredential={exchangeGoogleCredential}
  onAuthenticated={finishGoogleLogin}
  onFailure={reportAndDescribeLoginFailure}
  onUseAnotherAccount={forgetGoogleAccount}
/>
```

These function names are host adapter points, not supplied implementations. In Next.js, use the existing `next/script` loader's `onReady` to provide the identity API. Its `onError` should report failure and show safe feedback in the auth shell. The component's fallback works with identity null, including server-rendered HTML without JavaScript.

If the app uses a one-use nonce/challenge, the auth shell obtains a fresh one after rejection or cancellation and updates `nonce` before retrying. Keep `identity` null while that challenge is unavailable so the same-tab fallback remains usable. Report challenge-fetch errors in the auth shell and never reuse a consumed challenge.

## Email adapter

Copy EmailAuth.tsx and email-auth.css together, and pass localized copy and an adapter for the app’s existing routes. The supplied component supports email/password login, signup, six-digit email verification, resend and password reset. It asks for email and one password. Add fields only when the app needs them before access. Keep a visibility control rather than asking for the password twice. Set minPasswordLength to the existing backend policy rather than changing that policy from the browser.

The app owns identity, code expiry, attempts, single use, sessions, account eligibility and return navigation. A single header entry such as “Get started” can open signup while the form offers “Log in”. Keep public browsing public. Ask for streaming connections, extensions or other setup at the action that needs them. Preserve invitations, terms, consent and private-app registration rules.

| Adapter | Result |
| --- | --- |
| login | Authenticated user |
| register | Account saved and verification email sent |
| sendCode | New signup or reset code issued |
| verifyEmail | Verified user with a persisted session |
| verifyResetCode | A server-authorized recovery capability |
| resetPassword | Password saved and authenticated user |

A recovery capability can be an opaque single-use reset ticket, or the already established session if that is the app’s existing recovery contract. Never create a client-side ticket or accept email alone as reset authorization. Do not put recovery capabilities in localStorage or expose them in a URL. This component does not implement a recovery backend.

Map backend failures through onFailure to safe localized text. Use reason email-exists to offer login with the entered email preserved, and verification-needed to offer a new verification code. Do not tell someone with an existing account to choose a different address. The component retains email while switching forms and clears password and code at transitions. Signup terms are supplied by the host and require a checkbox only when that host passes terms. Do not preselect consent or mix marketing permission into account terms.

The adapter must use the supplied AbortSignal. Closing the component cancels its pending request and prevents stale completion. A cancellation cannot undo a server-side write that already happened. Resume from the actual session or account state on the next visit. Keep onAuthenticated in the host auth owner so email and Google paths resume the same action once. EmailAuth is a form, so do not place it inside another form. Keep the Google button as a sibling in the auth shell, rather than nesting forms.

Complete recovery in place: email, code, new password, then the selected app action. Show the actual recipient, support pasting and one-time-code autofill, and keep resend and email correction available. The backend owns expiry, so do not invent a countdown or hide its expiry error behind client timing.

Free access should activate through the app’s account lifecycle without a confirmation or checkout. Keep existing Stripe customer registration and zero-priced subscription bookkeeping when that is how the app grants credits. A free-plan CTA opens the app, and paid checkout still shows its actual price and renewal terms. Do not change allowances or billing ownership while editing the auth interface.

## Backend contract

Map these roles to existing routes rather than adding parallel endpoints.

| Route role | Behavior |
| --- | --- |
| Public configuration | Expose the client ID without consuming credential-attempt limits |
| POST credential | Verify ID token, apply account policy, set the app session, return user |
| GET redirect start | Validate return destination, bind it to fresh short-lived state, redirect to Google |
| GET code callback | Validate/consume state, handle cancellation, exchange code, verify identity, apply the same account/session policy |
| Session/profile | Resolve the actual session on reload and server rendering |
| Logout | Invalidate according to the app's revocation model, clear cookie, then leave the protected document |

Use an existing provider library for code exchange and signature verification. Google recommends a production token-verification library with signing-key caching rather than the `tokeninfo` debugging endpoint. Validate issuer, audience, expiry, subject and the relevant verified-email/domain policy. Identify Google accounts by `sub`. Do not auto-link an existing account solely from an untrusted email match or weaken an allowlist.

For GIS credentials submitted through app fetch, require JSON and the app's cookie-auth CSRF protection, including an exact trusted Origin check. Do not allow arbitrary credentialed origins or a missing Origin as a web-client bypass. Optional GIS nonces need server-issued challenges and server verification. Google's direct credential POST instead uses its documented double-submit `g_csrf_token` contract.

Preserve the framework's state, PKCE and nonce checks. Bind return context to verified state with a server-side store or integrity-protected transient cookie. Consume the pending operation once on success, rejection or cancellation. An integrity-protected cookie alone does not enforce server-side replay prevention. Keep it separate from GIS `g_state`. Use HttpOnly, Secure production cookies and a SameSite policy appropriate to the callback method. A GET code callback differs from GIS `ux_mode: "redirect"`, which POSTs a credential and has another CSRF/cookie contract.

Validate the destination against the allowed app origin and routes. Cover roots, language roots, queries, fragments, encoded separators, protocol-relative paths and backslashes. Keep sensitive draft state server-side behind an opaque reference. Preserve registered callbacks and scopes. New origins/callbacks require provider-console configuration before rollout.

Pass `login_hint` for the remembered account. Explicit account switching clears it and requests account selection in the redirect path. Return failures to localized login with the original context and a safe retry message. Success normally uses an HTTP redirect without tokens in the URL. Muvisafe's HTTP 200 callback exists for extension account events and is not a universal requirement.

## Design and journey ownership

A valid app session bypasses login. Preserve existing email/password methods, signup verification, invitations, terms and consent. Google login must not open registration in a private app. Do not trigger One Tap automatically after logout.

Keep the official Google button, an underlined same-tab fallback and an explicit account-switch control. Preserve host typography, surfaces and primary color. Use a supported button theme rather than restyling the Google iframe. Keep controls at least 44px high, focus visible, pending state announced and errors actionable. The CSS is scoped and inherits app type and color. Authorization, upgrades and action resumption belong to the action owner after login.

Wrap GoogleSignIn in AuthPanel for the supplied design, passing the app’s real logo or icon through its ReactNode brand slot, a title and optional description/footer. Give the logo useful alt text. The fixture mark is an example asset, not a product logo. Use a task heading such as “Create your account” or “Reset your password” rather than a vague “Get started” inside a form. Keep modal focus trapping and dismissal in the existing modal owner. Remove ornamental accent rules without stripping useful card grouping, field borders or focus outlines. The panel is a section, not a replacement dialog. It inherits typography. Override `--auth-surface`, `--auth-text`, `--auth-muted`, `--auth-accent`, `--auth-border`, `--auth-error` and `--auth-radius` to match the app, and choose the Google button theme separately. Never ship fixture controls or the test provider as product UI.

## Primary references

- [GIS API](https://developers.google.com/identity/gsi/web/reference/js-reference)
- [Button modes](https://developers.google.com/identity/gsi/web/guides/display-button)
- [ID-token verification](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)
- [Server code flow](https://developers.google.com/identity/protocols/oauth2/web-server)
- [React Effect Events](https://react.dev/reference/react/useEffectEvent)
