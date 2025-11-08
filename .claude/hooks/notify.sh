#!/usr/bin/env bash

# Read JSON input from Claude Code hook
input=$(cat)

# Extract message from JSON (basic parsing)
message=$(echo "$input" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
title="Claude Code"

# Terminal bell - triggers VSCode visual bell icon
printf '\a'

# Send OS notification
if [[ "$OSTYPE" == "darwin"* ]]; then
    osascript -e "display notification \"${message}\" with title \"${title}\" sound name \"Glass\""
elif command -v notify-send &> /dev/null; then
    notify-send "${title}" "${message}" -u normal -i terminal
fi