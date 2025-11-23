---
description: Clean up local branches deleted from remote
---

# Clean Gone Branches

Remove local git branches that have been deleted from remote (marked as [gone]).

## Instructions

Run the following commands in sequence:

1. **Update remote references:**
   ```bash
   git fetch --prune
   ```

2. **View branches marked as [gone]:**
   ```bash
   git branch -vv
   ```

3. **List worktrees (if any):**
   ```bash
   git worktree list
   ```

4. **Remove worktrees for gone branches (if any):**
   ```bash
   git branch -vv | grep '\[gone\]' | awk '{print $1}' | sed 's/^[*+]*//' | while read -r branch; do
     worktree=$(git worktree list | grep "\[$branch\]" | awk '{print $1}')
     if [ -n "$worktree" ]; then
       echo "Removing worktree: $worktree"
       git worktree remove --force "$worktree"
     fi
   done
   ```

5. **Delete gone branches:**
   ```bash
   git branch -vv | grep '\[gone\]' | awk '{print $1}' | sed 's/^[*+]*//' | xargs -I {} git branch -D {}
   ```

Report the results: list of removed worktrees and deleted branches, or notify if no [gone] branches exist.