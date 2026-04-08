---
name: clean-gone-branches
description: This skill should be used when user asks to "clean gone branches", "remove deleted local branches", "prune branches removed from remote", or explicitly invokes "clean-gone-branches".
---

# Clean Gone Branches

Remove local git branches that have been deleted from the remote.

## Process

1. **Update remote references**
   - Run `git fetch --prune`.

2. **Inspect local state**
   - Run `git branch -vv` to find branches marked as `[gone]`.
   - Run `git worktree list` to see whether any of those branches still have worktrees.

3. **Remove worktrees first**
   - For each `[gone]` branch that still has a worktree, remove the worktree before deleting the branch.

4. **Delete the gone branches**
   - Delete each local branch marked as `[gone]`.

5. **Report the result**
   - List removed worktrees and deleted branches.
   - If there are no `[gone]` branches, report that nothing needed cleanup.
