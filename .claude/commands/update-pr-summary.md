# Claude Command: PR Summary

Update PR message with automatically generated summary with concise bullet points.

## Usage

```bash
/pr-summary <pr_number>    # Generate summary for PR
/pr-summary 131            # Example: analyze PR #131
```

## Workflow

1. **Tool Selection**: Uses GitHub MCP tool (if available) or falls back to `gh` command
2. **Analysis**: Fetches PR details, retrieves diff, analyzes important changes
3. **Summary**: Generates concise bullet points with code references
4. **Update/Edit**: Always edit the PR description** with generated summary using `mcp__github__update_pull_request` (or `gh pr edit` if MCP unavailable). Never skip this step.

## Examples

### Command Usage
```bash
/pr-summary 131    # Analyzes PR #131 and updates description
```

### Generated Summary
```markdown
## Summary

- **Add async model inference** - Implements concurrent processing with `asyncio.gather()` in `inference.py:L45-52`
- **Fix race condition** - Resolved deadlock in worker pool with proper lock management in `workers.py:L156-168`  
- **Optimize batch processing** - Reduced memory usage by 40% using numpy vectorization in `processing.py:L78-85`
- **Extract validation logic** - Moved common validation from 3 files to `utils/validation.py:validate_input()`
```

## Requirements & Error Handling

**Requirements**: GitHub MCP tool or GitHub CLI (`gh`) installed and authenticated

**Common Issues**:
- Invalid PR number → Shows available PRs
- Missing tools → Suggests `brew install gh` or MCP setup
- Auth issues → Provides setup instructions

Focuses on API changes, performance optimizations, bug fixes while filtering out trivial formatting changes.