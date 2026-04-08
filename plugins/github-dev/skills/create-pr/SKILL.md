---
name: create-pr
description: This skill should be used when user asks to "create a PR", "make a pull request", "open PR for this branch", "submit changes as PR", "push and create PR", or explicitly invokes "create-pr".
---

# Create PR

Complete workflow for creating pull requests following project standards.

When explicitly invoked with extra text, treat that text as additional context for branch
naming, commit context, and PR title and body generation.

## Process

1. **Preferred execution**
   - If subagents are available, use `github-dev:pr-creator` for the full workflow.
   - Pass along any extra invocation text as additional context.
   - Otherwise follow the manual steps below.

2. **Verify staged changes** exist with `git diff --cached --name-only`

3. **Branch setup**
   - If on main/master, create feature branch first: `feature/brief-description` or `fix/brief-description`
   - Use `github-dev:commit-creator` subagent to handle staged changes if needed

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
     - `-t` (title): Start with capital letter, use verb, NO "fix:" or "feat:" prefix
     - `-b` (body): Brief summary + bullet points with inline markdown links
     - `-a @me` (self-assign)
     - `-r <reviewer>`: Only add if the user explicitly asks OR recent PRs by this author have reviewers.
       Check with: `gh pr list --repo <owner>/<repo> --author @me --limit 5 --json reviewRequests`
       If recent PRs have no reviewers, skip `-r` entirely.

7. **PR Body Guidelines**
   - Single section, no headers if possible. Very concise
   - Few bullet points + 1 CLI/usage snippet or simple before/after snippet
   - No test plans, no changed file lists, no line-number links

## Examples

### CLI snippet:

```
Add compare command for side-by-side model comparison

- Run multiple models on same images with `--models` and `--phrases` flags
- Horizontal panel concatenation with model name headers

`ultrannotate compare --source ./images --models sam3.pt,yoloe-26x-seg.pt --phrases "person,car"`
```

### Before/after:

```
Inline single-use variables in compare_models

- xyxy2xywhn handles empty arrays, guard unnecessary
- Use function reference for draw dispatch

Before: `boxes = result.get(...); ops.xyxy2xywhn(boxes, ...)`
After: `ops.xyxy2xywhn(result.get(...), ...)`
```
