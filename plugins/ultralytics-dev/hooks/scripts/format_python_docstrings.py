#!/usr/bin/env python3
"""Format Python docstrings in Google style without external dependencies."""

from __future__ import annotations

import ast
import json
import re
import sys
import textwrap
from pathlib import Path


def is_google_docstring(docstring: str) -> bool:
    """Check if docstring is Google-style format."""
    google_sections = (
        'Args:', 'Arguments:', 'Attributes:', 'Example:', 'Examples:',
        'Note:', 'Notes:', 'Returns:', 'Return:', 'Raises:', 'Raise:',
        'Yields:', 'Yield:', 'References:', 'See Also:', 'Todo:', 'Todos:'
    )
    return any(f'\n    {section}' in docstring for section in google_sections)


def wrap_text(text: str, width: int = 120, initial_indent: str = '', subsequent_indent: str = '') -> str:
    """Wrap text intelligently, preserving code blocks, tables, and lists."""
    lines = text.split('\n')
    result = []
    in_code_block = False

    for line in lines:
        # Detect code blocks
        if line.strip().startswith('```'):
            in_code_block = not in_code_block
            result.append(line)
            continue

        if in_code_block or line.startswith(' ' * 8) or line.startswith('\t'):
            result.append(line)
            continue

        # Preserve table rows, lists, and tree diagrams
        if any(line.strip().startswith(x) for x in ['|', '-', '*', '+', '└', '├', '│']):
            result.append(line)
            continue

        # Preserve URLs on their own
        if re.match(r'^\s*(https?://|www\.)', line):
            result.append(line)
            continue

        # Wrap regular text
        if line.strip():
            wrapped = textwrap.fill(
                line.strip(),
                width=width,
                initial_indent=initial_indent,
                subsequent_indent=subsequent_indent,
                break_long_words=False,
                break_on_hyphens=False
            )
            result.append(wrapped)
        else:
            result.append('')

    return '\n'.join(result)


def format_docstring(docstring: str) -> str:
    """Format a single docstring in Google style."""
    if not docstring or not docstring.strip():
        return docstring

    if not is_google_docstring(docstring):
        return docstring

    lines = docstring.split('\n')
    if not lines:
        return docstring

    # Extract content and indentation
    indent = len(lines[0]) - len(lines[0].lstrip())
    base_indent = ' ' * indent

    # Process lines
    result = []
    i = 0

    # Summary line
    summary = lines[0].strip()
    if summary:
        # Capitalize first word if not URL
        if summary and not summary[0].isupper() and not summary.startswith(('http', 'www', '@')):
            summary = summary[0].upper() + summary[1:]
        # Add period if missing
        if summary and not summary.endswith(('.', '!', '?', ':')):
            summary += '.'
        result.append(base_indent + summary)
        i = 1

    # Skip blank lines after summary
    while i < len(lines) and not lines[i].strip():
        i += 1

    # Process remaining sections
    while i < len(lines):
        line = lines[i]
        section_match = re.match(r'^(\s*)([A-Za-z\s]+):\s*$', line)

        if section_match:
            # Section header
            section_name = section_match.group(2).strip()
            # Normalize section names
            section_name = {
                'Arguments': 'Args',
                'Return': 'Returns',
                'Yield': 'Yields',
                'Raise': 'Raises',
                'Example': 'Examples',
                'Note': 'Notes',
                'Todo': 'Todos',
                'See Also': 'References'
            }.get(section_name, section_name)

            result.append(base_indent + section_name + ':')
            i += 1

            # Process section content
            while i < len(lines):
                line = lines[i]
                if not line.strip():
                    result.append('')
                    i += 1
                    break

                # Check if next section starts
                if re.match(r'^(\s*)([A-Za-z\s]+):\s*$', line):
                    break

                # Preserve indentation for parameters and code
                if line.strip():
                    # Parameter line (name: description)
                    param_match = re.match(r'^(\s+)(\w+)\s*\(([^)]+)\):\s*(.*)$', line)
                    if param_match:
                        spaces, name, type_str, desc = param_match.groups()
                        param_indent = base_indent + '    '
                        result.append(f'{param_indent}{name} ({type_str}): {desc}')
                    else:
                        result.append(line)
                else:
                    result.append(line)
                i += 1
        else:
            result.append(line)
            i += 1

    # Remove trailing blank lines but keep structure
    while result and not result[-1].strip():
        result.pop()

    return '\n'.join(result)


class DocstringVisitor(ast.NodeVisitor):
    """Find all docstrings in a Python file."""

    def __init__(self):
        self.docstrings = []

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        """Visit function definitions."""
        if ast.get_docstring(node):
            self.docstrings.append((node.lineno - 1, ast.get_docstring(node)))
        self.generic_visit(node)

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef) -> None:
        """Visit async function definitions."""
        if ast.get_docstring(node):
            self.docstrings.append((node.lineno - 1, ast.get_docstring(node)))
        self.generic_visit(node)

    def visit_ClassDef(self, node: ast.ClassDef) -> None:
        """Visit class definitions."""
        if ast.get_docstring(node):
            self.docstrings.append((node.lineno - 1, ast.get_docstring(node)))
        self.generic_visit(node)


def format_python_file(content: str) -> str:
    """Format all docstrings in Python file content."""
    try:
        tree = ast.parse(content)
    except SyntaxError:
        return content

    visitor = DocstringVisitor()
    visitor.visit(tree)

    if not visitor.docstrings:
        return content

    lines = content.split('\n')

    # Format docstrings (iterate in reverse to maintain line numbers)
    for line_num, docstring in reversed(visitor.docstrings):
        formatted = format_docstring(docstring)
        if formatted != docstring:
            # Find and replace the docstring in the source
            # This is a simplified approach - find the docstring literal in source
            for i in range(line_num, min(line_num + 50, len(lines))):
                if '"""' in lines[i] or "'''" in lines[i]:
                    quote = '"""' if '"""' in lines[i] else "'''"
                    # Simple replacement for single-line docstrings in source
                    if lines[i].count(quote) == 2:
                        indent = len(lines[i]) - len(lines[i].lstrip())
                        lines[i] = ' ' * indent + quote + formatted + quote
                    break

    return '\n'.join(lines)


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
    if any(p in path.parts for p in ['.venv', 'venv', 'site-packages', '__pycache__', '.claude']):
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
            # Block on unexpected errors during formatting
            error_msg = f'ERROR formatting Python docstrings ❌ {python_file}: {e}'
            print(error_msg, file=sys.stderr)
            output = {
                'systemMessage': f'Docstring formatting failed for {python_file.name}',
                'hookSpecificOutput': {'hookEventName': 'PostToolUse', 'decision': 'block', 'reason': error_msg},
            }
            print(json.dumps(output), file=sys.stderr)
            sys.exit(2)
    sys.exit(0)


if __name__ == '__main__':
    main()
