# Claude Code Settings

Guidance for Claude Code and other AI tools working in this repository.

## AI Guidance

- After receiving tool results, carefully reflect on their quality and determine optimal next steps before proceeding. Use your thinking to plan and iterate based on this new information, and then take the best next action.
- For maximum efficiency, whenever you need to perform multiple independent operations, invoke all relevant tools simultaneously rather than sequentially.
- Before you finish, please verify your solution
- Do what has been asked; nothing more, nothing less.
- NEVER create new files unless they're absolutely necessary for achieving your goal.
- ALWAYS prefer editing an existing file to creating a new one.
- NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.
- Reuse existing code wherever possible and minimize unnecessary arguments.
- Look for opportunities to simplify the code or remove unnecessary parts.
- Focus on targeted modifications rather than large-scale changes.
- This year is 2026. Definitely not 2025.
- Never use words like "consolidate", "modernize", "streamline", "flexible", "delve", "establish", "enhanced", "comprehensive", "optimize" or symbols like em-dahses (--) in docstrings or commit messages or comments. Looser AI's do that, and that ain't you. You are better than that.
- Prefer `rg` over `grep` for better performance.
- Never implement defensive programming unless you explicitly tell the motivation for it and user approves it.
- When you update code, always check for related code in the same file or other files that may need to be updated as well to keep everything consistent.

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

- **Before exiting the plan mode**: Never assume anything. Always run tests with `python -c "..."` to verify you hypothesis and bugfix candidates about code behavior, package functions, or data structures before suggesting a plan or exiting the plan mode. This prevents wasted effort on incorrect assumptions.
- **Package Manager**: uv (NOT pip) - defined in pyproject.toml
- Use Google-style docstrings:
  - **Summary**: Start with clear, concise summary line in imperative mood ("Calculate", not "Calculates")
  - **Args/Attributes**: Document all parameters with types and brief descriptions (no default values)
  - **Types**: Use union types with vertical bar `int | str`, uppercase letters for shapes `(N, M)`, lowercase builtins `list`, `dict`, `tuple`, capitalize typing module classes `Any`, `Path`
  - **Optional Args**: Mark at end of type `name (type, optional): Description...`
  - **Returns**: Always enclose in parentheses `(type)`, NEVER use tuple types - document multiple returns as separate named values
  - **Sections**: Optional minimal sections in order: Examples (using >>>), Notes, References (plaintext only, no new ultralytics.com links)
  - **Line Wrapping**: Wrap at specified character limit, use zero indentation in docstring content
  - **Special Cases**:
    - Classes: Include Attributes, omit Methods/Args sections, put all details in class docstring
    - `__init__`: Args ONLY, no Examples/Notes/Methods/References
    - Functions: Include Args and Returns sections when applicable
    - All test functions should be single-line docstrings.
    - Indent section titles like "Args:" 0 spaces
    - Indent section elements like each argument 4 spaces
    - DO NOT CONVERT SINGLE-LINE CLASS DOCSTRINGS TO MULTILINE.
    - Optionally include a minimal 'Examples:' section, and improve existing Examples if applicable.
    - Do not include default values in argument descriptions, and erase any default values you see in existing arg descriptions.
  - **Omissions**: Omit "Returns:" if nothing returned, omit "Args:" if no arguments, avoid "Raises:" unless critical
- Separation of concerns: If-else checks in main should be avoided. Relevant functions should handle inputs checks themselves.
- Super important to integrate new code changes seamlessly within the existing code rather than simply adding more code to current files. Always review any proposed code updates for correctness and conciseness. Focus on writing things in minimal number of lines while avoiding redundant trivial extra lines and comments. For instance don't do:
  ```python
  # Generate comment report only if requested
  if include_comments:
      comment_report = generate_comments_report(start_date, end_date, team, verbose)
  else:
      comment_report = ""
      print("   Skipping comment analysis (disabled)")
  ```
  Instead do:
  ```python
  comment_report = generate_comments_report(start_date, end_date, team, verbose) if include_comments else ""
  ```
- Understand existing variable naming, function importing, class method definition, function signature ordering and naming patterns of the given modules and align your implementation with existing patterns. Always exploit existing utilities/optimization/data structures/modules in the project when suggesting something new.
- Redundant duplicate code use is inefficient and unacceptable.
- **File paths**: Use pathlib instead of os.path
- **Function purpose**: Functions should have a clear, single purpose. Don't hardcode behavior that makes them less general
- **No trivial wrappers**: Never create functions for repeated content that is 2 lines or less. Inline it
- **Inline single-use variables**: If a variable is assigned and used only once, inline it at the usage site
- **Observability**: Don't use try/except blocks unless critical. Let errors surface for easier debugging
- Never assume anything without testing it with `python3 -c "..."` (don't create file)
- Always consider MongoDB/Gemini/OpenAI/Claude/Voyage API and time costs, and keep them as efficient as possible
- When using 3rd party package functions/classes, find location with `python -c "import pkg; print(pkg.__file__)"`, then use Read tools to explore
- When running Python commands, run `source .venv/bin/activate` to activate the virtual environment before running any scripts or run with uv `uv run python -c "import example"`

## Git and Pull Request Workflows

### Commit Messages

- Format: `{type}: brief description` (max 50 chars first line)
- Optional second line: 1 sentence with findings/motivation
- Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `build`
- Simple terms, no jargon
- ONLY analyze staged files (`git diff --cached`), ignore unstaged
- NO test plans in commit messages

### Pull Requests

- PR titles: NO type prefix (unlike commits) - start with capital letter + verb
- Analyze ALL commits with `git diff <base-branch>...HEAD`, not just latest
- PR body: single section, no headers, 1-2 sentences + usage snippet
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

## Marketplace Plugin Conventions

### Source Types in `marketplace.json`

- **Local path**: `"source": "./plugins/my-plugin"` — for plugins in this repo
- **URL source**: `"source": { "source": "url", "url": "https://github.com/owner/repo.git" }` — for external repos. Use this over `github` source (which has been unreliable)
- **Git subdir**: `"source": { "source": "git-subdir", "url": "https://github.com/owner/repo.git", "path": "plugins/subdir" }` — for a single plugin inside a monorepo

### Cherry-picking skills from external repos

Use `strict: false` + explicit `skills` array to expose only specific skills from an external repo. The rest of the repo is ignored. Example (see `anthropic-creative-suite` entry):

```json
{
  "source": { "source": "url", "url": "https://github.com/owner/repo.git" },
  "strict": false,
  "skills": ["./skills/skill-a", "./skills/skill-b"]
}
```

### plugin.json (minimal format)

Local plugins use a minimal `plugin.json` with only: `name`, `version`, `description`, `homepage`, `repository`, `license`. Author is optional — skip for third-party plugins.

### SKILL.md frontmatter

Only two fields: `name` and `description`. Description should start with "This skill should be used when..." with quoted trigger phrases.

### Marketplace entry fields

Rich metadata (`keywords`, `category`, `tags`) lives in `marketplace.json`, not in individual `plugin.json` files.

## Citation Verification Rules

**CRITICAL**: Never use unverified citation information. Before adding or referencing any academic citation:

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
- After adding citations into md or bibtex entries into biblo.bib, fact check all fields from web. Even if you performed fact check before, always do it again after writing the citation in the document.
