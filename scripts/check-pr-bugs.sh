#!/bin/bash
# Check for bugs in a GitHub PR (specifically BugBot comments)
# Usage: ./scripts/check-pr-bugs.sh [pr-number]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

pr_number="$1"

if [ -z "$pr_number" ]; then
  # Try to get PR number from current branch
  branch=$(git branch --show-current)
  if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
    pr_number=$(gh pr list --head "$branch" --json number --jq '.[0].number' 2>/dev/null || echo "")
  fi
fi

if [ -z "$pr_number" ] || [ "$pr_number" = "null" ]; then
  echo "0"  # No PR, no bugs
  exit 0
fi

if ! command -v gh >/dev/null 2>&1 || ! gh auth status >/dev/null 2>&1; then
  echo "0"  # Can't check, assume no bugs
  exit 0
fi

# Get repository owner and name
repo=$(gh repo view --json owner,name --jq '{owner: .owner.login, name: .name}' 2>/dev/null || echo '{"owner":"","name":""}')
owner=$(echo "$repo" | jq -r '.owner' 2>/dev/null || echo "")
repo_name=$(echo "$repo" | jq -r '.name' 2>/dev/null || echo "")

if [ -z "$owner" ] || [ -z "$repo_name" ]; then
  # Fallback: try to get from git remote
  remote_url=$(git remote get-url origin 2>/dev/null || echo "")
  if [[ "$remote_url" =~ github.com[:/]([^/]+)/([^/]+) ]]; then
    owner="${BASH_REMATCH[1]}"
    repo_name="${BASH_REMATCH[2]%.git}"
  fi
fi

# Count BugBot review comments
bug_count=0

if ! command -v jq >/dev/null 2>&1; then
  # Fallback: count PR comments without jq (parse JSON with grep)
  # Note: gh api --jq requires jq, so we get raw JSON and parse it manually
  pr_comments_json=$(gh api "repos/$owner/$repo_name/pulls/$pr_number/comments" 2>/dev/null || echo "[]")
  if [ -n "$pr_comments_json" ] && [ "$pr_comments_json" != "[]" ]; then
    # Count comments from cursor[bot] that contain "### Bug:"
    # This is a simple grep-based approach since jq is not available
    bug_count=$(echo "$pr_comments_json" | grep -o '"login":"cursor\[bot\]"' | wc -l | tr -d ' ' || echo "0")
    if [ "$bug_count" != "0" ]; then
      # Filter for comments that also contain "### Bug:"
      # We check if the comment body contains the bug marker
      bug_count=$(echo "$pr_comments_json" | grep -c '"login":"cursor\[bot\]".*"### Bug:"' 2>/dev/null || echo "0")
      # If the above doesn't work (due to JSON structure), try a simpler approach
      if [ "$bug_count" = "0" ]; then
        # Count occurrences of cursor[bot] login followed by Bug: in the JSON
        bug_count=$(echo "$pr_comments_json" | grep -c 'cursor\[bot\].*### Bug:' 2>/dev/null || echo "0")
      fi
    fi
  fi
  echo "$bug_count"
  exit 0
fi

# Get repository owner and name if not already set
if [ -z "$owner" ] || [ -z "$repo_name" ]; then
  # Try to get from git remote
  remote_url=$(git remote get-url origin 2>/dev/null || echo "")
  if [[ "$remote_url" =~ github.com[:/]([^/]+)/([^/]+) ]]; then
    owner="${BASH_REMATCH[1]}"
    repo_name="${BASH_REMATCH[2]%.git}"
  else
    # Try gh CLI
    repo_info=$(gh repo view --json owner,name --jq '{owner: .owner.login, name: .name}' 2>/dev/null || echo '{"owner":"","name":""}')
    owner=$(echo "$repo_info" | jq -r '.owner' 2>/dev/null || echo "")
    repo_name=$(echo "$repo_info" | jq -r '.name' 2>/dev/null || echo "")
  fi
fi

if [ -z "$owner" ] || [ -z "$repo_name" ]; then
  echo "0"
  exit 0
fi

# Check PR review comments (BugBot comments are in /pulls/{pr}/comments endpoint)
pr_comments_json=$(gh api "repos/$owner/$repo_name/pulls/$pr_number/comments" 2>/dev/null || echo "[]")

if [ -n "$pr_comments_json" ] && [ "$pr_comments_json" != "[]" ]; then
  # Count bug mentions from cursor[bot]
  bug_count=$(echo "$pr_comments_json" | jq -r '.[] | select(.user.login == "cursor[bot]") | .body' 2>/dev/null | grep -c "### Bug:" 2>/dev/null || echo "0")
fi

echo "$bug_count"

