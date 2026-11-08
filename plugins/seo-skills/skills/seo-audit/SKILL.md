---
name: seo-audit
description: "Use when reviewing a page or site for organic search, or diagnosing why something isn't ranking: crawl and index signals, on-page elements, content quality, and how to order the fixes."
license: MIT
---

# SEO audit

Audit in priority order, because the layers depend on each other. A page that can't be indexed doesn't benefit from a better title.

1. Can it be found and indexed? Robots rules, canonical tags, noindex, redirect chains.
2. Is the foundation sound? HTTPS, mobile rendering, speed, URL structure.
3. Is the page optimized? Title, meta description, headings, keyword alignment, internal links, images.
4. Does it deserve to rank? Depth, first-hand experience, sourcing, whether it beats what already ranks.
5. Does it have credibility? Who links to it, who cites it.

Work down the list and stop where the evidence stops. Most asks are answered at layers 3 and 4.

## What a fetch can and can't tell you

`web_fetch` returns the server's HTML as text. Everything you report as observed has to come from that, from a source you read, or from the caller.

Readable from a fetch: title tag, meta description, heading order and text, body copy, visible links and their anchor text, canonical tag, `robots` meta, `hreflang` in the HTML head, server-rendered JSON-LD, `robots.txt` and `sitemap.xml` when you fetch them directly.

Not readable, so not yours to assert: anything JavaScript injects after load, Core Web Vitals and any speed measurement, whether Google has actually indexed a URL, rank position, search volume, traffic, backlink counts, and whole-site facts like orphan pages or crawl budget that need evidence beyond a single fetch or bounded sample.

The trap worth naming: CMS SEO plugins commonly inject JSON-LD client side, so a fetch shows no schema on a page that has plenty. Never conclude "no schema" from a fetch. Report that the server HTML carried none, and send them to the Rich Results Test at https://search.google.com/test/rich-results, which renders JavaScript.

For a check you can't run, name the check and the tool rather than skipping it silently. Search Console covers index coverage and queries; PageSpeed Insights covers Core Web Vitals; a crawler like Screaming Frog covers site-wide structure.

## Diagnosing a page that isn't ranking

Work outward from the page before reaching for site-wide theories.

- Does the page target one query, and do the title, H1, URL, and opening paragraph agree on which one? Disagreement here explains more ranking problems than anything technical.
- Is another page on the site competing for the same query? Two mediocre pages on one keyword lose to one good one, and the fix is usually to merge them and redirect.
- Is the intent right? A product page will not rank for a question query however well optimized it is.
- Is it thinner than what ranks? Compare against the pages currently ranking rather than against a word count.
- Did something change? A migration, a redesign, or a template change dated near the drop is the first thing to check, and a drop that starts on a single date usually has a single cause.

## Run the technical audit

Use the bundled scripts before judging the page. They work from HTTP responses and HTML, independent of the app’s framework. From this skill directory, use Node.js 22 or newer:

```sh
npm ci --prefix scripts --ignore-scripts
node scripts/audit.mjs https://example.com --json
```

The audit reuses `check_head.mjs` for the entry page’s metadata, crawler responses, share images, icons, and unknown-path probe. It also checks robots.txt, XML sitemap indexes, XML, gzip-compressed XML, or text sitemaps, internal links, canonical targets, locale return links, duplicate titles/descriptions, missing alt attributes, and JSON-LD syntax across discovered pages. HTML and HTTP Link headers both supply canonical and locale annotations. XML sitemap locale annotations are checked too.

The crawl stays on the final entry origin, respects Googlebot’s robots rules for discovered pages, and checks at most 20 page URLs and 10 sitemaps. Use `--max-pages 100` to expand it, up to 500. Each crawl response has a 5 MiB budget and a 10-second timeout. The existing entry-page probes have their own request budgets. Cross-origin targets, unsupported feeds, request challenges, and crawl limits are reported as unchecked. A bounded crawl cannot prove that the whole site is free of errors or has no orphan pages.

The entry page is expected to be public and indexable. For an intentionally private entry page, add `--expect-noindex`. Discovered pages are not assumed to need indexing, but sitemap entries are expected to be indexable canonical URLs. Never remove deliberate privacy or training restrictions to satisfy an audit.

Read `findings`, `coverage`, and `pages` together. `coverage.crawlComplete` refers only to discovered URLs, not to rendered pages or every URL the site might have:

- `fail`: observed technical failures, such as a broken referenced URL or a noindex sitemap entry
- `review`: recommendations and context-dependent findings, such as duplicate titles or limited snippets
- `unchecked`: missing evidence, blocked requests, or work beyond the crawl budget
- `pass`: the stated check passed or a policy value was observed, not proof of indexing or ranking

Exit 1 means confirmed failures, exit 2 means invalid invocation or a run error, and exit 0 means no confirmed failures. Exit 0 does not mean all checks ran. `rulesCheckedOn` records when the cited guidance was reviewed, not a live certification against every Google update.

For a single URL without installing the crawl parsers, use `node scripts/check_head.mjs <url> --json`. For optional llms.txt work, use `node scripts/check_llms_txt.mjs <site-url>`. A missing llms.txt is not a Google SEO failure. For local JSON-LD checks, the schema skill supplies `scripts/validate_schema.mjs`. Its field map is a checklist, not proof of rich-result eligibility.

## Interpret evidence the scripts cannot settle

A server-HTML warning is not a rendered-page finding. For client-rendered pages, inspect the browser DOM with available browser tooling before concluding that a title, heading, link, or structured data is missing. Compare raw and rendered evidence without pretending a browser render is Google’s indexing result. Measure performance with Lighthouse or PageSpeed Insights and distinguish lab measurements from field Core Web Vitals. Use Search Console for actual index coverage, selected canonicals, snippets, and search performance.

Google’s [generative AI guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) uses the same SEO foundations. It does not require llms.txt, special AI markup, fixed content lengths, or a special writing style. Review Googlebot access and index/snippet controls. The script reports AI-search and training crawler policies separately. Blocking a training crawler is not a search failure, and a spoofed user-agent request cannot prove whether a verified crawler is allowed through a firewall. Content quality, intent, expertise, and factual accuracy still need editorial judgment. Do not produce an invented SEO or AI-readiness score.

Open the actual share images at feed and phone preview sizes. Flag redundant printed web addresses, subtitles that repeat the headline, and unreadable text. Suggest deleting redundant copy before enlarging the main message or product visual and rebalancing spacing. When creating or revising a card, omit redundant URLs and small subtitles by default. Keep useful context, standalone-sharing needs, explicit user choices, and recognizable branding. This is visual clarity advice, not a crawler requirement or ranking fix. Mark it unverified when you cannot inspect the image.

After a change, rerun the affected checks. Submit sitemaps or start Search Console validation only when the task authorizes that action and evidence supports it. A redirect or an alternate page with a valid canonical is not automatically an error. Never claim freshness of a sitemap’s lastmod dates without evidence of actual content changes.

## References

- `references/audit-checklist.md`: the per-area checks, each marked with whether a fetch can verify it.
- `references/international-seo.md`: hreflang, canonical interaction, and locale URL structure for multi-language sites, with the errors that silently void a whole cluster.

## Reporting

Give each finding the problem, why it matters for search, the evidence, the fix, and its rank against the others. Open with the few things worth doing first, and close with what you couldn't check and what it would take. Group by layer, not by page, so someone can fix a class of problem once.
