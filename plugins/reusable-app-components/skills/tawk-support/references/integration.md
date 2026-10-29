# Integration contract

## Host and component

Copy the TSX asset into the app. Pass an SDK API only after Tawk’s onLoad callback. A Script download event alone does not prove the SDK is ready. Configure onLoad before inserting the embed script. Load one widget and mount one identity owner. When switching language widgets, hold api at null until switchWidget succeeds, then pass the ready API. Report switch failures and reapply visibility after every load.

| Input | Host responsibility |
| --- | --- |
| api | Ready SDK for the intended property/widget, or null while loading/switching |
| accountKey | Observable current account ID or null. This triggers refresh but never proves identity |
| resolveIdentity(signal) | Fetch the current server-verified identity with this AbortSignal; return null for a guest |
| attributes | Explicitly allowed technical/product context. Do not include reserved userId, hash, name or email fields |
| hidden | Hide/minimize chat during workflows where it would obstruct the task |
| onFailure | Report safe diagnostics without credentials, hashes or provider payloads |

The component serializes SDK operations so account switches follow earlier login callbacks. Closing the owner aborts its identity request and prevents a cancelled result from reaching the SDK. Cancellation cannot undo a login the SDK already accepted. The next owner must resolve the actual account. Focus and chat maximization refresh context without reconnecting the same signed-in user.

For a cookie-based app, an auth-owner event or a reactive accountKey must change immediately after login/logout. Navigation alone is insufficient when the auth surface leaves the current page open. For a browser PocketBase client, subscribe to the same authStore the login action writes. Do not construct a second client with independent session state.

## Signed server response

Use the app’s existing authenticated account lookup. The server derives all account fields from that verified account, not request parameters. Calculate HMAC-SHA256 over the exact account ID using the current property’s API key. Return userId, hash, name and email plus a small allowlist of app-specific account facts. Never send the signing key. Keep it in server-only local/deployment secrets, never public build variables or browser assets. Tawk Secure Mode must be enabled for the property.

Return 204 for guests and private, no-store for every identity response. Invalid/expired credentials must resolve to a guest according to the app’s session policy. Report backend failures as failures rather than silently keeping another account’s identity. Different products and locale properties must use their own signing key.

Use a production cryptographic library. Node’s createHmac("sha256", key).update(account.id).digest("hex") matches the SDK contract. The login payload uses userId and its hash. Do not substitute an email-based hash from the separate setAttributes name/email recipe.

## Context selection

Account ID, name, email, actual sign-in method, UI language, browser type/release and mobile/desktop class are useful support fields. Add a product fact only when support needs it, such as connected streaming providers. A connected-account label is not permission to send cookies, credentials or provider tokens. Tawk captures the visitor IP itself.

Prefix version strings with v and create Short Text attributes before use. Tawk can infer Decimal Number from a version like 1.3.0 and truncate it. Existing attribute types cannot be changed in place, so move callers to a new text key and label the old field as legacy. Verify the full value in a real Tawk session.

Do not automatically collect clinical conversations, medication selections, diagnoses, treatment plans, scores, private drafts, search text, tokens or full URLs that expose sensitive context. Use a safe page category if needed. Check Tawk’s own automatic page tracking against the app’s URL design. Explain support processing in the existing privacy notice. Do not promise regulatory compliance from this integration.

## Verification

At the owning HTTP boundary, test guest, valid account, a second account, invalid/expired session and logout. Check the response field allowlist, no-store, signatures with isolated test keys and locale/property separation. At the browser boundary, verify SDK login/logout, focus refresh, context updates, cancellation, hidden workflow re-entry and no duplicate scripts. Exercise actual Tawk and inspect received fields separately from a mocked SDK.

The extraction tests use local HTTP identities and an SDK event source. They prove component lifecycle and transport, not Tawk’s server enforcement or real account privacy. The initial app evidence is MuviSafe (8d0d40a), My AI Patient (b5c2900) and Fast & Rational (f9b8e4a). Record only the flows actually checked before claiming wider coverage.

Reference: [Tawk JavaScript API](https://developer.tawk.to/jsapi/).
