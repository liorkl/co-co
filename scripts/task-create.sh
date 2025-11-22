#!/bin/bash
# Create a new GitHub issue (task)
# Usage: ./scripts/task-create.sh "Title" "Description" [labels...]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Detect repo info
if repo_info=$(git remote get-url origin 2>/dev/null | sed -E 's|.*github.com[:/]([^/]+)/([^/]+)\.git|\1 \2|'); then
  REPO_OWNER=$(echo "$repo_info" | awk '{print $1}')
  REPO_NAME=$(echo "$repo_info" | awk '{print $2}')
else
  REPO_OWNER="${GITHUB_REPOSITORY_OWNER:-liorkl}"
  REPO_NAME="${GITHUB_REPOSITORY_NAME:-co-co}"
fi

if [ $# -lt 2 ]; then
  echo "Usage: $0 <title> <description> [label1] [label2] ..."
  echo ""
  echo "Examples:"
  echo "  $0 \"Add user profile editing\" \"Allow users to update their profiles\" type:feature priority:high"
  echo "  $0 \"Fix login bug\" \"Users can't log in\" type:bug priority:critical"
  exit 1
fi

TITLE="$1"
DESCRIPTION="$2"
shift 2
LABELS=("$@")

# Create issue
echo "Creating issue: $TITLE"

# Build gh command with conditional --label flag
GH_CMD=(
  gh issue create
  --title "$TITLE"
  --body "$DESCRIPTION"
)

# Only add --label if labels are provided
# GitHub CLI requires each label to have its own --label flag
if [ ${#LABELS[@]} -gt 0 ]; then
  for label in "${LABELS[@]}"; do
    GH_CMD+=(--label "$label")
  done
fi

GH_CMD+=(--json number --jq '.number')

ISSUE_NUMBER=$("${GH_CMD[@]}" 2>/dev/null)

if [ -z "$ISSUE_NUMBER" ]; then
  echo -e "${RED}❌ Failed to create issue${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Created issue #$ISSUE_NUMBER${NC}"
echo "   View: https://github.com/${REPO_OWNER}/${REPO_NAME}/issues/${ISSUE_NUMBER}"

# Add to project board if labels include status:backlog
if [[ " ${LABELS[@]} " =~ " status:backlog " ]]; then
  echo -e "${BLUE}💡 Add issue #$ISSUE_NUMBER to your project board's Backlog column${NC}"
fi

