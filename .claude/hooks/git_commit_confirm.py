#!/usr/bin/env python3
"""PreToolUse hook: show confirmation modal before creating git commit."""
import json
import re
import subprocess
import sys


def parse_git_commit_message(command: str) -> dict[str, str]:
    """Parse git commit command to extract commit message.

    Args:
        command (str): The git commit command string

    Returns:
        (dict): Dictionary with message and is_amend keys
    """
    params = {"message": "", "is_amend": False}

    # Check for --amend flag
    params["is_amend"] = "--amend" in command

    # Try to extract heredoc format: git commit -m "$(cat <<'EOF' ... EOF)"
    heredoc_match = re.search(r"<<'EOF'\s*\n(.*?)\nEOF", command, re.DOTALL)
    if heredoc_match:
        params["message"] = heredoc_match.group(1).strip()
        return params

    # Try to extract simple -m "message" format
    simple_matches = re.findall(r'(?:-m|--message)\s+["\']([^"\']+)["\']', command)
    if simple_matches:
        # Join multiple -m flags with double newlines
        params["message"] = "\n\n".join(simple_matches)
        return params

    return params


def get_staged_files() -> tuple[list[str], str]:
    """Get list of staged files and diff stats.

    Returns:
        (tuple): (list of file paths, diff stats string)
    """
    try:
        # Get list of staged files
        files_result = subprocess.run(
            ["git", "diff", "--cached", "--name-only"],
            capture_output=True,
            text=True,
            timeout=5,
        )

        # Get diff stats
        stats_result = subprocess.run(
            ["git", "diff", "--cached", "--stat"],
            capture_output=True,
            text=True,
            timeout=5,
        )

        files = []
        if files_result.returncode == 0:
            files = [f for f in files_result.stdout.strip().split("\n") if f]

        stats = ""
        if stats_result.returncode == 0:
            # Get last line which contains the summary
            stats_lines = stats_result.stdout.strip().split("\n")
            if stats_lines:
                stats = stats_lines[-1]

        return files, stats

    except (subprocess.TimeoutExpired, FileNotFoundError):
        return [], ""


def format_confirmation_message(message: str, is_amend: bool, files: list[str], stats: str) -> str:
    """Format commit parameters into readable confirmation message.

    Args:
        message (str): Commit message
        is_amend (bool): Whether this is an amend commit
        files (list): List of staged file paths
        stats (str): Diff statistics string

    Returns:
        (str): Formatted confirmation message
    """
    lines = []

    # Header
    if is_amend:
        lines.append("💾 Amend Previous Commit?")
    else:
        lines.append("💾 Create Commit?")
    lines.append("")

    # Commit message
    if message:
        lines.append("Message:")
        lines.append(message)
        lines.append("")

    # Files
    if files:
        lines.append(f"Files to be committed ({len(files)}):")
        # Show first 15 files, truncate if more
        display_files = files[:15]
        for f in display_files:
            lines.append(f"- {f}")
        if len(files) > 15:
            lines.append(f"... and {len(files) - 15} more files")
        lines.append("")

    # Stats
    if stats:
        lines.append("Stats:")
        lines.append(stats)

    # Warning if no files staged
    if not files:
        lines.append("⚠️  No files staged for commit")

    return "\n".join(lines)


try:
    input_data = json.load(sys.stdin)
except json.JSONDecodeError as e:
    print(f"Error: Invalid JSON input: {e}", file=sys.stderr)
    sys.exit(1)

tool_name = input_data.get("tool_name", "")
tool_input = input_data.get("tool_input", {})
command = tool_input.get("command", "")

# Only handle git commit commands
if tool_name != "Bash" or not command.strip().startswith("git commit"):
    sys.exit(0)

# Parse commit message
params = parse_git_commit_message(command)

# Get staged files and stats
files, stats = get_staged_files()

# Format confirmation message
message = format_confirmation_message(params["message"], params["is_amend"], files, stats)

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
