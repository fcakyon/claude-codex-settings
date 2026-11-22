---
name: remote-mcp
description: This skill should be used when user asks to "build a remote MCP server", "add MCP OAuth", "build an MCP App UI", "fix ChatGPT or Claude connector issues", or "support MCP 2026-07-28".
---

# Remote MCP

Build a connector that signs users into the right account, returns useful tool results, and keeps working across hosts and deploys.

1. Find the public MCP URL, the authorization server, and the protocol revisions your hosts send. For an existing connector, capture status codes, headers and method names with credentials removed. Follow a request from the public edge to the handler before changing transport or OAuth.
2. Serve an authenticated, stateless JSON endpoint. Check anonymous discovery, authorization and the negotiated protocol before debugging individual tools. Keep any URLs already installed in users' settings working.
3. Give tools clear titles, observable results and accurate side-effect annotations. For account connections, return a stable opaque profile ID from the authenticated grant. When a tool opens a view, verify the advertised resource loads independently of the tool call.
4. Run HTTP checks against a disposable instance with a real test account and test grants. Then open the connector in each supported host and check connection, account identity, the first rendered result, an interactive action and reconnect. Use the `qa` plugin's `qa.mcp` helpers when the project uses Project QA.

## References

- [Protocol and transport](references/protocol-and-transport.md) covers stateless HTTP, old clients, proxies and cache scope.
- [OAuth and security](references/oauth-and-security.md) covers metadata, client registration, token rotation and trust boundaries.
- [Branding and host UX](references/branding-and-host-ux.md) covers identity, profile tools, tool annotations and host-specific symptoms.
- [MCP Apps UI](references/mcp-apps-ui.md) covers the view build, resource metadata, bridge lifecycle and payload limits.
- [Dependencies and schemas](references/dependencies-and-schemas.md) lists verified pins and minimal Go and TypeScript examples.
