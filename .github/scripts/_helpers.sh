#!/bin/bash
# Shared helper functions for syncing vendor agent-skills into local plugins.
# Source this from per-vendor sync scripts.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Clone repo to ~/dev/<clone-name> or checkout main + pull if it exists.
clone_or_update() {
  local repo_url="$1"
  local clone_name="$2"
  local clone_dir="$HOME/dev/$clone_name"

  if [ -d "$clone_dir/.git" ]; then
    echo "Updating $clone_dir..."
    git -C "$clone_dir" checkout main
    git -C "$clone_dir" pull
  else
    echo "Cloning $repo_url to $clone_dir..."
    mkdir -p "$(dirname "$clone_dir")"
    git clone "$repo_url" "$clone_dir"
  fi
}

# Copy files matching include patterns from source to target.
# Usage: sync_dir <source-dir> <target-dir> <pattern1> [pattern2...]
# Patterns: "SKILL.md" copies that file, "references/" copies that directory recursively.
sync_dir() {
  local src="$1"
  local target="$REPO_ROOT/$2"
  shift 2

  if [ ! -d "$src" ]; then
    echo "ERROR: source directory not found: $src" >&2
    return 1
  fi

  rm -rf "$target"
  mkdir -p "$target"

  for pattern in "$@"; do
    local src_path="$src/${pattern%/}"
    if [ -d "$src_path" ]; then
      cp -r "$src_path" "$target/"
    elif [ -f "$src_path" ]; then
      cp "$src_path" "$target/"
    else
      echo "WARNING: pattern not found: $src_path" >&2
    fi
  done

  echo "Synced $(basename "$src") -> $(basename "$target")"
}

# Add license field to SKILL.md frontmatter if missing.
# Usage: ensure_license <skill-dir> <license>
ensure_license() {
  local skill_md="$REPO_ROOT/$1/SKILL.md"
  local license="$2"
  [ ! -f "$skill_md" ] && return
  python3 -c "
p, lic = '$skill_md', '$license'
t = open(p).read()
parts = t.split('---', 2)
if len(parts) >= 3 and 'license:' not in parts[1]:
    parts[1] = parts[1].rstrip() + '\nlicense: ' + lic + '\n'
    open(p, 'w').write('---'.join(parts))
"
}

# Create a zip of the skill directory with SKILL.md at the top level.
# The zip is placed inside the skill directory.
create_zip() {
  local skill_dir="$REPO_ROOT/$1"
  local skill_name
  skill_name="$(basename "$skill_dir")"
  local zip_path="$skill_dir/$skill_name.zip"

  if [ ! -f "$skill_dir/SKILL.md" ]; then
    echo "WARNING: no SKILL.md in $skill_dir, skipping zip" >&2
    return 0
  fi

  rm -f "$zip_path"
  local zip_contents=("SKILL.md")
  [ -d "$skill_dir/references" ] && zip_contents+=("references/")
  (cd "$skill_dir" && zip -r "$skill_name.zip" "${zip_contents[@]}")

  echo "Created $1/$skill_name.zip"
}
