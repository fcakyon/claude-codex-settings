# Product workspaces, AI and knowledge

## Configuration

Discover existing resources before creating duplicates. Under `/v1`, list `/brands`, `/widgets` and `/bots` in the selected workspace. Patch their IDs, then read back the result. A new workspace creates defaults that can be renamed.

- `PATCH /brands/{id}`: name, color and locale. Upload `logo`, `help_center_logo` or `help_center_favicon` with multipart `file` to `PUT /brands/{id}/images/{kind}`.
- `PATCH /widgets/{id}`: `bot_id` and `settings`, including `allowed_origins`, `position`, `offset_x`, `offset_y`, theme and sound. Keep exact production origins. Remove local test origins after verification.
- `PUT /bots/{id}/image`: multipart `file`. `PATCH /bots/{id}` sets name, language and personality. Put instructions under `personality.instructions`, at most 4,000 characters. An empty bot language follows the customer.
- Keep a recognizable chat-bubble launcher. Use product logos inside the panel and for the bot. Custom widget `avatar` or `launcher` images use `PUT /widgets/{id}/images/{kind}` and `DELETE` to restore defaults.

Choose offsets against the actual mobile footer, cookie banner and main action. Avoid copying a desktop offset to every app. Use native translated greetings when possible. Test keyboard focus, contrast, light/dark mode, language switching and RTL layout.

## AI provider

Inspect `GET /ai/config` and the instance environment first. An instance can provide Anthropic through server-held `ANTHROPIC_API_KEY`, `AI_PROVIDER=anthropic`, `AI_MODEL` and `AI_FAST_MODEL`. Verify the chosen model with the provider and a real playground response.

For workspace-specific credentials, `POST /ai/provider/test` tests a provider and `PUT /ai/provider` saves `{kind:"anthropic",api_key,model,fast_model}`. These routes can return `404 ai_disabled` when the instance has no AI enabled. Read the deployed version's contract before changing its provider ownership.

`PATCH /ai/settings` controls `model`, `fast_model`, `widget_model`, `widget_answers`, `widget_max_replies`, `widget_collect_email` and `reply_language`. For direct human handoff without collecting an email first, set `widget_collect_email:false`. Set `reply_language:"customer"` for multilingual replies.

Akyon Labs currently uses the owner's shared Anthropic key and `claude-haiku-5-5` on the OpenDesk backend. Follow the user's credential choice. Key presence and a successful answer do not prove subscription credit eligibility or a remaining credit balance. Do not change billing or enable automatic top-ups as part of setup.

## Repository knowledge

Store public product facts, supported workflows and limits in `support/knowledge.txt`. Store persona, language behavior, refusal boundaries and human handoff instructions separately in `support/instructions.txt`. `support/opendesk.json` has this shape:

```json
{
  "url": "https://desk.example.com",
  "workspaceId": "workspace-id",
  "brandId": "brand-id",
  "widgetId": "widget-id",
  "botId": "bot-id",
  "widgetKey": "public-widget-key"
}
```

The bundled sync command uploads a content-hashed TXT source to `/ai/knowledge/files`, waits for `ready`, patches the bot instructions, then removes older sources bearing its `Repository knowledge ` prefix. Reserve that prefix for this publisher, with one publisher per workspace. Other knowledge sources are untouched. A failed indexing job keeps the previous source. Run only one sync at a time per workspace to avoid competing updates.

For automatic updates, copy `scripts/sync-support.mjs` into `scripts/` and install [support-openship.yml](../assets/support-openship.yml) as `.openship/workflows/support.yml` (or [support-github.yml](../assets/support-github.yml) as `.github/workflows/support.yml`). Isolating support sync from PR CI keeps `OPENDESK_API_KEY` (`settings:read`, `settings:write`) off untrusted pull requests and avoids full app builds on docs changes. Register `.openship/workflows/support.yml` with `OPENDESK_API_KEY` on OpenShip (or Actions secrets on GitHub), serialize per-workspace runs without cancelling in-flight uploads, keep runtime secrets out of container build arguments, and fail nonzero on sync errors. A tracked file or manual sync alone does not establish automatic updates.

Use `support/questions.json` entries such as:

```json
[{"id":"wrong-product","question":"Can this app filter movies?","expected":"Explain this product's scope without borrowing another product's features."}]
```

Review each returned answer, citations and `handoff` against the rubric. Include real facts, unsupported pricing or live-data claims, several languages, private data, injection and escalation. Keep questions synthetic. The playground runs actual model calls with `{settings:{bot_id},messages:[{role:"visitor",text}]}` at `/ai/agent/playground`, limited to 30 per user per minute.

## Website sources and help center

For public pages, create `/ai/knowledge` with `{kind:"website",name,website:{url,max_pages,include,exclude,recrawl:"weekly"}}`. Include/exclude entries are path prefixes. Inspect `/ai/knowledge/{id}` status and `/docs` results. Trigger a bounded manual refresh with `POST /ai/knowledge/{id}/sync`, respecting `409` when already syncing.

Weekly website recrawling is separate from Git repository sync. Keep login pages, account routes and customer material out. Curated repository facts should not contradict crawled pages. A public knowledge base uses `/kb/*` collections and published articles, distinct from private AI knowledge sources. Enable a help center only when its intended public content is ready.
