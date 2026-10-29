---
name: workers-profiling
description: Profile or debug CPU usage and memory allocation in deployed Cloudflare Workers and Durable Objects. Then use this information to optimize your code.
license: Apache-2.0
---

# Workers profiling

Find expensive functions or memory allocations in deployed code and come up with ways to fix them.

## Retrieve the docs

Start with the [production profiling guide](https://developers.cloudflare.com/workers/observability/profiling-in-production/index.md) to understand how
Workers and Durable Objects profiling works.

## Profiling steps

1. Identify the symptom and affected workload: CPU usage, latency, allocation pressure, or memory growth.
2. Confirm the account, Worker, environment, and deployed version with the user.
3. For a Durable Object, also confirm its owning Worker, namespace, and instance.
4. Choose CPU or heap profiling from the current guide's supported types and meanings.

Where possible, use the [`cf` CLI](https://developers.cloudflare.com/cf/index.md) to capture profiles. If the user requests `cf`, inspect the installed version's command help and schema where available.

If `cf` isn't available, consider prompting the user whether they would like to install it.


The profiling API will return a pprof file which you can analyze directly, or using appropriate tools like Go's `pprof` utility.

## Inspect the evidence

- Read the pprof file and analyse it for hotspots
- Map hotspots to functions and source locations when evidence supports it; report missing symbols or source mappings.
- If filenames and function names are pointing at the generated JavaScript, consider suggesting to the user to enable source maps and re-do the profiling.

## Optimise

Propose the smallest code change supported by the capture which resolves the issues identified.

## Report findings

Return a concise report with:

- Evidence for each finding: file, function, source location, and metric with units, where available.
- The smallest actionable change and how to check its effect.

## Skill feedback

If the user reports that this skill gave incorrect or outdated guidance, or is missing information, read [references/skill-feedback.md](references/skill-feedback.md).
