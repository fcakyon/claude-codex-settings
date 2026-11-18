# Store Listing Tips & Common Rejections

## Writing Effective Descriptions

### Short Description (132 chars max)

This appears in search results and category pages. It's your elevator pitch. Rules:

- Start with a verb or the extension's function: "Blocks ads on all websites" not "Ad blocker"
- Be specific: "Translates selected text into 50+ languages" not "Translation tool"
- Include the primary keyword naturally
- Don't waste characters on "Chrome extension" — the user already knows

**Good examples:**
- "Save articles to read later with one click. Works offline."
- "Replace new tab with a minimal dashboard showing weather and tasks"
- "Highlight and annotate text on any webpage. Export notes as Markdown."

**Bad examples:**
- "The best productivity tool for Chrome!" (vague, marketing-speak)
- "Extension for helping you do things better" (says nothing)
- "NEW! Amazing tab manager extension tool app for Chrome browser" (keyword stuffing)

### Detailed Description (16,000 chars max)

The CWS strips all markdown formatting. Use plain text with line breaks. Structure:

```
[One sentence: what does this extension do?]

FEATURES
• Feature 1 — brief explanation
• Feature 2 — brief explanation
• Feature 3 — brief explanation

HOW TO USE
1. Click the extension icon in the toolbar
2. [Next step]
3. [Next step]

PRIVACY
This extension does not collect any personal data. Your [data type] is stored
locally on your device and never transmitted to any server.

PERMISSIONS
• "Read and change data on sites you visit" — needed to [specific feature].
  The extension only activates when you [trigger action].

SUPPORT
Found a bug? Have a suggestion? Email [email] or open an issue at [URL].

Version [X.Y.Z] — [Brief changelog for latest version]
```

### The Implementation-Detail Rule

**Never describe how the extension is built.** Potential users are not developers evaluating your stack — they want to know what the extension does for them.

Strip all of the following from every piece of copy:

- Web API names: `MutationObserver`, `IntersectionObserver`, `Service Worker`, `Shadow DOM`, `IndexedDB`, `WebSockets`
- Chrome API names: `chrome.storage`, `declarativeNetRequest`, `chrome.scripting`, `offscreen document`
- Framework/library names: React, custom elements, Lit, Webpack, TypeScript
- Architecture descriptions: "background processing", "event-driven", "declarative"

**Transform every implementation sentence into a user benefit:**

| Before (implementation) | After (user benefit) |
|-------------------------|----------------------|
| "Uses a MutationObserver to detect page changes" | "Automatically detects new content as you browse" |
| "Built with custom elements and Shadow DOM" | "Works seamlessly without affecting page styles" |
| "Powered by a service worker" | "Runs quietly in the background" |
| "Your settings are synced via chrome.storage.sync" | "Your settings sync across all your devices" |
| "Implements declarativeNetRequest for filtering" | "Blocks ads and trackers without reading your page content" |

### Why This Structure Works

1. **One-sentence opener** — The reviewer and users both scan the first line. Make it count.
2. **Features list** — Users scan for capabilities. Plain-text bullets (•) render well.
3. **How to use** — Reduces support requests and proves the extension actually works.
4. **Privacy section** — Pre-empts user concerns about permissions. Builds trust.
5. **Permissions explanation** — Users see permission warnings during install. If you
   explain them in the description, they're less likely to abort installation.
6. **Support info** — Required by CWS policy ("meaningful customer support").
7. **Latest version note** — Shows the extension is actively maintained.

### Single Purpose Statement

This is filled in the developer dashboard, not shown to users. The review team reads it
carefully. It must be a single sentence that describes the extension's narrow purpose.

**Approved examples:**
- "Saves highlighted text from web pages to a local reading list"
- "Replaces the new tab page with a customizable dashboard"
- "Blocks cookie consent banners on websites"

**Rejected examples:**
- "Improves your browsing experience" (too vague)
- "Productivity and organization tool" (too broad)
- "Highlights text, saves bookmarks, manages tabs, and blocks ads" (not single purpose)

If your extension does multiple things, focus on the primary function. The detailed
description can cover secondary features.

## Common Rejection Reasons

### 1. Excessive Permissions

**Symptom:** "Your extension requests more permissions than it needs."

**Fix:**
- Replace `<all_urls>` with specific host patterns
- Replace `tabs` with `activeTab` if you only need the current tab on click
- Remove permissions you're not using
- Ensure every permission has a clear justification

### 2. Missing or Inadequate Single Purpose

**Symptom:** "Your item does not have a single, clear purpose."

**Fix:**
- Rewrite the single purpose field to be narrow and specific
- If the extension truly does too many unrelated things, consider splitting it

### 3. Misleading Description or Functionality

**Symptom:** "Your extension does not provide the functionality described."

**Fix:**
- Ensure every feature listed in the description actually works
- Remove claims about features you haven't built yet
- Don't use superlatives ("the best", "the fastest") unless verifiable

### 4. Privacy Policy Issues

**Symptom:** "Your extension requires a privacy policy." or "Your privacy policy URL
is not accessible."

**Fix:**
- Host the privacy policy at a stable, public URL
- Ensure it's not behind a login wall
- Make sure it covers all data the extension actually collects
- Match the privacy policy with the data disclosure form

### 5. Trademark Violation

**Symptom:** "Your extension uses trademarked content without authorization."

**Fix:**
- Don't use other companies' names in your extension name (e.g., "YouTube Downloader")
- Don't use logos or brand colors that imply affiliation
- Use generic terms: "Video Downloader for [site]" might be fine, but check the site's terms

### 6. Code Readability

**Symptom:** "Your extension contains obfuscated code."

**Fix:**
- Minification is allowed; obfuscation is not
- If using a bundler (webpack, rollup, vite), ensure source maps are NOT included but
  the output is minified, not obfuscated
- Don't use string encoding tricks to hide code intent

### 7. Remote Code Execution

**Symptom:** "Your extension executes remotely hosted code."

**Fix:**
- Bundle all JavaScript in the extension package
- Don't load scripts from CDNs at runtime
- Don't use `eval()` or `new Function()` with remote content
- Fetching JSON data from APIs is fine; fetching and executing JS is not

### 8. User Data Disclosure Mismatch

**Symptom:** "Your extension's data usage does not match your disclosure."

**Fix:**
- Audit every `fetch()`, `XMLHttpRequest`, and `chrome.storage.sync` call
- Remember that `chrome.storage.sync` transmits data to Google's servers
- If you use any analytics library (even self-hosted), declare it
- If you log errors to an external service, declare it

## After Rejection

When an extension is rejected:

1. Read the rejection email carefully — it specifies which policy was violated
2. Update CHROMEWEBSTORE.md with the rejection reason and fix
3. Make the required changes to the extension code or listing
4. Re-verify against the pre-publish checklist
5. Resubmit through the developer dashboard
6. Note: Repeated policy violations can result in account suspension

## Review Timeline

- First submission: typically 1–3 business days, can be longer
- Updates to existing extensions: usually faster, often within 24 hours
- Expedited review: not officially available; maintaining a clean track record helps
- Deferred publishing: you can choose to publish manually after review passes,
  giving you control over timing. Must publish within 30 days of approval.
