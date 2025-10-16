#!/usr/bin/env python3
"""
PostToolUse hook: Auto-format JS/TS/CSS/JSON/YAML/HTML/Vue/Svelte files with prettier
"""
import json
import sys
import subprocess
import shutil
from pathlib import Path

# File extensions that prettier handles
PRETTIER_EXTENSIONS = {'.js', '.jsx', '.ts', '.tsx', '.css', '.less', '.scss', 
                      '.json', '.yml', '.yaml', '.html', '.vue', '.svelte'}

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
        if ('lock' in py_file.name.lower() or 
            py_file.name == 'model.json'):
            sys.exit(0)

        # Check if prettier is available
        if not shutil.which('npx'):
            sys.exit(0)

        # Run prettier
        subprocess.run([
            'npx', 'prettier', '--write', str(py_file)
        ], capture_output=True, check=False, cwd=py_file.parent)

    except Exception:
        pass

    sys.exit(0)

if __name__ == "__main__":
    main()