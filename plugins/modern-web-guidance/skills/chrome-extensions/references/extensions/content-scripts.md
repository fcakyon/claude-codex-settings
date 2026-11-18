# Content Scripts & DOM Manipulation

## Two Ways to Inject

### 1. Static (manifest declaration)
```json
{
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content/content.js"],
    "css": ["content/content.css"],
    "run_at": "document_idle"
  }]
}
```

### 2. Programmatic (from service worker or popup)
```js
// Requires "scripting" permission and host access
chrome.scripting.executeScript({
  target: { tabId: tabId },
  files: ['content/content.js']
});

// Or inject a function directly
chrome.scripting.executeScript({
  target: { tabId: tabId },
  func: (param) => {
    document.body.style.backgroundColor = param;
  },
  args: ['yellow']
});
```

Use `activeTab` permission for on-click injection (no host_permissions needed):
```json
{
  "permissions": ["activeTab", "scripting"]
}
```

## Isolated World

Content scripts run in an isolated world:
- They share the DOM with the page but NOT JavaScript variables
- They can access chrome.runtime messaging APIs
- The page's CSP does NOT restrict content script code
- `window` refers to the content script's isolated world

## Message Passing from Content Scripts

```js
// content.js → service worker
chrome.runtime.sendMessage({ type: 'DATA', payload: data }, (response) => {
  console.log('Got response:', response);
});

// service worker → content script in a specific tab
chrome.tabs.sendMessage(tabId, { type: 'UPDATE', data: newData });

// content.js: listen for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_CONTENT') {
    const text = document.body.innerText;
    sendResponse({ text });
  }
  return true; // Keep channel open for async sendResponse
});
```

## DOM Manipulation Best Practices

- **Avoid blocking the main thread** when modifying many DOM elements. Use `requestAnimationFrame`
  to batch visual updates and `scheduler.yield()` to break up long-running tasks:

```js
// ❌ BAD: Blocks the main thread while processing hundreds of elements
const emails = document.body.innerText.match(/[\w.+-]+@[\w-]+\.[\w.]+/g);
emails.forEach(email => {
  // ... find and highlight each email (can freeze the page)
});

// ✅ GOOD: Process in batches using requestAnimationFrame
async function highlightEmails(elements) {
  const BATCH_SIZE = 20;
  for (let i = 0; i < elements.length; i += BATCH_SIZE) {
    const batch = elements.slice(i, i + BATCH_SIZE);
    await new Promise(resolve => requestAnimationFrame(() => {
      batch.forEach(el => el.style.backgroundColor = 'yellow');
      resolve();
    }));
    // Yield to the main thread between batches
    if (typeof scheduler !== 'undefined' && scheduler.yield) {
      await scheduler.yield();
    }
  }
}
```

- Use `MutationObserver` for dynamic pages (SPAs, infinite scroll)
- Namespace your CSS classes to avoid conflicts (e.g., `myext-highlight`)
- Use Shadow DOM for complex UI injected into pages
- Clean up on removal: `chrome.runtime.onMessage` listeners persist until the content script context is destroyed
- Use `TreeWalker` or `document.createNodeIterator` instead of regex on `innerHTML` for finding text in the DOM — this is more reliable and doesn't break event listeners

## `run_at` Timing

| Value | When |
|-------|------|
| `document_start` | Before DOM is constructed (useful for blocking) |
| `document_idle` | After DOM is ready but before all resources load (default, recommended) |
| `document_end` | After DOM is complete but before images/subframes |
