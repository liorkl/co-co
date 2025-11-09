#!/bin/sh
# Refresh main (or specified base) and create a new branch safely.
# Usage: ./scripts/git-new-branch.sh <branch-name> [base-branch] [remote]

set -eu

if [ $# -lt 1 ]; then
  echo "Usage: $0 <branch-name> [base-branch] [remote]" >&2
  exit 1
fi

INPUT_BRANCH="$1"
BRANCH_NAME="$(printf "%s" "$INPUT_BRANCH" | tr '[:upper:]' '[:lower:]')"
BASE_BRANCH="${2:-main}"
REMOTE_NAME="${3:-origin}"

if [ "$INPUT_BRANCH" != "$BRANCH_NAME" ]; then
  echo "ℹ️  Normalized branch name to lowercase: $BRANCH_NAME"
fi

# Enforce descriptive branch naming convention
BRANCH_PATTERN='^(feat|fix|chore|docs|refactor|test)/[a-z0-9]+(-[a-z0-9]+){2,}$'
if ! printf "%s" "$BRANCH_NAME" | grep -Eq "$BRANCH_PATTERN"; then
  echo "❌ Branch name '$BRANCH_NAME' is too generic."
  echo "   Use format: <type>/<scope>-<objective>-<detail>"
  echo "   Examples:"
  echo "     feat/matching-add-skill-filters"
  echo "     fix/auth-magic-link-email-copy"
  echo "     chore/devops-improve-pre-push-guardrail"
  exit 1
fi

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

