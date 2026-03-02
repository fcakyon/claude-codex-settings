# Claude Command: Update PR Summary

Update PR description with automatically generated summary based on complete changeset.

## Usage

```bash
/update-pr-summary <pr_number>    # Update PR description
/update-pr-summary 131            # Example: update PR #131
```

## Workflow Steps

1. **Fetch PR Information**:
   - Get PR details using `gh pr view <pr_number> --json title,body,baseRefName,headRefName`
   - Identify base branch and head branch from PR metadata

2. **Analyze Complete Changeset**:
   - **IMPORTANT**: Analyze ALL committed changes in the branch using `git diff <base-branch>...HEAD`
   - PR description must describe the complete changeset across all commits, not just the latest commit
   - Focus on what changed from the perspective of someone reviewing the entire branch
   - Ignore unstaged changes

3. **Generate PR Description**:
   - Single section, no headers if possible. Very concise
   - 1-2 sentences + few bullet points
   - 1 CLI/usage snippet or simple before/after snippet if applicable
   - For config/API changes, use `mcp__tavily__tavily_search` to verify information and include source links inline
   - No test plans, no changed file lists, no line-number links

4. **Update PR Title** (if needed):
   - Title should start with capital letter and verb
   - Should NOT start with conventional commit prefixes (e.g. "fix:", "feat:")

5. **Update PR**:
   - Use `gh pr edit <pr_number>` with `--body` (and optionally `--title`) to update the PR
   - Use HEREDOC for proper formatting:
   ```bash
   gh pr edit "$(
     cat << 'EOF'
   [PR description here]
   EOF
   )" < pr_number > --body
   ```

## PR Description Format

```markdown
[1-2 sentence summary]

- [Key change 1]
- [Key change 2]

[Optional: 1-line CLI/usage snippet or simple before/after]
```

## Examples

### Example 1: CLI snippet

```markdown
Add compare command for side-by-side model comparison

- Run multiple models on same images with `--models` and `--phrases` flags
- Horizontal panel concatenation with model name headers

`ultrannotate compare --source ./images --models sam3.pt,yoloe-26x-seg.pt --phrases "person,car"`
```

### Example 2: Before/after

```markdown
Inline single-use variables in compare_models

- xyxy2xywhn handles empty arrays, guard unnecessary
- Use function reference for draw dispatch

Before: `boxes = result.get(...); ops.xyxy2xywhn(boxes, ...)`
After: `ops.xyxy2xywhn(result.get(...), ...)`
```

## Error Handling

**Pre-Analysis Verification**:

- Verify PR exists and is accessible
- Check tool availability (`gh auth status`)
- Confirm authentication status

**Common Issues**:

- Invalid PR number → List available PRs
- Missing tools → Provide setup instructions
- Auth issues → Guide through authentication
