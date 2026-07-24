---
name: create-pr
description: This skill should be used when user asks to "create a PR", "make a pull request", "open PR for this branch", "submit changes as PR", "push and create PR", or explicitly invokes "create-pr".
---

# Create PR

Complete workflow for creating pull requests following project standards.

When explicitly invoked with extra text, treat that text as additional context for branch
naming, commit context, and PR title and body generation. Compress it into a short
plain-language branch name rather than copying the full text.

## Process

**First, run the `/simplify` skill on the staged diff and apply its findings before committing. Docs-only diffs are a no-op.**

1. **Preferred execution**
   - If subagents are available, use `github-dev:pr-creator` for the full workflow.
   - Pass along any extra invocation text plus session findings and motivation as additional context.
   - Otherwise follow the manual steps below.

2. **Verify staged changes** exist with `git diff --cached --name-only`

3. **Branch setup**
   - If on main/master, create a short branch first: `feature/short-topic`, `fix/short-topic`, or `docs/short-topic`
   - Keep the branch suffix to 2-4 short words
   - Avoid long, overly specific, or sentence-like branch names
   - Use `github-dev:commit-creator` subagent to handle staged changes if needed, and pass session findings and motivation into the commit context

4. **Documentation check**
   - Update README.md or docs based on changes compared to target branch
   - For config/API changes, use `mcp__tavily__tavily_search` to verify info and include sources

5. **Analyze all commits**
   - Use `git diff <base-branch>...HEAD` to review complete changeset
   - PR message must describe all commits, not just latest
   - Focus on what changed from reviewer perspective

6. **Create PR**
   - Use `gh` for GitHub operations and `git` only for local branch management
   - Use `github-dev:pr-creator` or `gh pr create` with parameters:
     - `-t` (title): a short human headline, capital first letter, no `fix:` or `feat:` prefix.
       Lead with the outcome in plain words, one idea not a list of everything the branch touched.
       Punchy beats exhaustive. A title is a headline, not a summary.
       Robotic: `Align Claude Code install commands to the CLI form and tidy humanize docs`
       Cooler: `Put Claude Code on the same install CLI as everything else`
     - `-b` (body): write it like a sharp teammate would, not a changelog. See PR Body Guidelines below.
     - `-a @me` (self-assign)
     - `-r <reviewer>`: Only add if the user explicitly asks OR recent PRs by this author have reviewers.
       Check with: `gh pr list --repo <owner>/<repo> --author @me --limit 5 --json reviewRequests`
       If recent PRs have no reviewers, skip `-r` entirely.

7. **PR Body Guidelines**
   - One-line why it exists, not "This PR...". No second intro paragraph.
   - Three bullets max, one point each, under ~12 words. Need a fourth? You are over-explaining, cut it.
   - Lead with the most visual proof, don't just describe it. A webpage, UI, or design change MUST carry before/after images in a two-column table, never text describing the change. Benchmarks get a table, anything else gets a `diff` or runnable CLI snippet.
   - Numbers win: put benchmarks, counts, speedups and comparisons in a markdown table, not a paragraph.
   - One read, one section, no headers. Plain words, no buzzwords, no test plans or file lists.
   - **Embedding images**: never commit them into the repo. Upload to a release and link that URL, which outlives the branch:
     ```bash
     gh release upload <tag> before.png after.png --clobber
     # ![before](https://github.com/OWNER/REPO/releases/download/<tag>/before.png)
     ```
     Capture both shots at the same window size so the pair is comparable. Release assets serve as `application/octet-stream`, so `curl -sI` looks wrong even when fine. Open the PR and confirm the images render.

## Examples

### Why-first with a diff

````
Codex, Cursor, and Gemini each install from their own CLI. Claude Code was the odd one out on the in-REPL slash form, so this lines everyone up.

```diff
- /plugin install fable-advisor@claude-settings
+ claude plugin install fable-advisor@claude-settings
```

Same swap across all 30 plugin tables. No behavior change, just one house style everywhere.
````

### CLI snippet

```
Add a compare command for side-by-side model runs

Point it at a folder and a few models and it stitches the panels together, so you can eyeball which one wins without juggling tabs.

`ultrannotate compare --source ./images --models sam3.pt,yoloe-26x-seg.pt --phrases "person,car"`
```

### Design change, before and after

```
The install panel only ever printed Codex commands, even though the site lists four tools.

| before | after |
|---|---|
| ![before](https://github.com/fcakyon/claude-codex-settings/releases/download/v2.4.0/install-panel-before.png) | ![after](https://github.com/fcakyon/claude-codex-settings/releases/download/v2.4.0/install-panel-after.png) |

- marketplace setup is its own step, shown only for tools that need one
- unsupported plugins say so instead of a dead command
```
