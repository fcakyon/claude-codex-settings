---
name: linear-usage
description: "Guide Linear issue tracking, sprint planning, and project management. Covers writing effective issues, label taxonomies, priority levels, cycle planning, triage workflows, and GitHub integration. Use when the user asks about Linear issues, issue tracking best practices, sprint planning, creating issues, or organizing projects in Linear."
---

# Linear & Issue Tracking Best Practices

## 1. Writing Effective Issues

### Clear Titles

Write titles that describe the problem or outcome:

- **Good:** "Users can't reset password on mobile Safari"
- **Bad:** "Password bug"
- **Good:** "Add export to CSV for user reports"
- **Bad:** "Export feature"

### Descriptions

Every issue description should include:

1. **Context:** Why this matters
2. **Current behavior:** What happens now (for bugs)
3. **Expected behavior:** What should happen
4. **Steps to reproduce:** For bugs
5. **Acceptance criteria:** Definition of done

### Issue Templates

**Bug report:**

```
## Description
Brief description of the issue.

## Steps to Reproduce
1. Step one
2. Step two
3. Issue occurs

## Expected Behavior
What should happen.

## Actual Behavior
What happens instead.

## Environment
- Browser/OS
- User type
```

**Feature request:**

```
## Problem Statement
What problem does this solve?

## Proposed Solution
High-level approach.

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
```

## 2. Label Taxonomy

**Type labels:** `bug`, `feature`, `improvement`, `chore`

**Area labels:** `frontend`, `backend`, `api`, `mobile` or by feature area (`auth`, `payments`, `onboarding`)

**Status labels (if not using workflow states):** `needs-triage`, `blocked`, `needs-design`

Keep label count to 15-25 total. Use consistent naming, color-code by category, and prune quarterly.

## 3. Priority and Estimation

### Priority Levels

| Level | When to use |
|-------|-------------|
| **Urgent (P0)** | Production down, security issue |
| **High (P1)** | Major functionality broken, key deadline |
| **Medium (P2)** | Important but not urgent |
| **Low (P3)** | Nice to have, minor improvements |

### Estimation

- Use relative sizing (points) not hours
- Estimate complexity, not time
- Include testing and review time
- Re-estimate if scope changes significantly

## 4. Cycle/Sprint Planning

### Planning Process

1. Review backlog priorities
2. Pull issues into cycle based on 70-80% capacity (leave room for interrupts)
3. Break down large items (>5 points)
4. Assign owners
5. Identify dependencies and blockers

Run 1-2 week cycles. Review carryover items and hold a brief retrospective at cycle end.

## 5. Project Organization

**Projects:** Focused, time-bound work (1-3 months) with a single team and clear deliverable. Example: "Mobile app v2 launch"

**Initiatives:** Strategic themes spanning multiple projects over longer timeframes. Example: "Platform reliability"

Keep roadmap items high-level, update status regularly, and share with stakeholders.

## 6. Triage Workflow

1. Review new issues daily
2. Add missing information (labels, priority)
3. Assign to appropriate team/person
4. Link related issues
5. Move to backlog or close if invalid

Close with a clear reason: Completed, Duplicate (link to original), Won't fix (explain why), or Invalid.

## 7. GitHub Integration

- Reference Linear issue ID in PR title or description for auto-linking
- Use branch names with issue ID (e.g., `feat/LIN-123-add-export`) for automatic linking
- Configure workflow automation: PR opened moves issue to "In Progress", PR merged moves to "Done"
