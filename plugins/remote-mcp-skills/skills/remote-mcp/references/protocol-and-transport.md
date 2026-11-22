# Protocol and transport

Use one public HTTPS endpoint at `/mcp`. For a JSON-only deployment with the Go SDK, set `Stateless: true` and `JSONResponse: true`. Each POST is independent and can land on any replica. The 2026-07-28 revision removes transport sessions and the standalone GET stream. It still allows SSE scoped to one POST. Choose JSON when your tools can complete within a request and your target connectors expect a JSON reply. [Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)

| Wire behavior | 2026-07-28 | Earlier Streamable HTTP clients |
| --- | --- | --- |
| Discover server | `server/discover` | `initialize` and `notifications/initialized` |
| Client context | `params._meta` carries protocol version, client info and capabilities on each request | Initialization carries client context |
| Routing headers | `MCP-Protocol-Version` matches body metadata. `Mcp-Method` matches the method. `Mcp-Name` matches the tool name, prompt name or resource URI for named operations | Send the negotiated version after initialization |
| JSON-only endpoint | POST returns JSON without a session ID. GET and DELETE return 405 after authentication | Keep the legacy handshake working in stateless mode and check the same methods |

Test both revisions over the public proxy. The SDK handles legacy initialization while running statelessly. If a connector identifying itself as `openai-mcp/1.0.0` fails to open or resume a stateful stream, compare the same calls through stateless JSON. An in-memory session ID ties requests to one process. Routing a later call to another container or restarting the first one can strand that session. Proxies can also buffer or time out a long-lived stream. Treat the user-agent string as a diagnostic hint and inspect the actual request headers. [Discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)

## Edge and authentication order

1. Pin the public origin and hostname in server configuration. Reject every present `Origin` outside an exact allowlist with 403. Accept an absent Origin for server-to-server clients. Reject `null` and multiple Origin values.
2. Keep the SDK's localhost protection for local servers. When a trusted reverse proxy connects over loopback with the configured public Host, `DisableLocalhostProtection: true` lets the SDK accept that topology. Put the explicit Origin check and bearer middleware in front of the SDK.
3. Mount the same wrapped handler for POST, GET and DELETE. Without a token, each verb returns `401` with `WWW-Authenticate: Bearer resource_metadata="https://example.com/.well-known/oauth-protected-resource/mcp"`. With a valid token, GET and DELETE return `405` with `Allow: POST`. Verify those headers on the deployed edge.
4. For an existing endpoint alias, mount the same wrapped handler at both paths. Forward the POST body in place. Advertise a canonical resource and publish metadata for the alias. Keep already-issued audience bindings valid during the migration and verify an old install alongside a fresh one.

## Caching

For discovery, tool catalogs and static HTML that are identical for all callers, use `ServerOptions.SetCacheable` to set `c.TTLMs, c.CacheScope = 300000, "public"`. Keep that callback limited to public metadata and views. Use private scope or zero TTL for grant-specific metadata and results. Treat this as MCP client cache metadata and configure intermediary HTTP caching separately. [MCP caching](https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/caching)
