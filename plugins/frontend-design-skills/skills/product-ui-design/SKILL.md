---
name: product-ui-design
description: This skill should be used when the user asks to "polish the UI", "improve product UX", "design app controls", "reduce friction", or "create design rules". Design usable, distinctive product interfaces for new or existing apps.
---

# Product UI design

Use this skill for product flows, screens and controls, including new products without a design system. Use the installed writing guidance for interface copy and frontend testing guidance for browser execution when available. For new visual concepts or substantial art direction, use the OpenAI or Anthropic frontend design skill when useful, while keeping the product workflow and design rules as constraints.

## Understand the job before choosing the treatment

Inspect the actual product, related screens, components, assets and design rules. Identify the user's goal, the next meaningful action, the decisions required and where the flow loses context. For a new product, derive these from the brief and real content. Ask only for decisions that accessible evidence cannot resolve.

Make the next action apparent through placement, hierarchy and plain labels. Remove unnecessary steps and repeated explanations. Preserve selections, draft input and the originating destination through sign-in, connection, retries and navigation. Keep destructive actions deliberate and recovery beside the failed action. Do not hide useful actions merely to make a screenshot cleaner.

## Create or improve product design rules

Read existing rules before changing a screen. Preserve approved identity unless the user asks to change it. If rules are missing or weak, derive a coherent system from the audience, task, assets and useful references. Show the resulting direction through rendered UI, then record accepted decisions in the project's existing design document. Create a design document when requested or required by project guidance.

Define the choices future screens need: brand assets and tone, font roles and type scale, color roles and supported themes, spacing and density, control sizes, radii and elevation, icon family, content hierarchy and responsive behavior. Explain why distinguishing choices fit the product. Keep rules aligned with actual tokens and components. Separate established decisions from proposals and unverified behavior.

Different products should retain different identities. A media catalog can prioritize imagery, an evaluation workspace can prioritize comparable evidence, and a live presentation can use louder visuals than its setup forms. Do not export one product's palette, font or ban on a visual treatment as a universal rule.

## Refine the controls and the composition

Use familiar behavior and a clear hierarchy. Choose rows, lists, tables, panels or open space according to the content. Avoid surrounding every item with a card. Spend visual emphasis where it helps the task, rather than adding decorative gradients, stripes, badges or motion.

For sequential setup or onboarding flows, group the steps into one cohesive divided list rather than separate bordered boxes or a wrapping pile of pills. Give every row button/link explicit left-aligned text (`justify-start text-left`) so `<button>` never inherits center alignment, never truncate primary action labels (`...`), and reserve the single accent fill for step 1 or the primary action. Keep unordered secondary tools as natural-width buttons (`flex-wrap`, never stretched 2+1 rows), and pair empty-state onboarding with a real theme-aware product preview screenshot when one exists.

Set typography on controls deliberately. Align labels, icons and action columns, balance visual weight and use a consistent spacing scale. Choose comfortable density for the task instead of inflating controls to fill space. Check real long values, empty content, loading, failure and selected states.

Text and fields must be readable in every supported theme. Check text contrast, field boundaries, placeholders, focus and disabled states against their actual backgrounds. Target WCAG AA contrast, including 4.5:1 for ordinary text and 3:1 for large text and essential control boundaries. Do not use color as the only signal. Keep visible labels, keyboard access and touch targets usable. Use at least 16px editable input text on phones to avoid automatic zoom where applicable.

## Use accurate icons and integration assets

Prefer a recognizable icon or real integration logo when it reduces reading or helps recognition. Keep concise visible text when a symbol would be ambiguous. Icon-only actions need an accessible name and an understandable discovery path.

Search existing assets and components first. Use verified brand assets or a maintained brand asset library. Never replace a real logo with a typed initial, emoji or approximate drawing. Preserve its proportions and recognizable colors, using official theme variants where needed. Decorative logos should not duplicate accessible labels. Keep the product icon family consistent in size, stroke weight and optical alignment. An action rarely needs both an action icon and a provider mark unless each adds useful meaning.

Read [control examples](references/control-examples.md) when implementing rows, form actions or account controls. They illustrate decisions with HeroUI v3, not a required dependency or a universal visual style. Check the project's installed APIs before adapting them.

## Render, inspect and show

For every UI change, inspect and show the affected interface in chat at desktop and mobile widths and in every supported theme. Use representative real content or clearly identified fixtures, including long values and relevant states. Do not add a theme the product does not support just to fill a comparison.

Prefer screenshots of the actual implementation at matching states and viewports. If a recreation is necessary, label it clearly, use the real assets and styling, and state what remains unverified. Never substitute an approximate preview for acceptance of the running UI. Display evidence inline using the host's supported visual tools, rather than handing back file paths alone.

Exercise the main interaction and inspect the rendered result after it changes. Check contrast, focus, clipping, wrapping, scrolling, alignment and mobile reachability. Build and functional tests are separate from visual quality. Report specific remaining limitations without claiming uninspected views passed.
