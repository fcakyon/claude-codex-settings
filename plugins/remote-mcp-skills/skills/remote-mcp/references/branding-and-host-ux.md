# Branding and host UX

Set `serverInfo.name` to a stable machine identifier and `title` to the product name. Give it a one-sentence `description`, a semver `version` and a public HTTPS `websiteUrl`. Serve `icons` with explicit `src`, `mimeType` and `sizes`. Supply PNGs at 180, 192 and 512 pixels plus an SVG with size `any`. Use URLs the host can fetch without a session and preserve a favicon at the site root. [MCP server discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)

Keep the first paragraph of `instructions` at or below 512 characters and make it stand on its own. State what the connector does and the first tool that helps the user get there. Put less common workflows and tool-specific behavior in later paragraphs and tool descriptions.

## Profile and intent

- Expose an authenticated read-only `whoami` (or equivalent) with an empty input object, an `outputSchema`, and `_meta["openai/profile"] = true`. Return a stable opaque profile ID in `structuredContent.id` with optional `name`, `email` or `nickname` for display. Include the same JSON as a text content item for older clients. Check two distinct test accounts and verify that reconnecting the same account returns the same ID. Host display also depends on feature availability. [OpenAI profile tool requirements](https://developers.openai.com/plugins/build/auth)
- Give each tool a human-readable `title`, a precise description and explicit `readOnlyHint`, `destructiveHint` and `openWorldHint` annotations. Set `readOnlyHint` for reads, `destructiveHint` for changes that can erase or replace existing data, and `openWorldHint` for operations that reach beyond the service's closed domain. Publish `securitySchemes` for hosts that use them and mirror them in `_meta.securitySchemes` for older readers. Enforce authentication and access on the server. [MCP tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)

## Host compatibility checks

These are deployment observations to verify on your current host build.

| Symptom | Check |
| --- | --- |
| ChatGPT lists a custom developer-mode connector under `Category: Other` | The custom connector category has been assigned by the host. Changing the MCP title or description should be tested independently of category. |
| ChatGPT's connector editor has no icon edit control after creation | Check the icon at creation time, then compare a fresh test registration with the existing connection. Preserve users' existing installs when testing. |
| Claude shows a text result and hides the interactive view | A deployment observed this near 150,000 serialized result characters. Retest with the small result size in the [UI guide](mcp-apps-ui.md) and verify `resources/read` separately. |
| Claude displays the website favicon | Check the `serverInfo.icons` URLs and MIME types and keep the favicon reachable as a fallback. |

Capture the host, build, protocol revision and result size when reporting a compatibility issue. [Claude custom connectors](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp)
