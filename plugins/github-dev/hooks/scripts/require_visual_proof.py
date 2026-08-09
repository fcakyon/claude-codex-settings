#!/usr/bin/env python3
"""PreToolUse hook: make design PRs carry before/after images hosted on a release.

Denies `gh pr create` and `gh pr edit` when the command writes an inline body and either that body
embeds a raw.githubusercontent image, which only works once the image is committed into the repo, or
the branch changes a webpage or stylesheet and the body carries no image at all. Reads a string
command (Claude Code) and an argv array (Codex). Lets the command through when git cannot list the
branch files.
"""
import json
import re
import sys

SEGMENT = re.compile(r"[\n;]|&&|\|\||\|")
DESIGN = re.compile(r"\.(astro|css|scss|sass|less|html|vue|svelte)$")
IMAGE = re.compile(r"!\[|<img\b", re.IGNORECASE)
# only a raw.githubusercontent URL used as an image, not one merely named in a title
COMMITTED_IMAGE = re.compile(r"(?:!\[[^\]]*\]\([^)]*|<img\b[^>]*)raw\.githubusercontent\.com", re.IGNORECASE)
RECIPE = (
    "Upload them to a release and link that URL: `gh release upload <tag> before.png after.png --clobber`, "
    "then `![before](https://github.com/OWNER/REPO/releases/download/<tag>/before.png)`."
)

data = json.load(sys.stdin)
command = (data.get("tool_input") or {}).get("command", "")
text = " ".join(map(str, command)) if isinstance(command, list) else str(command)

# anchor per command segment so `cd site && gh pr create` matches but `gh issue comment -b "pr create"` does not
if not any(part.strip().startswith(("gh pr create", "gh pr edit")) for part in SEGMENT.split(text)):
    sys.exit(0)

# only a command writing an inline body can be judged, label or reviewer edits carry none
if not re.search(r"(^|\s)(-b|--body)(\s|=)", text):
    sys.exit(0)

# the body text is unreadable here when it comes from a file or a substitution, and `gh pr edit <number>`
# retargets a PR whose branch this checkout may not be on
if "--body-file" in text or ("$(" in text and "<<" not in text) or re.search(r"gh pr edit\s+\d", text):
    sys.exit(0)

import subprocess  # noqa: E402  deferred, this hook runs on every Bash call and reaches here on almost none

# Diff against the base the PR actually targets, not the repo default. A repo with a long-lived
# integration branch (development, staging, next) merges into it rather than into main, so
# origin/HEAD...HEAD attributes every design change already sitting in that base to this branch and
# demands screenshots of somebody else's merged work. Falls back to origin/HEAD when no base is
# given, which is what gh itself defaults to.
base = re.search(r"(?:^|\s)(?:-B|--base)(?:[=\s]+)['\"]?([^\s'\"]+)", text)
base_ref = "origin/" + base.group(1).removeprefix("origin/") if base else "origin/HEAD"

# rev-parse of a missing base exits non-zero, leaving no files and letting the command through
changed = "" if IMAGE.search(text) else subprocess.run(
    ["git", "-C", data.get("cwd") or ".", "diff", "--name-only", f"{base_ref}...HEAD"],
    capture_output=True,
    text=True,
    timeout=5,
).stdout
design = [path for path in changed.split() if DESIGN.search(path)]

if COMMITTED_IMAGE.search(text):
    reason = f"This PR body links a raw.githubusercontent.com image, which only renders once that image is committed into the repo. {RECIPE}"
elif design:
    reason = (
        f"This branch changes design files ({', '.join(design[:3])}) but the PR body has no before/after image. "
        f"Screenshot the page on the base branch and on this branch at the same window size, then put the pair in a "
        f"two-column table. {RECIPE}"
    )
else:
    sys.exit(0)

print(json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny", "permissionDecisionReason": reason}}))
