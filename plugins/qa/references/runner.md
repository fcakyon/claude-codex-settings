# Runner API

Requirements: Node 22+, `npm ci` in this plugin, a supported Chrome build for browser cases. SQLite CLI and ADB are optional per-case dependencies. No MCP server.

```sh
project-qa discover --root .
project-qa setup --root . --base-url https://example.com --related ../backend
project-qa doctor
project-qa run --root .
project-qa run --root . --filter auth --output /private/path/qa-run
```

Export `cases` from `.agents/qa/suite.mjs`. Each has `id`, `surface`, optional `requires` with earlier case IDs, `async run(qa)` and an explicit `qa.assert` outcome assertion. Throw `new qa.Blocked(reason)` for known missing prerequisites. Unexpected errors fail. Reports record configured gaps and selected/omitted cases.

| API | Purpose |
| --- | --- |
| `qa.config`, `qa.root` | Project settings and resolved repository |
| `qa.browser()` | Isolated browser with saved sessions and analytics capture |
| `qa.assert` | Counted Node strict assertions |
| `qa.signIn(page)` | Configured password login and expected identity check |
| `qa.secret(name)` | Environment/private credential lookup |
| `qa.reuseCookies(origins)` | Approved provider cookies from local browser |
| `qa.http(url, options)` | Real fetch, 30-second deadline, no browser cookies |
| `qa.command(file, args, options)` | Spawn argv without a shell, return code/stdout/stderr |
| `qa.sqliteQuery(db, sql)` | Read-only SQLite JSON rows |
| `qa.androidInstrumentation(serial, runner)` | Actual ADB tests with positive assertion count |
| `qa.videoState(page, selector)` | Decoded media state |
| `qa.advancingVideo(page, options)` | Observe advancing time and frames |
| `qa.observeSkip(page, {start, end, selector})` | Observe skip across interval in seconds |
| `qa.evidence(name, value)` | Non-sensitive structured evidence |
| `qa.screenshot(page, name)` | Private screenshot |

`config.auth` defines `usernameEnv`, `passwordEnv`, `identityField`, `profileUrl`, `loginEndpoint`, `loginUrl`, `usernameSelector`, `passwordSelector`, `submitSelector`, `successUrl`. OAuth, MFA, device codes and provider profile selection need project-specific scripts.

Command output stays in memory unless saved. Use descriptive assertion messages instead of secret-bearing response dumps. Screenshots stay private. Use `try/finally` for project data and tabs. The runner saves sessions, closes its browser and reports failed cases.

Browser analytics capture does not cover `qa.http` or subprocesses. Follow telemetry guidance for their effects. Run suites sharing state sequentially.

## Optional network diagnostics

Use [browser-network-cli](https://github.com/fcakyon/browser-network-cli) when a failed journey needs request/response or extension-worker evidence beyond the runner's assertions. Check `browser-network --help` first. If missing and needed for the task, install its precompiled release with `npm install -g https://github.com/fcakyon/browser-network-cli/releases/latest/download/fcakyon-browser-network-cli.tgz` (Node 22.12+), then read the CLI's current help and linked agent skill. Routine QA does not depend on it.

Attach only to an authorized browser with an available CDP endpoint. The QA runner does not expose a debugging port by default. Use a unique `--state` path, explicit `--host` scope and the exact `--extension` ID when needed. Start capture before reproducing the action, inspect redacted evidence, and stop only your recorder in `finally`. Sensitive capture is opt-in and must stay private. Do not restart personal Chrome or request Keychain access to collect diagnostics.

Capture observes traffic; it does not isolate analytics or guarantee a worker's first requests were recorded. Node HTTP replay requires explicit authorization and does not prove browser authentication or DRM playback. Preserve the real UI and provider assertions. Put recurring diagnostic commands into the project's tracked scripts rather than repeating manual capture steps.
