#!/bin/bash
# Setup git hooks from scripts/git-hooks directory
# This makes hooks available to all developers

set -e

HOOKS_DIR=".git/hooks"
SOURCE_DIR="scripts/git-hooks"

if [ ! -d "$SOURCE_DIR" ]; then
  echo "❌ Source directory $SOURCE_DIR not found"
  exit 1
fi

if [ ! -d "$HOOKS_DIR" ]; then
  echo "❌ Git hooks directory $HOOKS_DIR not found"
  echo "   Make sure you're in a git repository"
  exit 1
fi

echo "📦 Setting up git hooks..."

for hook in "$SOURCE_DIR"/*; do
  if [ -f "$hook" ] && [ -x "$hook" ]; then
    hook_name=$(basename "$hook")
    target="$HOOKS_DIR/$hook_name"
    
    # Copy hook and make it executable
    cp "$hook" "$target"
    chmod +x "$target"
    
    echo "  ✅ Installed: $hook_name"
  fi
done

echo ""
echo "✅ Git hooks installed successfully!"
echo ""
echo "Hooks will now remind you to generate PR descriptions before pushing."

