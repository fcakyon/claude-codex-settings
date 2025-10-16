#!/usr/bin/env python3
"""
PostToolUse hook: Auto-format Bash/Shell scripts with prettier-plugin-sh
"""
import json
import sys
import subprocess
import shutil
from pathlib import Path

def main():
    try:
        data = json.load(sys.stdin)
        file_path = data.get("tool_input", {}).get("file_path", "")

        if not file_path.endswith(('.sh', '.bash')):
            sys.exit(0)

        sh_file = Path(file_path)
        if not sh_file.exists():
            sys.exit(0)

        # Check if npx is available
        if not shutil.which('npx'):
            sys.exit(0)

        # Try prettier with prettier-plugin-sh, handle any failure gracefully
        try:
            subprocess.run([
                'npx', 'prettier', '--write', 
                '--plugin=$(npm root -g)/prettier-plugin-sh/lib/index.cjs',
                str(sh_file)
            ], shell=True, capture_output=True, check=False, cwd=sh_file.parent, timeout=10)
        except:
            pass  # Silently handle any failure (missing plugin, timeout, etc.)

    except Exception:
        pass

    sys.exit(0)

if __name__ == "__main__":
    main()