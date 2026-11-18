---
name: modern-web-guidance
description: This skill should be used when a browser API, HTML, CSS or accessibility behavior affects an implementation or verification decision, or when the user asks to "check browser compatibility" or "scan legacy web patterns".
license: Apache-2.0
---

# Modern Web Guidance

Use GoogleChrome’s guides for a specific platform question. For example, when a form displays a validation error, find out when browsers expose the message to assistive technology. For React rendering, product copy and application state, follow the project’s existing guidance.

Run the bundled launcher by its path inside this skill. Keep the working directory in the project so the CLI can read its browser policy. Node 22+ and npm are required. The launcher uses the exact release version from its package manifest. The first call downloads it into npm's cache. The vendor sync checks the npm lockfile integrity. The launcher disables its telemetry.

```sh
"$skill_dir/scripts/guidance" search "announce form errors"
"$skill_dir/scripts/guidance" retrieve accessible-error-announcement
```

Set `skill_dir` to this SKILL.md's parent directory. Retrieve the closest applicable guide. Stop once it answers the question. Check the project's supported browsers, existing components and the fallback guidance. Use `retrieve` to read guide content so the project’s policy for volatile and origin-trial features is applied. The tracked `guides/` files let maintainers inspect upstream release changes. Run `legacy-scan <path> --json` for a requested legacy-pattern audit. Its findings cover a subset of the guides.

Turn the relevant behavior into an observable outcome in the project's existing journey. For a keyboard form error, exercise submission, focus recovery, correction and successful saving.

The guide corpus and CLI come from the [GoogleChrome release](https://github.com/GoogleChrome/modern-web-guidance/releases). The marketplace maintains this entry point. [Upstream skill and compatibility policy](https://github.com/GoogleChrome/modern-web-guidance/tree/main/skills/modern-web-guidance)
