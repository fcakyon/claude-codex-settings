#!/usr/bin/env python3
"""Format Python docstrings in Google style without external dependencies."""

from __future__ import annotations

import ast
import json
import re
import sys
from pathlib import Path


# Antipatterns for non-Google docstring styles
RST_FIELD_RX = re.compile(r"^\s*:(param|type|return|rtype|raises)\b", re.M)
EPYDOC_RX = re.compile(r"^\s*@(?:param|type|return|rtype|raise)\b", re.M)
NUMPY_UNDERLINE_SECTION_RX = re.compile(r"^\s*(Parameters|Returns|Yields|Raises|Notes|Examples)\n\s*[-]{3,}\s*$", re.M)


def likely_docstring_style(text: str) -> str:
    """Return 'google', 'numpy', 'rest', 'epydoc', or 'unknown' for docstring text."""
    t = "\n".join(line.rstrip() for line in text.strip().splitlines())
    if RST_FIELD_RX.search(t):
        return "rest"
    if EPYDOC_RX.search(t):
        return "epydoc"
    if NUMPY_UNDERLINE_SECTION_RX.search(t):
        return "numpy"
    return "google" if is_google_docstring(t) else "unknown"


GOOGLE_SECTION_RX = re.compile(
    r"^\s*(Args|Arguments|Attributes|Methods|Returns|Return|Yields|Yield"
    r"|Raises|Raise|Example|Examples|Notes|Note|References):\s*$",
    re.M,
)


def is_google_docstring(docstring: str) -> bool:
    """Check if docstring is Google-style format."""
    return bool(GOOGLE_SECTION_RX.search(docstring))


SECTION_ALIASES = {
    'Arguments': 'Args',
    'Return': 'Returns',
    'Yield': 'Yields',
    'Raise': 'Raises',
    'Example': 'Examples',
    'Usage': 'Examples',
    'Usage Example': 'Examples',
    'Usage Examples': 'Examples',
    'Example Usage': 'Examples',
    'Note': 'Notes',
    'Reference': 'References',
}


def format_docstring(docstring: str, indent: int = 4) -> str:
    """Format a cleaned/dedented docstring in Google style.

    Args:
        docstring (str): Cleaned docstring text (from ast.get_docstring with clean=True).
        indent (int): Column offset where the docstring quotes start in source.

    Returns:
        (str): Formatted docstring content ready for literal reconstruction.
    """
    if not docstring or not docstring.strip():
        return docstring

    lines = docstring.split('\n')
    if not lines:
        return docstring

    base_indent = ' ' * indent

    result = []
    i = 0

    # Summary line
    summary = lines[0].strip()
    if summary:
        if not summary[0].isupper() and not summary.startswith(('http', 'www', '@')):
            summary = summary[0].upper() + summary[1:]
        if not summary.endswith(('.', '!', '?', ':')):
            summary += '.'
        result.append(summary)
        i = 1

    # Skip blank lines after summary
    while i < len(lines) and not lines[i].strip():
        i += 1

    # Process remaining sections
    while i < len(lines):
        line = lines[i]
        section_match = re.match(r'^(\s*)([A-Za-z\s]+):\s*$', line)

        if section_match:
            section_name = SECTION_ALIASES.get(section_match.group(2).strip(), section_match.group(2).strip())
            # Blank line before section (if there's prior content)
            if result and result[-1] != '':
                result.append('')
            result.append(base_indent + section_name + ':')
            i += 1

            # Process section content
            while i < len(lines):
                line = lines[i]
                if not line.strip():
                    result.append('')
                    i += 1
                    break

                if re.match(r'^(\s*)([A-Za-z\s]+):\s*$', line):
                    break

                param_match = re.match(r'^\s*(\w+)\s*\(([^)]+)\):\s*(.*)$', line)
                if param_match:
                    name, type_str, desc = param_match.groups()
                    result.append(f'{base_indent}    {name} ({type_str}): {desc}')
                else:
                    stripped = line.rstrip()
                    leading = len(line) - len(line.lstrip())
                    result.append(base_indent + ' ' * leading + stripped.lstrip())
                i += 1
        else:
            if line.strip():
                leading = len(line) - len(line.lstrip())
                result.append(base_indent + ' ' * leading + line.strip())
            else:
                result.append('')
            i += 1

    # Remove trailing blank lines
    while result and not result[-1].strip():
        result.pop()

    return '\n'.join(result)


class DocstringVisitor(ast.NodeVisitor):
    """Collect docstring replacements for classes and functions using AST positions."""

    def __init__(self, src: list[str]):
        self.src = src
        self.replacements: list[tuple[int, int, int, int, str]] = []

    def _handle(self, node: ast.FunctionDef | ast.AsyncFunctionDef | ast.ClassDef) -> None:
        """Schedule replacement if first statement is a docstring."""
        try:
            doc_raw = ast.get_docstring(node, clean=False)
            doc_clean = ast.get_docstring(node)  # cleaned/dedented
            if not doc_raw or not doc_clean or not node.body or not isinstance(node.body[0], ast.Expr):
                return
            s = node.body[0].value
            if not (isinstance(s, ast.Constant) and isinstance(s.value, str)):
                return
            if likely_docstring_style(doc_raw) in {"numpy", "rest", "epydoc"}:
                return
            expr = node.body[0]
            if expr.end_lineno is None or expr.end_col_offset is None:
                return
            sl, el = expr.lineno - 1, expr.end_lineno - 1
            sc, ec = expr.col_offset, expr.end_col_offset
            if sl < 0 or el >= len(self.src):
                return
            # Extract original literal from source
            if sl == el:
                original = self.src[sl][sc:ec]
            else:
                original = "\n".join([self.src[sl][sc:], *self.src[sl + 1 : el], self.src[el][:ec]])
            # Detect quote style and prefix
            stripped = original.lstrip()
            i = 0
            while i < len(stripped) and stripped[i] in "rRuUbBfF":
                i += 1
            quotes = '"""'
            if i + 3 <= len(stripped) and stripped[i : i + 3] in ('"""', "'''"):
                quotes = stripped[i : i + 3]
            prefix = "".join(ch for ch in stripped[:i] if ch in "rRuU")
            # Format using cleaned docstring with proper indent
            formatted = format_docstring(doc_clean, indent=sc)
            if formatted == doc_clean:
                return
            # Check if single-line result fits
            has_section = is_google_docstring(formatted)
            has_newline = '\n' in formatted
            single_ok = not has_section and not has_newline and (sc + len(prefix) + len(quotes) * 2 + len(formatted) <= 120)
            if single_ok:
                new_literal = f"{prefix}{quotes}{formatted.strip()}{quotes}"
            else:
                new_literal = f"{prefix}{quotes}{formatted}\n{' ' * sc}{quotes}"
            if new_literal.strip() != original.strip():
                self.replacements.append((sl, el, sc, ec, new_literal))
        except Exception:
            return

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        """Visit function definitions."""
        self._handle(node)
        self.generic_visit(node)

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef) -> None:
        """Visit async function definitions."""
        self._handle(node)
        self.generic_visit(node)

    def visit_ClassDef(self, node: ast.ClassDef) -> None:
        """Visit class definitions."""
        self._handle(node)
        self.generic_visit(node)


def format_python_file(content: str) -> str:
    """Format all docstrings in Python file content."""
    if not content.strip():
        return content
    if '"""' not in content and "'''" not in content:
        return content
    try:
        tree = ast.parse(content)
    except SyntaxError:
        return content

    src = content.splitlines()
    visitor = DocstringVisitor(src)
    try:
        visitor.visit(tree)
    except Exception:
        return content

    if not visitor.replacements:
        return content

    # Apply replacements in reverse order to preserve line numbers
    for sl, el, sc, ec, rep in reversed(visitor.replacements):
        try:
            if sl == el:
                src[sl] = src[sl][:sc] + rep + src[sl][ec:]
            else:
                new_lines = rep.splitlines()
                new_lines[0] = src[sl][:sc] + new_lines[0]
                new_lines[-1] += src[el][ec:]
                src[sl : el + 1] = new_lines
        except Exception:
            continue

    return "\n".join(src)


def read_python_path() -> Path | None:
    """Read the Python path from stdin payload.

    Returns:
        (Path | None): Python file path when present and valid.
    """
    try:
        data = json.load(sys.stdin)
    except Exception:
        return None
    file_path = data.get("tool_input", {}).get("file_path", "")
    path = Path(file_path) if file_path else None
    if not path or path.suffix != ".py" or not path.exists():
        return None
    if any(p in path.parts for p in ['.git', '.venv', 'venv', 'env', '.env', '__pycache__', '.mypy_cache', '.pytest_cache', '.tox', '.nox', '.eggs', 'eggs', '.idea', '.vscode', 'node_modules', 'site-packages', 'build', 'dist', '.claude']):
        return None
    return path


def main() -> None:
    """Format Python docstrings in files."""
    python_file = read_python_path()
    if python_file:
        try:
            content = python_file.read_text()
            formatted = format_python_file(content)
            if formatted != content:
                python_file.write_text(formatted)
                print(f"Formatted: {python_file}")
        except Exception as e:
            output = {"hookSpecificOutput": {"hookEventName": "PostToolUse",
                       "additionalContext": f"Docstring formatting failed for {python_file.name}: {e}"}}
            print(json.dumps(output))
    sys.exit(0)


if __name__ == '__main__':
    main()
