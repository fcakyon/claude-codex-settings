---
allowed-tools: Bash, Read, Grep, Glob
argument-hint: <PR number>
description: Update PR description based on complete changeset
---

# Update PR Summary

Update PR title and description based on the complete changeset.

## Instructions

1. **Fetch PR info**:
   ```bash
   gh pr view $ARGUMENTS --json title,body,baseRefName,headRefName
   ```

2. **Analyze complete changeset**:
   - Use `git diff <base-branch>...HEAD` to review ALL committed changes
   - PR description must cover the full branch diff, not just the latest commit
   - Ignore unstaged changes

3. **Generate PR description** following the pr-workflow skill format:
   - Single section, no headers. Very concise
   - 1-2 sentences + few bullet points
   - 1 CLI/usage snippet or simple before/after snippet if applicable
   - For config/API changes, use `mcp__tavily__tavily_search` to verify info and include source links
   - No test plans, no changed file lists, no line-number links

4. **Update PR title** (if needed):
   - Start with capital letter + verb, no "fix:" or "feat:" prefix

5. **Apply update**:
   ```bash
   gh pr edit $ARGUMENTS --title "Title here" --body "$(cat <<'EOF'
   PR description here
   EOF
   )"
   ```
