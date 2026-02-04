#!/usr/bin/env python3
"""
PostToolUse hook: Auto-format Bash/Shell scripts with prettier-plugin-sh
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path


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

        if not file_path.endswith(('.sh', '.bash')):
            sys.exit(0)

        sh_file = Path(file_path)
        if not sh_file.exists() or any(p in sh_file.parts for p in ['.git', '.venv', 'venv', 'env', '.env', '__pycache__', '.mypy_cache', '.pytest_cache', '.tox', '.nox', '.eggs', 'eggs', '.idea', '.vscode', 'node_modules', 'site-packages', 'build', 'dist', '.claude']):
            sys.exit(0)

        # Check if prettier is available
        if not check_prettier_version():
            sys.exit(0)

        # Try prettier with prettier-plugin-sh, handle any failure gracefully
        try:
            cmd = f'npx prettier --write --list-different --print-width 120 --plugin=$(npm root -g)/prettier-plugin-sh/lib/index.cjs "{sh_file}"'
            subprocess.run(cmd, shell=True, capture_output=True, check=False, cwd=sh_file.parent, timeout=10)
        except Exception:
            pass  # Silently handle any failure (missing plugin, timeout, etc.)

    except Exception:
        pass

    sys.exit(0)

if __name__ == "__main__":
    main()