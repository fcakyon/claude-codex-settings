# View Transitions in Next.js

## Setup

`<ViewTransition>` works out of the box for `startTransition`/`Suspense` updates. To also animate `<Link>` navigations:

```js
// next.config.js
const nextConfig = {
  experimental: { viewTransition: true },
};
module.exports = nextConfig;
```

This wraps every `<Link>` navigation in `document.startViewTransition`. Any VT with `default="auto"` fires on **every** link click — use `default="none"` to prevent competing animations.

Requires `react@canary`: `npm install react@canary react-dom@canary`

---

## Next.js Implementation Additions

When following `implementation.md`, apply these additions:

**After Step 2:** Enable the experimental flag above.

**Step 4:** Use `transitionTypes` on `<Link>` instead of manual `addTransitionType`:

```tsx
<Link href="/photo/1" transitionTypes={["nav-forward"]}>View</Link>
<Link href="/" transitionTypes={["nav-back"]}>Back</Link>
```

Reserve `startTransition` + `addTransitionType` for programmatic navigation (buttons, forms).

**After Step 6:** For same-route dynamic segments (e.g., `/collection/[slug]`), use the `key` + `name` + `share` pattern — see Same-Route Dynamic Segment Transitions below.

---

## Layout-Level ViewTransition

**Do NOT add a layout-level VT wrapping `{children}` if pages have their own VTs.** Both fire simultaneously, producing competing animations.

A bare `<ViewTransition>` in layout works only if pages have **no** VTs of their own. Once any page adds a VT, use `default="none"` on the layout VT or remove it.

**Layouts persist across navigations** — `enter`/`exit` only fire on initial mount, not on route changes. Don't use type-keyed maps in layouts.

```tsx
// Prevents layout from interfering with per-page VTs
<ViewTransition default="none">{children}</ViewTransition>
```

---

## The `transitionTypes` Prop on `next/link`

Native prop — no wrapper component needed, works in Server Components:

```tsx
<Link href="/products/1" transitionTypes={['transition-to-detail']}>View Product</Link>
```

Replaces the manual pattern of `onNavigate` + `startTransition` + `addTransitionType` + `router.push()`. Reserve manual `startTransition` for non-link interactions (buttons, forms).

---

## Programmatic Navigation

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { startTransition, addTransitionType } from 'react';

function handleNavigate(href: string) {
  const router = useRouter();
  startTransition(() => {
    addTransitionType('nav-forward');
    router.push(href);
  });
}
```

---

## Directional Navigation

Place type-keyed VTs in **page components** (not layouts):

```tsx
<ViewTransition
  default="none"
  enter={{ 'nav-forward': 'slide-from-right', 'nav-back': 'slide-from-left', default: 'none' }}
  exit={{ 'nav-forward': 'slide-to-left', 'nav-back': 'slide-to-right', default: 'none' }}
>
  <PageContent />
</ViewTransition>
```

### Two-Layer Pattern

Directional slides + Suspense reveals coexist because they fire at different moments:

```tsx
<ViewTransition
  enter={{ "nav-forward": "slide-from-right", default: "none" }}
  exit={{ "nav-forward": "slide-to-left", default: "none" }}
  default="none"
>
  <div>
    <Suspense fallback={<ViewTransition exit="slide-down"><Skeleton /></ViewTransition>}>
      <ViewTransition enter="slide-up" default="none"><Content /></ViewTransition>
    </Suspense>
  </div>
</ViewTransition>
```

---

## Shared Elements Across Routes

```tsx
// List page
{products.map((product) => (
  <Link key={product.id} href={`/products/${product.id}`} transitionTypes={['nav-forward']}>
    <ViewTransition name={`product-${product.id}`}>
      <Image src={product.image} alt={product.name} width={400} height={300} />
    </ViewTransition>
  </Link>
))}

// Detail page — same name
<ViewTransition name={`product-${product.id}`}>
  <Image src={product.image} alt={product.name} width={800} height={600} />
</ViewTransition>
```

---

## Same-Route Dynamic Segment Transitions

When navigating between dynamic segments of the same route (e.g., `/collection/[slug]`), the page stays mounted — enter/exit never fire. Use `key` + `name` + `share`:

```tsx
<Suspense fallback={<Skeleton />}>
  <ViewTransition key={slug} name={`collection-${slug}`} share="auto" default="none">
    <Content slug={slug} />
  </ViewTransition>
</Suspense>
```

- `key={slug}` forces unmount/remount on change
- `name` + `share="auto"` creates a shared element crossfade
- VT inside `<Suspense>` (without keying Suspense) keeps old content visible during loading

---

## Suspense and Loading States

```tsx
<Suspense fallback={<ViewTransition exit="slide-down"><Skeleton /></ViewTransition>}>
  <ViewTransition default="none" enter="slide-up"><PageContent /></ViewTransition>
</Suspense>
```

Don't combine with a layout-level VT using `default="auto"`.

---

## Server Components

- `<ViewTransition>` works in both Server and Client Components
- `<Link transitionTypes>` works in Server Components — no `'use client'` needed
- `addTransitionType` and `startTransition` for programmatic nav require Client Components
