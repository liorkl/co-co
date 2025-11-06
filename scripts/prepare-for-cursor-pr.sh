#!/bin/bash
# Prepare PR description for Cursor's "Create PR" button
# Run this before clicking "Create PR" in Cursor to ensure description is ready

set -e

branch=$(git branch --show-current)
base_branch="main"

if [ "$branch" = "$base_branch" ] || [ "$branch" = "develop" ]; then
  echo "❌ Not on a feature branch"
  exit 1
fi

echo "📝 Ensuring PR description is up-to-date..."
npm run pr:description

if [ -f "PR_DESCRIPTION.md" ]; then
  echo "✅ PR description ready in PR_DESCRIPTION.md"
  echo ""
  echo "💡 When Cursor's 'Create PR' button opens:"
  echo "   1. The description is ready in PR_DESCRIPTION.md"
  echo "   2. Copy the content and paste it into the PR description field"
  echo ""
  echo "   Or use fully automated workflow:"
  echo "   npm run push  (pushes and creates PR automatically)"
  echo ""
  
  # Try to open the file in Cursor for easy copy
  if command -v cursor >/dev/null 2>&1; then
    echo "📄 Opening PR_DESCRIPTION.md in Cursor for easy copy..."
    cursor PR_DESCRIPTION.md 2>/dev/null || true
  fi
else
  echo "❌ Failed to generate PR description"
  exit 1
fi

