# Sessions and credentials

Set `QA_BROWSER_EXECUTABLE` to a supported Chrome executable. The runner pins Playwright. Extension loading requires Chrome’s `Extensions.loadUnpacked` CDP command. Builds verified on 2026-10-25 are Chrome for Testing 156 and standard Chrome 155, both with separate headless profiles. The browser supplies Widevine, not Playwright or an agent CLI.

Runs are headless by default and pause 500 ms between browser actions. Only set `QA_HEADED=1` when the user has chosen a time for visible browser work. A visible run may take focus. `browser.actionDelayMs` changes pacing. Each run uses a temporary isolated profile. Cookies and local storage are saved privately and restored next time. IndexedDB is deliberately excluded: replaying Netflix’s player database into a fresh browser caused M7063-1913-109000 even when DRM APIs succeeded. The same headless browser played normally with cookies and local storage retained but IndexedDB omitted. The extension loads after telemetry interception. Extension preferences are tested across reload within a run. Device-bound credentials, browser profile files and DRM licenses are not portable storage state.

`QA_STATE_DIR` selects private state. Otherwise it lives under `~/.local/share/project-qa/<project>-<root-hash>`. Related projects can share `stateGroup` if run sequentially. Directories use mode 700 and session/credential/report files mode 600. This is filesystem protection, not encryption. Keep state out of Git, archives and sync folders.

`qa.secret('ENV_NAME')` reads an environment variable, then `credentials.json` in private state. Track credential names only. A secret manager can supply environment variables. Do not put values in shell arguments, logs, screenshots or reports.

Recovery order:

1. Try saved state and verify the expected identity through the real service.
2. If expired, set `QA_SOURCE_CDP=http://127.0.0.1:<port>` for the authorized signed-in browser. Chrome versions exposing only a WebSocket endpoint accept that `ws://` URL directly, read from that profile’s `DevToolsActivePort` file without printing it. `qa.reuseCookies(origins)` requires exact origins in `config.authOrigins`. It reads only applicable cookies through a temporary blank tab, closes that tab and imports the cookies into QA. It does not read Keychain or copy a personal profile. Partitioned cookies are omitted.
3. If still expired, use configured credentials through the ordinary provider login. Project scripts own provider-specific forms and profile pickers. Stop on MFA/CAPTCHA and report the missing action. Do not repeatedly retry credentials.

MFA can recur after expiry, revocation or device checks. On macOS, Always Allow normally remembers permission for the same app and Keychain item. Allow Once does not. The runner requires no direct Keychain access. Never request the Mac password in chat or grant all applications access.

Use normal test accounts. An optional `is_test` label is reporting metadata, not an authorization role. Fresh-account and credit-limit tests belong in disposable databases or approved sandbox accounts.

References: [Playwright storage state](https://playwright.dev/docs/api/class-browsercontext#browser-context-set-storage-state), [Apple Keychain approval](https://support.apple.com/en-ie/guide/keychain-access/kyca1243/mac).

Keep Chrome component updates enabled. On the verified Chrome for Testing build, Playwright’s default disable-component-update flag made Widevine unavailable even though its library was bundled. The runner removes that flag.

For one-time machine setup, store `QA_BROWSER_EXECUTABLE` and `QA_SOURCE_PROFILE` alongside credentials in the private credentials file. The latter is the authorized Chrome user-data directory containing `DevToolsActivePort`. The runner reads the current local endpoint only when cookies need recovery, so browser restarts do not require a new saved WebSocket URL. Environment variables take precedence.

Treat provider databases and cryptographic browser state as non-portable. If an application stores its login token in IndexedDB, design and verify that application’s recovery separately. Do not enable whole-browser IndexedDB export to solve one application’s authentication.
