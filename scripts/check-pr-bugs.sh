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
    # Normalize JSON by removing newlines and extra spaces for multiline matching
    # This allows patterns to match across JSON structure boundaries
    normalized_json=$(echo "$pr_comments_json" | tr '\n' ' ' | sed 's/  */ /g')
    
    # Count comments from cursor[bot] that contain "### Bug:"
    # Strategy: Split JSON into comment objects and check each one individually
    # This handles multiline JSON and nested structures properly
    
    # Extract each comment object by finding patterns between { and }
    # We'll use a simple approach: find each cursor[bot] login and check surrounding context
    cursor_bot_count=$(echo "$normalized_json" | grep -o '"login":"cursor\[bot\]"' | wc -l | tr -d ' ' || echo "0")
    
    if [ "$cursor_bot_count" != "0" ] && [ "$cursor_bot_count" != "" ]; then
      # For each cursor[bot] login found, check if "### Bug:" appears in the same comment
      # Use awk to split JSON into comment objects and check each one
      # This approach handles multiline JSON and nested structures properly
      bug_count=$(echo "$normalized_json" | awk '{
        # Simple approach: if both patterns exist in the normalized JSON, count them
        # Since JSON is normalized (no newlines), we can check if cursor[bot] and ### Bug: appear together
        # Split by comment boundaries (rough approximation) or check proximity
        count = 0
        # Find each occurrence of cursor[bot] and check surrounding context
        remaining = $0
        while (remaining ~ /cursor\[bot\]/) {
          # Find position of cursor[bot]
          match(remaining, /cursor\[bot\]/)
          pos = RSTART
          # Extract context around this position (2000 chars total)
          start = pos - 1000
          if (start < 1) start = 1
          end = pos + 1000
          if (end > length(remaining)) end = length(remaining)
          context = substr(remaining, start, end - start + 1)
          # Check if context contains "### Bug:"
          if (context ~ /### Bug:/) {
            count++
          }
          # Move past this match to find next occurrence
          remaining = substr(remaining, RSTART + RLENGTH)
        }
        print count + 0
      }' 2>/dev/null || echo "0")
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

