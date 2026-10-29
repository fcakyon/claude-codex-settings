---
name: aeo
description: This skill should be used when the user asks to "build an AEO strategy", "improve AI search visibility", "track buyer prompts", "analyze AI citations", or "plan content for answer engines". Apply an evidence-led answer engine optimization (AEO/GEO) feedback loop to any product or service, prioritizing discovery by buyers who have not heard of it.
---

# Answer engine optimization

Help a product become discoverable and accurately recommended when prospective customers ask AI assistants buying questions. Adapt to software, physical goods, consumer products, services, marketplaces, and local businesses. Default to acquiring people who have not heard of the product. Success means the answer introduces the product or cites useful owned content without the buyer naming it.

Use the loop: buyer question → observed answer and sources → diagnosed gap → page or source improvement → repeated measurement → customer outcome.

## Scope and evidence

Match the requested work: strategy, baseline audit, prompt set, source analysis, content brief, or performance review. Keep explicitly requested branded accuracy or conversion work scoped to that purpose. Use existing product material, research, analytics, and monitoring exports before requesting missing inputs. Ask only for information that changes the next decision. With no analytics or answer-engine access, produce a proposed measurement plan and label assumptions. Never fill missing observations with invented results.

Treat case-study growth figures as hypotheses to investigate, not expected returns. Neither a fixed prompt count nor a particular engine's traffic share transfers between products. AEO guidance alone does not authorize publishing, outreach, paid monitoring, or recurring jobs.

## 1. Define the buying context

Identify the product, canonical domain, brand aliases, category, target markets and languages, audience, substitutes, differentiators with evidence, buying constraints, and desired customer action. Distinguish the buyer, user, and decision-maker where useful. For consumer or local purchases, use the shopper's situation, location, and constraints instead of inventing enterprise personas.

Define one primary outcome, such as a paid order, qualified inquiry, booking, or activated trial. Keep intermediate events such as page views and signups separate. Record the normal purchase or sales lag and the available attribution window.

## 2. Build a prompt portfolio

Start with observed language from support questions, sales conversations, reviews, on-site search, search queries, and customer research. Separate observed questions from generated candidates. Group prompts by audience or purchase situation, journey stage, topic, use case, constraints, market, and language.

Build the acquisition portfolio around problems, desired outcomes, categories, constraints, and alternatives. A buyer can be ready to purchase without knowing the product name. Useful patterns include:

- What is the best way to achieve an outcome under a specific constraint?
- Which product category fits a particular audience or situation?
- How do two approaches compare for a concrete use case?
- Which options meet a requirement, budget, location, or compatibility need?
- What tradeoffs, costs, proof, or limitations should a buyer check?

Use natural customer language and separate these cohorts:

| Cohort | Buyer knowledge and prompt | Purpose |
| --- | --- | --- |
| Problem or category discovery | Does not know the target product. Asks how to solve a problem or find a suitable option. | Measure whether answers introduce the product without naming it in the prompt |
| Competitor alternatives | Knows an alternative. Asks for alternatives to it without naming the target product. | Measure acquisition from competitor-aware buyers, reported separately from category discovery |
| Branded evaluation | Already knows the target product. Names it to ask about price, support, suitability, or comparisons. | Check accuracy and support conversion, excluded from acquisition visibility rates |

Exclude the target brand, aliases, domain, and unique product names from acquisition prompts and any supplied conversation context. Use fresh conversations without target-brand seeding. Competitor names, compatible platforms, and subjects such as a movie title can be natural buying context. Include poor-fit cases to check recommendation accuracy, without rewarding irrelevant recommendations.

Distinguish two acquisition paths: a solution question can lead to a product recommendation, while a contextual question can lead to a useful owned guide where the reader discovers the product. A guide citation is not a product recommendation. Map each acquisition prompt to its intended path and next customer action.

Choose coverage based on distinct buying decisions and collection cost. Deduplicate paraphrases that add no new intent. Keep a stable core for trend comparisons and a separate exploratory set for new questions. Version additions and removals so expanding coverage cannot masquerade as a visibility change.

## 3. Prioritize channels and collect a baseline

Review available referrals, conversions, customer acquisition surveys, and customer research. Prioritize engines that bring relevant customers or that the audience demonstrably uses. With no channel evidence, run a small discovery sample across plausible engines before committing the budget.

Estimate cost as prompts × engines × repetitions × collection frequency, plus research and maintenance. Start within the user's budget. Use existing exports or a small manual sample before suggesting a paid stack. Automated collection must use supported access and respect provider limits.

For each observation, retain the exact prompt, timestamp, engine and model or mode when visible, locale, relevant account or personalization context, answer evidence, brand mentions, explicit recommendations, and cited URLs. Do not store credentials or unnecessary customer identifiers. Record failed runs as failures, not brand absences.

Keep collection settings consistent within each cohort. Repeat enough observations to expose variability, with the sample size stated. Report API output as API output, not proof of what the consumer search interface shows. A web search about an engine is not an observation of that engine's answer.

## 4. Check whether the relevant content is accessible

Before commissioning content for a gap, inspect the existing page and the path by which the target engine can find it:

- Status and redirects, robots rules, canonical and index directives, snippet controls, internal links, and sitemap inclusion.
- The actual body text in fetched HTML and rendered output when available. Check whether access restrictions, rendering, CDN rules, or formatting hide the answer.
- Whether headings, text, tables, product facts, and applicable structured data accurately describe the visible page.

Keep retrieval, indexing, answer inclusion, and citation as separate findings. A fetched title without body text suggests a retrieval or rendering issue, not proof of partial indexing. A successful browser load or a changed user agent does not prove a provider crawler can access the page. Use index inspection and crawler logs when available, and state exactly what remains unknown.

Check current official documentation before recommending provider-specific crawler changes. Search retrieval and model training controls can differ. Do not broaden access indiscriminately. Google states that its AI Search features use existing SEO foundations and have no additional technical requirements. Do not sell special schema, AI text files, or a writing format as a universal inclusion requirement.

When available, use `seo-skills` for detailed crawl, index, schema, and architecture work, and `google-telemetry` for verified Google reporting. Neither plugin is required to apply this methodology. Avoid duplicating their procedures.

## 5. Diagnose answers and cited sources

For each high-value prompt, compare repeated answers and inspect the cited pages. Separate a brand mention, an explicit recommendation, an owned-page citation, and a third-party citation about the brand. Track competitors and substitutes consistently.

Classify the observed gap before selecting an action:

| Evidence | Candidate action |
| --- | --- |
| Relevant owned answer exists but cannot be retrieved | Fix access, rendering, discovery, or page structure |
| Owned answer is stale, incomplete, or unsupported | Correct the existing page and add verifiable evidence |
| No page addresses a distinct buying decision | Research and brief a new page |
| Answers repeatedly cite credible external comparisons or listings | Identify a factual contribution, correction, or listing opportunity |
| Recommendations misstate suitability or product facts | Clarify the canonical product information and supporting proof |
| Visibility grows but qualified customer actions do not | Review audience fit, landing experience, offer, and measurement |

Read sources before inferring why they appear. Citation frequency is an observation, not proof of authority or a causal ranking factor. Missing citations do not prove that a source was unused. Assess the source's audience, evidence, freshness, commercial relationship, and relevance. Do not propose fake reviews, undisclosed endorsements, or paid links presented as editorial citations.

## 6. Turn findings into content decisions

Review both prompts where the product appears and valuable prompts where it does not. A winning prompt may reveal a reusable strength or an already-satisfied need. Do not automatically turn every winning prompt into another article.

Prefer correcting, merging, or extending an existing relevant page before adding a competing page. Match the format to the buying question: product details, category guidance, comparison, tutorial, evidence report, pricing explanation, compatibility guide, or local service information. A blog post is only one option.

Research audience questions, cited sources, alternatives, and current facts before drafting. Deep-research tools are optional. Verify their claims against underlying sources. Plan original evidence the team can supply, such as a reproducible test, documented experience, demonstration, or measured result. Do not invent product capabilities, reviews, benchmarks, or competitor weaknesses.

Each brief should state the audience, buying question, evidence of the gap, target page or proposed URL, direct answer, supporting proof, relevant tradeoffs, internal links, next customer action, owner, and measurement plan. Use useful headings and readable content for buyers. Keep claims accurate even when quoted out of context. Do not prescribe arbitrary word counts or copy prompts verbatim into titles without checking intent.

Rank actions by buyer relevance, outcome proximity, evidence strength, gap size, effort, and dependency. State uncertainty rather than hiding it behind a precise score. Fix access blockers first for the pages they affect. Assign research, fact checking, drafting, and review to available owners, whether in-house or external.

## 7. Measure outcomes and repeat

Keep three layers of measurement distinct:

- Visibility: unprompted mention, relevant recommendation, and owned-content citation rates for each acquisition cohort and engine. Report branded answer accuracy separately.
- Visits and behavior: identifiable AI referrals, landing pages, engaged visits, and the defined conversion events.
- Customer outcomes: qualified inquiries, purchases, paid customers, or another agreed business result after the normal lag.

For each rate, state the numerator, denominator, period, engine, and cohort. For example, acquisition mention rate is successful observations mentioning the target brand divided by all successful observations in the same target-brand-free cohort. Never count branded evaluation runs in its numerator or denominator. Report collection failures separately. Do not compare an expanded prompt set with an older smaller set as if they were identical.

Referrers can be missing, and a visit cannot usually be assigned to a monitored prompt. Keep observed attribution, self-reported discovery, and modeled attribution separate. Search Console's Web reporting includes Google's AI features, so it does not by itself isolate AI-driven visits. Use aggregate conversion events without exposing individual financial records.

Log each page or source change and its hypothesis. Recheck access, allow for recrawl and purchase lag, then resample the stable cohort under comparable conditions. Use unchanged pages or prompt groups as comparisons where practical. Account for campaigns, seasonality, product changes, and engine variability. A before/after association alone does not prove AEO caused growth.

Review on a cadence suited to volume, volatility, sales lag, and budget. Keep improving actions supported by evidence, revise uncertain ones, and stop work that brings irrelevant visibility. Reduce redundant prompts or collection frequency before adding tools. Automate only when the repeated workflow warrants it and the user requests it.

## Deliver the requested result

For a full strategy, return a concise product and outcome definition, acquisition prompt portfolio with discovery paths, baseline findings with evidence and access limits, ranked page and source actions, and the next measurement window. Put any branded evaluation prompts in a separately labeled set. For a narrower request, return only that part.

When a dataset is requested, use the existing format or agree an export destination. Keep prompt definitions, answer observations, and business outcomes separate so repeated samples cannot duplicate customer counts:

- Prompt definitions: stable ID, text, origin, audience, stage, topic, use case, constraints, market, language, purpose/cohort, discovery path, target-brand presence, competitor context, cohort version.
- Observations: prompt ID, run ID, timestamp, engine and context, success or failure, answer evidence, mention and recommendation flags, cited URLs and source ownership, analyst notes.
- Actions and outcomes: page or source, hypothesis, change date, owner, linked prompt IDs, comparison group, attribution method, outcome definition, period, counts, costs, and decision.

Represent unknown values as unknown, not zero. Mark generated prompt candidates and proposed actions explicitly. Keep raw evidence traceable without leaking account data.

## Source

[Google Search Central: AI features and your website](https://developers.google.com/search/docs/appearance/ai-features) supports the Google-specific eligibility, SEO, and reporting guidance above. Recheck it when applying those details. The remaining workflow is a measurement methodology, not a promise of engine behavior or customer growth.
