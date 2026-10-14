---
name: resolve-pr-comments
description: This skill should be used when user asks to "address PR comments", "resolve PR feedback", "handle review comments", "fix PR issues", "respond to PR review", or explicitly invokes "resolve-pr-comments".
---

# Resolve PR Comments

Analyze unresolved PR review comments, fix valid concerns, and draft responses for comments
that do not require code changes.

When explicitly invoked with extra text, treat that text as the PR number or URL. If no PR
reference is provided, infer it from the current branch.

## Process

1. **Preferred execution**
   - If subagents are available, use `github-dev:pr-comment-resolver` and pass the PR reference.
   - Otherwise follow the manual steps below.

2. **Fetch unresolved comments**
   - Use the supplied PR number or URL, or auto-detect with `gh pr view --json number,url`.
   - Set `owner`, `repo`, and `number` from the target PR's base repository. Fetch unresolved inline threads with:

     ```bash
     gh api graphql --paginate \
       -f owner="$owner" -f repo="$repo" -F number="$number" \
       -f query='
     query($owner: String!, $repo: String!, $number: Int!,
           $endCursor: String) {
       repository(owner: $owner, name: $repo) {
         pullRequest(number: $number) {
           reviewThreads(first: 100, after: $endCursor) {
             pageInfo { hasNextPage endCursor }
             nodes {
               id isResolved isOutdated path line
               comments(first: 1) {
                 nodes { id databaseId url body author { login } }
               }
             }
           }
         }
       }
     }' \
       --jq '.data.repository.pullRequest.reviewThreads.nodes
              | map(select(.isResolved == false))'
     ```

   - Collect the JSON array from every page. Keep unresolved threads even when `isOutdated` is true. Outdated describes the diff location, not resolution.
   - Stop and report any failed page or GraphQL error. Only a successful complete fetch can establish that no unresolved threads remain.
   - The query includes each thread's root comment. Read replies with `gh api "repos/$owner/$repo/pulls/$number/comments" --paginate --slurp`, matching the root `databaseId` and replies' `in_reply_to_id`. REST comments supply context, not resolution state.
   - Fetch review bodies and conversation comments separately with `gh pr view "$number" --repo "$owner/$repo" --json reviews,comments`. These have no inline-thread resolution flag.

3. **Resolve each comment**
   - If the comment is valid, fix the code and search the codebase for the same problem in other locations.
   - Fix all matching occurrences, not just the location mentioned in the comment.
   - If the comment does not require a code change, draft a concise reply.
   - If the comment is from a bot, reply with a direct factual sentence and no pleasantries.

4. **Reply style**
   - Start in lowercase.
   - Use simple language and short sentences.
   - Avoid end punctuation when possible.
   - Be concise and polite when replying to real people.

5. **Never auto-submit**
   - Present all draft responses before posting them.
   - Reply comments are posted directly with `gh api repos/{owner}/{repo}/pulls/{number}/comments/{comment_id}/replies -f body="..."` (the `{number}` PR number is required, the endpoint 404s without it).
   - Add a random 3-5 second delay between posted replies with `sleep $((RANDOM % 3 + 3))`.
