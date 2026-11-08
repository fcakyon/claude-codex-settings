# Widget integration

## Signed identity

Create a same-origin endpoint such as `/api/support/identity`. Authenticate it with the app's existing server session. Guests return `204`. Signed-in users return only:

```json
{"user_id":"verified-account-id","user_hash":"hex-hmac-sha256","name":"Display name","email":"verified@example.com"}
```

Compute `createHmac('sha256', widgetSecret).update(user.id).digest('hex')` on the server. The secret belongs to that widget. Never sign a caller-supplied user ID, trust an email from the browser, or expose the secret. Return `Cache-Control: private, no-store`. Authentication outages must not silently become a different signed-in identity.

The native session API supports those identity fields, not arbitrary Tawk custom attributes. Keep clinical content, answers, access tokens and private account metadata out of identity and chat context. The SDK can send the page URL, so inspect query parameters as well as the message payload.

## React adapter

Copy both assets together. Mount one owner in the app shell:

```tsx
<OpenDeskSupport
  url={support.url}
  widgetKey={support.widgetKey}
  identityUrl="/api/support/identity"
  accountKey={user?.id ?? null}
  language={locale}
  hidden={isPrivateRoute}
/>
```

Derive `accountKey`, `language` and `hidden` from the app's actual auth and router state. An app with locale-prefixed API routes must provide its current identity URL. Adapt the framework-neutral `supportWidget` function for non-React apps.

The adapter loads `${url}/widget/v1.js` with `data-key` and `data-lang`, refreshes identity on focus and opening, and serializes SDK replacement. The SDK's `identify` merges fields and does not clear an existing conversation. Account changes and logout must call `shutdown` and recreate the SDK before identifying the next account. `shutdown` revokes the visitor token. Do not replace this sequence with `identify({})`.

The current SDK has `open`, `close`, `toggle`, `locale`, `identify`, `shutdown` and `on`. It has no public hide/show API. The adapter closes the panel and hides `[data-opendesk-widget]` for private routes. Review that selector when upgrading the SDK. Language updates use the native `locale` command, including RTL languages.

## Migration checks

Remove the old loader, component imports and provider-specific identity route after their OpenDesk replacements work. Update the app's privacy disclosure for self-hosted chat and the AI processor. Verify one widget and no old-provider requests on a production build.

Exercise guest → account A → account B → logout with separate conversation histories. Test a delayed identity request during logout and unmount, hidden → visible routes, focus refresh, EN/TR/AR, narrow viewports, and provider or identity failures. Reject invalid HMAC signatures and non-allowlisted origins through the real server. A foreign-workspace visitor token may create a new empty guest session rather than return an error, so assert isolation rather than a guessed status code.

Production extraction: MuviSafe, Fast & Rational and My AI Patient migrated on 2026-11-08. The assets model their lifecycle adapter. They do not replace app-specific server authentication, route policy or production integration checks.
