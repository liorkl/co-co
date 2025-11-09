#!/bin/bash
# Push branch and automatically create PR with generated description
# Usage: ./scripts/push-and-create-pr.sh [base-branch] [remote]

set -e

BASE_BRANCH=${1:-main}
REMOTE=${2:-origin}
CURRENT_BRANCH=$(git branch --show-current)

format_branch_title() {
  printf "%s" "$1" | tr '/-' '  ' | awk '{
    for (i = 1; i <= NF; i++) {
      $i = toupper(substr($i,1,1)) tolower(substr($i,2))
    }
    print
  }'
}

if [ "$CURRENT_BRANCH" = "$BASE_BRANCH" ] || [ "$CURRENT_BRANCH" = "develop" ]; then
  echo "❌ Cannot create PR: already on $CURRENT_BRANCH branch"
  echo "   Please checkout a feature branch first"
  exit 1
fi

# Ensure we're up-to-date with the latest base branch before proceeding
if git remote get-url "$REMOTE" >/dev/null 2>&1; then
  echo "🔄 Refreshing '$REMOTE/$BASE_BRANCH'..."
  if git fetch "$REMOTE" "$BASE_BRANCH" --quiet; then
    if ! git merge-base --is-ancestor "$REMOTE/$BASE_BRANCH" "$CURRENT_BRANCH"; then
      if [ "${SKIP_AUTO_REBASE:-0}" = "1" ]; then
        echo "❌ Branch '$CURRENT_BRANCH' is missing the latest commits from '$REMOTE/$BASE_BRANCH'."
        echo "   Rebase or merge the latest '$BASE_BRANCH' before continuing."
        exit 1
      fi

      if [ -n "$(git status --porcelain)" ]; then
        echo "❌ Branch '$CURRENT_BRANCH' is missing the latest commits from '$REMOTE/$BASE_BRANCH',"
        echo "   but the working tree has uncommitted changes. Rebase manually after cleaning up."
        exit 1
      fi

      echo "🔁 Auto-rebasing '$CURRENT_BRANCH' onto '$REMOTE/$BASE_BRANCH'..."
      if ! git rebase "$REMOTE/$BASE_BRANCH"; then
        echo "❌ Auto rebase failed. Resolve conflicts and rerun the script."
        exit 1
      fi
      echo "✅ Rebase completed."
    fi
  else
    echo "⚠️  Unable to fetch '$REMOTE/$BASE_BRANCH'; continuing without freshness check."
  fi
fi

# Check if GitHub CLI is installed
if ! command -v gh >/dev/null 2>&1; then
  echo "❌ GitHub CLI (gh) is not installed"
  echo "   Install it from: https://cli.github.com/"
  echo "   Or use: brew install gh"
  exit 1
fi

# Check if authenticated
if ! gh auth status >/dev/null 2>&1; then
  echo "❌ Not authenticated with GitHub CLI"
  echo "   Run: gh auth login"
  exit 1
fi

echo "📝 Generating PR description..."
npm run pr:description

if [ ! -f "PR_DESCRIPTION.md" ]; then
  echo "❌ Failed to generate PR description"
  exit 1
fi

echo ""
echo "🚀 Pushing branch to $REMOTE..."
git push -u "$REMOTE" "$CURRENT_BRANCH"

echo ""
echo "📋 Creating pull request..."

# Extract title from first commit or branch name
TITLE=$(git log -1 --pretty=%B | head -1)
if [ -z "$TITLE" ] || [ "$TITLE" = "" ]; then
  TITLE=$(format_branch_title "$CURRENT_BRANCH")
fi

# Create PR using GitHub CLI
PR_URL=$(gh pr create \
  --base "$BASE_BRANCH" \
  --title "$TITLE" \
  --body-file PR_DESCRIPTION.md \
  --head "$CURRENT_BRANCH" 2>&1)

if [ $? -eq 0 ]; then
  echo "✅ Pull request created successfully!"
  echo "   $PR_URL"
  echo ""
  echo "💡 You can view it in Cursor or open it in your browser"
else
  echo "⚠️  Failed to create PR automatically"
  echo "   PR description is in PR_DESCRIPTION.md"
  echo "   Create PR manually: gh pr create --body-file PR_DESCRIPTION.md"
  exit 1
fi

