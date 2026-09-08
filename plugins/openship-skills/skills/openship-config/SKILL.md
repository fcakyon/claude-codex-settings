---
name: openship-config
description: This skill should be used when the user asks to "create openship.json", "configure an OpenShip deployment", "make a repo deployable on OpenShip", or fix "openship config validate" errors.
---

# Design openship.json

Use OpenShip's upstream configuration workflow: inspect the repo, declare only necessary overrides, then validate. Auto-detection supplies omitted fields. Prefer self-hosted deployment unless the user selects cloud.

## Design the configuration

1. Inspect package scripts, lockfiles, framework settings, Dockerfiles, compose files, workspace layout, and an existing `openship.json`.
2. Choose a single app, compose services, or detected monorepo apps. Do not combine those shapes casually. `monorepo.apps` overrides detected apps by root directory. It does not discover new applications.
3. Read [fields](references/fields.md) for names and meanings and the bundled [JSON schema](references/openship.schema.json) for editor validation. Use [compose guidance](references/compose-multi-service.mdx) for service topology, ports, dependencies, and persistent volumes.
4. Start with `openship config init` only when the file is absent. Preserve an existing config and add only values that need to override detection. Keep its `$schema` set to `https://openship.io/openship.schema.json`.
5. Run `openship --json config validate` using the deployment's CLI version. Fix errors and review warnings: unknown keys can be ignored by the runtime even though the editor schema rejects them.

A minimal server config can be:

```json
{
  "$schema": "https://openship.io/openship.schema.json",
  "port": 3000,
  "runtime": "docker",
  "domains": ["app.example.com"]
}
```

## Self-hosted details

- Self-hosted defaults to unlimited resources in the bundled release. Declare caps only when intended. Service-level caps override project caps field by field. Check target capacity separately from local config validation.
- Use named persistent volumes for state that must survive an application deploy. Expose only the services intended to receive public traffic.
- Keep actual secret values out of committed JSON. `secret: true` controls storage handling after ingestion. It does not encrypt a credential in a Git file. Read [environment variables](references/environment-variables.mdx) for instance-managed values.
- `openship.json` expresses desired configuration. It does not prove an existing domain has moved or the running deployment has changed. The companion `openship-deploy` skill handles deployment and live verification.

## Source and version

The workflow and [field reference](references/fields.md) derive from the official upstream config skill. [upstream.json](references/upstream.json) records the release and links to its CLI validator, runtime parser, types, parser tests, and deployment preparation code. Consult those sources when docs disagree or a behavior depends on the installed version. The parser and actual deployment implementation decide runtime behavior. The JSON schema serves editor validation.

Read the [configuration guide](references/openship-json.mdx) for additional examples. Do not copy example credentials into a repository.
