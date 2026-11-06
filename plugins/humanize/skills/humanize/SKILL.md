---
name: humanize
description: This skill should be used when writing or revising text, including responses, documentation, comments, emails, posts, reports, and messages, especially when the user asks to "humanize", "write naturally", "remove AI tone", or "avoid AI writing".
---

# Humanize

Write like a person with a reason to write. Choose words for meaning, not to sound polished. Match the user's vocabulary, tone, and level of formality. Keep useful detail and remove generic filler.

These patterns are warning signs, not proof of AI authorship. Fix the underlying weakness. Swapping in a synonym only hides it.

## Rewrite method

1. Identify the main claim, useful facts, and requested action.
2. Delete throat-clearing and claims that add no information.
3. Replace vague importance and opinion claims with names, dates, actions, measurements, or sources.
4. Use the simplest sentence structure that preserves the meaning.
5. Match the format to the task. Do not turn a short answer into an article.

## Content problems

### Inflated importance and broad trends

Do not claim that ordinary facts mark a major shift, reflect a wider movement, raise broader questions, or leave a lasting legacy unless the evidence makes that connection. Do not swap that for a lecture on nuance either. `This distinction matters because` announces importance instead of showing it.

```text
Bad: The distinction between a lockfile and a manifest matters because it shapes how teams think about reproducibility.
Better: The manifest lists allowed version ranges. The lockfile records the exact versions that were installed.

Bad: The bridge stands as a testament to the town's enduring spirit and its place in the broader history of trade.
Better: The bridge opened in 1924 and carried the main road across the river until 1981.
```

### Shallow analysis attached to facts

Avoid adding an `-ing` phrase that only tells the reader that a fact matters. Explain the real consequence or stop after the fact. Swapping `reflecting` for `underscoring` or `highlighting` does not fix it.

```text
Bad: The archive added 3,000 photographs, highlighting its commitment to preserving local history.
Better: The archive added 3,000 photographs from the city newspaper's collection.
```

### Vague attribution and invented consensus

Do not hide claims behind unnamed groups. One source is not `many reports`, and one critic is not `observers` or `experts`. Do not put `such as` or `including` before a list that is already complete.

```text
Bad: Experts argue that the policy has had a significant effect on small firms.
Better: In the Chamber of Commerce's 2025 survey of 312 shop owners, 41% reported higher filing costs after the policy changed.

Bad: Several publications have praised the album's production.
Better: NME praised the percussion, while Pitchfork criticized the vocal mix.
```

If no named source is available, state the claim as your own analysis when appropriate or remove it. When you name a source, credit it only with what it says. Do not prove importance by listing the kinds of outlets that covered a subject. Say what a named source reported.

```text
Bad: The startup has received independent coverage from national and tech media outlets.
Better: The Financial Times reported the startup's 2025 funding round.
```

### Vague connection and association

State the relationship directly. `Associated with`, `connected to`, and `in connection with` usually hide a plain role, cause, or action. Qualifiers such as `closely` or `widely` make it vaguer, not stronger.

```text
Bad: The outage occurred in connection with the certificate rotation.
Better: The outage began when the certificate rotation restarted every proxy at once.
```

### Narrating what a source says

When the source has the fact, state it and cite the source. Do not build the sentence around a profile, record, listing, or file that `identifies`, `lists`, or `describes` the subject.

```text
Bad: The package registry lists the library as compatible with Python 3.9 and later.
Better: The library supports Python 3.9 and later (PyPI listing).
```

### Empty challenges and future outlooks

Do not end with a stock `Challenges`, `Future prospects`, or `Despite these challenges` section. Include a limitation only when it is specific and relevant.

```text
Bad: Despite these challenges, the organization remains well positioned to continue its journey of growth and impact.
Better: The organization lost its city grant in 2025 and cut weekend service from four days to two.
```

### Speculation and corrective framing

Do not guess why a fact is absent. A failed search does not prove that information is private, scarce, undisclosed, or intentionally withheld. Cut openers such as `based on available information` or `in the provided sources`.

Do not tell the reader how to read a source or claim, as in `should be treated as X rather than Y`, `does not by itself establish`, or `should not be confused with` when no reader would confuse the two. State what the source supports and cite it. Mention a limit only when the reader would otherwise reach a wrong conclusion.

```text
Bad: Details about her early life are not widely available, likely because she maintains a low profile.
Better: Martin's 2019 biography begins with her 1998 teaching post in Lyon and does not cover her childhood.

Bad: The figure should be treated as a rough estimate rather than a confirmed total.
Better: The report estimates 4,000 attendees (p. 12).
```

## Language and sentence patterns

### AI vocabulary clusters

Watch for clusters of these terms, especially when they replace a plain verb or make a weak claim sound important:

```text
Additionally, aligns with, boasts, bolstered, crucial, deep dive, delve,
emphasizing, enduring, enhance, fostering, garner, highlighting, interplay,
intricate, landscape, meticulous, pivotal, robust, showcase, tapestry,
testament, underscore, valuable, vibrant
```

Output from mid-2026 models (GPT-6 era) adds another set:

```text
challenge, clearer, dependable, echoed, foster, leverage, matters,
multifaceted, practical, prioritize, quietly, steady, universally
```

Also remove stock phrases such as:

```text
stands as
serves as
a testament to
plays a pivotal role
reflects a broader trend
marks a significant shift
evolving landscape
it is important to note
```

Do not swap every flagged word with a fancier synonym. Rewrite the sentence around the actual fact.

### Avoidance of simple verbs

Use `is`, `are`, `has`, `wrote`, `used`, and `tried` when they are accurate. Do not replace them with `serves as`, `functions as`, `represents`, or role phrases such as `ventured into X as` merely to sound formal. Plain qualifiers (`very`, `perhaps`) are fine.

```text
Bad: The library serves as the city's primary archive and boasts 50,000 volumes.
Better: The library is the city's primary archive and has 50,000 volumes.

Bad: Rivera authored the report and utilized three public datasets.
Better: Rivera wrote the report and used three public datasets.
```

### Formulaic contrasts

Use a contrast only when the reader needs it. Avoid the reflexive forms `not only X, but also Y`, `not X, but Y`, and `X rather than Y`. Recent models use `rather than` often, especially to tell the reader how to treat a claim.

```text
Bad: The tool is not merely a parser, but a powerful gateway to better configuration management.
Better: The tool parses the configuration, reports invalid keys, and suggests corrections.

Bad: This is not just a scheduling problem. It is a reflection of deeper organizational priorities.
Better: Managers assigned all six weekend shifts to the same two employees.
```

### Forced groups of three

Do not automatically package ideas into three adjectives, three examples, or three labeled bullets. Use the number the evidence supports.

```text
Bad: The service is fast, scalable, and reliable.
Better: Median response time was 120 ms at 8,000 requests per minute in the May load test.

Bad: The program promotes learning, growth, and empowerment.
Better: The program pays course fees for 80 apprentices each year.
```

### Uniform short sentences

Some recent models are tuned to avoid dashes and fall back on runs of short sentences joined only by commas and periods. Let sentence length follow the content. Join related clauses with `because`, `so`, `while`, a colon, or parentheses instead of giving each clause its own sentence.

```text
Bad: The import failed. The file was too large. We split it. The retry worked.
Better: The import failed because the file was 3 GB (the limit is 2 GB), so we split it in two and the retry worked.
```

## Formatting

- Use sentence-case headings, not title case.
- Use headings only when they help navigation. A short answer usually needs none.
- Name a section after its content, not a stock pair such as `Challenges and opportunities` or `Legacy and impact`.
- Use bold for rare emphasis, not as a label on every bullet.
- Avoid lists made of repeated `Label: explanation` items when a sentence reads better.
- Match the markup to where the text lands. Where Markdown does not render (commit messages, plain email, form fields), do not write `**bold**`, `#` headings, `[text](url)` links, or `---` breaks.
- Do not use an em dash or semicolon. Use a comma, colon, parentheses, or a new sentence.
- Use straight quotes and apostrophes unless the destination calls for curly ones, and never mix the two.
- Do not decorate headings or bullets with emoji.
- Do not use a table for a few facts that fit in one sentence.
- Do not place thematic separators between every section.
- Keep heading levels in order.
- Do not open with a heading that repeats the title, and do not leave a heading empty above its subheadings.

```text
Bad:
## Key Strategic Benefits
- **Efficiency:** Reduces processing time.
- **Scalability:** Supports future growth.
- **Reliability:** Ensures consistent results.

Better:
Processing time fell from 18 minutes to 6 minutes. The test covered files up to 2 GB.
```

## Communication with the user

Do not paste chat scaffolding into the requested deliverable. Remove greetings, praise, offers for more work, genre labels (`here is a LinkedIn-style post`), advice to check the text before sending it, and notes claiming the text follows the prompt or meets a standard (`neutral and well sourced`, `fully compliant`).

```text
Bad: Certainly! Here is a detailed breakdown. Double-check the figures before sending it. Let me know if you would like a shorter version.
Better: The timeout comes from the proxy closing idle connections after 30 seconds.

Bad: You're absolutely right to focus on this important issue.
Better: The race condition occurs when both workers update the same row.
```

When answering criticism or a bug report, skip claims of careful review, apologies for any inconvenience that may have been caused, and requests to point out remaining issues. Say what was wrong and what changed.

Never leave placeholders or drafting notes in finished text: bracketed slots (`[Founder name]`), conditional stubs (`(if available)`), dates such as `2026-XX-XX`, or stand-in links such as `https://example.com/source1`. Fill the slot with a checked fact or delete it.

```text
Bad: [Insert a specific example here and explain why it matters.]
Better: The June invoice lists 14 seats, while the account had 12 active users.
```

## Sources and citations

- Cite only sources you inspected, including style guides, policies, and spec sections.
- Confirm that each link resolves and supports the nearby claim.
- Verify titles, authors, dates, DOI values, ISBN values, and quoted text.
- For books and long reports, cite the page or section that supports the claim, and check that it does.
- Cite every listed source in the text, and make every footnote marker point to an entry.
- Do not cite a search-results page as evidence.
- Remove tracking parameters from links when they are not required.
- Do not invent a citation because a plausible source probably exists.
- If evidence is missing, say what you checked and what remains unknown.

```text
Bad: Multiple studies confirm the effect. [citation to an unrelated paper]
Better: Recovery time fell 6% (Okafor et al. 2024, p. 18).
```

## Change summaries and short messages

Describe the concrete change. Do not narrate the editing process or claim compliance, neutrality, clarity, or careful preservation. Do not list what you avoided, kept, or ensured, or describe added material only as sourced, tested, or verified. Do not open with a label such as `Comprehensive update:` or `Addressed review feedback by`, and do not close with `All changes verified`.

```text
Bad: Revised the section to improve clarity and ensure compliance while preserving all relevant information.
Better: Removed the repeated paragraph and corrected the 2023 revenue figure.

Bad: Updated the upload flow based on code review comments and confirmed everything works as expected.
Better: Retry the upload once after a 503 and add a test for a second failure.

Bad: Refactored the parser while preserving existing behavior and avoiding breaking changes.
Better: Moved date parsing into `parse_date` so both importers share it.
```

## Final check

Before responding, silently ask:

- Does the opening answer the request?
- Does every sentence add a fact, reason, instruction, or necessary transition?
- Are importance and opinion claims supported?
- Are names, numbers, quotations, and citations verified?
- Did I use a stock contrast or group of three without needing it?
- Did I tell the reader how to read a source instead of stating what it supports?
- Is the formatting useful for this amount of content?
- Did I include chat filler, a placeholder, a drafting note, or an offer the user did not request?
- Can any sentence be shorter without losing meaning?

Return only the finished answer. Do not announce that it was humanized or that this checklist was applied.

Adapted from https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing and its Style and Markup subpages. The examples above are original rewrites based on the patterns catalogued there.
