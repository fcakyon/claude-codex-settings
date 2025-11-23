# Claude Command: Update PR Summary

Update PR description with automatically generated summary based on complete changeset.

## Usage

```bash
/update-pr-summary <pr_number>    # Update PR description
/update-pr-summary 131            # Example: update PR #131
```

## Workflow Steps

1. **Fetch PR Information**:
   - Get PR details using `gh pr view <pr_number>` or `mcp__github__pull_request_read`
   - Identify base branch and head branch from PR metadata

2. **Analyze Complete Changeset**:
   - **IMPORTANT**: Analyze ALL committed changes in the branch using `git diff <base-branch>...HEAD`
   - PR description must describe the complete changeset across all commits, not just the latest commit
   - Focus on what changed from the perspective of someone reviewing the entire branch
   - Ignore unstaged changes

3. **Generate PR Description**:
   - Create brief summary (1 sentence or few words)
   - Add few bullet points of key changes
   - For significant changes, include before/after code examples in PR body
   - Include inline markdown links to relevant code lines when helpful (format: `[src/auth.py:42](src/auth.py#L42)`)
   - For config/API changes, use `mcp__tavily__tavily-search` to verify information and include source links inline
   - Never include test plans in PR descriptions

4. **Update PR Title** (if needed):
   - Title should start with capital letter and verb
   - Should NOT start with conventional commit prefixes (e.g. "fix:", "feat:")

5. **Update PR**:
   - Use `gh pr edit <pr_number>` with `--body` (and optionally `--title`) to update the PR
   - Use HEREDOC for proper formatting:
   ```bash
   gh pr edit <pr_number> --body "$(cat <<'EOF'
   [PR description here]
   EOF
   )"
   ```

## PR Description Format

```markdown
[Brief summary in 1 sentence or few words]

- [Key change 1 with inline code reference if helpful]
- [Key change 2 with source link if config/API change]
- [Key change 3]

[Optional: Before/after code examples for significant changes]
```

## Examples

### Example 1: Config/API Change with Source Links

```markdown
Update Claude Haiku to version 4.5

- Model ID: claude-3-haiku-20240307 → claude-haiku-4-5-20251001 ([source](https://docs.anthropic.com/en/docs/about-claude/models/overview))
- Pricing: $0.80/$4.00 → $1.00/$5.00 per MTok ([source](https://docs.anthropic.com/en/docs/about-claude/pricing))
- Max output: 4,096 → 64,000 tokens ([source](https://docs.anthropic.com/en/docs/about-claude/models/overview))
```

### Example 2: Code Changes with File Links

````markdown
Refactor authentication to use async context manager

- Replace synchronous auth flow with async/await pattern in [src/auth.py:15-42](src/auth.py#L15-L42)
- Add context manager support for automatic cleanup

Before:
```python
def authenticate(token):
    session = create_session(token)
    return session
```

After:
```python
async def authenticate(token):
    async with create_session(token) as session:
        return session
```
````

### Example 3: Simple Feature Addition

```markdown
Add user profile export functionality

- Export user data to JSON format in [src/export.py:45-78](src/export.py#L45-L78)
- Add CLI command `/export-profile` in [src/cli.py:123](src/cli.py#L123)
- Include email, preferences, and activity history in export
```

## Error Handling

**Pre-Analysis Verification**:
- Verify PR exists and is accessible
- Check tool availability (GitHub MCP or gh CLI)
- Confirm authentication status

**Common Issues**:
- Invalid PR number → List available PRs
- Missing tools → Provide setup instructions
- Auth issues → Guide through authentication
