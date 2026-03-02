---
name: pr-workflow
description: This skill should be used when user asks to "create a PR", "make a pull request", "open PR for this branch", "submit changes as PR", "push and create PR", or runs /create-pr or /pr-creator commands.
---

# Pull Request Workflow

Complete workflow for creating pull requests following project standards.

## Process

1. **Verify staged changes** exist with `git diff --cached --name-only`

2. **Branch setup**
   - If on main/master, create feature branch first: `feature/brief-description` or `fix/brief-description`
   - Use `github-dev:commit-creator` subagent to handle staged changes if needed

3. **Documentation check**
   - Update README.md or docs based on changes compared to target branch
   - For config/API changes, use `mcp__tavily__tavily_search` to verify info and include sources

4. **Analyze all commits**
   - Use `git diff <base-branch>...HEAD` to review complete changeset
   - PR message must describe all commits, not just latest
   - Focus on what changed from reviewer perspective

5. **Create PR**
   - Use `/pr-creator` agent or `gh pr create` with parameters:
     - `-t` (title): Start with capital letter, use verb, NO "fix:" or "feat:" prefix
     - `-b` (body): Brief summary + bullet points with inline markdown links
     - `-a @me` (self-assign)
     - `-r <reviewer>`: Find via `gh pr list --repo <owner>/<repo> --author @me --limit 5`

6. **PR Body Guidelines**
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
