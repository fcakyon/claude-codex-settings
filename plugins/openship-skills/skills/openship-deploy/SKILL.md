---
name: openship-deploy
description: This skill should be used when the user asks to "deploy with OpenShip", "manage a self-hosted OpenShip instance", "debug an OpenShip deployment", or manage its domains, storage, backups, or upgrades through the CLI.
---

# Deploy and operate OpenShip

Prefer the CLI and an existing self-hosted instance. Use a cloud or desktop workflow when the user requests it. Keep application deployments separate from installing or upgrading the OpenShip control plane.

## Choose the instance and command

- Check `openship --version` and `openship context list`. Select the intended self-hosted context before a remote operation. Never assume the active context points to the user's server.
- Use native commands with the global `--json` flag. Read [CLI access](references/cli/access.mdx) for context and authentication details. Do not print stored tokens.
- Check the installed command's `--help`. Use `openship api` for routes without a working command, after checking the matching implementation. In v0.7.2, `service exec` and `server ssh` are stubs despite appearing in help. A successful help command does not prove an operation works.
- [upstream.json](references/upstream.json) records the bundled release, exact source URLs, and hashes. If the installed CLI or server differs, verify the relevant source at that version before relying on a flag or API contract.

## Deploy an application

1. Inspect the repository, existing project link, build entry point, service topology, persistent volumes, and current domain ownership. Use [projects and services](references/cli/projects.mdx) for commands.
2. Use the companion `openship-config` skill to author a small `openship.json`. When only this ZIP is installed, use the [official config guide](https://openship.io/docs/guides/openship-json). Keep repeatable build and routing choices in the repository. Keep actual credentials in the instance's environment settings.
3. Run `openship --json config validate`, then use [deployment commands](references/cli/deploy.mdx) for the appropriate repository or folder deploy. A valid file does not prove its image builds or that the destination has sufficient capacity.
4. Check deployment completion, the active deployment, service health, logs, and the public URL. Report the deployed revision and any checks still pending. Use [edge and monitoring](references/cli/edge.mdx) for diagnosis.

Read only the guide needed for the operation:

- [Self-hosted GitHub App](references/guides/self-hosted-github-app.mdx): repository authorization and automatic deployment.
- [Domains](references/guides/custom-domains.mdx): ownership, DNS, ports, and HTTPS. Reconcile existing ownership before moving a hostname.
- [Persistent storage](references/guides/persistent-storage.mdx): volumes and data that must survive redeployment.

## Maintain the self-hosted instance

Use [self-host infrastructure](references/cli/self-host.mdx) for servers and backups, and [running OpenShip](references/cli/run.mdx) for lifecycle commands. Inspect how the instance was installed and whether it has a custom updater before selecting an upgrade command.

- [Updates](references/guides/updating.mdx): CLI and server lifecycle.
- [Backups and restore](references/guides/backups-restore.mdx): protection and recovery of application data.
- [Instance migration](references/guides/migrate-control-plane.mdx): control-plane export and import.

Use the user's existing authorization for the requested operation. Preparing a deployment is not authorization to replace a running instance or restore over its data.
