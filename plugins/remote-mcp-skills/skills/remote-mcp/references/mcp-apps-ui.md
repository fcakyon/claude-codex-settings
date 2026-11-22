# MCP Apps UI

Advertise the native `io.modelcontextprotocol/ui` extension and serve MCP Apps resource content as `text/html;profile=mcp-app`. The iframe bridge protocol revision is `2026-01-26`. MCP transport version negotiation happens independently. [MCP Apps specification](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx)

## Build and serve the view

1. Use `@modelcontextprotocol/ext-apps`, its `@modelcontextprotocol/client` peer and `vite-plugin-singlefile`. Build the widget entry as one HTML file with JS and CSS inline. Inspect the actual output for asset URLs that still require a dev server. Import only plain helpers from the main web app, because one component module can pull its whole UI library into the bundle. Grep the built file for that library's name.
2. Derive `ui://<app>/<view>-<hash>.html` from the HTML content. Declare it as a resource. Use a template such as `ui://example/report-{build}.html` to resolve recently issued URLs during rolling deploys. Serve the matching immutable build when available. Use the current bundle as fallback only if it understands the previous tool result shape.
3. Set both `_meta.ui.resourceUri` and `_meta["ui/resourceUri"]` to that URI on the tool definition. Include metadata under `_meta.ui` on the resource contents from `resources/read`. Set `csp.connectDomains` for fetch endpoints and `csp.resourceDomains` for external assets. Use exact origins and empty arrays for a fully inline view. Set `prefersBorder: true` when the view needs separation from the chat. [MCP Apps resource and tool metadata](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx#resource-discovery)

## Bridge lifecycle

Use React `useApp` and `useHostStyles` for the bridge and host styling. Install `ontoolinput`, `ontoolresult`, cancellation and context-change listeners in `onAppCreated`. The first tool result can arrive before mount effects. Declare `availableDisplayModes: ["inline", "fullscreen"]` when the view supports both, and check the host's available modes before asking for fullscreen. [MCP Apps SDK](https://modelcontextprotocol.github.io/ext-apps/api/)

- Use `callServerTool` for follow-up reads or user-initiated actions through the authenticated bridge.
- Append a Load more page because the view asked for one, never because the result echoes an offset, since a server may omit it. Dedupe items by ID, and replace the view and reset its filters when the parent record changes.
- Use `updateModelContext` for small facts that should inform the next turn and `openLink` for explicit user navigation. Check host support and handle a declined request.
- Keep model-visible output and view metadata small. Aim for at most 100,000 serialized result characters across `content`, `structuredContent` and `_meta`. Page lists, cap page size server-side and strip word-timing arrays from transcript previews. Preserve stable record IDs and cursors for follow-up reads.
- Serve heavy media through short-lived signed view links scoped to the grant and object. Return a reference in the tool result, fetch from an allowed origin, and renew through an authorized tool call on expiry without resetting the current view. Leave signed URLs out of model-visible text and logs.

## Host theme

Map the host's style variables onto your own tokens with your palette as the fallback, for example `--color-canvas: var(--color-background-primary, light-dark(#f5f2ed, #0e0d0c))` in a Tailwind v4 `@theme inline` block. Without `color-scheme: light dark` on `:root`, `light-dark()` always picks the light value. Keep the brand accent out of the host mapping so the host cannot recolor it. Check the view from 360 px wide to fullscreen with no horizontal overflow, and apply the host's `safeAreaInsets` as padding. [MCP Apps host context](https://modelcontextprotocol.github.io/ext-apps/api/)
