#!/usr/bin/env python3
"""Block AI buzzwords before a write, shell, or tool call lands, so text reads human.

Scans markdown whole, code files only in comments and docstrings, shell only in commit and PR text
plus heredoc bodies that cat or tee writes to a file, patches only in added lines, and MCP calls
only in message fields. Always blocks a few marks and stock words with a plain swap, and flags
common words only when they pile up. En-dash is allowed.

Words draw on Wikipedia "Signs of AI writing": https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing
"""

import json
import re
import shlex
import sys
from collections import namedtuple
from pathlib import Path

# TODO: build a companion guidance skill from that page's pitfalls, not only its word list

# fmt: off
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

MARKS = {"—": ("em-dash", "use commas or periods"), "§": ("section sign", "remove it"), ";": ("semicolon", "use a period or comma")}
MARK_RE = re.compile("|".join(map(re.escape, MARKS)))
CODE_REFERENCE_RE = re.compile(
    r"(?<![\w$])(?:[$A-Za-z_]\w*(?:(?:->|::|\.)[$A-Za-z_]\w*)*(?:\([^;\n]*\))|"
    r"[$A-Za-z_]\w*(?:(?:->|::|\.)[$A-Za-z_]\w*)+|"
    r"[$A-Za-z_]\w*(?:\[[^;\n]*\])?\s*[-+*/%?]?=\s*[^;\n]+)\s*;"
)
CSS_REFERENCE_RE = re.compile(
    r"\b[-A-Za-z_]\w*(?:-[-\w]+)*\s*:\s*(?:none|block|inline(?:-block)?|flex|grid|auto|inherit|initial|"
    r"unset|transparent|currentcolor|[-+]?(?:\d*\.)?\d+(?:px|rem|em|%|vh|vw|s|ms)?|#[0-9a-f]{3,8}|"
    r"(?:var|calc|url|rgba?|hsla?)\([^;\n]*\))\s*;",
    re.IGNORECASE,
)
SWAP_RE = re.compile(r"\b(" + "|".join(SWAP) + r")\b", re.IGNORECASE)
OFTEN_RE = re.compile(r"\b(" + "|".join(OFTEN) + r")\b", re.IGNORECASE)

# groups are the delimiter, the rest of the opening line, and the body
HEREDOC = re.compile(r"<<-?[ \t]*[\"']?([A-Za-z_]\w*)[\"']?([^\n]*)\r?\n(.*?)\r?\n[ \t]*\1[ \t]*$", re.DOTALL | re.MULTILINE)
FIELD_FLAGS = {"-f", "-F", "--field", "--raw-field"}

# only cat and tee put a heredoc body in a file unchanged, python or sed in front of it rewrites the text
SEPARATOR = re.compile(r"\|\||&&|[\n;|&]")
CAT_TEE = re.compile(r"^\s*(cat|tee)\b(.*)$", re.DOTALL)
REDIRECT = re.compile(r"(?<![0-9&])>>?[ \t]*(\"[^\"]*\"|'[^']*'|[^\s'\"|&;<>]+)")

# MCP input keys that carry human-facing message text, checked as markdown
MESSAGE_KEYS = {"body", "text", "markdown_text", "content", "comment", "message"}
TEXT_KEYS = MESSAGE_KEYS | {"description", "title", "subject", "note", "summary", "richtext", "rich_text"}

MD_EXT = {".md", ".markdown", ".mdx"}
HASH_EXT = {".py", ".sh", ".bash", ".zsh", ".rb", ".yaml", ".yml", ".toml"}
C_EXT = {".js", ".ts", ".jsx", ".tsx", ".c", ".cc", ".cpp", ".h", ".hpp", ".java", ".go", ".rs", ".css", ".scss", ".swift", ".kt", ".php"}
# fmt: on


Region = namedtuple("Region", "source text")
Finding = namedtuple("Finding", "region start end rule replacement")


def masked(text, keep):
    """Mask excluded characters with spaces while preserving newlines."""
    return "".join(char if char in "\r\n" or keep[i] else " " for i, char in enumerate(text))


def md_text(text):
    """Mask fenced and inline Markdown code without changing source offsets."""
    keep = [True] * len(text)
    offset = 0
    fence = None
    for line in text.splitlines(keepends=True):
        match = re.match(r" {0,3}(`{3,}|~{3,})(.*)$", line.rstrip("\r\n"))
        if fence:
            keep[offset : offset + len(line)] = [False] * len(line)
            if (
                match
                and match.group(1)[0] == fence[0]
                and len(match.group(1)) >= len(fence)
                and not match.group(2).strip()
            ):
                fence = None
        elif match:
            fence = match.group(1)
            keep[offset : offset + len(line)] = [False] * len(line)
        offset += len(line)

    i = 0
    while i < len(text):
        if text[i] != "`" or not keep[i]:
            i += 1
            continue
        end = i
        while end < len(text) and text[end] == "`":
            end += 1
        delimiter = text[i:end]
        close = text.find(delimiter, end)
        if close < 0:
            i = end
            continue
        keep[i : close + len(delimiter)] = [False] * (close + len(delimiter) - i)
        i = close + len(delimiter)
    return masked(text, keep)


def code_refs(text, ext):
    """Mask code-shaped references in comments and docstrings without changing source offsets."""
    patterns = (CODE_REFERENCE_RE, CSS_REFERENCE_RE) if ext in {".css", ".scss"} else (CODE_REFERENCE_RE,)
    for pattern in patterns:
        text = pattern.sub(lambda match: " " * len(match.group()), text)
    return text


def hash_comments(text):
    """Mask everything except docstrings and quote-aware hash comments."""
    keep = [False] * len(text)
    for pattern in (r'^[ \t]*[rbuRBU]*""".*?"""', r"^[ \t]*[rbuRBU]*'''.*?'''"):
        for match in re.finditer(pattern, text, flags=re.DOTALL | re.MULTILINE):
            keep[match.start() : match.end()] = [True] * (match.end() - match.start())
    offset = 0
    for line in text.splitlines(keepends=True):
        quote = None
        escaped = False
        for i, char in enumerate(line):
            if escaped:
                escaped = False
            elif char == "\\" and quote:
                escaped = True
            elif quote:
                if char == quote:
                    quote = None
            elif char in "\"'":
                quote = char
            elif char == "#":
                keep[offset + i : offset + len(line)] = [True] * (len(line) - i)
                break
        offset += len(line)
    return masked(text, keep)


def c_comments(text):
    """Mask everything except quote-aware C-style comments."""
    keep = [False] * len(text)
    i = 0
    quote = None
    while i < len(text):
        if quote:
            if text[i] == "\\":
                i += 2
            else:
                quote = None if text[i] == quote else quote
                i += 1
        elif text[i] in "\"'`":
            quote = text[i]
            i += 1
        elif text.startswith("//", i):
            end = text.find("\n", i)
            end = len(text) if end < 0 else end
            keep[i:end] = [True] * (end - i)
            i = end
        elif text.startswith("/*", i):
            end = text.find("*/", i + 2)
            end = len(text) if end < 0 else end + 2
            keep[i:end] = [True] * (end - i)
            i = end
        else:
            i += 1
    return masked(text, keep)


def checked(path, text, selected=None):
    """Return one source-preserving region for a known file type."""
    ext = Path(path).suffix.lower()
    if ext in MD_EXT:
        text = md_text(text)
    elif ext in HASH_EXT:
        text = code_refs(md_text(hash_comments(text)), ext)
    elif ext in C_EXT:
        text = code_refs(md_text(c_comments(text)), ext)
    else:
        return []
    if selected is not None:
        text = masked(text, selected)
    return [Region(path, text)] if text.strip() else []


def heredocs(command):
    """Yield each heredoc body paired with the simple command that opens it."""
    for m in HEREDOC.finditer(command):
        yield SEPARATOR.split(command[: m.start()])[-1] + SEPARATOR.split(m.group(2))[0], m.group(3)


def heredoc_writes(command):
    """Return regions from heredoc bodies that cat or tee writes unchanged."""
    out = []
    for head, body in heredocs(command):
        if not (writer := CAT_TEE.match(head)):
            continue
        targets = REDIRECT.findall(head)
        if writer.group(1) == "tee":
            targets += [a for a in REDIRECT.sub(" ", writer.group(2)).split() if not a.startswith("-")]
        for target in targets:
            out += checked(target.strip("\"'"), body)
    return out


def bash_text(command):
    """Return labeled commit, PR, and comment messages from a shell command."""
    git_commit = re.search(r"\bgit\b[^|&]*\bcommit\b", command)
    gh = re.search(r"\bgh\b", command)
    if not (git_commit or gh):
        return []
    body_source = "PR body" if re.search(r"\bgh\s+pr\b", command) else "GitHub body"
    parts = [
        ("commit message" if re.search(r"\bgit\b", head) else body_source, body)
        for head, body in heredocs(command)
        if re.search(r"\b(?:git|gh)\b", head)
    ]
    stripped = HEREDOC.sub(" ", command)
    flags = {"-m": "commit message", "--message": "commit message"} if git_commit else {}
    if gh:
        flags |= {"-b": body_source, "--body": body_source, "-t": "PR title", "--title": "PR title"}
    try:
        tokens = shlex.split(stripped, comments=False)
    except ValueError:
        tokens = stripped.split()
    close_comment = False
    for i, tok in enumerate(tokens):
        if tok in {"&&", "||", ";", "|", "&"}:
            close_comment = False
            continue
        if tokens[i : i + 3] in (["gh", "pr", "close"], ["gh", "issue", "close"]):
            close_comment = True
        key, sep, val = tok.partition("=")
        if tok in flags and i + 1 < len(tokens):
            parts.append((flags[tok], tokens[i + 1]))
        elif sep and key in flags:
            parts.append((flags[key], val))
        elif close_comment and tok in {"-c", "--comment"} and i + 1 < len(tokens):
            parts.append(("GitHub comment", tokens[i + 1]))
        elif close_comment and sep and key in {"-c", "--comment"}:
            parts.append(("GitHub comment", val))
        elif gh and tok in FIELD_FLAGS and i + 1 < len(tokens):
            field, _, value = tokens[i + 1].partition("=")
            if field in {"body", "title"} and not value.startswith("@"):
                parts.append((body_source if field == "body" else "PR title", value))
    return parts


def apply_edits(path, edits):
    """Apply editor replacements and select only their new text."""
    text = Path(path).read_text()
    selected = [False] * len(text)
    for edit in edits:
        old, new = edit["old_string"], edit["new_string"]
        parts, keep, cursor = [], [], 0
        while (start := text.find(old, cursor)) >= 0:
            parts += [text[cursor:start], new]
            keep += selected[cursor:start] + [True] * len(new)
            cursor = start + len(old)
            if not edit.get("replace_all"):
                break
        parts.append(text[cursor:])
        keep += selected[cursor:]
        text, selected = "".join(parts), keep
    return checked(path, text, selected)


def apply_patch_file(path, action, block):
    """Apply one patch block in memory and select only added text."""
    if action == "Add":
        text = "\n".join(line[1:] for line in block.splitlines() if line.startswith("+"))
        return checked(path, text + ("\n" if block.endswith("\n") else ""))

    original = Path(path).read_text()
    parts, selected = [], []
    cursor = 0
    for hunk in re.split(r"^@@.*$", block, flags=re.MULTILINE)[1:]:
        lines = [line for line in hunk.strip("\n").splitlines() if not line.startswith("\\ No newline")]
        old_lines = [line[1:] if line.startswith(("-", " ")) else line for line in lines if not line.startswith("+")]
        new_lines = [line[1:] if line.startswith(("+", " ")) else line for line in lines if not line.startswith("-")]
        old, new = "\n".join(old_lines), "\n".join(new_lines)
        start = original.index(old, cursor)
        parts += [original[cursor:start], new]
        selected += [False] * (start - cursor)
        keep = []
        for i, line in enumerate(line for line in lines if not line.startswith("-")):
            if i:
                keep.append(False)
            keep += [line.startswith("+")] * len(line[1:] if line.startswith(("+", " ")) else line)
        selected += keep
        cursor = start + len(old)
    parts.append(original[cursor:])
    selected += [False] * (len(original) - cursor)
    return checked(path, "".join(parts), selected)


def patch_regions(patch):
    """Return source-preserving regions from a Codex patch envelope."""
    out = []
    pattern = r"^\*\*\* (Add|Update) File: (.+?)\s*$(.*?)(?=^\*\*\* |\Z)"
    for action, path, block in re.findall(pattern, patch, re.DOTALL | re.MULTILINE):
        out += apply_patch_file(path, action, block)
    return out


def mcp_text(obj):
    """Yield human-facing field names and values from an MCP tool input."""
    if isinstance(obj, dict):
        for key, value in obj.items():
            if key.lower() in TEXT_KEYS and isinstance(value, str):
                yield key.lower(), value
            else:
                yield from mcp_text(value)
    elif isinstance(obj, list):
        for value in obj:
            yield from mcp_text(value)


def extract(tool, tool_input):
    """Return source-preserving regions for a tool call."""
    command = tool_input.get("command", tool_input.get("cmd", ""))
    if isinstance(command, list):  # Codex sends the shell tool an argv array, Claude Code a string
        command = " ".join(str(c) for c in command)
    if tool.startswith("mcp__"):
        namespace, name = tool.split("__", 2)[1:]
        server = name.split("_", 1)[0] if namespace == "codex_apps" else namespace.removeprefix("claude_ai_")
        regions = []
        for field, text in mcp_text(tool_input):
            kind = "message" if field in MESSAGE_KEYS else field.replace("_", " ")
            regions.append(Region(f"{server.replace('_', ' ').title()} {kind}", md_text(text)))
        return regions
    if tool in {"Bash", "exec_command"}:
        return [Region(source, md_text(text)) for source, text in bash_text(command)] + heredoc_writes(command)
    if tool == "apply_patch":
        return patch_regions(command)
    path = tool_input.get("file_path", "")
    if "content" in tool_input:
        return checked(path, tool_input["content"])
    edits = tool_input.get("edits") or [tool_input]
    return apply_edits(path, [edit for edit in edits if isinstance(edit, dict) and "old_string" in edit])


def detect(regions):
    """Return every rule occurrence with its source span."""
    findings = []
    piles = {}
    for region in regions:
        for match in MARK_RE.finditer(region.text):
            rule, replacement = MARKS[match.group()]
            findings.append(Finding(region, *match.span(), rule, replacement))
        for match in SWAP_RE.finditer(region.text):
            word = match.group().lower()
            replacement = SWAP[word]
            findings.append(
                Finding(
                    region,
                    *match.span(),
                    f'"{word}"',
                    replacement if replacement == "drop it" else f'use "{replacement}"',
                )
            )
        for pattern, replacement in PHRASES:
            for match in re.finditer(rf"\b(?:{pattern})\b", region.text, re.IGNORECASE):
                findings.append(Finding(region, *match.span(), f'"{match.group()}"', replacement))
        for match in OFTEN_RE.finditer(region.text):
            rule = f'"{match.group().lower()}"'
            piles.setdefault(rule, []).append(Finding(region, *match.span(), rule, "vary it"))
    return findings, {rule: matches for rule, matches in piles.items() if len(matches) >= LIMIT}


def location(finding):
    """Format a finding's source, line, and column."""
    text = finding.region.text
    return f"{finding.region.source}:{text.count(chr(10), 0, finding.start) + 1}:{finding.start - text.rfind(chr(10), 0, finding.start)}"


def context(finding, width=60):
    """Return short single-line context around a finding."""
    text = finding.region.text
    line_start = text.rfind("\n", 0, finding.start) + 1
    line_end = text.find("\n", finding.end)
    line_end = len(text) if line_end < 0 else line_end
    clip_start = max(line_start, finding.start - width // 2)
    clip_end = min(line_end, finding.end + width // 2)
    snippet = ("..." if clip_start > line_start else "") + text[clip_start:clip_end].strip()
    snippet += "..." if clip_end < line_end else ""
    return json.dumps(snippet)


def format_findings(findings, piles):
    """Format all findings into one actionable denial message."""
    lines = [
        f"- {finding.rule} at {location(finding)}, {finding.replacement}: {context(finding)}" for finding in findings
    ]
    for rule, matches in piles.items():
        shown = ", ".join(location(finding) for finding in matches[:5])
        more = f", +{len(matches) - 5} more" if len(matches) > 5 else ""
        lines.append(f"- {rule} used {len(matches)} times at {shown}{more}, {matches[0].replacement}")
    return "humanize:\n" + "\n".join(lines)


data = json.load(sys.stdin)
findings, piles = detect(extract(data.get("tool_name", ""), data.get("tool_input") or {}))

if findings or piles:
    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": format_findings(findings, piles),
                }
            }
        )
    )
