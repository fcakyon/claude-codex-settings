# Native macOS permission journeys

The plugin supplies native mechanics. The project owns selectors, fixtures, permission state, app-owned status checks and expected outcomes. Use `qa.macos` from a tracked journey or call `scripts/macos.mjs` directly. Node 22 and the macOS SDK are required on the machine running the native driver. The driver reads one JSON request from stdin and writes one JSON reply. It never opens Settings, installs an app, requests consent, edits TCC or Keychain, or resets permissions.

## Capture readiness before UI work

Live pixels are required for native UI acceptance. Check capture readiness before running the journey, changing app grants or collecting functional-only results. The agent captures and inspects the images. The user is needed only when macOS requires their consent, authentication or source selection.

1. Use the same execution route for preflight and capture. The app under test and the automation transport have separate authorization. A true app-owned Screen Capture flag does not authorize a helper running through SSH.
2. If capture preflight is false, identify the actual responsible client from the owned probe's ScreenCapture activity and TCC attribution. Keep logs scoped to that probe. An unknown preflight is unavailable authorization, not proof that the user denied access. Never read or edit TCC storage.
3. Inspect accessible native permission state and existing capture capabilities before asking for a grant. Prefer an already-authorized GUI provider with a supported exact-window or bounded-region API. Verify that capture runs in that provider's real GUI service. Launching its executable through SSH does not prove its app grant applies. Do not capture a full desktop and crop it afterward.
4. When no suitable authorized provider exists, prepare the exact native Settings destination and observed responsible identity, explain the grant's scope, then request only the required approval. On an SSH route, macOS can attribute capture to the SSH service, including `com.apple.sshd-keygen-wrapper` at `/usr/libexec/sshd-keygen-wrapper`. Authorizing that service covers the SSH responsibility domain, beyond one QA executable. Do not enable it silently or ask the user to re-enable an already-authorized product app. A new GUI helper needs its own attribution check before presenting it as a narrower alternative.
5. Retain the granted identity and recheck through the same transport after approval. Inspect signing evidence before blaming rebuilds. Identical builds in different temporary directories do not demonstrate an identity change. A stable driver path alone does not demonstrate separate TCC responsibility.
6. Prove capture readiness with a real narrow image of a controlled window. Open and inspect the resulting image, its dimensions and the intended content. A preflight boolean, exit zero, file existence or an isolated render is insufficient. Then capture the actual guide and Settings destination during the journey and inspect arrow direction, adjacency, occlusion, text and clutter against their observed bounds.

An existing CleanShot installation can provide a bounded capture through its [documented URL API](https://cleanshot.com/docs-api). Derive the rectangle from the current target and display bounds, use `capture-area` with explicit `x`, `y`, `width`, `height`, `display` and `action=annotate`, then export only that owned image to the private QA directory. Its coordinates start at the display's lower-left corner. Wait for any native external-control approval rather than approving it on the user's behalf. Keep the user's clipboard and image format, restore any changed save location, and close only the annotation created for QA. This GUI-provider route is separate from the native driver's own capture permission. Confirm the exported pixels before using it for the real journey.

Use the available image-viewing tool to inspect current captures and record the visual verdict beside the tested candidate and image fingerprints. Do not hand image review to the user or call UI acceptance complete while those images remain uninspected. Unattended SDK checks and functional CI stay separately labelled. Missing capture or review blocks UI acceptance until repaired.

## Build and freeze

Build once into a private scratch directory. Keep this exact helper binary after granting the automation harness access. Recompiling it can change its permission identity.

```sh
node <plugin-root>/scripts/macos.mjs build --output /private/tmp/qa-native/driver
node <plugin-root>/scripts/macos.mjs freeze --driver /private/tmp/qa-native/driver --contract .agents/qa/macos.json --source-sha256 <project-source-manifest-sha256> --output /private/tmp/qa-native/frozen.json
```

Create the output directory first with mode 700. The project build owner produces and rechecks a source-file hash manifest covering the actual candidate, including uncommitted changes. `freeze` records its SHA256 alongside the installed executable SHA256, code-directory hash, driver SHA256 and driver-source SHA256. The driver verifies the bundle's strict signature and executable on every window operation. It does not infer build provenance from a supplied source digest. Project acceptance must independently compare its source manifest before and after the run. Keep the exact app bundle, its registration and the driver unchanged through consent and quiet restart.

Example project contract, using public sample identifiers only:

```json
{
  "appPath": "/Applications/Example.app",
  "bundleID": "com.example.recorder",
  "targets": {
    "guide": {
      "bundleID": "com.example.recorder",
      "window": {"role": "AXWindow", "descendantIdentifier": "permission-guide"},
      "element": {"role": "AXImage", "identifier": "permission-app-file"}
    },
    "permissionList": {
      "bundleID": "com.apple.systempreferences",
      "window": {"role": "AXWindow", "title": "Accessibility"},
      "element": {"role": "AXList", "path": [0, 1, 2]}
    }
  }
}
```

These are illustrative selectors, not macOS defaults. Resolve current exact window titles, element roles and identifiers from the frozen project and the specific native pane. `inspect` returns roles, identifiers, structural paths and bounds within one selected window, without titles or text values. A structural path is relative to that window and must retain its expected role. Recheck it on the current OS and locale. An element selector may also match an exact accessible `description` or string `value`, such as the known app label, without exporting that value. Add exact row and navigation selectors in the project, rather than reusing a coordinate or selecting the first scroll area.

Window selectors require an identifier or exact title. An app-owned borderless window may instead use `descendantIdentifier` to match one exact descendant accessibility identifier, such as its content `AXGroup`, together with the window role. The window itself does not count as a descendant. Duplicate identifiers within a matching window or matches in multiple windows block the request. Other supplied window fields must still match exactly. This selector is only for windows of the frozen app, never System Settings or element selectors. Zero or multiple matches block an action. A `snapshot` returns zero matches when the window or element is absent, so the project can assert guide dismissal.

Store the `freeze` result under `contract.frozen` in a private run copy of the contract. Never replace its fingerprints mid-run. App-owned status and saved-state checks remain project code and must contain no tokens, names, account addresses or raw workspace URLs. Hash the specific saved selection values and report only fingerprints and non-sensitive booleans.

## API and input scope

```js
const mac = await qa.macos({
  driver: process.env.QA_MACOS_DRIVER,
  contract: runContract,
  mode: 'manual-live',
})
const before = await mac.call('snapshot', {target: 'appRow'})
qa.assert.equal(before.matches, 0)
await mac.call('drag', {source: 'guide', target: 'permissionList'})
// The project waits for the exact enabled row, app-owned trust and guide dismissal.
```

| Operation | Params and result |
| --- | --- |
| `identity` | No params. Strict signed-bundle identity, without GUI access |
| `preflight` | No params. `guiUnlocked`, `harnessAXTrusted`, `harnessScreenCaptureAuthorized`. These are harness facts, never app-owned trust |
| `snapshot` | `{target}`. Match count and frames, enabled, selected and numeric values. No text content |
| `inspect` | `{target}`. Scoped roles, identifiers, paths and frames to resolve project selectors |
| `capture` | `{target, output}`. One visible contract window, at most 1000 by 1000 points, to a new private PNG. No full desktop capture |
| `click` | `{target}`. Actual CGEvent mouse click. Destination must already be frontmost |
| `press` | `{target}`. AXPress. Keep this distinct from real pointer navigation |
| `drag` | `{source, target}`. CGEvent drag from the frozen app to an exact list. Checks the current drag pasteboard contains only that app file URL, the destination stays frontmost, and the source stays visible. Returns dispatch metadata with `acceptanceVerified: false` |
| `move` | `{target, x, y}`. Move the selected window within any active display |
| `resize` | `{target, width, height}`. Request a window size within an active display. Project checks the actual size, since OS constraints can differ |
| `hide`, `close` | `{target}`. Hide the selected app or close the exact selected window |

`call` re-resolves exact selectors with bounded AX messaging and traversal on every request. The default timeout is 10 seconds, configurable from 2 to 30 seconds. Modal dialogs block automation and remain for the user. A native drag always releases its mouse button on an in-process failure. A process killed by its outer deadline cannot run cleanup, so leave enough time for the native deadline to return and verify input state after any forced termination.

`observe` is the default and permits only observations. `fixture` permits input only inside one `com.example` app bundle in a temporary directory and cannot target System Settings. `manual-live` permits actions on the frozen app and System Settings only, after explicit authorization for that installed-app/grant scope. It does not authorize installs, grant removal, sign-in ACL changes or native consent on the user's behalf. Apple system apps cannot be the app under test. Keychain Access and unrelated apps are outside the target scope. Never use direct TCC writes, `tccutil reset`, all-applications Keychain access, full desktop screenshots or secret exports. A prior approval rejection remains binding and must not be retried through a different input route.

CLI calls share the API:

```sh
node <plugin-root>/scripts/macos.mjs call preflight --driver /private/tmp/qa-native/driver --contract /private/tmp/qa-native/run.json
node <plugin-root>/scripts/macos.mjs call snapshot --driver /private/tmp/qa-native/driver --contract /private/tmp/qa-native/run.json --params '{"target":"guide"}'
```

Replies use protocol 1 and `status: ok|blocked|error`. CLI exit 0 means the operation returned, 2 means a missing prerequisite, and 1 means failure. Dispatch is never an outcome assertion. `qa.macos` turns native blocked replies into `qa.Blocked`. A project must assert preflight readiness itself and throw `qa.Blocked` when GUI, harness AX or required Screen Capture access is missing. An app's own AX trust and Screen Capture authorization come from its own status API, never from the driver's preflight.

## Live acceptance owned by each project

1. Record source, installed bundle, driver and signature fingerprints, OS, displays and the app's own permission state. Confirm a quiet idle app and the exact selected workspace. Obtain explicit manual-live scope before installation or real grant changes. Preserve existing grants if absence cannot be arranged within that scope. Report that absence-to-grant case blocked rather than resetting the user's permissions.
2. Start with no guide and no target pane. Use the app's real Connect entry. Sample the ordered appearance with bounded polling. The guide must anchor only after the correct actual target exists. Verify the guide does not obscure the exact destination list and collect a narrow live window capture when visual quality is part of the claim.
3. Navigate to another pane using `click` on an exact native navigation selector. Assert the guide hides there. AXPress, opening a URL and isolated rendering do not exercise the same lifecycle. Return and verify the correct pane, then move, resize and move to a second display when available. Assert actual guide bounds and anchor direction after each change. Hide the destination, switch foreground apps and close the owned target window. Verify guide hide and resume behavior through the product's own UI path.
4. For a real Accessibility drop, prove the exact row absent first. Verify the app source offers only a copy operation, then drag the current installed `.app` URL from its app-owned guide into the exact list. Keep Settings frontmost and the source visible during the gesture. Then observe the enabled row, app-owned AX trust becoming true and guide disappearance. A stale display name needs an independently proven identity, never a guessed row match. Delivered events, a changed pasteboard and a successful handshake alone do not pass this case.
5. Exercise microphone and screen-recording routes separately. First microphone consent is a native OS dialog, denied access may open Settings, and screen recording can require Quit & Reopen or Later. A custom fake prompt does not prove any of them. Verify no extra guide where the product promises none. Stop at native consent for user action. Keep app and harness permissions distinct. If live narrow capture is unavailable, visual acceptance stays blocked even when functional assertions pass.
6. Quietly restart the same frozen candidate through the project's authorized route. Wait for asynchronous sign-in to settle without re-pairing. Compare hashed saved selections and app-owned sign-in/permission state. Recheck all source and binary fingerprints. Clean up only owned windows, files and fixture processes. Never close unrelated Settings panes or revoke personal permissions as cleanup.

Report functional, live visual, OS consent and preservation coverage separately. Missing access or unavailable displays are blocked coverage. Retain the first failing observation and its exact input route. When a project bug has a previous candidate, run the owner regression against that candidate and record its expected failure before verifying the fix. Do not claim such a negative control when it was not run.

## Unattended CI

The repository's Linux job runs the QA Node suite and the Antigravity reference packaging check. Its Mac job compiles the actual driver and a disposable signed app, checks independent executable fingerprints, rejects an expired request and detects changed signed code. It never launches the fixture or an installed app, changes grants, reads personal app data or touches Keychain. This is SDK and protocol coverage only. The native identity test is explicitly skipped off macOS.

Project CI may run its existing sandboxed Swift test suite with positive test counts and no skipped tests. An isolated AppKit render or an in-app scratch drag fixture remains its own contract coverage. Real Settings drop, first OS consent, multi-display placement, installed permission recovery and quiet restart remain separately authorized live journeys. Do not turn their unavailable prerequisites into passing CI cases.
