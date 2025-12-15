#!/usr/bin/env python3
"""
PostToolUse hook: Auto-format Python files with ruff and block on errors
Inspired by onuralpszr's pre-commit hook: https://github.com/onuralpszr/onuralpszr/blob/main/configs/git-hooks/pre-commit-line-120
"""

import json
import shutil
import subprocess
import sys
from pathlib import Path


def main():
    try:
        data = json.load(sys.stdin)

        # Get file path from tool input
        file_path = data.get("tool_input", {}).get("file_path", "")

        # Only process Python files
        if not file_path.endswith('.py'):
            sys.exit(0)

        py_file = Path(file_path)

        # Skip virtual env, cache, and .claude directories
        if not py_file.exists() or any(p in py_file.parts for p in ['.venv', 'venv', 'site-packages', '__pycache__', '.claude']):
            sys.exit(0)

        # Check if ruff is available - silent exit if not (no blocking)
        if not shutil.which('ruff'):
            sys.exit(0)

        work_dir = py_file.parent

        # Run ruff check with fixes - capture output to check for errors
        check_result = subprocess.run([
            'ruff', 'check',
            '--fix',
            '--extend-select', 'F,I,D,UP,RUF,FA',
            '--target-version', 'py39',
            '--ignore', 'D100,D104,D203,D205,D212,D213,D401,D406,D407,D413,RUF001,RUF002,RUF012',
            str(py_file)
        ], capture_output=True, text=True, cwd=work_dir)

        # Block only if ruff check finds unfixable errors
        if check_result.returncode != 0:
            error_output = check_result.stdout.strip() or check_result.stderr.strip() or f'ruff check failed with exit code {check_result.returncode}'
            error_msg = f'ERROR running ruff check ❌ {error_output}'
            print(error_msg, file=sys.stderr)
            output = {
                'systemMessage': f'Ruff errors detected in {py_file.name}',
                'hookSpecificOutput': {'hookEventName': 'PostToolUse', 'decision': 'block', 'reason': error_msg},
            }
            print(json.dumps(output), file=sys.stderr)
            sys.exit(2)

        # Run ruff format
        format_result = subprocess.run([
            'ruff', 'format',
            '--line-length', '120',
            str(py_file)
        ], capture_output=True, text=True, cwd=work_dir)

        # Block only if ruff format fails (unlikely but possible)
        if format_result.returncode != 0:
            error_output = format_result.stderr.strip() or f'ruff format failed with exit code {format_result.returncode}'
            error_msg = f'ERROR running ruff format ❌ {error_output}'
            print(error_msg, file=sys.stderr)
            output = {
                'systemMessage': f'Ruff format failed for {py_file.name}',
                'hookSpecificOutput': {'hookEventName': 'PostToolUse', 'decision': 'block', 'reason': error_msg},
            }
            print(json.dumps(output), file=sys.stderr)
            sys.exit(2)

    except Exception as e:
        # Block on unexpected errors
        error_msg = f'Python code quality hook error: {e}'
        print(error_msg, file=sys.stderr)
        sys.exit(2)

    # Success - no errors
    sys.exit(0)


if __name__ == '__main__':
    main()