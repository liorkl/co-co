#!/bin/sh
# Refresh main (or specified base) and create a new branch safely.
# Usage: ./scripts/git-new-branch.sh <branch-name> [base-branch] [remote]

set -eu

if [ $# -lt 1 ]; then
  echo "Usage: $0 <branch-name> [base-branch] [remote]" >&2
  exit 1
fi

BRANCH_NAME="$1"
BASE_BRANCH="${2:-main}"
REMOTE_NAME="${3:-origin}"

# Ensure clean working tree before switching branches
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Working tree has uncommitted changes."
  echo "   Commit, stash, or clean your tree before creating a new branch."
  exit 1
fi

# Ensure remote exists
if ! git remote get-url "$REMOTE_NAME" >/dev/null 2>&1; then
  echo "❌ Remote '$REMOTE_NAME' not found."
  exit 1
fi

echo "🔄 Fetching latest '$BASE_BRANCH' from '$REMOTE_NAME'..."
if ! git fetch "$REMOTE_NAME" "$BASE_BRANCH" --prune --prune-tags >/dev/null 2>&1; then
  echo "❌ Failed to fetch '$BASE_BRANCH' from '$REMOTE_NAME'."
  exit 1
fi

echo "📦 Updating local '$BASE_BRANCH'..."
git checkout "$BASE_BRANCH" >/dev/null 2>&1
git pull --ff-only "$REMOTE_NAME" "$BASE_BRANCH"

if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
  echo "⚠️  Local branch '$BRANCH_NAME' already exists. Switching to it."
  git checkout "$BRANCH_NAME"
else
  echo "🌱 Creating new branch '$BRANCH_NAME' based on '$BASE_BRANCH'..."
  git checkout -b "$BRANCH_NAME"
fi

echo "✅ Ready on branch '$BRANCH_NAME'."

