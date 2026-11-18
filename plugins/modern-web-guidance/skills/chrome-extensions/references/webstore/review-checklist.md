# Pre-Publish Review Checklist

Run through this checklist before every submission to the Chrome Web Store. Each item
corresponds to a common rejection reason or publishing failure.

## Manifest & Package

- [ ] **manifest_version is 3** — Manifest V2 is no longer accepted for new submissions.
- [ ] **Version bumped** — CWS rejects uploads with a version ≤ the currently published
      version. Use semver: bump patch for fixes, minor for features, major for breaking
      changes.
- [ ] **Name matches CHROMEWEBSTORE.md** — The `name` field in manifest.json must exactly
      match what you put in the store listing.
- [ ] **Description in manifest ≤ 132 chars** — This is the short description shown in
      chrome://extensions. It should match or be close to your CWS short description.
- [ ] **No unnecessary files in ZIP** — Exclude: `.git/`, `node_modules/`, `.env`,
      `*.map`, test files, build configs, `CHROMEWEBSTORE.md` itself, `README.md`,
      `.DS_Store`, `thumbs.db`. Use a build script or `.cws-ignore`-style exclusion.
- [ ] **ZIP under 2GB** — Maximum package size. Most extensions should be under 10MB.
- [ ] **No absolute file paths** — All paths in manifest.json must be relative.

## Permissions

- [ ] **Minimum permissions** — Only request what you need. `<all_urls>` is a red flag.
      Use specific host_permissions like `*://*.example.com/*` when possible.
- [ ] **Every permission justified** — Check the Permissions Justification section in
      CHROMEWEBSTORE.md. The CWS dashboard has a field for each permission — you'll need
      to fill these in during submission.
- [ ] **activeTab preferred over tabs + <all_urls>** — If you only need access to the
      current tab when the user clicks your icon, `activeTab` is the right permission.
- [ ] **No unused permissions** — If you removed a feature that used a permission, remove
      the permission from manifest.json too. Leftover permissions cause rejection.
- [ ] **host_permissions justified** — Explain which features need access to which domains
      and why.

## Store Listing Content

- [ ] **Detailed description is specific** — Describes exactly what the extension does.
      No vague marketing language. The review team reads this.
- [ ] **Single purpose is narrow** — One sentence that clearly states the primary function.
      "Manages bookmarks into categorized folders" not "Productivity enhancement tool."
- [ ] **No misleading claims** — Don't claim features you don't have. Don't exaggerate
      performance claims.
- [ ] **No keyword stuffing** — Don't repeat keywords unnaturally in the description.
- [ ] **No trademark violations** — Don't use other companies' names, logos, or trademarks
      in your extension name, description, or screenshots unless you have authorization.
- [ ] **Contact email is valid** — The email shown on the listing must be monitored. Google
      sends important notifications (takedowns, policy changes) to this address.

## Graphics

- [ ] **Store icon**: 128×128 PNG, no transparency issues, readable at small sizes.
- [ ] **At least 1 screenshot**: 1280×800 or 640×400 pixels. Shows the extension in action.
- [ ] **Screenshots are current** — Match the current version of the extension UI. Outdated
      screenshots can trigger rejection.
- [ ] **No misleading screenshots** — Screenshots must accurately represent the extension.
- [ ] **No phone/tablet mockups** — Unless the extension actually works on those devices.
- [ ] **Small promo tile** (recommended): 440×280 PNG or JPEG. Used for featured placements.

## Privacy & Compliance

- [ ] **Data disclosure form matches reality** — The CWS data use disclosure checkboxes
      must accurately reflect what the extension code actually does. Mismatch = rejection.
- [ ] **Privacy policy URL is live** — Visit the URL yourself. Confirm it loads and
      contains an actual privacy policy, not a 404 or placeholder.
- [ ] **Privacy policy matches disclosure** — The text of the policy must be consistent
      with what you declared in the disclosure form.
- [ ] **chrome.storage.sync disclosed** — If you use `chrome.storage.sync`, data is
      transmitted to Google's servers. This counts as off-device transmission.
- [ ] **Remote code prohibition** — Extensions cannot execute remotely hosted code.
      All JS must be bundled in the extension package. No loading scripts from CDNs
      at runtime (Manifest V3 enforces this, but verify).
- [ ] **No obfuscated code** — Minification is fine. Obfuscation (intentionally making
      code unreadable) is prohibited and will cause rejection.

## Functionality

- [ ] **Extension works** — Load it unpacked in Chrome, test all features. Check the
      console for errors.
- [ ] **No crashes or blank popups** — Test popup, side panel, options page, content
      scripts. All should load without errors.
- [ ] **Works on intended sites** — If the extension targets specific websites, verify
      it works on current versions of those sites.
- [ ] **Graceful degradation** — The extension should handle edge cases (no internet,
      empty data, restricted pages like chrome:// URLs) without crashing.
- [ ] **Uninstall is clean** — No persistent side effects after the extension is removed.
- [ ] **No excessive resource use** — The extension shouldn't noticeably slow down
      browsing. Content scripts in particular should be lightweight.

## Updates (for existing extensions)

- [ ] **CHROMEWEBSTORE.md version history updated** — New entry with version, date, and
      summary of changes.
- [ ] **Last Updated date bumped** — If any user-facing changes were made.
- [ ] **Feature list in descriptions updated** — If new features were added.
- [ ] **Permissions justification updated** — If manifest.json permissions changed.
- [ ] **Screenshots refreshed** — If the UI changed significantly.
- [ ] **Privacy disclosures updated** — If data practices changed.

## Packaging Script

To create a clean ZIP for submission, use a script like:

```bash
#!/bin/bash
# package-extension.sh — Creates a clean ZIP for Chrome Web Store submission

EXTENSION_NAME="my-extension"
VERSION=$(node -p "require('./manifest.json').version")
OUTPUT="${EXTENSION_NAME}-v${VERSION}.zip"

# Remove old package
rm -f "$OUTPUT"

# Create ZIP excluding dev files
zip -r "$OUTPUT" . \
  -x ".git/*" \
  -x "node_modules/*" \
  -x ".env" \
  -x "*.map" \
  -x "tests/*" \
  -x "__tests__/*" \
  -x "*.test.*" \
  -x "*.spec.*" \
  -x ".eslintrc*" \
  -x ".prettierrc*" \
  -x "tsconfig.json" \
  -x "package.json" \
  -x "package-lock.json" \
  -x "webpack.config.*" \
  -x "vite.config.*" \
  -x "rollup.config.*" \
  -x "CHROMEWEBSTORE.md" \
  -x "README.md" \
  -x "CHANGELOG.md" \
  -x ".DS_Store" \
  -x "Thumbs.db" \
  -x "*.sh" \
  -x "store-assets/*"

echo "Packaged: $OUTPUT ($(du -h "$OUTPUT" | cut -f1))"
```

Customize the exclusion list for your project. The key principle: ship only what Chrome
needs to run the extension.
