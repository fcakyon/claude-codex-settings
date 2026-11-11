---
name: heroui-react
description: "HeroUI v3 React component library (Tailwind CSS v4 + React Aria). Use when building UIs with HeroUI — creating Buttons, Modals, Forms, Cards; installing @heroui/react; configuring dark/light themes with oklch variables; or fetching component docs. Keywords: HeroUI, Hero UI, heroui, @heroui/react, @heroui/styles."
metadata:
  author: heroui
  version: "3.0.1"
---

> Marketplace adaptation: installation and framework guidance follow the host project.

# HeroUI v3 React Development Guide

HeroUI v3 is a component library built on **Tailwind CSS v4** and **React Aria Components**, providing accessible, customizable UI components for React applications.

---

## Installation

This skill is provided by the marketplace plugin. Install project dependencies using the host project package manager.

---

## CRITICAL: v3 Only - Ignore v2 Knowledge

**This guide is for HeroUI v3 ONLY.** Do NOT apply v2 patterns — the provider, styling, and component API all changed:

| Feature       | v2 (DO NOT USE)                   | v3 (USE THIS)                               |
| ------------- | --------------------------------- | ------------------------------------------- |
| Provider      | `<HeroUIProvider>` required       | **No Provider needed**                      |
| Animations    | `framer-motion` package           | CSS-based, no extra deps                    |
| Component API | Flat props: `<Card title="x">`    | Compound: `<Card><Card.Header>`             |
| Styling       | Tailwind v3 + `@heroui/theme`     | Tailwind v4 + `@heroui/styles`         	  |
| Packages      | `@heroui/system`, `@heroui/theme` | `@heroui/react`, `@heroui/styles` 		  |

```tsx
// DO NOT DO THIS - v2 pattern
import { HeroUIProvider } from "@heroui/react";
import { motion } from "framer-motion";

<HeroUIProvider>
	<Card title="Product" description="A great product" />
</HeroUIProvider>;
```

### CORRECT (v3 patterns)

```tsx
// DO THIS - v3 pattern (no provider, compound components)
import { Card } from "@heroui/react";

<Card>
	<Card.Header>
		<Card.Title>Product</Card.Title>
		<Card.Description>A great product</Card.Description>
	</Card.Header>
</Card>;
```

**Always fetch v3 docs before implementing.**

---

## Core Principles

- Semantic variants (`primary`, `secondary`, `tertiary`) over visual descriptions
- Composition over configuration (compound components)
- CSS variable-based theming with `oklch` color space
- BEM naming convention for predictable styling

---

## Accessing Documentation & Component Information

**For component details, examples, props, and implementation patterns, always fetch documentation:**

### Using Scripts

```bash
# List all available components
node scripts/list_components.mjs

# Get component documentation (MDX)
node scripts/get_component_docs.mjs Button
node scripts/get_component_docs.mjs Button Card TextField

# Get component source code
node scripts/get_source.mjs Button

# Get component CSS styles (BEM classes)
node scripts/get_styles.mjs Button

# Get theme variables
node scripts/get_theme.mjs

# Get non-component docs (guides, releases)
node scripts/get_docs.mjs /docs/react/getting-started/theming
```

### Direct MDX URLs

Component docs: fetch `.mdx` with a concrete kebab-case slug. Run `node scripts/list_components.mjs` when the slug is unknown, and never fetch a URL that still contains a placeholder.

Examples:

- Button: `https://heroui.com/docs/react/components/button.mdx`
- Modal: `https://heroui.com/docs/react/components/modal.mdx`
- Form: `https://heroui.com/docs/react/components/form.mdx`

Getting started guides: use a concrete topic URL such as `https://heroui.com/docs/react/getting-started/quick-start.mdx`.

**Important:** Always fetch component docs before implementing. The MDX docs include complete examples, props, anatomy, and API references.

---

## Installation Essentials

### Quick Install

```bash
npm i @heroui/styles @heroui/react tailwind-variants
```

### Framework Setup (Vite and React)

For a Vite React application, install Tailwind CSS v4 and its Vite plugin alongside HeroUI:

```bash
npm install @heroui/react @heroui/styles
npm install -D tailwindcss @tailwindcss/vite
```

Add the Tailwind plugin to the existing Vite configuration, alongside the React plugin:

```ts
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({ plugins: [react(), tailwindcss()] });
```

Import the styles in the application's existing CSS file, with Tailwind first:

```css
@import "tailwindcss";
@import "@heroui/styles";
```

Import that CSS file from the existing React entry point. HeroUI v3 needs no provider.
Use the project's existing framework and package manager when working on an existing app.
Vite builds static browser assets that a Go or PocketBase server can serve without Node at runtime.

### Critical Setup Requirements

1. **Tailwind CSS v4 is MANDATORY** - HeroUI v3 will NOT work with Tailwind CSS v3
2. **Use Compound Components** - Components use compound structure (e.g., `Card.Header`, `Card.Content`)
3. **Use onPress, not onClick** - For better accessibility, use `onPress` event handlers
4. **Import Order Matters** - Always import Tailwind CSS before HeroUI styles

---

## Component Patterns

All components use the **compound pattern** shown above (dot-notation subcomponents like `Card.Header`, `Card.Content`). Don't flatten to props — always compose with subcomponents. Fetch component docs for complete anatomy and examples.

---

## Semantic Variants

HeroUI uses semantic naming to communicate functional intent:

| Variant     | Purpose                           | Usage          |
| ----------- | --------------------------------- | -------------- |
| `primary`   | Main action to move forward       | 1 per context  |
| `secondary` | Alternative actions               | Multiple       |
| `tertiary`  | Dismissive actions (cancel, skip) | Sparingly      |
| `danger`    | Destructive actions               | When needed    |
| `ghost`     | Low-emphasis actions              | Minimal weight |
| `outline`   | Secondary actions                 | Bordered style |

**Don't use raw colors** - semantic variants adapt to themes and accessibility.

---

## Theming

HeroUI v3 uses CSS variables with `oklch` color space:

```css
:root {
	--accent: oklch(0.6204 0.195 253.83);
	--accent-foreground: var(--snow);
	--background: oklch(0.9702 0 0);
	--foreground: var(--eclipse);
}
```

**Get current theme variables:**

```bash
node scripts/get_theme.mjs
```

**Color naming:**

- Without suffix = background (e.g., `--accent`)
- With `-foreground` = text color (e.g., `--accent-foreground`)

**Theme switching:**

```html
<html class="dark" data-theme="dark"></html>
```

For detailed theming, fetch: `https://heroui.com/docs/react/getting-started/theming.mdx`
