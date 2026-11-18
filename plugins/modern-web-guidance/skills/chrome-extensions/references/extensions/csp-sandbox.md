# CSP & Sandboxed Code Execution

## Extension CSP Restrictions

Chrome Extensions enforce a strict Content Security Policy that cannot be relaxed for extension
pages (popup, side panel, options, new tab, etc.).

Blocked by default:
- `eval()`, `new Function()`, `setTimeout("string")`
- Inline `<script>` tags
- Inline event handlers (`onclick="..."`, `onload="..."`, etc.)
- `javascript:` URLs

## HTML Best Practices

```html
<!-- ❌ BAD: Inline script -->
<script>
  document.getElementById('btn').onclick = () => alert('hi');
</script>

<!-- ❌ BAD: Inline event handler -->
<button onclick="doThing()">Click</button>

<!-- ✅ GOOD: External script file -->
<script src="popup.js"></script>
```

In `popup.js`:
```js
document.getElementById('btn').addEventListener('click', () => {
  // Handle click
});
```

## Executing User Code (Code Playground Pattern)

If you need to execute arbitrary code (e.g., a CodePen-like playground), you MUST use one of these
approaches. **Extension CSP completely blocks `eval()`, `new Function()`, and inline scripts in
normal extension pages.** There is no way around this — you need sandboxing.

### Option 1: Sandboxed Page in Manifest (Recommended)

Declare a sandboxed page in manifest.json. Sandboxed pages have a relaxed CSP that allows
`eval()` and inline scripts, but they cannot access chrome.* APIs.

```json
{
  "sandbox": {
    "pages": ["sandbox.html"]
  }
}
```

Use an iframe in your extension page to embed the sandbox:

```html
<!-- playground.html (extension page) -->
<iframe id="preview" src="sandbox.html"></iframe>
```

**CRITICAL:** Communication between the extension page and the sandboxed iframe MUST use
`postMessage`. You CANNOT access `iframe.contentDocument` or `iframe.contentWindow.document`
directly — this will throw:

```
SecurityError: Blocked a frame with origin "chrome-extension://..." from accessing a cross-origin frame.
```

Correct pattern:

```js
// playground.js — send code to sandbox
const iframe = document.getElementById('preview');
iframe.contentWindow.postMessage({
  html: htmlCode,
  css: cssCode,
  js: jsCode
}, '*');

// sandbox.js — receive and execute
window.addEventListener('message', (event) => {
  const { html, css, js } = event.data;
  // Clear previous content
  document.body.innerHTML = '';
  document.head.querySelectorAll('style.user-style').forEach(s => s.remove());

  // Apply HTML
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);

  // Apply CSS
  const style = document.createElement('style');
  style.className = 'user-style';
  style.textContent = css;
  document.head.appendChild(style);

  // Execute JS (eval is allowed in sandbox!)
  try {
    eval(js);
  } catch (e) {
    const errEl = document.createElement('pre');
    errEl.style.color = 'red';
    errEl.textContent = e.message;
    document.body.appendChild(errEl);
  }
});
```

### Option 2: Blob URL in iframe

Create a self-contained HTML document via blob URL:

```js
function updatePreview(htmlCode, cssCode, jsCode) {
  const html = `
<!DOCTYPE html>
<html>
<head><style>${cssCode}</style></head>
<body>
  ${htmlCode}
  <script>${jsCode}<\/script>
</body>
</html>
`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const iframe = document.getElementById('preview');
  // Revoke previous URL
  if (iframe.dataset.blobUrl) URL.revokeObjectURL(iframe.dataset.blobUrl);
  iframe.dataset.blobUrl = url;
  iframe.src = url;
}
```

### Option 3: srcdoc Attribute

```js
const iframe = document.getElementById('preview');
iframe.srcdoc = `
  <!DOCTYPE html>
  <style>${cssCode}</style>
  ${htmlCode}
  <script>${jsCode}<\/script>
`;
```

Both blob URLs and srcdoc create a separate origin, so they bypass the extension's CSP.
However, they also cannot access chrome.* APIs, and you cannot access their DOM directly
from the extension page (same cross-origin restriction as sandbox).

### What NOT to Do

```js
// ❌ WILL FAIL: Trying to set iframe content directly
iframe.contentDocument.open();
iframe.contentDocument.write(html);
iframe.contentDocument.close();

// ❌ WILL FAIL: Accessing cross-origin sandbox DOM
const doc = iframe.contentWindow.document;
doc.body.innerHTML = html;

// ❌ WILL FAIL: eval in a normal extension page
eval(userCode); // CSP blocks this
```

## CSP for Remote Resources

Extension pages cannot load remote scripts by default. If you need external libraries:

1. **Bundle them** — download and include in your extension
2. **Use chrome.scripting to inject into web pages** — web pages have their own CSP

For content scripts injected into web pages, the web page's CSP does NOT apply to the
content script's own code. Content scripts run in an isolated world.
