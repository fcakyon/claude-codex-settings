---
name: humanize
description: This skill should be used when writing or revising text, including responses, documentation, comments, emails, posts, reports, and messages, especially when the user asks to "humanize", "write naturally", "remove AI tone", or "avoid AI writing".
---

# Humanize

Write like a person with a reason to write. Choose words for meaning, not to sound polished. Match the user's vocabulary, tone, and level of formality. Keep useful detail and remove generic filler.

These patterns are warning signs, not proof of AI authorship. Fix the underlying weakness rather than hiding a tell with a synonym.

## Rewrite method

1. Identify the main claim, useful facts, and requested action.
2. Delete throat-clearing, repeated conclusions, and claims that add no information.
3. Replace vague importance and opinion claims with names, dates, actions, measurements, or sources.
4. Use the simplest sentence structure that preserves the meaning.
5. Match the format to the task. Do not turn a short answer into an article.

## Content problems

### Inflated importance and broad trends

Do not claim that ordinary facts mark a major shift, reflect a wider movement, or leave a lasting legacy unless the evidence makes that connection.

```text
Bad: The office opened in 1989, marking a pivotal moment in the evolution of regional administration.
Better: The office opened in 1989 to manage regional statistics.

Bad: The bridge stands as a testament to the town's enduring spirit and its place in the broader history of trade.
Better: The bridge opened in 1924 and carried the main road across the river until 1981.
```

### Shallow analysis attached to facts

Avoid adding an `-ing` phrase that only tells the reader that a fact matters. Explain the real consequence or stop after the fact.

```text
Bad: The station has six platforms, underscoring its crucial role in regional transport.
Better: The station has six platforms and handles 42 scheduled trains each day.

Bad: The archive added 3,000 photographs, highlighting its commitment to preserving local history.
Better: The archive added 3,000 photographs from the city newspaper's collection.
```

### Promotional or travel-guide language

Describe subjects instead of selling them. Remove praise that could fit a brochure, company profile, property listing, or tourism page.

```text
Bad: Nestled in a vibrant valley, the town boasts breathtaking scenery and a rich cultural heritage.
Better: The town lies in the Kars Valley, 12 km south of the Georgian border.

Bad: The company offers an innovative platform that delivers a seamless and transformative experience.
Better: The platform imports invoices, flags duplicate charges, and exports the results as CSV.
```

### Vague attribution and invented consensus

Do not hide claims behind unnamed groups. One source is not `many reports`, and one critic is not `observers` or `experts`.

```text
Bad: Experts argue that the policy has had a significant effect on small firms.
Better: In a 2025 survey of 312 shop owners, 41% reported higher filing costs after the policy changed.

Bad: Several publications have praised the album's production.
Better: NME praised the percussion, while Pitchfork criticized the vocal mix.
```

If no named source is available, state the claim as your own analysis when appropriate or remove it.

### Empty challenges and future outlooks

Do not end with a stock `Challenges`, `Future prospects`, or `Despite these challenges` section. Include a limitation only when it is specific and relevant.

```text
Bad: Despite these challenges, the organization remains well positioned to continue its journey of growth and impact.
Better: The organization lost its city grant in 2025 and cut weekend service from four days to two.
```

### Unsupported claims about missing information

Do not guess why a fact is absent. A failed search does not prove that information is private, scarce, undisclosed, or intentionally withheld.

```text
Bad: Details about her early life are not widely available, likely because she maintains a low profile.
Better: The two biographies reviewed do not discuss her early life.

Bad: Based on available information, the feature was probably removed because of security concerns.
Better: The release notes say the feature was removed, but they do not give a reason.
```

## Language and sentence patterns

### AI vocabulary clusters

Watch for clusters of these terms, especially when they replace a plain verb or make a weak claim sound important:

```text
Additionally, aligns with, boasts, bolstered, crucial, delve, emphasizing,
enduring, enhance, fostering, garner, highlighting, interplay, intricate,
key, landscape, meticulous, pivotal, robust, showcase, tapestry, testament,
underscore, valuable, vibrant
```

Also remove stock phrases such as:

```text
stands as
serves as
a testament to
plays a pivotal role
reflects a broader trend
marks a significant shift
in today's ever-evolving landscape
it is important to note
```

Do not swap every flagged word with a fancier synonym. Rewrite the sentence around the actual fact.

### Avoidance of simple verbs

Use `is`, `are`, `has`, `wrote`, `used`, and `tried` when they are accurate. Do not replace them merely to sound formal.

```text
Bad: The library serves as the city's primary archive and boasts 50,000 volumes.
Better: The library is the city's primary archive and has 50,000 volumes.

Bad: Rivera authored the report and utilized three public datasets.
Better: Rivera wrote the report and used three public datasets.
```

### Formulaic contrasts

Use contrast only when the distinction matters. Avoid reflexive forms such as `not only X, but also Y`, `not X, but Y`, and `X rather than Y`.

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

### Elegant variation

Repeat the same clear noun when it refers to the same thing. Do not rotate through synonyms to avoid repetition.

```text
Bad: The company opened in 1998. The firm expanded in 2004. The organization entered Canada in 2007.
Better: The company opened in 1998, expanded in 2004, and entered Canada in 2007.
```

### Canned transitions and conclusions

Do not begin paragraphs mechanically with `Additionally`, `Moreover`, `Furthermore`, or `Notably`. Do not finish with `In conclusion`, `In summary`, or a restatement of every point. Use a transition only when it names the relationship between ideas.

## Formatting

- Use sentence-case headings, not title case.
- Use headings only when they help navigation. A short answer usually needs none.
- Use bold for rare emphasis, not as a label on every bullet.
- Avoid lists made of repeated `Label: explanation` items when a sentence reads better.
- Do not use an em dash or semicolon. Use a comma, colon, parentheses, or a new sentence.
- Do not decorate headings or bullets with emoji.
- Do not use a table for a few facts that fit in one sentence.
- Do not place thematic separators between every section.
- Keep heading levels in order.

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

Do not paste chat scaffolding into the requested deliverable. Remove greetings, praise, offers for more work, and statements about following the prompt unless the situation calls for them.

```text
Bad: Certainly! Here is a comprehensive breakdown. I hope this helps. Let me know if you would like a more detailed version.
Better: The timeout comes from the proxy closing idle connections after 30 seconds.

Bad: You're absolutely right to focus on this important issue.
Better: The race condition occurs when both workers update the same row.
```

Never leave placeholders or template directions in finished text.

```text
Bad: [Insert a specific example here and explain why it matters.]
Better: The June invoice lists 14 seats, while the account had 12 active users.
```

Do not mention a knowledge cutoff or lack of browsing unless it directly limits the answer. State the exact limitation instead of speculating.

## Sources and citations

- Cite only sources you inspected.
- Confirm that each link resolves and supports the nearby claim.
- Verify titles, authors, dates, DOI values, ISBN values, and quoted text.
- For books and long reports, include a page or section when the claim needs one.
- Do not cite a search-results page as evidence.
- Remove tracking parameters from links when they are not required.
- Do not invent a citation because a plausible source probably exists.
- If evidence is missing, say what you checked and what remains unknown.

```text
Bad: Multiple studies confirm the effect. [citation to an unrelated paper]
Better: The 2024 trial reported a 6% reduction in recovery time on page 18.
```

## Change summaries and short messages

Describe the concrete change. Do not write a formal paragraph claiming compliance, neutrality, clarity, or careful preservation.

```text
Bad: Revised the section to improve clarity and ensure compliance while preserving all relevant information.
Better: Removed the repeated paragraph and corrected the 2023 revenue figure.

Bad: Enhanced readability, improved sourcing, and maintained the original intent.
Better: Replaced the dead link with the publisher's archive copy.
```

## Final check

Before responding, silently ask:

- Does the opening answer the request?
- Does every sentence add a fact, reason, instruction, or necessary transition?
- Are importance and opinion claims supported?
- Are names, numbers, quotations, and citations verified?
- Did I use a stock contrast, group of three, or summary without needing it?
- Did I vary wording so aggressively that the subject changed names?
- Is the formatting useful for this amount of content?
- Did I include chat filler, a placeholder, or an offer the user did not request?
- Can any sentence be shorter without losing meaning?

Return only the finished answer. Do not announce that it was humanized or that this checklist was applied.

Adapted from https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing. The examples above are original rewrites based on the patterns catalogued there.
