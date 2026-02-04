#!/usr/bin/env python3
"""PostToolUse hook: Auto-format Python files with ruff, provide feedback on errors."""

import json
import shutil
import subprocess
import sys
from pathlib import Path

EXCLUDED_DIRS = {'.git', '.venv', 'venv', 'env', '.env', '__pycache__', '.mypy_cache', '.pytest_cache',
                 '.tox', '.nox', '.eggs', 'eggs', '.idea', '.vscode', 'node_modules', 'site-packages',
                 'build', 'dist', '.claude'}


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    file_path = data.get("tool_input", {}).get("file_path", "")
    if not file_path.endswith('.py'):
        sys.exit(0)

    py_file = Path(file_path)
    if not py_file.exists() or any(p in py_file.parts for p in EXCLUDED_DIRS):
        sys.exit(0)

    if not shutil.which('ruff'):
        sys.exit(0)

    work_dir = py_file.parent
    issues = []

    # Run ruff check with fixes
    check_result = subprocess.run([
        'ruff', 'check', '--fix',
        '--extend-select', 'F,I,D,UP,RUF,FA',
        '--target-version', 'py39',
        '--ignore', 'D100,D104,D203,D205,D212,D213,D401,D406,D407,D413,RUF001,RUF002,RUF012',
        str(py_file)
    ], capture_output=True, text=True, cwd=work_dir)

    if check_result.returncode != 0:
        error_output = check_result.stdout.strip() or check_result.stderr.strip()
        issues.append(f'Ruff check found unfixable errors in {py_file.name}:\n{error_output}')

    # Run ruff format regardless of check result
    format_result = subprocess.run([
        'ruff', 'format', '--line-length', '120', str(py_file)
    ], capture_output=True, text=True, cwd=work_dir)

    if format_result.returncode != 0:
        error_output = format_result.stderr.strip()
        issues.append(f'Ruff format failed for {py_file.name}:\n{error_output}')

    # Output single JSON with all collected feedback
    if issues:
        output = {"hookSpecificOutput": {"hookEventName": "PostToolUse",
                   "additionalContext": "\n\n".join(issues)}}
        print(json.dumps(output))

    sys.exit(0)


if __name__ == '__main__':
    main()
