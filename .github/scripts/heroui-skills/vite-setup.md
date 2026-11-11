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
