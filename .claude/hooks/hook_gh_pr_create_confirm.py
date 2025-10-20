#!/usr/bin/env python3
"""PreToolUse hook: show confirmation modal before creating GitHub PR via gh CLI."""
import json
import re
import subprocess
import sys


def parse_gh_pr_create(command: str) -> dict[str, str]:
    """Parse gh pr create command to extract PR parameters.

    Args:
        command (str): The gh pr create command string

    Returns:
        (dict): Dictionary with title, body, assignee, reviewer keys
    """
    params = {"title": "", "body": "", "assignee": "", "reviewer": ""}

    # Extract title (-t or --title)
    title_match = re.search(r'(?:-t|--title)\s+["\']([^"\']+)["\']', command)
    if title_match:
        params["title"] = title_match.group(1)

    # Extract body (-b or --body) - handle HEREDOC syntax first, then simple quotes
    heredoc_match = re.search(
        r'(?:-b|--body)\s+"?\$\(cat\s+<<["\']?(\w+)["\']?\s+(.*?)\s+\1\s*\)"?',
        command,
        re.DOTALL,
    )
    if heredoc_match:
        params["body"] = heredoc_match.group(2).strip()
    else:
        body_match = re.search(r'(?:-b|--body)\s+"([^"]+)"', command)
        if body_match:
            params["body"] = body_match.group(1)

    # Extract assignee (-a or --assignee)
    assignee_match = re.search(r'(?:-a|--assignee)\s+([^\s]+)', command)
    if assignee_match:
        params["assignee"] = assignee_match.group(1)

    # Extract reviewer (-r or --reviewer)
    reviewer_match = re.search(r'(?:-r|--reviewer)\s+([^\s]+)', command)
    if reviewer_match:
        params["reviewer"] = reviewer_match.group(1)

    return params


def resolve_username(assignee: str) -> str:
    """Resolve @me to actual GitHub username.

    Args:
        assignee (str): Assignee value from command (may be @me)

    Returns:
        (str): Resolved username or original value
    """
    if assignee == "@me":
        try:
            result = subprocess.run(
                ["gh", "api", "user", "--jq", ".login"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            if result.returncode == 0:
                return result.stdout.strip()
        except (subprocess.TimeoutExpired, FileNotFoundError):
            pass
    return assignee


def format_confirmation_message(params: dict[str, str]) -> str:
    """Format PR parameters into readable confirmation message.

    Args:
        params (dict): Dictionary with title, body, assignee, reviewer

    Returns:
        (str): Formatted confirmation message
    """
    # Truncate body if too long
    body = params["body"]
    if len(body) > 500:
        body = body[:500] + "..."

    # Resolve assignee
    assignee = resolve_username(params["assignee"]) if params["assignee"] else "None"

    lines = ["📝 Create Pull Request?", "", f"Title: {params['title']}", ""]

    if body:
        lines.extend(["Body:", body, ""])

    lines.append(f"Assignee: {assignee}")

    if params["reviewer"]:
        lines.append(f"Reviewer: {params['reviewer']}")

    return "\n".join(lines)


try:
    input_data = json.load(sys.stdin)
except json.JSONDecodeError as e:
    print(f"Error: Invalid JSON input: {e}", file=sys.stderr)
    sys.exit(1)

tool_name = input_data.get("tool_name", "")
tool_input = input_data.get("tool_input", {})
command = tool_input.get("command", "")

# Only handle gh pr create commands
if tool_name != "Bash" or not command.strip().startswith("gh pr create"):
    sys.exit(0)

# Parse PR parameters
params = parse_gh_pr_create(command)

# Format confirmation message
message = format_confirmation_message(params)

# Return JSON with ask decision
output = {
    "hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "ask",
        "permissionDecisionReason": message,
    }
}

print(json.dumps(output))
sys.exit(0)
