# Runner API

Requirements: Node 22+, `npm ci` in this plugin, a supported Chrome build for browser cases. SQLite CLI and ADB are optional per-case dependencies. No MCP server.

```sh
project-qa discover --root .
project-qa setup --root . --base-url https://example.com --related ../backend
project-qa doctor
project-qa run --root . --base-url http://localhost:3000
project-qa run --root . --filter auth --output /private/path/qa-run
```

Export `cases` from `.agents/qa/suite.mjs`. Each has `id`, `surface`, optional `requires` with earlier case IDs, `async run(qa)` and an explicit `qa.assert` outcome assertion. Throw `new qa.Blocked(reason)` for known missing prerequisites. Unexpected errors fail. A case that signs out, revokes tokens or deletes shared data uses an account or fixture of its own, so later cases never inherit its state. Reports record the effective `baseUrl`, tested revision, configured gaps and selected/omitted cases. `run --base-url` overrides only the website target for that run; API and authentication endpoints are separate settings. Confirm those endpoints before using credentials or creating side effects.

| API | Purpose |
| --- | --- |
| `qa.config`, `qa.root` | Project settings and resolved repository |
| `qa.browser()` | Isolated browser with saved sessions and analytics capture |
| `qa.assert` | Counted Node strict assertions |
| `qa.signIn(page)` | Configured password login and expected identity check |
| `qa.secret(name)` | Environment/private credential lookup |
| `qa.reuseCookies(origins)` | Approved provider cookies from local browser |
| `qa.http(url, options)` | Real fetch, 30-second deadline, no browser cookies |
| `qa.network(startArgs, run)` | Scoped CLI capture with private export and cleanup |
| `qa.command(file, args, options)` | Spawn argv without a shell, return code/stdout/stderr |
| `qa.sqliteQuery(db, sql)` | Read-only SQLite JSON rows |
| `qa.androidInstrumentation(serial, runner)` | Actual ADB tests with positive assertion count |
| `qa.videoState(page, selector)` | Decoded media state |
| `qa.advancingVideo(page, options)` | Observe advancing time and frames |
| `qa.observeSkip(page, {start, end, selector})` | Observe skip across interval in seconds |
| `qa.emulateTouch(page, {width, height})` | Phone viewport and touch input for one page. Call before navigation and again after a full-page screenshot |
| `qa.touchGesture(page, selector, steps, {observe, settle, timeout})` | Real touch points. `steps` are `[dx, dy, waitMs]` from the target center. `observe(element)` state, pointer events and `scrolled` `{x, y}` are sampled with the finger down and `settle` ms after release |
| `qa.gestures` | Named step presets by finger direction |
| `qa.captureAudio(page)` | Scripted microphone and played-audio meter for voice pages, see [voice](voice.md). Call before navigation |
| `qa.evidence(name, value)` | Non-sensitive structured evidence |
| `qa.screenshot(page, name)` | Private screenshot |

`config.auth` defines `usernameEnv`, `passwordEnv`, `identityField`, `profileUrl`, `loginEndpoint`, `loginUrl`, `usernameSelector`, `passwordSelector`, `submitSelector`, `successUrl`. OAuth, MFA, device codes and provider profile selection need project-specific scripts.

Command output stays in memory unless saved. A failure records `reason` with the compared values cut to 120 characters, `at` with up to three suite lines, `detail` with the browser call log without request headers, and `pages` with each page's last address without its query, plus a screenshot while the page is open. Console output repeats them, so wrappers that delete the report still show the cause. URL queries are dropped and `qa.secret` values show as `[hidden]`, while response bodies in Playwright errors print as they are. Assert on statuses, ids and counts, never on tokens or secret-bearing responses. Screenshots stay private. Use `try/finally` for project data and tabs. The runner saves sessions, closes its browser and reports failed cases.

Browser analytics capture does not cover `qa.http` or subprocesses. Follow telemetry guidance for their effects. Run suites sharing state sequentially.

## Optional network diagnostics

Requires [browser-network-cli](https://github.com/fcakyon/browser-network-cli) 0.2.1+. Check `browser-network --version`. If missing, install with `npm install -g https://github.com/fcakyon/browser-network-cli/releases/latest/download/fcakyon-browser-network-cli.tgz`. If the release is older, build a checkout and set `BROWSER_NETWORK_CLI` to its `dist/cli.js`.

`qa.network(startArgs, run)` owns a private recorder, exports evidence and stops it even when the callback fails. Pass an authorized CDP endpoint or profile and explicit host/extension scope. The runner does not expose its own debugging port by default.

```js
await qa.network(['--cdp', endpoint, '--host', 'example.test'], async network => {
  const after = (await network('status')).lastRequestId
  await page.getByRole('button', {name: 'Connect'}).click()
  const request = await network('wait', ['--contains', '/connect', '--after', after, '--status', '200'])
  qa.assert.equal(request.status, 200)
})
```

Use `targets` for exact IDs and `media --target ID` for frame/time/dimension samples. Startup capture needs `--pause-workers` before loading a service worker in a dedicated test browser. Capture does not isolate analytics or replace provider/playback assertions. Keep callback commands to observation and let the helper own export and stop.
