#!/usr/bin/env python3
"""Block AI buzzwords before a write, shell, or tool call lands, so text reads human.

Scans markdown whole, code files only in comments and docstrings, Bash and gh only in commit,
PR, and comment text, patches only in added lines, and MCP calls only in message fields. Always
blocks a few marks and stock words with a plain swap, and flags common words only when they pile
up. En-dash is allowed.

Words draw on Wikipedia "Signs of AI writing": https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing
"""
import json
import re
import shlex
import sys
from collections import Counter
from pathlib import Path

# TODO: build a companion guidance skill from that page's pitfalls, not only its word list

# always blocked on any hit, each mapped to a plain swap or a short "drop it" note
SWAP = {
    "leverage": "use", "utilize": "use", "plethora": "many", "myriad": "many",
    "delve": "look at", "paradigm": "model", "tapestry": "mix", "showcase": "show",
    "prose": "text", "realm": "area", "landscape": "field", "innovative": "new",
    "transformative": "major", "unprecedented": "new", "consolidate": "merge",
    "modernize": "update", "streamline": "simplify", "flexible": "adjustable",
    "establish": "set up", "enhanced": "better", "comprehensive": "full", "optimize": "improve",
    "unequivocally": "clearly", "symphony": "mix", "delicate": "fragile", "begrudgingly": "reluctantly",
    "merit": "worth", "albeit": "though", "reverent": "respectful", "revolutionizing": "changing",
    "revolutionize": "change", "crucially": "drop it", "remarkably": "drop it", "seamlessly": "drop it",
    "manifestation": "sign", "testament": "sign", "prominent": "clear", "underscoring": "showing",
    "symbolizing": "showing", "cultivating": "building", "fostering": "building", "encompassing": "covering",
    "facilitating": "helping", "emphasizing": "showing", "embodying": "showing", "underlies": "drives",
    "evoke": "stir", "enduring": "lasting", "nestled": "in", "fascinating": "notable",
    "vibrant": "lively", "game-changing": "big", "cutting-edge": "latest",
}

# always blocked cliches and filler openers, each mapped to a short fix note
PHRASES = [
    (r"ever[- ]evolving", "drop 'ever-evolving'"),
    (r"fast[- ]paced world", "drop 'fast-paced world'"),
    (r"a testament to", "say what it shows"),
    (r"vibrant tapestry", "drop the cliche"),
    (r"aims to explore", "say 'covers'"),
    (r"aims to bridge", "say what it connects"),
    (r"foster innovation", "say what gets built"),
    (r"measured steps", "drop the cliche"),
    (r"practiced efficiency", "drop the cliche"),
    (r"stark reminder", "drop the cliche"),
    (r"it is important to note", "state the point"),
    (r"as an ai language model", "drop it"),
    (r"in conclusion", "drop it"),
    (r"in summary", "drop it"),
    (r"to sum up", "drop it"),
    (r"plays? a \w+ role in shaping", "say what it does"),
]

# fine once, suspicious when repeated, flagged at LIMIT or more
# 'prompted' sits here on purpose, LLM comments and docstrings use it a lot
LIMIT = 3
OFTEN = ["crucial", "essential", "vital", "significant", "moreover", "furthermore", "additionally", "aligns", "explore", "prompted"]

MARKS = {"—": "em-dash, use commas or periods", "§": "section sign", ";": "semicolon, use a period or comma"}
SWAP_RE = re.compile(r"\b(" + "|".join(SWAP) + r")\b", re.IGNORECASE)
OFTEN_RE = re.compile(r"\b(" + "|".join(OFTEN) + r")\b", re.IGNORECASE)

HEREDOC = re.compile(r"<<-?\s*[\"']?([A-Za-z_]\w*)[\"']?\r?\n(.*?)\r?\n[ \t]*\1\b", re.DOTALL)
FIELD_FLAGS = {"-f", "-F", "--field", "--raw-field"}

# MCP input keys that carry human-facing message text, checked as markdown
TEXT_KEYS = {"body", "text", "markdown_text", "content", "description", "title",
             "comment", "message", "subject", "note", "summary", "richtext", "rich_text"}

MD_EXT = {".md", ".markdown", ".mdx", ".txt"}
HASH_EXT = {".py", ".sh", ".bash", ".zsh", ".rb", ".yaml", ".yml", ".toml"}
C_EXT = {".js", ".ts", ".jsx", ".tsx", ".c", ".cc", ".cpp", ".h", ".hpp", ".java", ".go", ".rs", ".css", ".scss", ".swift", ".kt", ".php"}


def md_text(text):
    """Return markdown with fenced and inline code removed."""
    text = re.sub(r"```.*?```", "", text, flags=re.DOTALL)
    return re.sub(r"`[^`]*`", "", text)


def hash_comments(text):
    """Return line-start docstrings and hash comment tails from a hash-comment language."""
    out = re.findall(r'^[ \t]*[rbuRBU]*"""(.*?)"""', text, flags=re.DOTALL | re.MULTILINE)
    out += re.findall(r"^[ \t]*[rbuRBU]*'''(.*?)'''", text, flags=re.DOTALL | re.MULTILINE)
    out += [m.group(1) for line in text.splitlines() if (m := re.search(r"(?:^|\s)#(.*)", line))]
    return "\n".join(out)


def c_comments(text):
    """Return block comments and double-slash comment tails from a C-style language."""
    out = re.findall(r"/\*(.*?)\*/", text, flags=re.DOTALL)
    out += [m.group(1) for line in text.splitlines() if (m := re.search(r"(?:^|\s)//(.*)", line))]
    return "\n".join(out)


def checked(path, text):
    """Return the text regions to check for the file type, empty for unknown types."""
    ext = Path(path).suffix.lower()
    if ext in MD_EXT:
        return md_text(text)
    if ext in HASH_EXT:
        return hash_comments(text)
    if ext in C_EXT:
        return c_comments(text)
    return ""


def bash_text(command):
    """Return commit, PR, and comment message text from a git-commit or gh command, else empty."""
    git_commit = re.search(r"\bgit\b[^|&]*\bcommit\b", command)
    gh = re.search(r"\bgh\b", command)
    if not (git_commit or gh):
        return ""
    parts = [m.group(2) for m in HEREDOC.finditer(command)]
    stripped = HEREDOC.sub(" ", command)
    flags = {"-m", "--message"} if git_commit else set()
    if gh:
        flags |= {"-b", "--body", "-t", "--title"}
    try:
        tokens = shlex.split(stripped, comments=False)
    except ValueError:
        tokens = stripped.split()
    for i, tok in enumerate(tokens):
        key, sep, val = tok.partition("=")
        if tok in flags and i + 1 < len(tokens):
            parts.append(tokens[i + 1])
        elif sep and key in flags:
            parts.append(val)
        elif gh and tok in FIELD_FLAGS and i + 1 < len(tokens):
            field, _, value = tokens[i + 1].partition("=")
            if field in {"body", "title"} and not value.startswith("@"):
                parts.append(value)
    return "\n".join(parts)


def patch_text(patch):
    """Return checkable text from a Codex apply_patch envelope, split by file type."""
    out = []
    for path, block in re.findall(r"^\*\*\* (?:Add|Update) File: (.+?)\s*$(.*?)(?=^\*\*\* |\Z)", patch, re.DOTALL | re.MULTILINE):
        added = "\n".join(ln[1:] for ln in block.splitlines() if ln.startswith("+") and not ln.startswith("+++"))
        out.append(checked(path, added))
    return "\n".join(p for p in out if p)


def mcp_text(obj):
    """Return human-facing field values pulled from an MCP tool input, walked in full."""
    if isinstance(obj, dict):
        items = [v if k.lower() in TEXT_KEYS and isinstance(v, str) else mcp_text(v) for k, v in obj.items()]
    elif isinstance(obj, list):
        items = [mcp_text(v) for v in obj]
    else:
        return ""
    return "\n".join(p for p in items if p)


def extract(tool, tool_input):
    """Return the checkable text for a tool call, routed by tool type."""
    command = tool_input.get("command", "")
    if isinstance(command, list):  # Codex sends the shell tool an argv array, Claude Code a string
        command = " ".join(str(c) for c in command)
    if tool.startswith("mcp__"):
        return md_text(mcp_text(tool_input))
    if tool == "Bash":
        return md_text(bash_text(command))
    if tool == "apply_patch":
        return patch_text(command)
    chunks = [tool_input.get("content", ""), tool_input.get("new_string", "")]
    chunks += [e.get("new_string", "") for e in tool_input.get("edits", []) if isinstance(e, dict)]
    return checked(tool_input.get("file_path", ""), "\n".join(c for c in chunks if c))


data = json.load(sys.stdin)
text = extract(data.get("tool_name", ""), data.get("tool_input") or {})

notes = [f"remove {label}" for ch, label in MARKS.items() if ch in text]
notes += [f"'{w}' -> {SWAP[w]}" for w in dict.fromkeys(m.group(1).lower() for m in SWAP_RE.finditer(text))]
notes += [note for pat, note in PHRASES if re.search(pat, text, re.IGNORECASE)]
counts = Counter(m.group(1).lower() for m in OFTEN_RE.finditer(text))
notes += [f"'{w}' used {n} times, vary it" for w, n in counts.items() if n >= LIMIT]

if notes:
    reason = "humanize: " + ", ".join(notes) + ". Applies to markdown, code comments, and message text."
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny", "permissionDecisionReason": reason}}))
