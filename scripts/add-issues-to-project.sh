#!/bin/bash
# Script to add MVP backlog issues to GitHub project "Co-Co Backlog"
# Requires: gh CLI with read:project and write:project scopes

set -e

REPO="liorkl/co-co"
ISSUES=(45 46 47 48 49 50 51 52 53 54 55 56)
PROJECT_NAME="Co-Co Backlog"

echo "🔍 Finding project: $PROJECT_NAME..."

# Try to find the project (user or org)
PROJECT_NUMBER=$(gh project list --owner liorkl --format json 2>/dev/null | jq -r ".[] | select(.title == \"$PROJECT_NAME\") | .number" | head -1)

if [ -z "$PROJECT_NUMBER" ]; then
  PROJECT_NUMBER=$(gh project list --format json 2>/dev/null | jq -r ".[] | select(.title == \"$PROJECT_NAME\") | .number" | head -1)
fi

if [ -z "$PROJECT_NUMBER" ]; then
  echo "❌ Project '$PROJECT_NAME' not found."
  echo "   Available projects:"
  gh project list --owner liorkl 2>/dev/null || gh project list 2>/dev/null || echo "   (Run 'gh auth refresh -s read:project' first)"
  exit 1
fi

echo "✅ Found project #$PROJECT_NUMBER: $PROJECT_NAME"
echo "📋 Adding issues to project..."

for ISSUE_NUM in "${ISSUES[@]}"; do
  echo "  Adding issue #$ISSUE_NUM..."
  gh project item-add "$PROJECT_NUMBER" --owner liorkl --url "https://github.com/$REPO/issues/$ISSUE_NUM" 2>/dev/null || \
  gh project item-add "$PROJECT_NUMBER" --url "https://github.com/$REPO/issues/$ISSUE_NUM" 2>/dev/null || {
    echo "    ⚠️  Failed to add issue #$ISSUE_NUM (may already be in project)"
  }
done

echo "✅ Done! Added ${#ISSUES[@]} issues to project '$PROJECT_NAME'"
echo ""
echo "📊 View project: https://github.com/users/liorkl/projects/$PROJECT_NUMBER"

