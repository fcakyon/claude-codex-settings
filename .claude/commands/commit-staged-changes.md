# Claude Command: Commit - Enhanced with Advanced Thinking Patterns

<thinking>
Before applying standard commit conventions, I should first explore the unique characteristics of these changes. What patterns emerge? What's the real story these changes tell? Are there non-obvious relationships between files that suggest a different commit strategy?
</thinking>

## Progressive Analysis Framework

### Phase 0: Open-Ended Change Exploration
**Before applying any rules, conduct creative analysis:**
- What story do these changes tell about the evolution of the codebase?
- Are there hidden dependencies or relationships between changed files?
- What unconventional grouping strategies might better represent the work?
- How might different stakeholders (users, maintainers, contributors) view these changes?

### Phase 1: Multi-Dimensional Change Assessment

<thinking>
Allocate thinking budget based on change complexity:
- Simple changes (< 5 files, single purpose): Standard analysis
- Medium changes (5-20 files, 2-3 purposes): Extended analysis with pattern detection
- Complex changes (> 20 files, multiple purposes): Deep analysis with relationship mapping
</thinking>

Apply these analytical lenses sequentially:

1. **Functional Perspective**: What capabilities are being added/modified/removed?
2. **Architectural Perspective**: How do changes affect system structure?
3. **Quality Perspective**: What improvements to maintainability/performance/reliability?
4. **User Impact Perspective**: How do changes affect different user personas?
5. **Technical Debt Perspective**: What debt is being paid or incurred?

## Enhanced Workflow with Verification

### 1. Pre-Analysis Thinking Allocation
```
Assess change complexity:
- Count files, line changes, and distinct change types
- If complexity > threshold: Allocate extended thinking time
- Document: "This appears to be a [simple/medium/complex] change requiring [standard/extended] analysis"
```

### 2. Progressive Staging Analysis
**Layer 1 - Creative Exploration:**
- What unexpected patterns or relationships exist in the staged files?
- Are there alternative ways to group these changes that tell a clearer story?
- What assumptions am I making about how these changes should be organized?
- Which changes will be required in the README or other documentation?

**Layer 2 - Systematic Framework Application:**
```bash
git diff --cached --name-only  # Initial assessment
git diff --cached --stat       # Quantitative analysis
git diff --cached             # Deep content analysis
```

**Layer 3 - Context Integration:**
- Cross-reference with README.md and project documentation
- Identify which audiences care about which changes
- Map changes to project goals and roadmap
- Consider if any changes will be required with the staged changes

### 3. Enhanced Documentation Impact Analysis

<thinking>
Apply constraint optimization: When should documentation updates happen?
- Constraint 1: User-facing changes need immediate documentation
- Constraint 2: Too many doc updates fragment the commit history
- Constraint 3: Missing documentation creates technical debt
- Resolution: Batch related doc updates, prioritize user-facing docs
</thinking>

**Multi-Framework Documentation Assessment:**
1. **User Impact Framework**: Do users need to know about this change?
2. **API Contract Framework**: Have any interfaces or contracts changed?
3. **Configuration Framework**: Are there new settings or options?
4. **Migration Framework**: Do existing users need guidance to adapt?
5. **Example Framework**: Would examples clarify the change?

### 4. Advanced Commit Message Generation

**Step 1 - Initial Message Ideation** (Open-ended):
- Generate 3-5 different ways to describe this change
- Consider different emphasis points (what vs why vs how)
- Explore metaphors or analogies that clarify the change

**Step 2 - Message Optimization** (Systematic):
Apply these filters sequentially:
1. **Clarity Filter**: Would a new contributor understand this?
2. **Searchability Filter**: What keywords would someone search for?
3. **Context Filter**: Does it make sense without viewing the diff?
4. **Precision Filter**: Is every word necessary and accurate?

**Step 3 - Bias Detection**:
- Anchoring bias: Am I over-influenced by the first file I analyzed?
- Recency bias: Am I giving too much weight to the last changes reviewed?
- Complexity bias: Am I over-complicating simple changes?
- Familiarity bias: Am I assuming context that others won't have?

### 5. Intelligent Commit Splitting with Verification

**Progressive Split Analysis:**

<thinking>
Before applying split rules, consider: What's the cost/benefit of splitting?
- Cost: More commits to review, potential bisect complexity
- Benefit: Clearer history, easier reverts, better attribution
- Context: Team preferences, project phase, change urgency
</thinking>

**Layer 1 - Relationship Mapping**:
Create a mental graph of file relationships:
- Which files always change together? (high cohesion)
- Which files serve different purposes? (low cohesion)
- What's the "center of gravity" for each logical change?

**Layer 2 - Split Verification Framework**:
For each potential split, verify:
1. **Independence Test**: Can each commit stand alone?
2. **Revert Test**: Would reverting one break the others?
3. **Review Test**: Does each commit tell a complete story?
4. **Build Test**: Does each commit maintain a working state?

**Layer 3 - Split Decision Matrix**:
```
Score each factor (1-5):
- Logical separation: How distinct are the changes?
- File coupling: How related are the changed files?
- Commit size: How large would each commit be?
- Review complexity: How hard to review separately?
- Revert value: How useful to revert independently?

If total score > 15: Split recommended
If total score 10-15: Split optional
If total score < 10: Keep together
```

### 6. Commit Message Quality Assurance

**Multi-Perspective Validation**:
1. **New Contributor Test**: Without context, is the change clear?
2. **Future Maintainer Test**: In 6 months, will this still make sense?
3. **Bisect User Test**: When debugging, would this message help?
4. **Release Notes Test**: Could this be adapted for user communication?

**Steel Man Reasoning**: 
For each commit message, argue why it might be inadequate:
- What context is assumed but not stated?
- What alternative interpretations exist?
- What questions might reviewers ask?

## Enhanced Conventional Commit Framework

### Extended Type Analysis
Before selecting a type, consider:
- Primary impact (feature/fix/docs/refactor/perf/test/build/ci)
- Secondary impacts (often overlooked but important)
- Audience relevance (who cares most about this change?)

### Advanced Scope Detection
Identify scope through:
1. **Directory analysis**: Common parent directory
2. **Module analysis**: Logical component affected
3. **Feature analysis**: User-facing capability impacted
4. **Cross-cutting analysis**: Multiple scopes may apply

### Context-Aware Description Generation

**Description Optimization Framework**:
1. **Action**: Strong verb describing the change
2. **Target**: What specifically changed
3. **Purpose**: Why this change matters (when not obvious)
4. **Impact**: User-visible effects (when applicable)

**Example Enhancement**:
```
Basic: "fix: update validation logic"
Enhanced: "fix(api): prevent null pointer in user validation"
Optimal: "fix(api): prevent crash when validating users with missing email"
```

## Original Command Structure

### Usage
```bash
/commit         # Run without linting (default)
/commit --lint  # Run with linting
```

### Core Workflow (Preserved with Enhancements)

1. **Linting** (only with `--lint`):
   ```bash
   source .venv/bin/activate && ruff check && ruff format
   ```

2. **Staging Check**:
   - Check which files are staged with `git diff --cached --name-only`
   - **Stops if 0 files staged** - guides user to stage files first
   - Never stage already staged files

3. **Documentation Impact Analysis** ⚠️ **MANDATORY**:
   - **ALWAYS check if staged changes require documentation updates**
   - Analyze changes for documentation needs:
     - New configuration files → Document configuration options
     - New features/tools → Document usage and examples
     - API changes → Document endpoints and parameters
   - **Only suggest README updates when genuinely needed**
   - Skip documentation if changes are internal-only or self-contained

4. **README Context**:
   - Read README.md to understand project structure
   - Use project context for accurate commit messages
   - Apply findings from documentation analysis

5. **Diff Analysis**:
   - Perform `git diff --cached` on staged changes
   - Identify logical separation opportunities
   - Suggest commit splits if multiple concerns detected
   - Incorporate README context for better descriptions

6. **README Update Check**:
   - Add README update check to your todo list. At this step you will decide if README contains any outdated info in the light of recent changes and requires an update.

7. **Commit Creation**:
   - Generate conventional commit message(s)
   - Execute commit(s) based on analysis

### Conventional Commit Types
- `feat`: New feature (api endpoints, gradio demos, integrations)
- `fix`: Bug fix (concurrency, memory leaks, edge cases)
- `docs`: Documentation only (api docs, deployment guides, readme)
- `style`: Formatting, no code change
- `refactor`: Code restructuring, no behavior change
- `perf`: Performance improvement (speed, memory, concurrency)
- `test`: Test additions/corrections (pytest, integration, load tests)
- `mlops`: Build/tooling/CI changes (github actions, docker, pypi)

### Commit Message Rules
- Format: `<type>: <description>`
- Present tense, imperative mood
- First line ≤ 72 characters
- No emojis

### Commit Message Body Guidelines
When changes are complex, include a body with:
- **Maximum 4 bullet points** summarizing key changes
- Each bullet should be concise (1 line, ~80 chars)
- Focus on WHAT changed and WHY, not implementation details
- Group related changes into single bullets

### Good Body Example:
```
refactor: extract azure utilities and centralize configuration

- Move Azure blob storage functions to dedicated azure_utils.py module
- Centralize constants and user-configurable settings in init.py
- Extract general utilities (env loading, audio preprocessing) to utils.py
- Remove unused examples/init.py module
```

### Bad Body Example (too detailed):
```
refactor: extract azure utilities and centralize configuration

- Move parse_sas_url, create_azure_container, upload_to_azure_blob functions
from transcribe.py to new azure_utils.py module for better separation
- Add cleanup_temp_folder utility for managing temporary directories
- Centralize configuration in init.py with constants for Azure API version,
container name, Whisper model URL, and temp folder path
- Implement user-configurable settings with environment variable override support
for Whisper model search, polling intervals, and TTL settings
- Move load_env_file, preprocess_audio_for_transcription, get_user_config
to utils.py for better code organization
```

### Split Criteria
Commits are split when detecting:
- Unrelated API/service changes
- Mixed change types (feature + performance optimization)
- Different file categories (src vs tests vs docs vs configs)
- Large changes (>100 lines per file or new service implementation)
- Independent components (api vs ui vs deployment vs ci)

### Examples

#### Single Commits
```
feat: add concurrent model inference with asyncio pool
fix: resolve race condition in fastapi endpoint handlers
docs: update gradio demo deployment instructions
refactor: remove duplicate preprocessing logic from pipeline
perf: optimize batch processing with numpy vectorization
test: add pytest fixtures for api endpoint testing
mlops: configure github actions for package publishing
style: apply ruff formatting to inference modules
feat: implement redis caching for model predictions
fix: handle multiprocessing deadlock in worker pool
perf: reduce docker image size from 2gb to 800mb
docs: add openapi schema for all endpoints
test: add benchmarks for concurrent request handling
refactor: extract common validation logic to utils
mlops: add pre-commit hooks for code quality
fix: prevent memory leak in gradio interface callbacks
```

#### Split Commits
```
# Original: Large API refactoring with deployment updates
# Becomes:
feat: implement async model serving with connection pooling
perf: reduce inference latency by 40% with caching
fix: handle oom errors in concurrent requests
docs: add api rate limiting documentation
test: add load testing for 1000 concurrent users
mlops: update dockerfile for multi-stage builds

# Original: Package publishing and ci improvements
# Becomes:
mlops: add pypi publishing workflow
test: add integration tests for all api endpoints
docs: update readme with installation instructions
fix: resolve import errors in __init__.py
refactor: restructure package for cleaner imports
```

### Options
- `--lint`: Enable ruff style checks and formatting before committing

### Important Behaviors
- **Documentation Check**: When adding new features (MCP servers, commands, etc.), always check if README or other docs need updates
- **Staging**: NEVER use `git add` on already staged files - only check what's staged with `git diff --cached --name-only`
- **Split Strategy**: Suggest documentation updates as separate commits after feature commits
- **Context Awareness**: Cross-reference changes with README.md to ensure documentation stays in sync

### Notes
- Requires files to be staged before running
- Reviews diff for optimal commit structure
- Suggests staging strategy for multi-commit scenarios

## Constraint Optimization for Competing Requirements

### Common Constraint Conflicts:
1. **Brevity vs Clarity**: Keep under 72 chars while being descriptive
   - Solution: Prioritize clarity in subject, add body for details
   
2. **Technical vs User Focus**: Developer details vs user impact
   - Solution: User impact in subject, technical details in body
   
3. **Atomicity vs Completeness**: Small commits vs feature completeness
   - Solution: Logical atomicity over file atomicity

4. **Convention vs Context**: Standard types vs unique situations
   - Solution: Extend conventions mindfully, document exceptions

## Advanced Thinking Budget Management

### Complexity Indicators:
```
HIGH COMPLEXITY (Extended thinking required):
- Cross-cutting architectural changes
- API/interface modifications  
- Security-related changes
- Performance optimizations with trade-offs
- Breaking changes requiring migration

MEDIUM COMPLEXITY (Standard thinking with verification):
- Feature additions with clear boundaries
- Bug fixes with understood root causes
- Refactoring within modules
- Test additions/improvements
- Documentation updates

LOW COMPLEXITY (Rapid analysis sufficient):
- Style/formatting changes
- Typo corrections
- Configuration updates
- Dependency updates
- Simple renamings
```

### Dynamic Budget Allocation:
- Start with complexity assessment
- Adjust based on initial analysis findings
- Document when extended thinking was needed

## Self-Correction and Continuous Improvement

### Per-Commit Reflection:
After generating each commit:
1. **Alternative Generation**: What's a completely different way to frame this?
2. **Stakeholder Simulation**: How would [user/reviewer/maintainer] react?
3. **Anti-pattern Check**: Am I falling into common traps?
4. **Improvement Note**: What would make this commit message even better?

### Pattern Learning:
- Track which split decisions were questioned in review
- Note which commit messages required clarification
- Identify recurring challenges in the codebase
- Adapt strategies based on team feedback

## Usage Guidelines for Enhanced Thinking

### When to Use Extended Analysis:
- First time committing to a new area of the codebase
- Changes spanning multiple architectural layers
- Commits that might be controversial or need justification
- When you feel uncertain about the best approach

### When Standard Analysis Suffices:
- Routine changes in familiar code
- Following established patterns in the project
- Simple, isolated bug fixes
- Documentation-only updates

### Progressive Enhancement:
Start with standard analysis and elevate when you encounter:
- Unexpected relationships between files
- Difficulty choosing a commit type
- Uncertainty about splitting strategies
- Complex constraint trade-offs

This enhanced approach ensures consistent, thoughtful commit messages while adapting analysis depth to change complexity.