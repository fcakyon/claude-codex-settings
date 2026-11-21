#!/bin/bash
# Sync the SwiftUI skill and its references.
set -euo pipefail
source "$(dirname "$0")/_helpers.sh"

TARGET="$(mktemp -d)"
trap 'rm -rf "$TARGET"' EXIT
REV="$(gh api repos/twostraws/SwiftUI-Agent-Skill/commits/main -q .sha)"
gh api "repos/twostraws/SwiftUI-Agent-Skill/tarball/$REV" > "$TARGET/upstream.tar.gz"
tar -xzf "$TARGET/upstream.tar.gz" -C "$TARGET"
SRC="$(find "$TARGET" -mindepth 1 -maxdepth 1 -type d)"
cp "$SRC/LICENSE" "$SRC/swiftui-pro/LICENSE"
sed -i.bak 's|^name: swiftui-pro$|name: swiftui-best-practices|; s|^description:.*|description: This skill should be used when user asks to "write SwiftUI code", "review SwiftUI code", or "refactor SwiftUI code" for iOS or macOS apps.|' "$SRC/swiftui-pro/SKILL.md"
sed -i.bak 's|SwiftUI Pro|SwiftUI Best Practices|; s|\$swiftui-pro|\$swiftui-best-practices|' "$SRC/swiftui-pro/agents/openai.yaml"
rm "$SRC/swiftui-pro/SKILL.md.bak" "$SRC/swiftui-pro/agents/openai.yaml.bak"
sync_skill "$SRC/swiftui-pro" "plugins/swift-skills/skills/swiftui-best-practices" MIT

echo "Done syncing swift-skills."
