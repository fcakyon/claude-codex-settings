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
   - **Summary**: Few words or 1 sentence describing changes
   - **Changes**: Bullet points with inline links `[src/auth.py:42](src/auth.py#L42)`
   - **Examples**: For significant changes, include before/after code examples
   - **No test plans**: Never mention test procedures in PR

## Examples

### With inline source links:

```
Update Claude Haiku to version 4.5

- Model ID: claude-3-haiku-20240307 → claude-haiku-4-5-20251001 ([source](https://docs.anthropic.com/en/docs/about-claude/models/overview))
- Pricing: $0.80/$4.00 → $1.00/$5.00 per MTok ([source](https://docs.anthropic.com/en/docs/about-claude/pricing))
- Max output: 4,096 → 64,000 tokens ([source](https://docs.anthropic.com/en/docs/about-claude/models/overview))
```

### With code changes:

```
Refactor authentication to use async context manager

- Replace synchronous auth flow with async/await pattern in [src/auth.py:15-42](src/auth.py#L15-L42)
- Add context manager support for automatic cleanup

Before:
\`\`\`python
def authenticate(token):
    session = create_session(token)
    return session
\`\`\`

After:
\`\`\`python
async def authenticate(token):
    async with create_session(token) as session:
        return session
\`\`\`
```
