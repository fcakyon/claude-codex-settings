---
name: schema
description: "Use when adding, fixing, or reviewing structured data: JSON-LD for articles, products, FAQs, breadcrumbs, organizations, and local businesses, and what to do when markup doesn't earn a rich result."
license: MIT
---

# Schema markup

Structured data tells a search engine what a page is rather than making it rank. Done right it earns a richer result and makes the page easier for an engine to summarize. Done wrong it earns a manual action.

Four rules govern everything below:

- Mark up only what the page visibly shows. Schema describing content a reader can't see is a spam signal, and it's the single most common reason markup gets penalized rather than ignored.
- Use JSON-LD, in a `<script type="application/ld+json">` in the head or at the end of the body. Google recommends it, and it's the only format you can add without touching the page's markup.
- Only claim types and properties the engine actually supports for a rich result. Valid schema.org markup with no supported result does nothing for search, which is fine, but don't promise a rich result it can't produce.
- Validate before it ships, then watch Search Console. Markup that validates can still be wrong about the page.

## Choosing the type

| Type | Use on | Required |
| --- | --- | --- |
| Organization | Homepage, about page | `name`, `url` |
| WebSite | Homepage, to declare a site search | `name`, `url` |
| Article, BlogPosting | Posts and news | `headline`, `image`, `datePublished`, `author` |
| Product | Product pages | `name`, `image`, `offers` |
| SoftwareApplication | App and SaaS pages | `name`, `offers` |
| FAQPage | A page with real questions and answers | `mainEntity` |
| HowTo | Step-by-step instructions | `name`, `step` |
| BreadcrumbList | Any page with breadcrumbs | `itemListElement` |
| LocalBusiness | A location page | `name`, `address` |
| Event | Events and webinars | `name`, `startDate`, `location` |

`references/schema-examples.md` has a complete, valid block for each of these plus a combined `@graph` and a Next.js pattern. `references/required-properties.json` is the same table in the form the bundled validator reads, so adding a type means editing both.

When a page needs several types, prefer one `@graph` array over several separate script tags: entities can then reference each other by `@id` instead of repeating themselves.

## Reviewing existing markup

A fetch of the page shows only server-rendered JSON-LD. CMS SEO plugins commonly inject it client side, so absence in fetched HTML is not absence on the page. Report what the server HTML contained, then send them to the Rich Results Test, which renders JavaScript.

When markup exists but earns nothing, check in this order: a required property missing, a value in the wrong shape (dates must be ISO 8601, URLs absolute, enumerations exact), the type having no rich result to earn, or the markup describing something the page doesn't show.

From this skill directory, run `node scripts/validate_schema.mjs <jsonld-file>` on any block before you hand it over. It parses the JSON, checks each type against the required properties in `references/required-properties.json`, and catches the two value shapes that fail most often: a date that isn't ISO 8601 and a relative URL. It's mechanical, so a clean result means the syntax is right and nothing more.

Then point the user at the Rich Results Test at https://search.google.com/test/rich-results for eligibility, and the schema.org validator at https://validator.schema.org/ for correctness against the vocabulary. Those answer different questions from each other and from the tool, so a block can pass one and fail another. None of the three can tell you whether the markup describes what the page actually shows, which is the accuracy rule above and still yours to check.

## Handing it over

Give the complete block, ready to paste, with the page's real values filled in rather than placeholders. Say where it goes, name any property you had to leave out and why, and note which rich result it makes the page eligible for, with eligible being the honest word. Google decides whether to show one.

## Rich result limits and entity identity

These rules decide whether markup is safe and whether it can earn anything:

- Retired rich results: Google [stopped showing FAQ rich results for every site on May 7, 2026](https://developers.google.com/search/updates) and removed their documentation, after [dropping HowTo results in 2023](https://developers.google.com/search/blog/2023/08/howto-faq-changes) and the [sitelinks search box in November 2024](https://developers.google.com/search/blog/2024/10/sitelinks-search-box). `FAQPage`, `HowTo`, and a `WebSite` `SearchAction` earn nothing in Google Search, so add them only for other consumers and never promise the rich result. `WebSite` with `name` and `url` still sets the [site name](https://developers.google.com/search/docs/appearance/site-names).
- Required properties: Google lists [no required properties for Article](https://developers.google.com/search/docs/appearance/structured-data/article) or Organization, so treat the bundled validator's Article, BlogPosting, and Organization errors as recommendations. [Software apps](https://developers.google.com/search/docs/appearance/structured-data/software-app) need `offers.price` and either `aggregateRating` or `review`, and [events](https://developers.google.com/search/docs/appearance/structured-data/event) need a physical `Place` with an address, since online-only events aren't eligible.
- Inline JSON-LD: `JSON.stringify` doesn't escape `</script>`, so [Next.js recommends](https://nextjs.org/docs/app/guides/json-ld) `JSON.stringify(schema).replace(/</g, "\\u003c")` before `dangerouslySetInnerHTML`.
- Ratings from other sites: Google's review snippet guidelines say [don't aggregate reviews or ratings from other websites](https://developers.google.com/search/docs/appearance/structured-data/review-snippet), so IMDb, Rotten Tomatoes, or app store scores never go into `aggregateRating`. Show them as attributed text instead.
- Organization logo: Google [may show the logo on a purely white background](https://developers.google.com/search/docs/appearance/structured-data/organization), where a white or light-gray wordmark vanishes. Point `logo` at a version that reads on white, at least 112x112 px, at a crawlable URL.
- Entity identity: schema.org defines [`sameAs`](https://schema.org/sameAs) as a page that unambiguously identifies the item, such as its Wikipedia page, Wikidata entry, or official website. On a movie or show page, the IMDb title URL does the same job and tells apart remakes that share a name.

## Sources

- Google Search Central, Intro to how structured data works: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
- Google Search Central, Structured data general guidelines: https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- Google Search Central, Search gallery of supported result types: https://developers.google.com/search/docs/appearance/structured-data/search-gallery
- schema.org: https://schema.org/
