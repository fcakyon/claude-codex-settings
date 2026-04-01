---
name: vercel-react-view-transitions
description: Guide for implementing smooth, native-feeling animations using React's View Transition API (`<ViewTransition>` component, `addTransitionType`, and CSS view transition pseudo-elements). Use this skill whenever the user wants to add page transitions, animate route changes, create shared element animations, animate enter/exit of components, animate list reorder, implement directional (forward/back) navigation animations, or integrate view transitions in Next.js. Also use when the user mentions view transitions, `startViewTransition`, `ViewTransition`, transition types, or asks about animating between UI states in React without third-party animation libraries.
license: MIT
metadata:
  author: vercel
  version: "1.0.0"
---

# React View Transitions

Animate between UI states using the browser's native `document.startViewTransition`. Declare *what* with `<ViewTransition>`, trigger *when* with `startTransition` / `useDeferredValue` / `Suspense`, control *how* with CSS classes. Unsupported browsers skip animations gracefully.

## When to Animate

Every `<ViewTransition>` should communicate a spatial relationship or continuity. If you can't articulate what it communicates, don't add it.

Implement **all** applicable patterns from this list, in this order:

| Priority | Pattern | What it communicates |
|----------|---------|---------------------|
| 1 | **Shared element** (`name`) | "Same thing — going deeper" |
| 2 | **Suspense reveal** | "Data loaded" |
| 3 | **List identity** (per-item `key`) | "Same items, new arrangement" |
| 4 | **State change** (`enter`/`exit`) | "Something appeared/disappeared" |
| 5 | **Route change** (layout-level) | "Going to a new place" |

This is an implementation order, not a "pick one" list. Most apps need #1–#3 at minimum. Only skip a pattern if the app has no use case for it. Only one tree level should animate at a time — adding a layout-level transition on top of per-page animations produces competing double-animation.

### Choosing Animation Style

| Context | Animation | Why |
|---------|-----------|-----|
| Hierarchical navigation (list → detail) | Type-keyed `nav-forward` / `nav-back` | Communicates spatial depth |
| Lateral navigation (tab-to-tab) | Bare `<ViewTransition>` (fade) or `default="none"` | No depth to communicate |
| Suspense reveal | `enter`/`exit` string props | Content arriving |
| Revalidation / background refresh | `default="none"` | Silent — no animation needed |

Reserve directional slides for hierarchical navigation only. Directional slides on sibling links falsely imply spatial depth.

---

## Availability

- Requires `react@canary` or `react@experimental` — **not** in stable React (including 19.x). Verify with `npm ls react`.
- Browser support: Chromium 111+, Firefox 144+, Safari 18.2+. Graceful degradation on unsupported browsers.

---

## Implementation Workflow

When adding view transitions to an existing app, **follow `references/implementation.md` step by step.** Start with the audit — do not skip it. Copy the CSS recipes from `references/css-recipes.md` into the global stylesheet — do not write your own animation CSS.

---

## Core Concepts

### The `<ViewTransition>` Component

```jsx
import { ViewTransition } from 'react';

<ViewTransition>
  <Component />
</ViewTransition>
```

React auto-assigns a unique `view-transition-name` and calls `document.startViewTransition` behind the scenes. Never call `startViewTransition` yourself.

### Animation Triggers

| Trigger | When it fires |
|---------|--------------|
| **enter** | `<ViewTransition>` first inserted during a Transition |
| **exit** | `<ViewTransition>` first removed during a Transition |
| **update** | DOM mutations inside a `<ViewTransition>`. With nested VTs, mutation applies to the innermost one |
| **share** | Named VT unmounts and another with same `name` mounts in the same Transition |

Only `startTransition`, `useDeferredValue`, or `Suspense` activate VTs. Regular `setState` does not animate.

### Critical Placement Rule

`<ViewTransition>` only activates enter/exit if it appears **before any DOM nodes**:

```jsx
// Works
<ViewTransition enter="auto" exit="auto">
  <div>Content</div>
</ViewTransition>

// Broken — div wraps the VT, suppressing enter/exit
<div>
  <ViewTransition enter="auto" exit="auto">
    <div>Content</div>
  </ViewTransition>
</div>
```

---

## Styling with View Transition Classes

### Props

Values: `"auto"` (browser cross-fade), `"none"` (disabled), `"class-name"` (custom CSS), or `{ [type]: value }` for type-specific animations.

```jsx
<ViewTransition default="none" enter="slide-in" exit="slide-out" share="morph" />
```

If `default` is `"none"`, all triggers are off unless explicitly listed.

### CSS Pseudo-Elements

- `::view-transition-old(.class)` — outgoing snapshot
- `::view-transition-new(.class)` — incoming snapshot
- `::view-transition-group(.class)` — container
- `::view-transition-image-pair(.class)` — old + new pair

See `references/css-recipes.md` for ready-to-use animation recipes.

---

## Transition Types

Tag transitions with `addTransitionType` so VTs can pick different animations based on context:

```jsx
startTransition(() => {
  addTransitionType('nav-forward');
  router.push('/detail/1');
});
```

Pass an object to map types to CSS classes:

```jsx
<ViewTransition
  enter={{ 'nav-forward': 'slide-from-right', 'nav-back': 'slide-from-left', default: 'none' }}
  exit={{ 'nav-forward': 'slide-to-left', 'nav-back': 'slide-to-right', default: 'none' }}
  default="none"
>
  <Page />
</ViewTransition>
```

**TypeScript:** `ViewTransitionClassPerType` requires a `default` key in the object.

### Types and Suspense

Types are available during navigation but **not** during subsequent Suspense reveals (separate transitions, no type). Use type maps for page-level enter/exit; use simple string props for Suspense reveals.

---

## Shared Element Transitions

Same `name` on two VTs — one unmounting, one mounting — creates a shared element morph:

```jsx
<ViewTransition name="hero-image">
  <img src="/thumb.jpg" onClick={() => startTransition(() => onSelect())} />
</ViewTransition>

// On the other view — same name
<ViewTransition name="hero-image">
  <img src="/full.jpg" />
</ViewTransition>
```

- Only one VT with a given `name` can be mounted at a time — use unique names (`photo-${id}`).
- `share` takes precedence over `enter`/`exit`. Think through each navigation path: when no matching pair forms (e.g., the target page doesn't have the same name), `enter`/`exit` fires instead. Consider whether the element needs a fallback animation for those paths.
- Never use a fade-out exit on pages with shared morphs — use a directional slide instead.

---

## Common Patterns

### Enter/Exit

```jsx
{show && (
  <ViewTransition enter="fade-in" exit="fade-out"><Panel /></ViewTransition>
)}
```

### List Reorder

```jsx
{items.map(item => (
  <ViewTransition key={item.id}><ItemCard item={item} /></ViewTransition>
))}
```

Trigger inside `startTransition`. Avoid wrapper `<div>`s between list and VT.

### Force Re-Enter with `key`

```jsx
<ViewTransition key={searchParams.toString()} enter="slide-up" default="none">
  <ResultsGrid />
</ViewTransition>
```

**Caution:** If wrapping `<Suspense>`, changing `key` remounts the boundary and refetches.

### Suspense Fallback to Content

Simple cross-fade:
```jsx
<ViewTransition>
  <Suspense fallback={<Skeleton />}><Content /></Suspense>
</ViewTransition>
```

Directional reveal:
```jsx
<Suspense fallback={<ViewTransition exit="slide-down"><Skeleton /></ViewTransition>}>
  <ViewTransition enter="slide-up" default="none"><Content /></ViewTransition>
</Suspense>
```

For more patterns, see `references/patterns.md`.

---

## How Multiple VTs Interact

Every VT matching the trigger fires simultaneously in a single `document.startViewTransition`. VTs in **different** transitions (navigation vs later Suspense resolve) don't compete.

### Use `default="none"` Liberally

Without it, every VT fires the browser cross-fade on **every** transition — Suspense resolves, `useDeferredValue` updates, background revalidations. Always use `default="none"` and explicitly enable only desired triggers.

### Two Patterns Coexist

**Pattern A — Directional slides:** Type-keyed VT on each page, fires during navigation.
**Pattern B — Suspense reveals:** Simple string props, fires when data loads (no type).

They coexist because they fire at different moments. `default="none"` on both prevents cross-interference. Always pair `enter` with `exit`. Place directional VTs in page components, not layouts.

---

## Next.js Integration

`<ViewTransition>` works out of the box for `startTransition`/`Suspense` updates. To also animate `<Link>` navigations:

```js
// next.config.js
experimental: { viewTransition: true }
```

This wraps every `<Link>` navigation in `document.startViewTransition`. Use `default="none"` to prevent competing animations.

`next/link` supports a native `transitionTypes` prop:
```tsx
<Link href="/products/1" transitionTypes={['nav-forward']}>View</Link>
```

For App Router patterns and Server Component details, see `references/nextjs.md`.

---

## Accessibility

Always add the reduced motion CSS from `references/css-recipes.md` to your global stylesheet.

---

## Reference Files

- **`references/implementation.md`** — Step-by-step implementation workflow.
- **`references/patterns.md`** — Patterns, animation timing, events API, troubleshooting.
- **`references/css-recipes.md`** — Ready-to-use CSS animation recipes.
- **`references/nextjs.md`** — Next.js App Router patterns and Server Component details.
