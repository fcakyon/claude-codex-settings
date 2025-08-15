#!/usr/bin/env python3
"""
PostToolUse hook: Auto-format Markdown files with prettier and update code blocks
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
        
        if not file_path.endswith('.md'):
            sys.exit(0)
            
        md_file = Path(file_path)
        if not md_file.exists():
            sys.exit(0)
            
        # Check if prettier is available
        if not shutil.which('npx'):
            sys.exit(0)
            
        # Check if in docs directory for special tab-width handling
        is_docs = 'docs' in md_file.parts and 'reference' not in md_file.parts
        
        if is_docs:
            # Use tab-width 4 for docs
            subprocess.run([
                'npx', 'prettier', '--tab-width', '4', '--write', str(md_file)
            ], capture_output=True, check=False, cwd=md_file.parent)
        else:
            # Standard prettier formatting
            subprocess.run([
                'npx', 'prettier', '--write', str(md_file)
            ], capture_output=True, check=False, cwd=md_file.parent)
        
    except Exception:
        pass
    
    sys.exit(0)

if __name__ == "__main__":
    main()