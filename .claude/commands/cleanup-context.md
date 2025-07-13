# Memory Bank Context Optimization

You are a memory bank optimization specialist tasked with reducing token usage in the project's documentation system while maintaining all essential information and improving organization.

## Task Overview

Analyze the project's memory bank files (CLAUDE-*.md, CLAUDE.md, README.md) to identify and eliminate token waste through:

1. **Duplicate content removal**
2. **Obsolete file elimination**
3. **Content consolidation**
4. **Archive strategy implementation**
5. **Essential content optimization**

## Analysis Phase

### 1. Initial Assessment

```bash
# Get comprehensive file size analysis
find . -name "CLAUDE-*.md" -exec wc -c {} \; | sort -nr
wc -c CLAUDE.md README.md
```

**Examine for:**

- Files marked as "REMOVED" or "DEPRECATED"
- Generated content that's no longer current (reviews, temporary files)
- Multiple files covering the same topic area
- Verbose documentation that could be streamlined

### 2. Identify Optimization Opportunities

**High-Impact Targets (prioritize first):**

- Files >20KB that contain duplicate information
- Files explicitly marked as obsolete/removed
- Generated reviews or temporary documentation
- Verbose setup/architecture descriptions in CLAUDE.md

**Medium-Impact Targets:**

- Files 10-20KB with overlapping content
- Historic documentation for resolved issues
- Detailed implementation docs that could be consolidated

**Low-Impact Targets:**

- Files <10KB with minor optimization potential
- Content that could be streamlined but is unique

## Optimization Strategy

### Phase 1: Remove Obsolete Content (Highest Impact)

**Target:** Files marked as removed, deprecated, or clearly obsolete

**Actions:**

1. Delete files marked as "REMOVED" or "DEPRECATED"
2. Remove generated reviews/reports that are outdated
3. Clean up empty or minimal temporary files
4. Update CLAUDE.md references to removed files

**Expected Savings:** 30-50KB typically

### Phase 2: Consolidate Overlapping Documentation (High Impact)

**Target:** Multiple files covering the same functional area

**Common Consolidation Opportunities:**

- **Security files:** Combine security-fixes, security-optimization, security-hardening into one comprehensive file
- **Performance files:** Merge performance-optimization and test-suite documentation
- **Architecture files:** Consolidate detailed architecture descriptions
- **Testing files:** Combine multiple test documentation files

**Actions:**

1. Create consolidated files with comprehensive coverage
2. Ensure all essential information is preserved
3. Remove the separate files
4. Update all references in CLAUDE.md

**Expected Savings:** 20-40KB typically

### Phase 3: Streamline CLAUDE.md (Medium Impact)

**Target:** Remove verbose content that duplicates memory bank files

**Actions:**

1. Replace detailed descriptions with concise summaries
2. Remove redundant architecture explanations
3. Focus on essential guidance and references
4. Eliminate duplicate setup instructions

**Expected Savings:** 5-10KB typically

### Phase 4: Archive Strategy (Medium Impact)

**Target:** Historic documentation that's resolved but worth preserving

**Actions:**

1. Create `archive/` directory
2. Move resolved issue documentation to archive
3. Add archive README.md with index
4. Update CLAUDE.md with archive reference
5. Preserve discoverability while reducing active memory

**Expected Savings:** 10-20KB typically

## Consolidation Guidelines

### Creating Comprehensive Files

**Security Consolidation Pattern:**

```markdown
# CLAUDE-security-comprehensive.md

**Status**: ✅ COMPLETE - All Security Implementations  
**Coverage**: [List of consolidated topics]

## Executive Summary
[High-level overview of all security work]

## [Topic 1] - [Original File 1 Content]
[Essential information from first file]

## [Topic 2] - [Original File 2 Content] 
[Essential information from second file]

## [Topic 3] - [Original File 3 Content]
[Essential information from third file]

## Consolidated [Cross-cutting Concerns]
[Information that appeared in multiple files]
```

**Quality Standards:**

- Maintain all essential technical information
- Preserve implementation details and examples
- Keep configuration examples and code snippets
- Include all important troubleshooting information
- Maintain proper status tracking and dates

### File Naming Convention

- Use `-comprehensive` suffix for consolidated files
- Use descriptive names that indicate complete coverage
- Update CLAUDE.md with single reference per topic area

## Implementation Process

### 1. Plan and Validate

```bash
# Create todo list for tracking
TodoWrite with optimization phases and specific files
```

### 2. Execute by Priority

- Start with highest-impact targets (obsolete files)
- Move to consolidation opportunities
- Optimize main documentation
- Implement archival strategy

### 3. Update References

- Update CLAUDE.md memory bank file list
- Remove references to deleted files
- Add references to new consolidated files
- Update archive references

### 4. Validate Results

```bash
# Calculate savings achieved
find . -name "CLAUDE-*.md" -not -path "*/archive/*" -exec wc -c {} \; | awk '{sum+=$1} END {print sum}'
```

## Expected Outcomes

### Typical Optimization Results

- **15-25% total token reduction** in memory bank
- **Improved organization** with focused, comprehensive files
- **Maintained information quality** with no essential loss
- **Better maintainability** through reduced duplication
- **Preserved history** via organized archival

### Success Metrics

- Total KB/token savings achieved
- Number of files consolidated
- Percentage reduction in memory bank size
- Maintenance of all essential information

## Quality Assurance

### Information Preservation Checklist

- [ ] All technical implementation details preserved
- [ ] Configuration examples and code snippets maintained
- [ ] Troubleshooting information retained
- [ ] Status tracking and timeline information kept
- [ ] Cross-references and dependencies documented

### Organization Improvement Checklist

- [ ] Related information grouped logically
- [ ] Clear file naming and purpose
- [ ] Updated CLAUDE.md references
- [ ] Archive strategy implemented
- [ ] Discoverability maintained

## Post-Optimization Maintenance

### Regular Optimization Schedule

- **Monthly**: Check for new obsolete files
- **Quarterly**: Review for new consolidation opportunities
- **Semi-annually**: Comprehensive optimization review
- **As-needed**: After major implementation phases

### Warning Signs for Re-optimization

- Memory bank files exceeding previous optimized size
- Multiple new files covering same topic areas
- Files marked as removed/deprecated but still present
- User feedback about context window limitations

## Documentation Standards

### Consolidated File Format

```markdown
# CLAUDE-[topic]-comprehensive.md

**Last Updated**: [Date]
**Status**: ✅ [Status Description]
**Coverage**: [What this file consolidates]

## Executive Summary
[Overview of complete topic coverage]

## [Major Section 1]
[Comprehensive coverage of subtopic]

## [Major Section 2] 
[Comprehensive coverage of subtopic]

## [Cross-cutting Concerns]
[Information spanning multiple original files]
```

### Archive File Format

```markdown
# archive/README.md

## Archived Files
### [Category]
- **filename.md** - [Description] (resolved/historic)

## Usage
Reference when investigating similar issues or understanding implementation history.
```

This systematic approach ensures consistent, effective memory bank optimization while preserving all essential information and improving overall organization.