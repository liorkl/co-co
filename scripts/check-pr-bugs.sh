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

# Count BugBot review comments
bug_count=0

# Check if jq is available before using it
if ! command -v jq >/dev/null 2>&1; then
  # No jq available - use fallback logic
  # Get repository owner and name without jq
  remote_url=$(git remote get-url origin 2>/dev/null || echo "")
  if [[ "$remote_url" =~ github.com[:/]([^/]+)/([^/]+) ]]; then
    owner="${BASH_REMATCH[1]}"
    repo_name="${BASH_REMATCH[2]%.git}"
  else
    owner=""
    repo_name=""
  fi
  # Fallback: count PR comments without jq (parse JSON with awk)
  # Validate owner and repo_name before making API call
  if [ -z "$owner" ] || [ -z "$repo_name" ]; then
    echo "0"  # Can't check without valid repo info
    exit 0
  fi
  pr_comments_json=$(gh api "repos/$owner/$repo_name/pulls/$pr_number/comments" 2>/dev/null || echo "[]")
  if [ -n "$pr_comments_json" ] && [ "$pr_comments_json" != "[]" ]; then
    # Normalize JSON by removing newlines and extra spaces for multiline matching
    normalized_json=$(echo "$pr_comments_json" | tr '\n' ' ' | sed 's/  */ /g')
    
    # Count comments from cursor[bot] that contain "### Bug:"
    # Strategy: Find each "login":"cursor[bot]" occurrence, then verify the "body" field
    # in the same comment object contains "### Bug:"
    # This properly parses JSON structure to avoid false positives/negatives
    bug_count=$(echo "$normalized_json" | awk '
    {
      count = 0
      json = $0
      
      # Find each occurrence of "login":"cursor[bot]"
      while (match(json, /"login":"cursor\[bot\]"/)) {
        login_pos = RSTART
        
        # Find the start of this comment object by looking backwards for the nearest {
        obj_start = login_pos
        brace_count = 0
        found_start = 0
        
        # Look backwards to find the start of this comment object
        for (i = login_pos; i >= 1; i--) {
          char = substr(json, i, 1)
          if (char == "}") {
            brace_count++
          } else if (char == "{") {
            if (brace_count == 0) {
              obj_start = i
              found_start = 1
              break
            } else {
              brace_count--
            }
          }
        }
        
        # If we found the start, look for the "body" field in this comment object
        if (found_start) {
          # Find the end of this comment object
          # Start from obj_start (not login_pos) since login_pos is inside nested objects
          obj_end = obj_start
          brace_count = 1  # Start at 1 since we are already inside the comment object
          found_end = 0
          
          # Look forwards from the object start to find the end of this comment object
          for (i = obj_start + 1; i <= length(json); i++) {
            char = substr(json, i, 1)
            if (char == "{") {
              brace_count++
            } else if (char == "}") {
              brace_count--
              if (brace_count == 0) {
                # Found the matching closing brace for the comment object
                obj_end = i
                found_end = 1
                break
              }
            }
          }
          
          # Extract the comment object
          if (found_end) {
            comment_obj = substr(json, obj_start, obj_end - obj_start + 1)
            
            # Check if this comment object has a "body" field containing "### Bug:"
            # First, try simple pattern: "body":"...### Bug:..."
            if (match(comment_obj, /"body":"[^"]*### Bug:/)) {
              count++
            } else {
              # If simple pattern does not match, the body might contain escaped quotes
              # Look for "body":" and then search for "### Bug:" within reasonable distance
              body_match_pos = match(comment_obj, /"body":"/)
              if (body_match_pos > 0) {
                # Extract a window after "body":" to search for "### Bug:"
                # Pattern "body":" is 8 characters, so add 8 to skip past it
                body_start = body_match_pos + 8
                body_end = body_start + 10000
                if (body_end > length(comment_obj)) body_end = length(comment_obj)
                body_window = substr(comment_obj, body_start, body_end - body_start)
                
                # Check if this window contains "### Bug:"
                if (match(body_window, /### Bug:/)) {
                  count++
                }
              }
            }
          }
        }
        
        # Move past this match to find next occurrence
        json = substr(json, login_pos + RLENGTH)
      }
      
      print count + 0
    }' 2>/dev/null || echo "0")
  fi
  echo "$bug_count"
  exit 0
else
  # jq is available - use it to get repository owner and name
  repo=$(gh repo view --json owner,name --jq '{owner: .owner.login, name: .name}' 2>/dev/null || echo "{\"owner\":\"\",\"name\":\"\"}")
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
fi

if [ -z "$owner" ] || [ -z "$repo_name" ]; then
  echo "0"
  exit 0
fi

# Check PR review comments (BugBot comments are in /pulls/{pr}/comments endpoint)
pr_comments_json=$(gh api "repos/$owner/$repo_name/pulls/$pr_number/comments" 2>/dev/null || echo "[]")

if [ -n "$pr_comments_json" ] && [ "$pr_comments_json" != "[]" ]; then
  # Count comment objects from cursor[bot] that contain "### Bug:"
  # This matches the awk fallback behavior: one comment object = one bug count
  # even if the comment contains multiple "### Bug:" markers
  bug_count=$(echo "$pr_comments_json" | jq '[.[] | select(.user.login == "cursor[bot]") | select(.body | contains("### Bug:"))] | length' 2>/dev/null || echo "0")
fi

echo "$bug_count"
exit 0
