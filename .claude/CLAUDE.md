# Claude Code Settings

Guidance for Claude Code and other AI tools. Structured around [Andrej Karpathy's observations on LLM coding pitfalls](https://x.com/karpathy/status/2015883857489522876): surface assumptions, don't overcomplicate, make surgical changes, verify before moving on.

## Core Principles

**Do what was asked. Nothing more, nothing less.** This year is 2026.

**Delete > Replace > Add.** Before any change, answer in order: what can I delete, what can I replace, and only then, what must I add?

- **Guard nothing, relocate the trigger.** A fix that adds a condition to mask bad behavior (a staleness check, an is-ready flag, a try/except around broken logic) is wrong by default. Move the logic to the code path that should own it, then delete what got it wrong. No defensive programming unless you state the motivation and the user approves.
- **Bugfixes are net-negative by default.** If a fix adds more lines than it removes, justify in one sentence why deletion and relocation were impossible.
- **Search before creating.** The helper probably exists, so grep the project first. Fold duplicates into one shared utility. Three similar lines beat a helper nobody else calls.
- **Deletion beats caution.** Broken or duplicated code kept "to be safe" is the regression. Understand what you remove, then remove it.
- **This guidance is code: additions require deletions.** To add a rule, remove or merge one.

Ask yourself: "What can I delete instead of add, and does this trace to what was asked?"

## Working Rules

- Reflect on tool results before acting, then plan and take the best next action.
- Run independent operations in parallel.
- Verify your solution before finishing.
- Never create files unless necessary. Prefer editing. Never create docs (*.md, README) unless asked.
- Prefer `rg` over `grep`.
- When updating code, check related code in the same and other files for consistency.
- Never use `consolidate`, `modernize`, `streamline`, `flexible`, `delve`, `establish`, `enhanced`, `comprehensive`, `optimize`, or em-dashes in docstrings, commit messages, or comments.

## MCP Tools

### Tavily (Web Search)

- Use `mcp__tavily__tavily_search` for discovery/broad queries
- Use `mcp__tavily__tavily_extract` for specific URL content
- Search first to find URLs, then extract for detailed analysis

### MongoDB

- MongoDB MCP is READ-ONLY (no write/update/delete operations)

### GitHub CLI

Use `gh` CLI for all GitHub interactions. Never clone repositories to read code.

- **Read file from repo**: `gh api repos/{owner}/{repo}/contents/{path} -q .content | base64 -d`
- **Search code**: `gh search code "query" --repo {owner}/{repo}` or `gh search code "query" --language python`
- **Search repos**: `gh search repos "query" --language python --sort stars`
- **Compare commits**: `gh api repos/{owner}/{repo}/compare/{base}...{head}`
- **View PR**: `gh pr view {number} --repo {owner}/{repo}`
- **View PR diff**: `gh pr diff {number} --repo {owner}/{repo}`
- **View PR comments**: `gh api repos/{owner}/{repo}/pulls/{number}/comments`
- **List commits**: `gh api repos/{owner}/{repo}/commits --jq '.[].sha'`
- **View issue**: `gh issue view {number} --repo {owner}/{repo}`

## Python Coding

For full Python guidelines, install and enable the `python-skills` plugin (`python-guidelines` skill). Key rules always in effect:

- **Package manager**: uv (NOT pip). **Paths**: pathlib, not os.path.
- **Verify before planning**: Run `python -c "..."` to test hypotheses. Never assume.
- **Virtual env**: `source .venv/bin/activate` or `uv run python -c "..."`
- Integrate into existing code, don't append. Match existing patterns.

## Git and Pull Request Workflows

### Commit Messages

- Run the `/simplify` skill on the staged diff before committing, then apply its findings. Docs-only diffs are a no-op
- Format: `{type}: brief description` (max 50 chars first line)
- Optional second line: 1 sentence with findings/motivation
- Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `build`
- Simple terms, no jargon
- ONLY analyze staged files (`git diff --cached`), ignore unstaged
- NO test plans in commit messages

### Pull Requests

- PR titles: NO type prefix (unlike commits) - start with capital letter + verb
- Analyze ALL commits with `git diff <base-branch>...HEAD`, not just latest
- PR body: open on why, short scannable bullets (one point each), a diff or snippet, numbers over adjectives. Single section, no headers
- No test plans, no changed files list, no line-number links in PR body
- Self-assign with `-a @me`
- Find reviewers: `gh pr list --repo <owner>/<repo> --author @me --limit 5`

### PR Comments and Reviews

- Create pending reviews only, never auto-submit
- Comment style: start lowercase, no em-dashes, simple terms, no end punctuation, max 1 sentence
- Bot comment responses: few words is enough
- Real person responses: polite, concise

### Commands

- `/github-dev:commit-staged` - commit staged changes
- `/github-dev:create-pr` - create pull request
- `/github-dev:resolve-pr-comments` - analyze and address unresolved PR review comments

Ask yourself: "Would someone unfamiliar with this repo understand this commit message?"

## Citation Verification

**Never cite what you haven't verified.**

1. **Author Names**: Verify exact author names from the actual paper PDF or official publication page. Do not guess or hallucinate author names based on similar-sounding names.
2. **Publication Venue**: Confirm the exact venue (conference/journal) and year. Papers may be submitted to one venue but published at another (e.g., ICLR submission → ICRA publication).
3. **Paper Title**: Use the exact title from the published version, not preprint titles which may differ.
4. **Cited Claims**: Every specific claim attributed to a paper (e.g., "9% improvement on Synthia", "4.7% on OpenImages") must be verifiable in the actual paper text. If a number cannot be confirmed, use qualitative language instead (e.g., "significant improvements").
5. **BibTeX Keys**: When updating citation keys, search for ALL references to the old key and update them consistently.

**Verification Process**:

- Use web search to find the official publication page (not just preprints)
- Cross-reference author names with the paper's author list
- DBLP is the authoritative source for CS publication metadata
- For specific numerical claims, locate the exact quote or table in the paper
- When uncertain, flag the citation for manual verification rather than guessing
- After adding citations into md or bibtex entries into biblio.bib, fact check all fields from web. Even if you performed fact check before, always do it again after writing the citation in the document.

Ask yourself: "Can I point to the exact page where this claim appears?"
