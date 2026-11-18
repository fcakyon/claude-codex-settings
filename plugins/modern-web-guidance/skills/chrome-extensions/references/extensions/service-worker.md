# Service Worker Lifetime & State Management

## The Core Problem

Chrome terminates extension service workers after ~30 seconds of inactivity. Unlike Manifest V2
persistent background pages, you CANNOT rely on in-memory state.

## Rules

1. **Never store state in global variables** — treat every event handler as if the SW just started
2. **Use chrome.storage for all persistent state** — read on demand, write after changes
3. **Use chrome.alarms for timers** — not setTimeout/setInterval (these die with the SW)
4. **Use chrome.storage.session for ephemeral session state** — survives SW restart but not browser restart

## Storage Tier Selection

| Need | Use |
|------|-----|
| Survives browser restart, syncs across devices | `chrome.storage.sync` (8KB/item, 100KB total) |
| Survives browser restart, local only | `chrome.storage.local` (10MB default) |
| Survives SW restart only | `chrome.storage.session` (10MB default) |
| Never persisted (avoid) | Global variables ❌ |

## Pattern: State Read-on-Demand

```js
// ❌ BAD: State in memory
let count = 0;
chrome.webNavigation.onCompleted.addListener(() => {
  count++;
  chrome.action.setBadgeText({ text: String(count) });
});

// ✅ GOOD: State in storage
chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId !== 0) return; // Main frame only
  const data = await chrome.storage.local.get({ visitCount: 0 });
  data.visitCount++;
  await chrome.storage.local.set(data);
  chrome.action.setBadgeText({ text: String(data.visitCount) });
});
```

## Pattern: Alarms Instead of Timers

```js
// ❌ BAD: Timer dies when SW terminates
setInterval(() => checkForUpdates(), 60000);

// ✅ GOOD: Alarm persists
chrome.alarms.create('check-updates', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'check-updates') {
    checkForUpdates();
  }
});
```

Minimum alarm interval: 0.5 minutes.

## Pattern: One-Time Initialization

```js
// Set up defaults and context menus on install
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await chrome.storage.local.set({ settings: defaultSettings });
  }
  // Context menus must be re-created (they persist, but re-creating is idempotent)
  chrome.contextMenus.create({
    id: 'myItem',
    title: 'My Context Menu Item',
    contexts: ['selection']
  });
});
```

## Pattern: Keeping the SW Alive (When Necessary)

Occasionally you need the SW alive for a long-running operation. Use one of:

1. **chrome.offscreen** — create an offscreen document for long tasks
2. **Periodic storage writes** — each chrome.storage call resets the idle timer
3. **Active port connections** — an open port keeps the SW alive

```js
// Port-based keepalive from popup/side panel
const port = chrome.runtime.connect({ name: 'keepalive' });
// The SW stays alive as long as this port is open
```

⚠️ Do NOT abuse keepalive patterns. Chrome may enforce stricter limits in future versions.

## Pattern: Event Registration

All event listeners MUST be registered synchronously at the top level of the service worker.
Chrome replays events to a restarted SW, but only for listeners that were registered synchronously.

```js
// ✅ GOOD: Top-level registration
chrome.runtime.onMessage.addListener(handleMessage);
chrome.tabs.onUpdated.addListener(handleTabUpdate);
chrome.webNavigation.onCompleted.addListener(handleNavigation);

// ❌ BAD: Conditional or async registration
async function setup() {
  const { enabled } = await chrome.storage.local.get('enabled');
  if (enabled) {
    chrome.tabs.onUpdated.addListener(handleTabUpdate); // Too late!
  }
}
setup();
```

Instead, register all listeners and check conditions inside them:

```js
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  const { enabled } = await chrome.storage.local.get('enabled');
  if (!enabled) return;
  // Process...
});
```

## Date-Based Resets

For daily counters, store the date alongside the count:

```js
function getToday() {
  return new Date().toISOString().split('T')[0]; // "2025-01-15"
}

async function incrementDailyCount() {
  const { dailyCount = 0, countDate = '' } = await chrome.storage.local.get(['dailyCount', 'countDate']);
  const today = getToday();

  if (countDate !== today) {
    // New day — reset
    await chrome.storage.local.set({ dailyCount: 1, countDate: today });
    return 1;
  } else {
    const newCount = dailyCount + 1;
    await chrome.storage.local.set({ dailyCount: newCount });
    return newCount;
  }
}
```
