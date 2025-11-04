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

4. **Remove gone branches and their worktrees:**
   ```bash
   git branch -vv | grep '\[gone\]' | awk '{print $1}' | while read branch; do
     branch_name=${branch#\*}
     branch_name=${branch_name#\+}
     branch_name=$(echo $branch_name | xargs)
     worktree=$(git worktree list | grep "\\[$branch_name\\]" | awk '{print $1}')
     if [ -n "$worktree" ]; then
       echo "Removing worktree: $worktree"
       git worktree remove --force "$worktree"
     fi
     echo "Deleting branch: $branch_name"
     git branch -D "$branch_name"
   done
   ```

Report the results: list of removed worktrees and deleted branches, or notify if no [gone] branches exist.