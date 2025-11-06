#!/bin/bash
# Convenience script to generate PR description and open GitHub PR creation
# Usage: ./scripts/create-pr.sh [base-branch]

set -e

BASE_BRANCH=${1:-main}
CURRENT_BRANCH=$(git branch --show-current)

if [ "$CURRENT_BRANCH" = "$BASE_BRANCH" ]; then
  echo "❌ Cannot create PR: already on $BASE_BRANCH branch"
  echo "   Please checkout a feature branch first"
  exit 1
fi

echo "📝 Generating PR description..."
npm run pr:description

echo ""
echo "✅ PR description generated in PR_DESCRIPTION.md"
echo ""
echo "Next steps:"
echo "1. Review PR_DESCRIPTION.md"
echo "2. Click 'Create PR' in Cursor"
echo "3. Copy the description from PR_DESCRIPTION.md into the PR"
echo ""
echo "Or create PR via GitHub CLI:"
echo "  gh pr create --title \"$(git log -1 --pretty=%B | head -1)\" --body-file PR_DESCRIPTION.md"

