# Integration contract

## Default full-page login and remembered profiles

The plain TypeScript helpers in login.ts have no React or Vite dependency. Use socialLoginUrl with the app's existing redirect-start endpoint and selected destination. A normal anchor navigates in the same tab and works without JavaScript. Vite runs the local demo only. The supplied UI adapters use React.

```tsx
<GoogleSignIn redirectEndpoint="/auth/google/login"
  returnTo={selectedAction.returnTo} label="Continue with Google" />
```

RememberedLogin renders a host-supplied last successful profile first. A host may skip the row for a saved password account and open the form with the email filled in, which saves a click. Its continueWith(profile, badge) callback renders the provider link with the supplied badge passed as SocialSignIn trailing, and its children callback renders the full form with an email prefill for saved password accounts. Choosing another profile opens the full form with no saved email. Keep current input in the auth owner so switching views does not lose it. Supply localized lastUsed, anotherProfile, savedProfile and or labels. Password profiles still require their password.

The host owns persistence and authentication. lastLogin(storage, appSpecificKey) reads, saves or removes only email and method. Call save only after verified authentication, and save(null) to forget. Saving every successful login with no checkbox is the default, because the stored email and method grant no access. Add the remember checkbox through beforeSubmit only when the product needs opt-in, such as shared or public devices. Keep this metadata across logout, and with a checkbox clear it when the user opts out. Supply localStorage only in the browser after hydration, and handle unavailable storage through the app's existing storage policy. Never use stored metadata for authorization or auto-linking. Do not store passwords, codes, tokens or session credentials. Only render supported providers. Social redirect flows carry the chosen method, and any remember choice, through the callback using existing transient state and save the backend-verified email after completion.

An email hint is optional for a remembered profile. The generic link requests prompt=select_account without login_hint. The backend redirect adapter must explicitly support these parameters and preserve state, PKCE, nonce, allowed destinations and the selected action. A hint does not prove identity or force a provider to choose an account. The local demo exercises a simulated provider and must not be used as a session backend.

## Optional social providers

SocialSignIn accepts a providers array with id, localized label, endpoint and an optional ReactNode icon. Configure Google, GitHub, Apple, Hugging Face or another provider only when its backend is available. One provider fills the row with a logo and label. Several providers default to compact logo buttons with accessible names and tooltips, matching the OpenRouter reference. Set layout="labels" to keep visible labels for several providers. The component bundles local SVG logos for google, github, apple and huggingface, with no icon package or external image request. The optional icon slot supports other providers. Copy the logos directory, ProviderLogo.tsx and logos.d.ts with SocialSignIn. Frameworks other than React can use the SVG files directly. Set --auth-logo-filter: none for monochrome marks on light surfaces. An empty array renders no buttons. Only pass a remembered profile while its method is still enabled.

Each endpoint owns its provider-specific OAuth details. Interpret login_hint and prompt as app-level selection intent, mapping them only to options supported by that provider. Preserve the same verified session, callback state and return destination contract for all methods. Adding a button does not implement a provider backend.

## Optional PocketBase integration

The UI remains backend-neutral. Import EmailAuthAdapter and OAuthProvider from assets/auth.ts for plain TypeScript integrations. The existing EmailAuth.tsx type export remains available for React callers.

Use assets/pocketbase.ts with the SDK's listAuthMethods result. It maps only enabled OAuth providers into id, label and app-owned redirect endpoint. It enables the email/password form only when password auth is enabled and email is an allowed identity field. Custom provider names remain intact. Provide a custom icon for a configured OIDC provider if needed.

```tsx
const methods = await pb.collection("users").listAuthMethods()
const auth = pocketBaseAuthMethods(methods, name => `/auth/${name}/login`)
// Pass auth.providers to SocialSignIn and mount EmailAuth when auth.emailPassword is true.
```

Run discovery in the auth owner and expose only this mapped configuration to the view. Do not persist or log the raw discovery result, which includes OAuth state and a PKCE verifier. Each redirect-start route obtains fresh provider details, retains state/verifier in its transient transaction, validates the callback and exchanges the code through authWithOAuth2Code. Keep the original destination and remember choice in that transaction. The helper does not start OAuth or create a session.

For native password login, authWithPassword returns a record and token. Return the record from the login adapter and let the app's auth owner manage the token or browser session. Native record creation needs passwordConfirm, which the adapter can populate from the same password field. Apply the app's registration and terms policy there.

The current EmailAuth verification and recovery screens use a six-digit code contract. PocketBase requestVerification/confirmVerification and requestPasswordReset/confirmPasswordReset use email tokens instead. Use the app's native token-link pages, or implement the existing code adapter on the backend. Do not treat a PocketBase OTP as a password-reset ticket. OTP login requires its otpId, and enabled MFA needs the app's second-factor flow. These methods are not implemented by the discovery helper.

PocketBase's native auth tokens are stateless and clearing authStore is local logout. Revocable server sessions in the proposed backend standard are an additional app layer, not a component requirement. Never share an authenticated SDK client between server requests. Keep native-token transport, cookie/CSRF policy and session invalidation in the app's auth owner.

References: [PocketBase authentication](https://pocketbase.io/docs/authentication/), [record auth APIs](https://pocketbase.io/docs/api-records/), [SDK auth-method types](https://github.com/pocketbase/js-sdk/blob/master/src/services/RecordService.ts).

## Legacy popup adapter

The following credential adapter remains for existing hosts with explicit `mode="popup"`. New integrations use full-page navigation above.

## Dependencies and adapters

The component needs React and React DOM 19.2+ for `useEffectEvent`. It has no Next.js, HeroUI, PocketBase or routing dependency. Copy the TSX and CSS together. The optional AuthPanel and its CSS provide a minimal dark panel without coupling auth to a design system. The plugin package.json is for validating the extraction, not for installation in every deployed app.

Load `https://accounts.google.com/gsi/client` once in the auth shell. Pass `google.accounts.id` as `identity` when ready, or null while unavailable. Supply the public client ID from existing public configuration or server rendering, outside credential-attempt rate limits. Mount only the active login/signup surface because GIS initialization is global to the page. Render the button once per active configuration and let Google choose its intrinsic width. Do not observe the rendered widget to clear and rebuild it: its iframe height changes can retrigger the observer indefinitely, replacing an active button. Keep the button mounted through provider layout and viewport changes; remove it only when the auth surface closes or its identity configuration changes.

| Input | App responsibility |
| --- | --- |
| `clientId`, `nonce`, `locale`, `theme` | Public client, optional server-issued challenge, language and official Google button theme |
| `redirectEndpoint`, `returnTo` | Existing start endpoint without a query string and an app-relative destination |
| `onCredential(credential, signal)` | Submit to the backend with the supplied cancellation signal, return its authenticated user |
| `onAuthenticated(user)` | Update/reload the verified session and resume the action |
| `onFailure(error)` | Report redacted diagnostics and return a localized safe message, including rate-limit guidance |
| `initialError`, `copy` | Retry feedback and localized control labels |

Never display arbitrary provider payloads or `error.message`. Bound credential requests at the transport owner. Closing the surface aborts its operation and ignores that cancelled callback. It cannot undo a session already created by the server, so the next visit must resolve the actual session.

Let Google own account selection. Omit `login_hint`, leave `button_auto_select` false, and request `prompt=select_account` for the same-tab fallback. Google can still personalize its button from its own sessions. In the legacy popup adapter, leave account selection to the official Google control. Use the full-page adapter above for remembered-profile navigation. Store no credential, session token or code in localStorage.

```tsx
<GoogleSignIn
  mode="popup"
  identity={googleIdentity}
  clientId={publicGoogleClientId}
  locale={locale}
  redirectEndpoint="/auth/google/login"
  returnTo={selectedAction.returnTo}
  copy={loginCopy}
  onCredential={exchangeGoogleCredential}
  onAuthenticated={finishGoogleLogin}
  onFailure={reportAndDescribeLoginFailure}
/>
```

These function names are host adapter points, not supplied implementations. In Next.js, use the existing `next/script` loader's `onReady` to provide the identity API. Its `onError` should report failure and show safe feedback in the auth shell. The component's fallback works with identity null, including server-rendered HTML without JavaScript.

If the app uses a one-use nonce/challenge, the auth shell obtains a fresh one after rejection or cancellation and updates `nonce` before retrying. Keep `identity` null while that challenge is unavailable so the same-tab fallback remains usable. Report challenge-fetch errors in the auth shell and never reuse a consumed challenge.

## Email adapter

Copy EmailAuth.tsx and email-auth.css together, and pass localized copy and an adapter for the app’s existing routes. The supplied component supports email/password login, signup, six-digit email verification, resend and password reset. It asks for email and one password. Add fields only when the app needs them before access. Instead of asking for the password twice, put an eye icon button inside the password field with a localized show or hide label. Keep every input at the same full width, and hide the browser's own reveal button so Edge does not show two. Set minPasswordLength to the existing backend policy rather than changing that policy from the browser.

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

The adapter must use the supplied AbortSignal. Closing the component cancels its pending request and prevents stale completion. A cancellation cannot undo a server-side write that already happened. Resume from the actual session or account state on the next visit. Keep onAuthenticated in the host auth owner so email and Google paths resume the same action once. EmailAuth is a form, so do not place it inside another form. Use the social slot for same-tab provider links and beforeSubmit for the host-owned remember checkbox. EmailAuth renders its own phase heading. Omit AuthPanel title when the form owns the heading. Keep the legacy GIS widget as a sibling in the auth shell, rather than nesting forms.

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

Validate the destination against the allowed app origin and routes. Cover roots, language roots, queries, fragments, encoded separators, protocol-relative paths and backslashes. Keep sensitive draft state server-side behind an opaque reference. Preserve registered callbacks and scopes. Register new callbacks under the OAuth client's Authorized redirect URIs and every origin serving the button, local ports included, under its Authorized JavaScript origins before rollout. Redirect URIs cover only the same-tab path, so a missing origin fails the button with `no registered origin` (`invalid_client`). Confirm each origin with `curl -H 'X-Requested-With: XmlHttpRequest' "https://accounts.google.com/o/oauth2/iframerpc?action=checkOrigin&origin=<origin>&client_id=<client id>"`, an undocumented endpoint that returns `"valid":true` once Google accepts it.

Request account selection in Google for both paths. Return failures to localized login with the original context and a safe retry message. Success normally uses an HTTP redirect without tokens in the URL. Muvisafe's HTTP 200 callback exists for extension account events and is not a universal requirement.

## Design and journey ownership

A valid app session bypasses login. Preserve existing email/password methods, signup verification, invitations, terms and consent. Google login must not open registration in a private app. Do not trigger One Tap automatically after logout.

Center the official Google button in a flex container with `color-scheme: light`. A dark ancestor otherwise makes Chrome paint an opaque white canvas behind Google’s light iframe. Keep the fallback as a secondary 14px link labeled “Continue in this tab”. Preserve host typography, surfaces and primary color. Use a supported button theme rather than restyling the Google iframe. Keep the form compact. Email fields, primary buttons and provider buttons are 44px high, the tap-target minimum, and never taller, with visible focus, announced pending state and actionable errors. Use 16px input text to avoid mobile focus zoom, 14px labels and provider button text, 18px provider logos, a 20px phase heading, 6px label gaps and 12px field gaps. A remembered profile is one 44px row: the email stays on a single line at 13px and ends in an ellipsis when it cannot fit, with the full address in the title, beside an 11px last-used badge. Never let an email wrap or grow the row. Scope button padding to form actions so inline terms and password controls do not inherit submit-button sizing. The CSS is scoped and inherits app type and color. Authorization, upgrades and action resumption belong to the action owner after login.

Wrap GoogleSignIn in AuthPanel for the supplied design, passing the app’s real logo or icon through its ReactNode brand slot, a title and optional description/footer. Give the logo useful alt text. The fixture mark is an example asset, not a product logo. Use a task heading such as “Create your account” or “Reset your password” rather than a vague “Get started” inside a form. Keep modal focus trapping and dismissal in the existing modal owner. Remove ornamental accent rules without stripping useful card grouping, field borders or focus outlines. The panel is a section, not a replacement dialog. It bundles the Inter variable font locally for consistent typography. Copy its fonts directory with the CSS, including the font license. Override --auth-font-family to use the host app’s typeface. Override `--auth-surface`, `--auth-text`, `--auth-muted`, `--auth-accent`, `--auth-border`, `--auth-error` and `--auth-radius` to match the app, and choose the Google button theme separately. Never ship fixture controls or the test provider as product UI.

## Primary references

- [GIS API](https://developers.google.com/identity/gsi/web/reference/js-reference)
- [Button modes](https://developers.google.com/identity/gsi/web/guides/display-button)
- [ID-token verification](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)
- [Server code flow](https://developers.google.com/identity/protocols/oauth2/web-server)
- [React Effect Events](https://react.dev/reference/react/useEffectEvent)
