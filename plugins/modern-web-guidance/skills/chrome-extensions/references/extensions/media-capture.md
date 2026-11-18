# Media Capture (Tab & Desktop)

## Choosing the Right API

| Need | API |
|------|-----|
| Record the active tab's audio/video | `chrome.tabCapture.getMediaStreamId()` |
| Let the user choose a screen, window, or tab | `chrome.desktopCapture.chooseDesktopMedia()` |

Prefer `tabCapture` when you only need the current tab — it requires no user chooser dialog and
no `"tabs"` permission. Use `desktopCapture` only when the user must select what to capture.

## Tab Capture

### Permissions

```json
{ "permissions": ["tabCapture"] }
```

### Pattern

`chrome.tabCapture.getMediaStreamId()` runs in the **service worker** and returns a stream ID.
The actual `getUserMedia()` call must happen in an **offscreen document** (the SW cannot access
media streams directly).

```js
// service-worker.js
chrome.action.onClicked.addListener(async (tab) => {
  const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id });
  // Pass the ID to the offscreen document to call getUserMedia
  await chrome.runtime.sendMessage({ type: 'START_CAPTURE', streamId });
});

// offscreen.js
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type !== 'START_CAPTURE') return;
  (async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: msg.streamId } },
      video: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: msg.streamId } }
    });
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    // ... handle recorder events
  })();
});
```

## Desktop Capture

### Permissions

```json
{ "permissions": ["tabs", "desktopCapture"] }
```

`"tabs"` is **required** — `chooseDesktopMedia` needs a `targetTab` with its `url` field
populated, which requires the `"tabs"` permission.

### Pattern

```js
// service-worker.js
chrome.action.onClicked.addListener(async (tab) => {
  // ❌ BROKEN — no targetTab
  // chrome.desktopCapture.chooseDesktopMedia(['screen', 'window'], cb);

  // ✅ CORRECT — pass the active tab
  chrome.desktopCapture.chooseDesktopMedia(['screen', 'window', 'tab'], tab, (streamId) => {
    if (!streamId) return; // User cancelled
    // Send streamId to offscreen document for getUserMedia
    chrome.runtime.sendMessage({ type: 'START_DESKTOP_CAPTURE', streamId });
  });
});
```

## State Locking — Prevent Double-Start Errors

Both APIs fail if called while a previous capture is still active:
- `tabCapture`: `"Cannot capture a tab with an active stream"`
- `desktopCapture`: opens a second chooser dialog on top of the first

Use a state machine stored in `chrome.storage.session` (survives service worker restarts,
cleared on browser close):

```js
// State: 'idle' → 'starting' → 'recording' → 'stopping' → 'idle'
chrome.action.onClicked.addListener(async (tab) => {
  const { recordingState = 'idle' } = await chrome.storage.session.get('recordingState');

  // Ignore clicks during transitions
  if (recordingState === 'starting' || recordingState === 'stopping') return;

  if (recordingState === 'idle') {
    await chrome.storage.session.set({ recordingState: 'starting' });
    try {
      await startRecording(tab);
      await chrome.storage.session.set({ recordingState: 'recording' });
      await chrome.action.setBadgeText({ text: 'REC' });
      await chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
    } catch (err) {
      console.error('Failed to start recording:', err);
      await chrome.storage.session.set({ recordingState: 'idle' });
    }
  } else if (recordingState === 'recording') {
    await chrome.storage.session.set({ recordingState: 'stopping' });
    try { await stopRecording(); }
    finally {
      await chrome.storage.session.set({ recordingState: 'idle' });
      await chrome.action.setBadgeText({ text: '' });
    }
  }
});
```

This same pattern applies to `chrome.offscreen.createDocument` (only one offscreen document
is allowed at a time) and any other API that manages an exclusive resource.

## Saving Recordings

Offscreen documents cannot call `chrome.downloads` — send the blob back to the service worker:

```js
// offscreen.js — when recording stops
recorder.ondataavailable = (e) => chunks.push(e.data);
recorder.onstop = async () => {
  const blob = new Blob(chunks, { type: 'video/webm' });
  const url = URL.createObjectURL(blob);
  // Service worker handles the download
  await chrome.runtime.sendMessage({ type: 'SAVE_RECORDING', url });
};

// service-worker.js
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type !== 'SAVE_RECORDING') return;
  chrome.downloads.download({ url: msg.url, filename: 'recording.webm' });
});
```

See `references/extensions/message-passing.md` for the full offscreen document messaging pattern.
