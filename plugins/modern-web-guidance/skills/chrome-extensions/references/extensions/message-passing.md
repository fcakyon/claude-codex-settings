# Message Passing

## Basic patterns

### One-way message (fire and forget)

```js
// sender (popup, content script, etc.)
chrome.runtime.sendMessage({ type: 'LOG', data: 'hello' });

// receiver (service worker)
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'LOG') console.log(message.data);
});
```

### Request/response — IIFE + return true (most compatible)

```js
// sender
const response = await chrome.runtime.sendMessage({ type: 'GET_DATA' });
console.log(response.data);

// receiver — IIFE keeps the channel open until sendResponse is called
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_DATA') {
    (async () => {
      const data = await chrome.storage.local.get('key');
      sendResponse({ data });
    })();
    return true; // REQUIRED — tells Chrome to keep the channel open
  }
});
```

### Request/response — return a Promise (Chrome 99+)

Returning a Promise directly from the listener is now supported and cleaner than the IIFE pattern:

```js
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'GET_DATA') {
    return chrome.storage.local.get('key'); // returned promise resolves the response
  }
  // Return nothing (or undefined) for messages this listener doesn't handle
});
```

**Note:** Requires Chrome 99+, only use when minimum Chrome version is set to 99.
**Note:** Do NOT mix the two styles. If you return a Promise, do NOT also call `sendResponse` or `return true`.

## Content script ↔ service worker

```js
// content script → service worker
const result = await chrome.runtime.sendMessage({ type: 'FETCH_DATA', url: location.href });

// service worker → specific tab's content script
await chrome.tabs.sendMessage(tabId, { type: 'HIGHLIGHT', selector: '.important' });
```

## Service worker → content script (targeted)

Always check that the tab exists and the content script is injected:

```js
async function sendToContentScript(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (err) {
    // Content script not injected yet, or tab navigated away
    console.warn('Could not reach content script:', err.message);
    return null;
  }
}
```

## Long-lived connections (ports)

Use ports when you need a persistent channel (e.g., streaming data, DevTools panel):

```js
// opener (popup or content script)
const port = chrome.runtime.connect({ name: 'my-channel' });
port.postMessage({ type: 'START' });
port.onMessage.addListener((msg) => console.log('received:', msg));
port.onDisconnect.addListener(() => console.log('disconnected'));

// receiver (service worker)
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'my-channel') return;
  port.onMessage.addListener((msg) => {
    if (msg.type === 'START') {
      port.postMessage({ status: 'ok' });
    }
  });
});
```

## Common mistakes

### Missing `return true` causes response to never arrive

```js
// ❌ BROKEN — async work completes but channel is already closed
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  fetchSomething().then(data => sendResponse(data)); // too late
  // missing: return true
});

// ✅ CORRECT
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  fetchSomething().then(data => sendResponse(data));
  return true;
});
```

### Sending to a tab before the content script is ready

Content scripts are injected after the page loads. If the service worker sends a message immediately on `tabs.onUpdated`, the content script may not be listening yet. Use a handshake or retry:

```js
// content script — announce it's ready
chrome.runtime.sendMessage({ type: 'CONTENT_READY' });

// service worker — wait for CONTENT_READY before sending
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === 'CONTENT_READY' && sender.tab) {
    chrome.tabs.sendMessage(sender.tab.id, { type: 'INIT_DATA', ... });
  }
});
```

### Multiple listeners responding

Only one listener should respond to a given message type. If multiple listeners call `sendResponse`, only the first one wins and the rest are silently ignored.
