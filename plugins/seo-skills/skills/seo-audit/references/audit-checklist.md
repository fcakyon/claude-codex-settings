# Audit checklist

Run `scripts/audit.mjs` from the skill first. Its HTTP checks cover the crawl, metadata, image-delivery, and link checks below within the reported limits. `fetch` means HTTP evidence can establish the fact, sometimes across several URLs. `tool` means another source of evidence is needed. Use available tools before asking for access, and mark missing evidence as unchecked. Guidance sources were reviewed on 2026-11-08.

## 1. Crawl and index

| Check | Evidence |
| --- | --- |
| `robots.txt` exists and doesn't block anything important | fetch |
| `robots.txt` references the sitemap | fetch |
| `sitemap.xml` exists, parses, and lists canonical indexable URLs only | fetch |
| Sitemap has no redirected, 404, or noindexed URLs in it | fetch |
| Page has a canonical tag, self-referencing when the page is the original | fetch |
| No `noindex` on a page that should rank | fetch |
| One canonical host (www or not, http or https) with the others redirecting | fetch |
| Trailing-slash handling is consistent | fetch |
| No redirect chains or loops on key paths | fetch |
| The URL is actually indexed | tool: Search Console |
| Indexed count matches expected count | tool: Search Console |
| Crawl budget, faceted-navigation explosion, parameter duplication | tool: crawler |
| Orphan pages across the site | tool: crawler |

The unknown-path probe reports a 200 fallback as a soft-404 candidate. Search Console is needed to confirm Google’s classification. Near-duplicate clusters need content review and a broader crawl.

## 2. Foundations

| Check | Evidence |
| --- | --- |
| HTTPS everywhere, valid certificate, no mixed content | fetch |
| Viewport meta present, layout not fixed-width | fetch |
| URLs readable, lowercase, hyphenated, no session IDs or content in query strings | fetch |
| Largest Contentful Paint under 2.5s | tool: PageSpeed Insights |
| Interaction to Next Paint under 200ms | tool: PageSpeed Insights |
| Cumulative Layout Shift under 0.1 | tool: PageSpeed Insights |
| Server response time, caching headers, CDN, font loading | tool: PageSpeed Insights or WebPageTest |

Page weight and blocking scripts are partly visible in fetched HTML: a head full of synchronous third-party scripts is worth flagging as a likely speed problem, framed as a hypothesis for them to confirm.

## 3. On-page

| Check | Target |
| --- | --- |
| Title tag | Unique per page, primary keyword near the front, descriptive and concise. Google sets no length limit and truncates the title link to fit the device width, so there is no fixed character cutoff. Brand with just the site name at the start or end after a hyphen, colon, or pipe, which Google may leave out when the result already shows it |
| Meta description | Unique, states the value and earns the click. Google sets no length limit and truncates the snippet to fit the device width. Not a ranking factor |
| H1 | Describes the page, contains the target query or its clear paraphrase |
| Heading order | Subheads read as a map of the page. Google says heading order and count do not matter for Search, so report skipped levels as an accessibility fix |
| Target query | Appears in the first 100 words, naturally, along with the phrasings a reader would actually use |
| Keyword alignment | Title, H1, URL, and opening all point at the same query |
| Cannibalization | No other page on the site targets the same query |
| Internal links | Descriptive anchor text, no "click here", important pages linked more often, no broken links |
| Images | Descriptive filenames, alt text that describes the image, compressed, modern format, lazy loaded below the fold |

Presence, syntax, targets, and exact duplicates are measurable. Relevance, alt-text quality, keyword intent, and cannibalization require interpretation. Do not turn a word count, title-length budget, or a missing raw-HTML heading into a ranking failure.

## 4. Content quality

Judge against the pages currently ranking for the query, not against a word count. Google is explicit that word count is not a ranking factor.

- Experience: does it show first-hand use, original data, or real examples, or does it read assembled from other pages?
- Expertise: is the author named and credentialed where that matters, and are claims sourced?
- Trust: is there a real business behind it, contact details, a privacy policy, and no contradiction between what the page claims and what it shows?
- Depth: does it answer the obvious follow-up question, or stop at the headline answer?
- Currency: is anything dated, superseded, or describing a product that has changed?
- Thin pages: tag and category pages with nothing unique, doorway pages, and pages that exist only to hold a keyword.

## 5. Authority

Off-page work needs a backlink tool, so treat this as scoping rather than measurement: name whether the page has any obvious reason to be linked or cited, and what asset would earn links if it doesn't. Do not estimate a domain metric you cannot read.

## Common patterns by site type

- SaaS: thin feature pages, blog disconnected from product pages, missing comparison and alternative pages, no glossary.
- Ecommerce: thin category pages, duplicated manufacturer descriptions, missing product schema, faceted navigation generating duplicates, out-of-stock pages left to rot.
- Content sites: stale posts never refreshed, several posts competing for one query, no topic clustering, weak internal linking, missing author pages.
- Local: inconsistent name, address, and phone across pages, missing LocalBusiness schema, no location pages.
- Multi-locale: see `international-seo.md`, since the failure modes there are specific and severe.

## Repair context after a script finding

- When metadata appears only in the body, inspect the framework’s streaming behavior. For Next.js, review [streamed metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#streaming-metadata) and [htmlLimitedBots](https://nextjs.org/docs/app/api-reference/config/next-config-js/htmlLimitedBots). Prerender metadata when possible. Blocking metadata for every crawler also delays responses until that work finishes.
- For missing or stale Next.js share images, inspect [metadata merging](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#merging). A child Open Graph object can replace inherited image metadata. Preserve the page URL, image URL, dimensions, type, and alt text together.
- Test an unknown content slug on generated image routes. It should return 404 rather than 500. Use the route controls supported by the deployed framework and bundler version.
- Collapse redirect chains across `http` to `https`, `www` to apex, locale prefixes, and legacy path rewrites into a single permanent hop (`301` or `308`).
- Put `noindex` and a clean path canonical on auth or login routes that accept redirect query parameters (such as `/login?returnTo=/`), and add `X-Robots-Tag: noindex` (plus `rel="nofollow"` on internal links) to linked non-HTML utility files like `/llms.txt` and `/sitemap.xml`.
- Disable Cloudflare Email Obfuscation when crawlers hit `/cdn-cgi/l/email-protection` 404s or index `[email protected]`.
- Use Search Console for sitemap submission and recrawling, and confirm declared sitemaps are registered in Search Console rather than only referenced in `robots.txt`. Do not use retired sitemap ping endpoints or repeatedly request indexing. Start validation only for an issue the change actually fixed.
- A source date in a sitemap is not evidence of a content change. Google ignores priority and changefreq, and lastmod needs to reflect a real update.

## Sources

- Google Search Central, Search Essentials: https://developers.google.com/search/docs/essentials
- Google Search Central, Creating helpful, reliable, people-first content: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google Search Central, Robots.txt introduction: https://developers.google.com/search/docs/crawling-indexing/robots/intro
- Google Search Central, Consolidate duplicate URLs: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- Google Search Central, Influencing title links: https://developers.google.com/search/docs/appearance/title-link
- Google Search Central, Control your snippets: https://developers.google.com/search/docs/appearance/snippet
- Google Search Central, SEO Starter Guide: https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- Google Search Central, Sitemaps overview: https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
- web.dev, Core Web Vitals: https://web.dev/articles/vitals
- Google Rich Results Test: https://search.google.com/test/rich-results

- Google Search Central, Generative AI guidance: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Google Search Central, Robots meta and snippet controls: https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
- OpenAI crawler roles: https://developers.openai.com/api/docs/bots
- Perplexity crawler roles: https://docs.perplexity.ai/docs/resources/perplexity-crawlers
