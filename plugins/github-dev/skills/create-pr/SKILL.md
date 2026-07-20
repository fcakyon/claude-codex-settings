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
   - Open on why it exists, not "This PR...".
   - Show, don't list: a `diff`, a before/after, or a CLI snippet they can run.
   - Numbers win: benchmarks, counts, speedups, comparisons over adjectives.
   - One read, one section. No headers, no bullet dump.
   - Plain words, no buzzwords. No test plans, file lists, or line links.

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
