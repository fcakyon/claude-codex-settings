#!/usr/bin/env python3
"""
PostToolUse hook: Auto-format Python files with ruff and docformatter
Inspired by onuralpszr's pre-commit hook: https://github.com/onuralpszr/onuralpszr/blob/main/configs/git-hooks/pre-commit-line-120
"""
import json
import sys
import subprocess
import shutil
from pathlib import Path

def main():
    try:
        data = json.load(sys.stdin)

        # Get file path from tool input
        file_path = data.get("tool_input", {}).get("file_path", "")

        # Only process Python files
        if not file_path.endswith('.py'):
            sys.exit(0)

        # Check if tools are available
        if not shutil.which('ruff') or not shutil.which('docformatter'):
            sys.exit(0)  # Silent exit if tools not available

        # Get directory containing the Python file
        py_file = Path(file_path)
        if not py_file.exists():
            sys.exit(0)

        work_dir = py_file.parent

        # Run ruff format
        subprocess.run([
            'ruff', 'format',
            '--line-length', '120',
            str(py_file)
        ], capture_output=True, check=False, cwd=work_dir)

        # Run ruff check with fixes
        subprocess.run([
            'ruff', 'check',
            '--fix',
            '--extend-select', 'I,D,UP',
            '--target-version', 'py38',
            '--ignore', 'D100,D101,D103,D104,D203,D205,D212,D213,D401,D406,D407,D413,F821,F841',
            str(py_file)
        ], capture_output=True, check=False, cwd=work_dir)

        # Run docformatter
        subprocess.run([
            'docformatter',
            '--wrap-summaries', '120',
            '--wrap-descriptions', '120',
            '--pre-summary-newline',
            '--close-quotes-on-newline',
            '--in-place',
            "--recursive",
            str(py_file)
        ], capture_output=True, check=False, cwd=work_dir)

    except Exception:
        # Never fail Claude Code operations
        pass

    sys.exit(0)

if __name__ == "__main__":
    main()