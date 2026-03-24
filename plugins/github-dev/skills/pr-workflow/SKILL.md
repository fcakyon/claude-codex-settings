---
name: pr-workflow
description: "Create pull requests by verifying changes, setting up branches, analyzing commits, and generating PR titles and bodies following project conventions. Use when the user asks to create a PR, make a pull request, open a PR for a branch, submit changes as PR, or runs /create-pr or /pr-creator commands."
---

# Pull Request Workflow

## Process

1. **Verify staged changes** exist with `git diff --cached --name-only`

2. **Branch setup**
   - If on main/master, create feature branch: `feature/brief-description` or `fix/brief-description`
   - Use `github-dev:commit-creator` subagent to handle staged changes if needed

3. **Documentation check**
   - Update README.md or docs based on changes compared to target branch
   - For config/API changes, use `mcp__tavily__tavily_search` to verify info and include sources

4. **Analyze all commits**
   - Review complete changeset: `git diff <base-branch>...HEAD`
   - PR message must describe all commits, not just the latest
   - Focus on what changed from reviewer perspective

5. **Create PR**
   Use `/pr-creator` agent or `gh pr create` with these parameters:
   - `-t` (title): Start with capital letter, use verb, NO "fix:" or "feat:" prefix
   - `-b` (body): Brief summary + bullet points with inline markdown links
   - `-a @me` (self-assign)
   - `-r <reviewer>`: Find via `gh pr list --repo <owner>/<repo> --author @me --limit 5`

6. **PR body guidelines**
   - Single section, no headers if possible, very concise
   - Few bullet points + 1 CLI/usage snippet or simple before/after snippet
   - No test plans, no changed file lists, no line-number links

## Examples

### CLI snippet style:

```
Add compare command for side-by-side model comparison

- Run multiple models on same images with `--models` and `--phrases` flags
- Horizontal panel concatenation with model name headers

`ultrannotate compare --source ./images --models sam3.pt,yoloe-26x-seg.pt --phrases "person,car"`
```

### Before/after style:

```
Inline single-use variables in compare_models

- xyxy2xywhn handles empty arrays, guard unnecessary
- Use function reference for draw dispatch

Before: `boxes = result.get(...); ops.xyxy2xywhn(boxes, ...)`
After: `ops.xyxy2xywhn(result.get(...), ...)`
```
