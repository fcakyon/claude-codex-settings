# Proof by surface

| Surface | Outcome to observe | Execution |
| --- | --- | --- |
| Website | Visible result, route, persistence, mobile and localized flows | Real Chrome and HTTP |
| Extension | Built package, background auth, content-script UI and effect on host page | Chrome for Testing and real backend |
| Provider | Expected session and successful authorized action | Saved session, scoped cookie recovery, ordinary login |
| Video | Decoded frames, advancing time, selected skip and same interval without filter | Real provider subscription/player |
| Backend | HTTP contract, committed state, retries and rejection | Existing integration process or sandbox API |
| Database | Read-after-write and cleanup | Disposable DB, read-only assertions |
| Auth/credits | Login/logout, protected denial, first debit, repeat-free, insufficient/unlimited | Normal account and disposable ledger |
| Android | UI/action outcome on explicit device and assertion count | ADB and project Espresso/UI Automator |

For localized text regressions, extend the existing affected journey with representative supported-language inputs and explicit expected outcomes for display, search, input, copy or formatting as applicable. Select a stable content identity rather than the first search result. Exercise the actual page/content language and direction, not only browser preferences. Assert the expected rendered or copied value without applying the same transformation as the implementation. Include visual inspection when glyphs, clipping or bidirectional layout matter.

Build the exact extension candidate and record its version. Do not modify it to bypass auth or replace provider responses. Popup state and provider-site UI are separate observations. Fullscreen, subtitles, title changes and reconnect need explicit journeys when supported. A toolbar is not playback proof.

Media helpers observe dimensions, frames, time and a discontinuous jump. Seek before the interval, then observe the extension acting. A test-issued seek cannot count as a skip. Unavailable titles, DRM, subscriptions and provider login failures must retain evidence and explain the precise limitation.

Invoke existing backend tests with `qa.command`. Require tests to execute because a no-match filter may exit 0. SQLite helpers open read-only. Mutate through application routes and restore test records in `finally`. Never treat production databases as disposable or send test purchases/webhooks to live billing.

Android requires explicit serial, installed app and test runner. `qa.androidInstrumentation` runs `adb -s <serial> shell am instrument -w -r <runner>` and requires positive `OK (N tests)` output. Project instrumentation owns UI assertions. Physical DRM/hardware playback needs a compatible physical device. Appium can run through `qa.command` when the project already uses it.

Keep missing integrations blocked until scripts exist. Do not create fake Android, payment, OAuth or provider cases to fill a coverage table.

For a provider regression, compare the same browser and cookies with and without restored origin databases before assuming bot detection or changing browser identity. Verify actual media frames after the repair. A successful DRM capability call alone does not prove playback.

Record the actual package, revisions and hashed account/profile/device context so identity changes are not mistaken for deployment regressions. Use network/media metadata when screen capture affects protected playback.
