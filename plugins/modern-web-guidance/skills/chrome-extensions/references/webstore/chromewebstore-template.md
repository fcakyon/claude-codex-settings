# CHROMEWEBSTORE.md Template

Copy this template into the project root as `CHROMEWEBSTORE.md` and fill in each section.
Fields marked `[REQUIRED]` must be completed before submission. Fields marked `[RECOMMENDED]`
are optional but improve listing quality and approval odds.

---

```markdown
# Chrome Web Store Listing — [Extension Name]

> Last Updated: YYYY-MM-DD

## Store Listing

**Extension Name** [REQUIRED]
<!-- Must match manifest.json "name". Max 75 characters. -->


**Short Description** [REQUIRED]
<!-- Max 132 characters. Shown in search results and tiles. Be specific about function. -->


**Detailed Description** [REQUIRED]
<!-- Max 16,000 characters. Structure recommendation:
     Line 1: One-sentence summary of what the extension does
     Paragraph 2: Key features (use line breaks, not bullet points — CWS strips markdown)
     Paragraph 3: How to use it (step-by-step)
     Paragraph 4: Privacy/permissions note (builds trust)
     Paragraph 5: Support/feedback info

     WRITE FROM A USER'S PERSPECTIVE — what the extension does FOR them, not HOW it works.
     Never mention implementation details: APIs used, libraries, frameworks, code patterns.

     ❌ "Uses a MutationObserver and custom elements to track page changes"
     ✅ "Automatically detects new content as you scroll"

     ❌ "Powered by a service worker for background processing"
     ✅ "Runs quietly in the background without slowing your browser"

     ❌ "Implements declarativeNetRequest for network filtering"
     ✅ "Blocks ads and trackers without reading your page content"
-->


**Category** [REQUIRED]
<!-- Pick one: Accessibility, Blogging, Developer Tools, Fun, News & Weather,
     Photos, Productivity, Search Tools, Shopping, Social & Communication, Sports -->


**Single Purpose** [REQUIRED]
<!-- One sentence. Narrow and easy to understand.
     Good: "Highlights and saves text selections on web pages"
     Bad:  "Productivity tool that helps you work better" -->


**Primary Language** [REQUIRED]
<!-- e.g., English, German, etc. -->


## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon [REQUIRED] | 128×128 PNG | ⬜ Not created | |
| Screenshot 1 [REQUIRED] | 1280×800 or 640×400 | ⬜ Not created | |
| Screenshot 2 [RECOMMENDED] | 1280×800 or 640×400 | ⬜ Not created | |
| Screenshot 3 [RECOMMENDED] | 1280×800 or 640×400 | ⬜ Not created | |
| Screenshot 4 | 1280×800 or 640×400 | ⬜ Not created | |
| Screenshot 5 | 1280×800 or 640×400 | ⬜ Not created | |
| Small Promo Tile [RECOMMENDED] | 440×280 | ⬜ Not created | |
| Marquee Promo Tile | 1400×560 | ⬜ Not created | |

<!-- Status options: ⬜ Not created | 🟡 Needs update | ✅ Ready -->

### Screenshot Notes
<!-- Describe what each screenshot should show. Good screenshots demonstrate the extension
     in action, not just the popup. Include annotations if helpful. -->


## Permissions Justification

<!-- Every permission in manifest.json needs a justification. The review team reads these.
     Be specific about WHY the permission is needed and WHAT user-facing feature uses it.
     "Required for functionality" will be rejected. -->

| Permission | Type | Justification |
|------------|------|---------------|
| | permissions | |
| | host_permissions | |

<!-- Type is either "permissions" or "host_permissions" -->


## Privacy & Data Use

<!-- These map to the CWS data use disclosure form. Be exhaustive and accurate —
     mismatches between what you declare and what the code does cause rejection. -->

### Data Collection

**Does the extension collect user data?** Yes / No

<!-- If Yes, fill in the table below. If No, skip to the certification. -->

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|-----------|-----------|------------------------|---------|---------------------------|
| Personally identifiable info | | | | |
| Health info | | | | |
| Financial info | | | | |
| Authentication info | | | | |
| Personal communications | | | | |
| Location | | | | |
| Web history | | | | |
| User activity | | | | |
| Website content | | | | |

### Data Use Certification
<!-- Check all that apply: -->
- [ ] Data is NOT sold to third parties
- [ ] Data is NOT used for purposes unrelated to the extension's core functionality
- [ ] Data is NOT used for creditworthiness or lending purposes


## Privacy Policy

**Privacy Policy URL** [REQUIRED]

<!-- Host this at a publicly accessible URL. GitHub Pages, your website, or a
     Notion page all work. See references/webstore/privacy-policy.md for a template. -->


## Distribution

**Visibility**: Public / Unlisted / Private
**Regions**: All regions / [List specific regions]

## Developer Info

**Publisher Name** [REQUIRED]

**Contact Email** [REQUIRED]
<!-- Displayed publicly on the store listing. -->

**Support URL / Email** [RECOMMENDED]
<!-- Where users go for help. Can be a GitHub Issues page, email, or support site. -->

**Homepage URL** [RECOMMENDED]


## Version History

<!-- Add an entry for every version submitted to the Chrome Web Store.
     Most recent first. -->

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| | | | Draft |

<!-- Status options: Draft | Submitted | In Review | Published | Rejected -->


## Review Notes

<!-- Track rejection reasons, communication with the review team, and fixes applied.
     This section is for your records, not published to the store. -->

### Known Issues / Limitations
<!-- Document anything reviewers might flag or users should know about. -->


### Rejection History
<!-- If applicable:
| Date | Reason | Fix Applied | Resubmitted |
|------|--------|-------------|-------------|
-->

```
