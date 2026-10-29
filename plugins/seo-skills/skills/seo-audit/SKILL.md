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

Not readable, so not yours to assert: anything JavaScript injects after load, Core Web Vitals and any speed measurement, whether Google has actually indexed a URL, rank position, search volume, traffic, backlink counts, and whole-site facts like orphan pages or crawl budget that need a crawl you can't run.

The trap worth naming: CMS SEO plugins commonly inject JSON-LD client side, so a fetch shows no schema on a page that has plenty. Never conclude "no schema" from a fetch. Report that the server HTML carried none, and send them to the Rich Results Test at https://search.google.com/test/rich-results, which renders JavaScript.

For a check you can't run, name the check and the tool rather than skipping it silently. Search Console covers index coverage and queries; PageSpeed Insights covers Core Web Vitals; a crawler like Screaming Frog covers site-wide structure.

## Diagnosing a page that isn't ranking

Work outward from the page before reaching for site-wide theories.

- Does the page target one query, and do the title, H1, URL, and opening paragraph agree on which one? Disagreement here explains more ranking problems than anything technical.
- Is another page on the site competing for the same query? Two mediocre pages on one keyword lose to one good one, and the fix is usually to merge them and redirect.
- Is the intent right? A product page will not rank for a question query however well optimized it is.
- Is it thinner than what ranks? Compare against the pages currently ranking rather than against a word count.
- Did something change? A migration, a redesign, or a template change dated near the drop is the first thing to check, and a drop that starts on a single date usually has a single cause.

## Checks from live audits

A cached fetch and the layers above can miss these:

- Metadata outside the head: Next.js 15.2 and later [append `generateMetadata` output to the end of `<body>`](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#streaming-metadata) for any user agent missing from its HTML-limited bot list, and Googlebot, GPTBot, ClaudeBot, and PerplexityBot are all missing from it. Next.js says Googlebot reads it after rendering, but [the major AI crawlers don't run JavaScript](https://vercel.com/blog/the-rise-of-the-ai-crawler), and a parser that reads only the head loses the title, canonical, and hreflang. Fetch a URL nobody has requested since the deploy with each crawler's user agent, because a warm data cache can resolve metadata in time and pass the check while cold renders fail. [`htmlLimitedBots: /.*/`](https://nextjs.org/docs/app/api-reference/config/next-config-js/htmlLimitedBots) in `next.config.js` makes metadata blocking for every user agent. Every response then waits for `generateMetadata` before its first byte, so keep it to the data the page already fetches.
- Sitemap fields: Google [ignores `<priority>` and `<changefreq>`](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) and uses `<lastmod>` only when it's consistently accurate, so set it from real content changes or leave it out. Pages built around images can list them as [`<image:image>` entries](https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps), up to 1,000 per URL. Images on a CDN host count when Search Console verifies that host too, which a Domain property does for every subdomain.
- Share previews: give each indexable page its own absolute `og:url` and `og:image`. Next.js [merges metadata shallowly](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#merging), so a page that sets any `openGraph` field replaces the layout's whole object and loses its url and image. Have such a page export `generateMetadata(_, parent)` and set `images: (await parent).openGraph?.images`, which keeps the hashed URL, width, height, alt, and type that a bare `images: "/opengraph-image"` drops. Without it, an inherited `og:title` also picks up the title template. Open Graph title and description default to the page's own `title` and `description`, so don't repeat them. Leave `twitter` out. Next.js then builds every Twitter tag from Open Graph and picks `summary_large_image` whenever an og image exists. A layout's `twitter` object merges the same way and leaks its title to children that set none. Add `max-image-preview:large` to the robots meta, which Google [recommends for Discover](https://developers.google.com/search/docs/appearance/google-discover).
- Open Graph image routes: a `[slug]/opengraph-image` that trusts `generateStaticParams` returns 500 for an unknown slug. `export const dynamicParams = false` in that image file returns 404 before the handler runs on Turbopack builds, though webpack drops it before Next.js 16.3.8. Don't set it on a page rendered per request, where `next start` ignores it.
- Linked images: describe the image in its `alt`. An `aria-label` on the link with `alt=""` on the image names the link but leaves image search nothing to read.
- Permanent redirects: Next.js `permanent: true` returns 308, which Google [treats like 301](https://developers.google.com/search/docs/crawling-indexing/301-redirects), so don't report it as an error.
- Favicon: a robots.txt rule such as `Disallow: /favicon.ico` keeps the site's icon out of Google results, because [Googlebot-Image must be able to crawl the favicon file and Googlebot the home page](https://developers.google.com/search/docs/appearance/favicon-in-search). Search Console then lists the icon under Blocked by robots.txt.
- Search Console submission: submit the sitemap URL in the [Sitemaps report](https://support.google.com/webmasters/answer/7451001) of a Search Console property you own. A [Domain property](https://support.google.com/webmasters/answer/34592) covers every subdomain and protocol, while a URL-prefix property covers only its exact prefix. Keep the `Sitemap:` line in robots.txt as well, because Google [finds it on the next robots.txt crawl](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap#addsitemap) without a submission. Google [retired the sitemap ping endpoint](https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping), which now returns 404. The Search Console API's [`sitemaps.submit`](https://developers.google.com/webmaster-tools/v1/sitemaps/submit) automates submission. Request indexing in [URL Inspection](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl) only for a few key new pages, since individual requests have a quota and repeating one doesn't speed up the crawl.
- Search Console validation: start Validate fix only for an issue a change has fixed. [Page with redirect and Alternate page with proper canonical tag](https://support.google.com/webmasters/answer/7440203) are expected states with nothing to do. A validation stays Started until Google recrawls every affected URL, usually within about two weeks, but rarely crawled legacy URLs can hold it open for months. Requesting indexing for a stuck example in URL Inspection queues a recrawl. A URL that never existed, such as a literal `/*`, should keep returning 404 even though that fails its validation.
- Brave Search: there is no sitemap submission or webmaster console. [Its crawler](https://search.brave.com/help/brave-search-crawler) sends no distinct user agent and skips whatever robots.txt blocks for Googlebot, so a Googlebot block also hides the page from Brave. Submit key URLs one at a time at https://search.brave.com/submit-url, which also re-fetches a page after a `noindex` or removal.
- llms.txt: Google Search [doesn't use it](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), including for its AI features, so report it as optional guidance for agents, never as a ranking fix. [Spec v2](https://llmstxt.org/) orders the file as one H1 name, a `>` summary, detail paragraphs or lists without headings, then H2 sections of `- [name](url): notes` items, with skippable links under `## Optional`. A file at `/docs/llms.txt` covers only `/docs/`. Link absolute URLs, as every llms.txt example in the spec does, to `.md` copies or to pages whose text is in the server HTML. Pages can point to their `.md` copy with `rel="alternate" type="text/markdown"` and to the file with `rel="describedby"`, as `<link>` tags or a `Link` header. Keep it small enough to fit in an agent's context, and test it by asking an agent questions with only the file as a starting point.
- llms.txt checks: [Lighthouse](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/agentic/llms-txt.js) runs the check by default since 13.3. As of 13.6 it fetches `/llms.txt` from the origin root and follows redirects. It fails a 5xx, a 429, a fetch over 2 seconds, or a file under 50 characters or without a `# ` heading or `[name](url)` link, and marks any other 4xx Not Applicable. Locale middleware that adds a language prefix to every path turns `/llms.txt` into a redirect to a localized 404, which Lighthouse marks Not Applicable, so exclude the file from the middleware matcher and confirm with `curl -sI`, without `-L`, that it answers 200 `text/plain`. From this skill directory, run `node scripts/check_llms_txt.mjs <site-url>` for the spec structure, the Lighthouse content rules, and the status of the first 50 links. Then run `npx -y lighthouse@13 <url> --only-audits=llms-txt --chrome-flags=--headless=new --output=json --quiet` and read `audits["llms-txt"]`. Pin the major version: on Node below 22.19, a bare `npx lighthouse` installs 12.8, which has no llms.txt audit and returns empty `audits` with exit 0.

From this skill directory, run `node scripts/check_head.mjs <url>`, or add `--json` for the full report, to fetch a page as a browser, Googlebot Smartphone, GPTBot, ClaudeBot, and PerplexityBot, with a fresh query parameter on every request so no URL-keyed cache answers. It exits 1 on errors, such as head metadata that a crawler running no JavaScript finds only in `<body>`. It reads raw HTML, so it can't show what Googlebot renders, and URL Inspection can't settle that either, because Next.js serves Google-InspectionTool blocking metadata. Anthropic publishes no full ClaudeBot user agent, so the script uses the one seen in server logs, and a site that verifies crawler IP addresses may block the spoofed requests.

## References

- `references/audit-checklist.md`: the per-area checks, each marked with whether a fetch can verify it.
- `references/international-seo.md`: hreflang, canonical interaction, and locale URL structure for multi-language sites, with the errors that silently void a whole cluster.

## Reporting

Give each finding the problem, why it matters for search, the evidence, the fix, and its rank against the others. Open with the few things worth doing first, and close with what you couldn't check and what it would take. Group by layer, not by page, so someone can fix a class of problem once.
