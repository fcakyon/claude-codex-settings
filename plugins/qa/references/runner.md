# Runner API

Requirements: Node 22+, `npm ci` in this plugin, a supported Chrome build for browser cases. SQLite CLI and ADB are optional per-case dependencies. No MCP server.

```sh
project-qa discover --root .
project-qa setup --root . --base-url https://example.com --related ../backend
project-qa doctor
project-qa run --root . --base-url http://localhost:3000
project-qa run --root . --filter auth --filter pages.home --output /private/path/qa-run --verification
```

Discovery does not load project code by default. For a trusted project, `project-qa discover --root . --load-suite` imports the suite and its dependencies, including their module initialization, without calling journey bodies. The report distinguishes a missing suite from one that was not loaded. Import errors stop the command. `declaredSurfaces` combines case surface labels, splitting slash-separated labels, and optional case `capabilities` arrays. Generated `.unconfigured` cases do not count. `candidateGaps` compares these labels with detected components and capabilities. It cannot prove either coverage or a missing journey.

Export `cases` from `.agents/qa/suite.mjs`. Each has `id`, `surface`, optional `requires` with earlier case IDs, `async run(qa)` and an explicit `qa.assert` outcome assertion. The runner counts calls, so `assert.ok(true)` passes its check. Assert observed values. Throw `new qa.Blocked(reason)` for known missing prerequisites. Unexpected errors fail, and so does an uncaught error on any page of the case, recorded as `pageErrors` with up to five page addresses and messages. Set `allowPageErrors: true` on a case that triggers them on purpose. A case that signs out, revokes tokens or deletes shared data uses an account or fixture of its own, so later cases never inherit its state. Each `--filter` selects the cases whose id contains it, and a filter that matches no case stops the run. A CI job compares `report.selected` with its case list, since a later case whose id contains a filter joins the run. With `--verification` the CLI also prints a commit trailer from executed case results, including failures and blockers. The run keeps its normal exit status. Reports record the effective `baseUrl`, tested revision, configured gaps and selected/omitted cases. `run --base-url` overrides only the website target for that run; API and authentication endpoints are separate settings. Confirm those endpoints before using credentials or creating side effects.

| API | Purpose |
| --- | --- |
| `qa.config`, `qa.root` | Project settings and resolved repository |
| `qa.browser()` | Isolated browser with saved sessions and analytics capture. Another device is `(await qa.browser()).browser().newContext()`, which has no saved session, analytics capture or page-error check |
| `qa.assert` | Counted Node strict assertions |
| `qa.telemetry` | Analytics requests captured this run, each `{transport, events}` with event and parameter names only |
| `qa.signIn(page)` | Configured password login and expected identity check |
| `qa.secret(name)` | Environment/private credential lookup |
| `qa.reuseCookies(origins)` | Approved provider cookies from local browser |
| `qa.http(url, options)` | Real fetch, 30-second deadline, no browser cookies |
| `qa.mcp` | Remote MCP and OAuth checks using Node fetch, see below |
| `qa.network(startArgs, run)` | Scoped CLI capture with private export and cleanup |
| `qa.command(file, args, options)` | Spawn argv without a shell, return code/stdout/stderr |
| `qa.sqliteQuery(db, sql)` | Read-only SQLite JSON rows |
| `qa.macos({driver, contract, mode, timeout})` | Native macOS client with `call(operation, params)` and `freeze(projectSourceSHA256)`, see [native workflow](macos.md) |
| `qa.swiftTests(result, {selfTest})` | Assert a real Swift Testing command result, positive test count, no failed runs or skips, and optional app self-test success |
| `qa.androidInstrumentation(serial, runner)` | Actual ADB tests with positive assertion count |
| `qa.videoState(page, selector)` | Decoded media state |
| `qa.advancingVideo(page, options)` | Observe advancing time and frames |
| `qa.observeSkip(page, {start, end, selector})` | Observe skip across interval in seconds |
| `qa.emulateTouch(page, {width, height})` | Phone viewport and touch input for one page. Call before navigation and again after a full-page screenshot |
| `qa.touchGesture(page, selector, steps, {observe, settle, timeout})` | Real touch points. `steps` are `[dx, dy, waitMs]` from the target center. `observe(element)` state, pointer events and `scrolled` `{x, y}` are sampled with the finger down and `settle` ms after release. A tap that loads a new document returns `after.navigated` with its address, and a target that is gone reports `state` as `null` |
| `qa.gestures` | Named step presets by finger direction |
| `qa.captureAudio(page)` | Scripted microphone and played-audio meter for voice pages, see [voice](voice.md). Call before navigation |
| `qa.tabTo(locator, {timeout} = {})` | Reach a Playwright locator by pressing Tab from the current focus, with a 30-second default budget. Use before keyboard activation. Assert the resulting focus, navigation or saved state in the journey. |
| `qa.overflow(page)` | Up to five `tag#id.class right=<px>` elements past the viewport's right edge, `[]` when the page has no horizontal scroll. Assert with `deepEqual(…, [])` |
| `qa.evidence(name, value)` | Non-sensitive structured evidence |
| `qa.screenshot(page, name)` | Private screenshot |

## Remote MCP

The helpers default to MCP `2026-07-28`. Pass `protocolVersion: '2025-11-25'` to check the legacy stateless path. Each request has a 30-second deadline and stops at redirects. Use a configured connector URL and retrieve your disposable account's bearer token with `qa.secret`. Return only non-sensitive summaries as evidence.

| API | Purpose |
| --- | --- |
| `qa.mcp.discoverOAuth(endpoint, {expectedIssuer, expectedResource, extraProtectedResourcePaths, removedPaths, checkPreflight, preflightOrigin, checkOpenIDConfig, timeoutMs})` | Follow the anonymous GET bearer challenge to same-origin protected resource metadata and check RFC 8414 metadata and S256. Defaults the resource to the endpoint. Set the issuer explicitly for a separate auth origin. Pass `extraProtectedResourcePaths` for aliases, `removedPaths` to assert 404 without a challenge on retired URLs, `checkPreflight` for OPTIONS metadata preflights, and `checkOpenIDConfig` for OIDC metadata parity. `preflightOrigin` selects the allowed browser origin to test, defaulting to `https://untrusted.example.invalid`. Returns `{protectedResource, authorizationServer}` |
| `qa.mcp.call(endpoint, {token, method, params, protocolVersion, headers})` | Send one JSON-RPC POST with protocol headers and metadata. Returns `{status, headers, body, result, error, chars}`. Body is JSON or text, with `null` for an SSE response closed on receipt. Supply your own `qa.assert` on the outcome of this raw call |
| `qa.mcp.assertServerContract(endpoint, {token, protocolVersion, requiredTools, requireProfileTool, requireIcons, verifyIconUrls, requireToolAnnotations, noExternalBundleRefs, requireWebsite, requireDescription, maxInstructionsParagraph, maxResultChars, expectedAppHashes})` | Check anonymous challenges, authenticated GET and DELETE, foreign Origin rejection, discovery, paginated tool lists and referenced view metadata. When `requireIcons` is set, `verifyIconUrls` fetches same-origin (or `'all'`) icon URLs for HTTP 200 image bytes matching `mimeType`. `requireToolAnnotations` checks tool safety hints, and `noExternalBundleRefs` (default true) rejects uninlined script or stylesheet tags in `ui://` HTML. Returns `{serverInfo, instructions, tools}` |
| `qa.mcp.assertToolCall(endpoint, {token, name, arguments, expectError, maxChars, protocolVersion})` | Check a JSON tool result or expected tool or JSON-RPC error. Returns the raw call shape. The default budget is 100,000 characters measured on the serialized result or error |
| `qa.mcp.assertOAuthNegativeBoundaries(baseUrl, {registerEndpoint, authorizeEndpoint, tokenEndpoint, protectedResource})` | Check invalid registration if a DCR URL is provided, unsafe authorization redirects, and rejection of unsupported grants or fake credentials. Endpoint options accept absolute URLs or paths relative to the base URL. Uses synthetic values, with no valid registration or token exchange |

```js
const endpoint = new URL('/mcp', qa.config.baseUrl)
const token = await qa.secret('QA_MCP_BEARER')
await qa.mcp.assertServerContract(endpoint, {token, requiredTools: ['list_reports'], requireProfileTool: true})
const {result} = await qa.mcp.assertToolCall(endpoint, {token, name: 'list_reports', arguments: {limit: 5}})
qa.assert.ok(result.structuredContent.reports.some(report => report.id === 'qa-fixture-report'))
```

When testing release packaging, compute the hash from the build output before calling the server. A fallback shell can have valid MCP metadata and still serve different HTML. For an app URI that embeds a content hash, also check the URI against the build's naming rule.

```js
import {createHash} from 'node:crypto'
import {readFile} from 'node:fs/promises'

const hash = createHash('sha256').update(await readFile(buildArtifact)).digest('hex')
await qa.mcp.assertServerContract(endpoint, {token, expectedAppHashes: {open_report: hash}})
```

Exercise the result budget with a large fixture. The Go MCP SDK can add `_meta["io.modelcontextprotocol/serverInfo"]` and `resultType` after the handler returns. Leave room for those fields in the handler's budget and use `assertToolCall` to check the final response.

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
