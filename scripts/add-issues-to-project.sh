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
echo "📋 Adding ${#ISSUES[@]} issues to project..."
echo ""

SUCCESS=0
EXISTS=0
ERRORS=0

for ISSUE_NUM in "${ISSUES[@]}"; do
  echo -n "  Issue #$ISSUE_NUM... "
  
  if ADD_OUTPUT=$(gh project item-add "$PROJECT_NUMBER" --owner liorkl --url "https://github.com/$REPO/issues/$ISSUE_NUM" 2>&1); then
    echo "✅"
    ((SUCCESS++))
  elif ADD_OUTPUT=$(gh project item-add "$PROJECT_NUMBER" --url "https://github.com/$REPO/issues/$ISSUE_NUM" 2>&1); then
    echo "✅"
    ((SUCCESS++))
  elif echo "$ADD_OUTPUT" | grep -qi "already\|exists"; then
    echo "ℹ️  (already in project)"
    ((EXISTS++))
  else
    echo "❌ (failed)"
    ((ERRORS++))
  fi
done

echo ""
echo "✅ Summary:"
echo "   Added: $SUCCESS"
echo "   Already in project: $EXISTS"
echo "   Errors: $ERRORS"
echo ""
echo "📊 View project: https://github.com/users/liorkl/projects/$PROJECT_NUMBER"

