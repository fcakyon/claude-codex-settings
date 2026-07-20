#!/usr/bin/env python3
"""Flag AI-tell wording before a Write or Edit lands, so drafted text reads human.

Checks markdown files whole, and in code files only the comment and docstring lines,
never real code. Always blocks a few marks and stock words, each with a plain swap, and
flags a wider set of common words only when they pile up. En-dash is allowed. The pile-up
count sees one write at a time, so it is exact on a whole-file Write and partial on an Edit.
"""
import json
import re
import sys
from collections import Counter
from pathlib import Path

# always blocked on any hit, each mapped to a plain replacement
SWAP = {
    "leverage": "use", "utilize": "use", "plethora": "many", "myriad": "many",
    "delve": "look at", "paradigm": "model", "tapestry": "mix", "showcase": "show",
    "prose": "text", "realm": "area", "landscape": "field", "innovative": "new",
    "transformative": "major", "unprecedented": "new", "consolidate": "merge",
    "modernize": "update", "streamline": "simplify", "flexible": "adjustable",
    "establish": "set up", "enhanced": "better", "comprehensive": "full", "optimize": "improve",
}

# always blocked cliches and filler openers, each mapped to a short fix note
PHRASES = [
    (r"ever[- ]evolving", "drop 'ever-evolving'"),
    (r"fast[- ]paced world", "drop 'fast-paced world'"),
    (r"a testament to", "say what it shows"),
    (r"vibrant tapestry", "drop the cliche"),
    (r"aims to explore", "say 'covers'"),
    (r"it is important to note", "state the point"),
    (r"as an ai language model", "drop it"),
    (r"in conclusion", "drop it"),
    (r"in summary", "drop it"),
    (r"to sum up", "drop it"),
    (r"plays? a \w+ role in shaping", "say what it does"),
]

# fine once, an AI-tell when repeated, flagged at LIMIT or more
LIMIT = 3
OFTEN = ["crucial", "essential", "vital", "significant", "moreover", "furthermore", "additionally", "aligns", "explore"]

MARKS = {"—": "em-dash, use commas or periods", "§": "section sign", ";": "semicolon, use a period or comma"}
SWAP_RE = re.compile(r"\b(" + "|".join(SWAP) + r")\b", re.IGNORECASE)
OFTEN_RE = re.compile(r"\b(" + "|".join(OFTEN) + r")\b", re.IGNORECASE)

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


data = json.load(sys.stdin)
tool_input = data.get("tool_input") or {}
chunks = [tool_input.get("content", ""), tool_input.get("new_string", "")]
chunks += [e.get("new_string", "") for e in tool_input.get("edits", []) if isinstance(e, dict)]
text = checked(tool_input.get("file_path", ""), "\n".join(c for c in chunks if c))

notes = [f"remove {label}" for ch, label in MARKS.items() if ch in text]
notes += [f"'{w}' to '{SWAP[w]}'" for w in dict.fromkeys(m.group(1).lower() for m in SWAP_RE.finditer(text))]
notes += [note for pat, note in PHRASES if re.search(pat, text, re.IGNORECASE)]
counts = Counter(m.group(1).lower() for m in OFTEN_RE.finditer(text))
notes += [f"'{w}' used {n} times, vary it" for w, n in counts.items() if n >= LIMIT]

if notes:
    reason = "humanize: " + ", ".join(notes) + ". Applies to markdown, comments, and docstrings."
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny", "permissionDecisionReason": reason}}))
