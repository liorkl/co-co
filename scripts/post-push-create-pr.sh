#!/bin/bash
# Post-push hook to automatically create PR after successful push
# This is called after a successful push

set -e

branch=$(git branch --show-current)
base_branch="main"

# Only run on feature branches
if [ "$branch" = "$base_branch" ] || [ "$branch" = "develop" ]; then
  exit 0
fi

# Check if GitHub CLI is available
if ! command -v gh >/dev/null 2>&1; then
  exit 0  # Silently exit if gh not available
fi

# Check if authenticated
if ! gh auth status >/dev/null 2>&1; then
  exit 0  # Silently exit if not authenticated
fi

# Check if PR already exists for this branch
existing_pr=$(gh pr list --head "$branch" --json number --jq '.[0].number' 2>/dev/null || echo "")

if [ -n "$existing_pr" ] && [ "$existing_pr" != "null" ]; then
  # PR already exists, skip
  exit 0
fi

# Check if PR_DESCRIPTION.md exists
if [ ! -f "PR_DESCRIPTION.md" ]; then
  # Try to generate it
  if command -v npm >/dev/null 2>&1; then
    npm run pr:description >/dev/null 2>&1 || exit 0
  else
    exit 0
  fi
fi

# Extract title from first commit or branch name
title=$(git log -1 --pretty=%B | head -1)
if [ -z "$title" ] || [ "$title" = "" ]; then
  # Fallback to branch name
  title=$(echo "$branch" | sed 's/.*\///' | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++)sub(/./,toupper(substr($i,1,1)),$i)}1')
fi

# Create PR automatically
echo ""
echo "📋 Auto-creating pull request..."
pr_url=$(gh pr create \
  --base "$base_branch" \
  --title "$title" \
  --body-file PR_DESCRIPTION.md \
  --head "$branch" 2>&1)

if [ $? -eq 0 ]; then
  echo "✅ Pull request created: $pr_url"
  echo ""
else
  # If creation fails, don't block - just show message
  echo "💡 PR description ready in PR_DESCRIPTION.md"
  echo "   Create PR manually: npm run pr:create"
  echo ""
fi

exit 0

