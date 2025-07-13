# Claude Command: PR Summary

Update PR message with automatically generated summary using advanced analytical frameworks and progressive reasoning.

## Progressive Reasoning Framework

<thinking>
Before applying standard PR analysis patterns, let me think broadly about what makes this PR unique. What unconventional changes might be present? What hidden dependencies or architectural impacts could exist beyond the obvious file changes? What narrative is this PR trying to tell?
</thinking>

## Usage

```bash
/pr-summary <pr_number>    # Generate summary for PR
/pr-summary 131            # Example: analyze PR #131
```

## Advanced PR Analysis Methodology

### Phase 1: Initial Exploration & Context Building

**Open-Ended Analysis** (Allocate extended thinking for novel patterns):
1. What is the overarching narrative of this PR?
2. What problem space does it operate in?
3. Are there unconventional patterns or approaches that standard analysis might miss?
4. What implicit assumptions or context might be important?

### Phase 2: Sequential Analytical Framework Application

Apply these frameworks progressively to build comprehensive understanding:

#### Framework 1: Change Impact Analysis
**Progression**: Surface changes → Deep dependencies → Architectural implications
- **File-Level Analysis**: What files changed and their relationships
- **Function-Level Analysis**: Specific method/function modifications
- **Cross-Cutting Analysis**: Changes affecting multiple components
- **Ripple Effect Assessment**: Potential downstream impacts

#### Framework 2: Change Category Classification
**Apply multiple categorization lenses**:
1. **Technical Categories**: Feature/Bug/Refactor/Performance/Security
2. **Business Impact**: User-facing/Internal/Infrastructure/Technical Debt
3. **Risk Assessment**: Breaking/Non-breaking/Experimental
4. **Architectural Pattern**: New pattern/Pattern enhancement/Pattern removal

#### Framework 3: Code Quality & Best Practices Assessment
**Progressive evaluation**:
1. **Consistency Analysis**: Does it follow existing patterns?
2. **Best Practice Alignment**: Industry standards adherence
3. **Technical Debt Impact**: Adding/Reducing/Neutral
4. **Future Maintainability**: Complexity changes

### Phase 3: Systematic Verification & Validation

#### Test Case Validation for Each Finding
For each significant change identified:
1. **Positive Test**: Verify the file and line numbers exist
2. **Negative Test**: Check if description accurately reflects the change
3. **Edge Case Test**: Consider partial implementations or WIP changes
4. **Context Test**: Validate against PR title and description

#### Steel Man Reasoning
Before summarizing, argue FOR the current implementation:
- What valid reasons exist for the approach taken?
- Are there constraints that justify seemingly suboptimal choices?
- What context might reviewers be missing?

### Phase 4: Constraint Optimization

**Balance competing requirements**:
1. **Conciseness vs Completeness**: Essential information without overwhelming detail
2. **Technical Accuracy vs Accessibility**: Clear to both experts and newcomers
3. **Change Focus vs Context**: Individual changes vs overall narrative
4. **Priority vs Comprehensiveness**: Most important vs all changes

**Optimization Strategy**:
- High-impact changes: Detailed with code references
- Medium-impact changes: Grouped summaries
- Low-impact changes: Aggregate mentions or omit

### Phase 5: Advanced Summary Generation

#### Progressive Summary Structure
1. **Executive Summary** (1-2 sentences): Overall PR impact
2. **Primary Changes** (3-5 bullets): Most significant modifications
3. **Secondary Changes** (optional): Important but supporting changes
4. **Technical Notes** (if needed): Implementation details or caveats

#### Summary Enhancement Patterns
```markdown
## Summary

<thinking>
Analyzing PR complexity: [High/Medium/Low]
Novel patterns detected: [Yes/No]
Cross-cutting concerns: [List]
Thinking budget allocation: [Extended/Standard]
</thinking>

**Overview**: [1-2 sentence executive summary capturing the PR's essence]

### Primary Changes
- **[Category] [Change Title]** - [Specific impact description] in `file.ext:L##-##`
  - Verification: ✓ File exists, ✓ Line numbers accurate, ✓ Description matches diff
- **[Category] [Change Title]** - [Why this matters] via `file.ext:function_name()`
  - Trade-off: Chose [approach A] over [approach B] for [specific reason]

### Technical Considerations
- **Performance Impact**: [Measured or estimated impact]
- **Breaking Changes**: [None/List with migration notes]
- **Dependencies**: [New/Updated/Removed]

### Context & Rationale
[Brief explanation of why these changes were made and how they fit the larger picture]
```

### Phase 6: Self-Correction & Bias Mitigation

#### Cognitive Bias Checks
1. **Confirmation Bias**: Am I overemphasizing changes that fit common patterns?
2. **Recency Bias**: Am I giving too much weight to the last files reviewed?
3. **Complexity Bias**: Am I focusing too much on complex changes vs important simple ones?
4. **Framework Bias**: Am I forcing changes into framework categories?

#### Alternative Perspective Simulation
- **Security Reviewer**: What vulnerabilities or security improvements?
- **Performance Engineer**: What optimization opportunities or regressions?
- **New Team Member**: What context is needed to understand these changes?
- **End User**: What user-visible impacts exist?

### Phase 7: Thinking Budget Management

#### Complexity Assessment
**High Complexity Indicators** (Allocate extended thinking):
- Cross-repository changes
- Architectural modifications
- Security-sensitive code
- Performance-critical paths
- Novel patterns or approaches

**Medium Complexity Indicators** (Standard thinking):
- Standard feature additions
- Routine bug fixes
- Well-understood refactoring
- Isolated component changes

**Low Complexity Indicators** (Minimal thinking):
- Documentation updates
- Formatting changes
- Dependency updates
- Configuration adjustments

#### Budget Allocation Strategy
```
PR Size:     Thinking Budget:
< 100 lines  → 2-3 minutes standard thinking
100-500      → 5-10 minutes with complexity-based extension
500-2000     → 10-20 minutes with framework progression
> 2000       → 20+ minutes with full methodology application
```

## Workflow Implementation

1. **Initial Assessment Phase**:
   - Fetch PR metadata and diff
   - Assess complexity and allocate thinking budget
   - Perform open-ended exploration

2. **Framework Application Phase**:
   - Apply change impact analysis
   - Categorize changes using multiple lenses
   - Assess code quality implications
   - Verify findings with test cases

3. **Summary Generation Phase**:
   - Apply constraint optimization
   - Generate progressive summary structure
   - Include verification checkmarks
   - Add context and rationale

4. **Quality Assurance Phase**:
   - Run bias detection checks
   - Simulate alternative perspectives
   - Validate against steel man reasoning
   - Ensure accuracy of all code references

5. **Update/Edit Phase**:
   - Always edit the PR description with generated summary
   - Use `mcp__github__update_pull_request` or `gh pr edit`
   - Never skip the update step

## Error Handling & Verification

**Pre-Analysis Verification**:
- Verify PR exists and is accessible
- Check tool availability (GitHub MCP or gh CLI)
- Confirm authentication status

**Post-Analysis Verification**:
- All file references exist in the PR
- Line numbers accurately reflect changes
- Descriptions match actual diff content
- Summary length appropriate for PR size

**Common Issues & Solutions**:
- Invalid PR number → Show available PRs with context
- Missing tools → Provide setup instructions with verification
- Auth issues → Guide through authentication with test commands
- Large PRs → Apply progressive summarization with thinking budget management

## Examples with Enhanced Analysis

### Command Usage
```bash
/pr-summary 131    # Analyzes PR #131 with full methodology
```

### Enhanced Summary Example
```markdown
## Summary

**Overview**: Implements async processing pipeline with 40% performance improvement while maintaining backwards compatibility through careful API design.

### Primary Changes
- **Performance: Add async model inference** - Enables concurrent request processing via `asyncio.gather()` pattern in `inference.py:L45-52`
  - Trade-off: Added complexity for 3x throughput improvement
  - Verification: ✓ Benchmarked, ✓ Error handling preserved
  
- **Bug Fix: Resolve worker pool deadlock** - Fixes race condition using context managers in `workers.py:L156-168`  
  - Root cause: Competing lock acquisition in cleanup path
  - Verification: ✓ Stress tested, ✓ No regression in normal flow

- **Optimization: Vectorize batch processing** - Reduces memory by 40% using numpy operations in `processing.py:L78-85`
  - Impact: 500MB → 300MB for standard workloads
  - Verification: ✓ Memory profiled, ✓ Output identical

### Secondary Changes
- **Refactor: Extract validation logic** - Consolidates from 3 locations to `utils/validation.py:validate_input()`
- **Docs: Update API examples** - Reflects new async patterns in `docs/api.md`

### Technical Considerations
- **Breaking Changes**: None - async methods addition only
- **Performance**: 3x throughput, 40% memory reduction
- **Dependencies**: Added `aiofiles==0.8.0` for async file operations

### Context & Rationale
This PR addresses production bottlenecks identified in Q4 performance review. The async implementation maintains compatibility while enabling horizontal scaling for high-traffic deployments.
```

## Continuous Improvement

After each PR analysis:
1. Assess if new patterns emerged requiring framework updates
2. Evaluate thinking budget allocation effectiveness
3. Collect feedback on summary accuracy and usefulness
4. Refine categorization frameworks based on domain patterns
5. Update bias detection based on observed tendencies