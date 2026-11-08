# Chats, messages and API access

Read the deployed server's `contracts/api.md` and `contracts/agent.md` when an operation is not covered here. Upstream: [OpenDesk contracts](https://github.com/useopendesk/opendesk/tree/main/contracts). Match the deployed commit because endpoint and scope support can change.

## REST

Management requests use `Authorization: Bearer <workspace API key>` and `OD-Workspace: <workspace ID>`. API keys are already workspace-bound. Keep one key per product and only grant the required scopes. Widget public keys and visitor tokens cannot administer the workspace.

Use a secret-aware client that reads the app's ignored `.env` or an environment variable. Do not print authorization headers, interpolate secret values into shell commands, or log full raw responses by default. Retrieve only the requested workspace and conversations.

| Task | Method and path | Scope and request |
| --- | --- | --- |
| Recent chat tickets | `GET /v1/tickets?channel=chat&sort=last_message_at&order=desc&limit=20` | `tickets:read` |
| Ticket details | `GET /v1/tickets/{id}` | `tickets:read` |
| Messages | `GET /v1/tickets/{id}/messages` | `tickets:read`, ascending order |
| Customer reply | `POST /v1/tickets/{id}/messages` | `tickets:write`, `{kind:"reply",body_html:"<p>Approved response</p>"}` |
| Internal note | Same message endpoint | `tickets:write`, `kind:"note"` |
| Status or assignment | `PATCH /v1/tickets/{id}` | `tickets:write`, only the intended changed fields |
| AI settings and bots | `/v1/ai/settings`, `/v1/bots/{id}` | `settings:read` or `settings:write` |
| Knowledge sources | `/v1/ai/knowledge` | `settings:read` or `settings:write` |

Lists normally return `{data,next_cursor}`. Follow the cursor only as far as the requested range requires. Ticket reads can include private internal notes. Summarize relevant details rather than exporting unrelated customer content.

Before sending, re-read the intended ticket and check workspace, recipient, channel and latest message. An internal note and a public reply have different audiences. For an authorized POST, use a unique `Idempotency-Key` for that logical operation, reused with the same route and body on retry. Keys last 24 hours. After an ambiguous failure, inspect the thread before sending again. Do not blindly retry a customer-visible action.

For events, use signed webhooks such as `message.created` and `ticket.created`. Verify the deployed webhook signature contract, deduplicate event IDs, and enqueue work rather than sending duplicate replies from webhook retries.

## MCP

Connect the operator's MCP client to `https://<instance>/mcp` using Streamable HTTP and a workspace-scoped bearer API key or the server's OAuth flow. Keep authentication in the client's secret storage, not tracked configuration. The server is stateless and does not issue `Mcp-Session-Id`. GET and DELETE return 405 by design.

Initialize the connection and call `tools/list` to discover tools allowed by the key. Useful tools include:

- `search_tickets` and `get_ticket` for conversation inspection, requiring `tickets:read`.
- `draft_reply` for an unsent shared draft, `reply_to_ticket` for a public reply, and `add_note` for an internal note, requiring `tickets:write`.
- `update_ticket` for authorized status, assignment and labels.
- `search_knowledge` and `create_kb_draft` for the knowledge base.

MCP reply tools take Markdown `body`. The REST message endpoint takes `body_html`. Discover schemas rather than passing one format to both.

This operator connection is different from `/v1/ai/mcp-servers`, which gives tools to the customer-facing bot. Do not attach the operator's helpdesk administration key or personal connectors to that bot. Enable only intended business tools with the appropriate read, confirmation and verified-visitor policies.

## Existing Akyon Labs deployment

The instance is `https://desk.akyonlabs.com`. MuviSafe, Fast & Rational and My AI Patient each keep current public IDs in their own `support/opendesk.json`, and credentials in their own ignored `.env`. Read these files by field rather than dumping the environment. The setup's knowledge-sync keys have settings and knowledge scopes, so chat inspection may need a separate `tickets:read` key. Do not assume a successful settings request proves ticket permissions.
