---
name: product-ui-design
description: This skill should be used when the user asks to "polish the UI", "improve product UX", "design app controls", "reduce friction", or "create design rules". Design usable, distinctive product interfaces for new or existing apps.
---

# Product UI design

Use this skill for product flows, screens and controls, including products without a design system. Use writing guidance for interface copy and frontend testing guidance for browser execution when available. For new visual concepts or substantial art direction, use the OpenAI or Anthropic frontend design skill while preserving the product workflow and approved identity.

## Understand the job before choosing the treatment

Inspect the actual product, related screens, components, assets and design rules. Identify the user's goal, the next meaningful action, the decisions required and where the flow loses context. For a new product, derive these from the brief and real content. Ask only for decisions that accessible evidence cannot resolve.

Make the next action apparent through placement, hierarchy and plain labels. Remove unnecessary steps and repeated explanations. Preserve selections, drafts and the originating destination through sign-in, connection, retries and navigation. Keep destructive actions deliberate and recovery beside the failed action. Do not hide useful actions merely to make a screenshot cleaner.

Separate small preferences from ongoing work. Connecting several accounts, switching between them and browsing their content may belong in a product workspace alongside related work. Settings should not become that workflow by accident. A single optional connection does not automatically need its own primary navigation item.

## Create or improve product design rules

Read existing rules before changing a screen. Preserve approved identity unless the user asks to change it. If rules are missing or weak, derive a coherent system from the audience, task, assets and useful references. Show the direction through rendered UI, then fold accepted choices and user corrections into the existing design document. Replace stale or contradictory rules instead of appending a history of rejected treatments. Create a design document only when requested or required by project guidance.

Define the choices future screens need: brand assets and tone, font roles and type scale, color roles and supported themes, spacing and density, control sizes, radii and elevation, icon family, content hierarchy and responsive behavior. Explain why distinguishing choices fit the product. Keep rules aligned with actual tokens and components. Separate established decisions from proposals and unverified behavior.

Different products should retain different identities. A media catalog can prioritize imagery, an evaluation workspace can prioritize comparable evidence, and a live presentation can use louder visuals than its setup forms. Do not export one product's palette, font or ban on a visual treatment as a universal rule.

## Choose surfaces for the amount of work

Choose rows, lists, tables, panels or open space according to the content. Group related preferences into one coherent divided list rather than a card for every small choice. Put the label and a useful hint beside a natural-width control. A three-option choice rarely needs to span the page. At narrow widths, wrap the control below its label without truncating choices or forcing horizontal scrolling.

A preference that manages a growing collection can show a count and a Manage action. Open a bounded manager with search, identifying metadata and row actions instead of rendering the entire collection inside Settings. Keep search and actions reachable while the list scrolls. Preserve the query, scroll and useful focus after a mutation, and show loading, empty, pending and failure states where they belong.

Keep infrequent creation forms from occupying the main reading or browsing surface. A visible Create action can open a focused dialog, popover or dedicated page according to the form's length and complexity. An icon-only launcher needs an accessible name. Keep the chosen account and draft through failure, and make the effect of submission clear, including whether it changes an external service or sends invitations.

Put independent setup actions side by side as natural-width buttons with real integration marks, wrapping on phones. Use an ordered list only when each step depends on the preceding one. Do not add a web sign-in step when the desktop app already guides its own sign-in. Keep row actions explicitly left aligned (`justify-start text-left`) and primary labels untruncated. Avoid a stretched 2+1 arrangement for independent actions. Pair empty-state onboarding with a real theme-aware product preview when one exists. Spend visual emphasis on the next meaningful action instead of adding decoration to every section.

## Keep copy useful

Remove hints, captions and tooltips that restate a visible label, title or action. Beside Generate report, keep No reports yet and drop Generate your first report. In an empty pane, Select an item is enough without explaining the editor it opens. Remove operating instructions such as Click to edit when the control already makes the action clear. Use browser-neutral wording when several browsers are supported.

Keep text that adds a decision: real status, a failure reason with a recovery action, a non-obvious destructive or external consequence, or a disclosure about data access, retention or sharing. Keep each fact once at the relevant decision. Delete feature explainers and internal mechanics the user cannot act on. Check the actual state and neighboring controls before cutting text. A missing snapshot must not become No changes, and a hidden placeholder cannot replace necessary recovery guidance.

## Let native setup and updates do the work

For OS permissions, prefer the native prompt when it already lists the app and only a switch is needed. When the user must add the app to a System Settings list, dock a guide beside that window with an animated pointer and a draggable app row. Never put System Settings steps into page text.

Download app updates silently. Relaunch automatically only while idle and in the background. Offer one quiet Restart to Update action in the menu bar, app menu and About, disabled during active work such as a call or recording. Never show the updater's own dialog.

## Make controls belong to the product

Use the product's font and control hierarchy deliberately rather than accepting the component library's default treatment. Choose label size, weight, line height and spacing for the role. Check that the intended font actually loads. Align labels, icons and action columns, and choose comfortable density instead of enlarging controls to fill space.

Choose fills, borders and corner radii by role. Pills and accent-colored labels can be appropriate, but should not become the default for every action. Check the actual foreground against its surface, especially pale fills in light mode. Use a restrained secondary treatment and a clear committing action consistent with the product's own hierarchy. Do not add a generic AI sparkle to an otherwise clear action label as decoration.

Text and fields must be readable in every supported theme. Check text contrast, field boundaries, placeholders, focus and disabled states against their actual backgrounds. Target WCAG AA contrast, including 4.5:1 for ordinary text and 3:1 for large text and essential control boundaries. Do not use color as the only signal. Keep visible labels, keyboard access and touch targets usable. Use at least 16px editable input text on phones to avoid automatic zoom where applicable.

## Use accurate icons and integration assets

Prefer a recognizable icon or real integration logo when it reduces reading or helps recognition. Keep concise visible text when a symbol would be ambiguous. Icon-only actions need an accessible name and an understandable discovery path.

Search existing assets and components first. Use verified brand assets or a maintained brand asset library. Never replace a real logo with a typed initial, emoji or approximate drawing. Preserve its proportions and recognizable colors, using official theme variants where needed. Decorative logos should not duplicate accessible labels. Keep the product icon family consistent in size, stroke weight and optical alignment. An action rarely needs both an action icon and a provider mark unless each adds useful meaning.

Read [control examples](references/control-examples.md) when implementing preference rows, collection managers, form actions or account controls. They illustrate composition with HeroUI v3, not a required dependency, palette or universal visual style. Check the project's installed APIs before adapting them.

## Render, inspect and show

Inspect and show the affected interface at desktop and mobile widths and in every supported theme. Use representative real content or clearly identified fixtures. Check the scale the workflow can reach: empty, one item and a realistic larger collection, such as 40 or more entries, with long values and multiple accounts where relevant. These are coverage examples, not fixed limits. Do not add a theme the product does not support just to fill a comparison.

Prefer screenshots of the actual implementation at matching states and viewports. If a recreation is necessary, label it clearly, use the real assets and styling, and state what remains unverified. Never substitute an approximate preview for acceptance of the running UI. Display evidence inline using the host's supported visual tools, rather than handing back file paths alone.

Exercise the main interaction and inspect the result after it changes. Check hierarchy, density, contrast, focus, clipping, wrapping, scrolling and mobile reachability. Verify that a larger collection does not push unrelated settings out of reach and that recovery retains the user's work. Reuse existing test and QA owners for observable behavior rather than testing CSS classes or copying implementation inventories. A passing build or small fixture does not prove usable composition. Report specific remaining limitations without claiming uninspected views passed.
