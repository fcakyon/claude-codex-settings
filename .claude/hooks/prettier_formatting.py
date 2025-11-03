#!/usr/bin/env python3
"""
PostToolUse hook: Auto-format JS/TS/CSS/JSON/YAML/HTML/Vue/Svelte files with prettier
"""
import json
import re
import sys
import subprocess
import shutil
from pathlib import Path

# File extensions that prettier handles
PRETTIER_EXTENSIONS = {'.js', '.jsx', '.ts', '.tsx', '.css', '.less', '.scss',
                      '.json', '.yml', '.yaml', '.html', '.vue', '.svelte'}
LOCK_FILE_PATTERN = re.compile(r'.*lock\.(json|yaml|yml)$|.*\.lock$')


def check_prettier_version() -> bool:
    """Check if prettier is installed and warn if version differs from 3.6.2."""
    if not shutil.which('npx'):
        return False
    try:
        result = subprocess.run(['npx', 'prettier', '--version'],
                                capture_output=True, text=True, check=False, timeout=5)
        if result.returncode == 0:
            version = result.stdout.strip()
            if '3.6.2' not in version:
                print(f"⚠️  Prettier version mismatch: expected 3.6.2, found {version}")
            return True
    except Exception:
        pass
    return False


def main():
    try:
        data = json.load(sys.stdin)
        file_path = data.get("tool_input", {}).get("file_path", "")

        if not file_path:
            sys.exit(0)

        py_file = Path(file_path)
        if not py_file.exists() or py_file.suffix not in PRETTIER_EXTENSIONS:
            sys.exit(0)

        # Skip lock files and model.json
        if LOCK_FILE_PATTERN.match(py_file.name) or py_file.name == 'model.json':
            sys.exit(0)

        # Check if prettier is available
        if not check_prettier_version():
            sys.exit(0)

        # Run prettier
        subprocess.run([
            'npx', 'prettier', '--write', '--list-different', str(py_file)
        ], capture_output=True, check=False, cwd=py_file.parent)

    except Exception:
        pass

    sys.exit(0)

if __name__ == "__main__":
    main()