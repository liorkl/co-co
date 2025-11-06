#!/bin/bash
# Wrapper for git push that automatically creates PR after successful push
# Usage: ./scripts/git-push-with-pr.sh [git-push-args...]

set -e

branch=$(git branch --show-current)
base_branch="main"

# Only auto-create PR for feature branches
if [ "$branch" = "$base_branch" ] || [ "$branch" = "develop" ]; then
  # Just do normal push for main/develop
  git push "$@"
  exit 0
fi

# Generate PR description if needed
# Compare against the latest commit timestamp (more reliable than .git/HEAD or refs files)
if [ ! -f "PR_DESCRIPTION.md" ]; then
  # File doesn't exist, generate it
  echo "📝 Auto-generating PR description..."
  npm run pr:description >/dev/null 2>&1 || true
else
  # File exists, check if it's older than the latest commit
  latest_commit_time=$(git log -1 --format=%ct HEAD 2>/dev/null || echo "0")
  file_mtime=$(stat -f %m "PR_DESCRIPTION.md" 2>/dev/null || stat -c %Y "PR_DESCRIPTION.md" 2>/dev/null || echo "0")
  
  if [ "$latest_commit_time" -gt "$file_mtime" ]; then
    # Latest commit is newer than the file, regenerate
    echo "📝 Auto-generating PR description..."
    npm run pr:description >/dev/null 2>&1 || true
  fi
fi

# Perform the actual git push
echo "🚀 Pushing branch..."
if git push "$@"; then
  # Push succeeded, now create PR
  echo ""
  
  # Check if GitHub CLI is available
  if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
    # Check if PR already exists
    existing_pr=$(gh pr list --head "$branch" --json number --jq '.[0].number' 2>/dev/null || echo "")
    
    if [ -z "$existing_pr" ] || [ "$existing_pr" = "null" ]; then
      # PR doesn't exist, create it
      echo "📋 Auto-creating pull request..."
      
      # Extract title from first commit or branch name
      title=$(git log -1 --pretty=%B | head -1)
      if [ -z "$title" ] || [ "$title" = "" ]; then
        title=$(echo "$branch" | sed 's/.*\///' | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++)sub(/./,toupper(substr($i,1,1)),$i)}1')
      fi
      
      # Ensure PR_DESCRIPTION.md exists
      if [ ! -f "PR_DESCRIPTION.md" ]; then
        npm run pr:description >/dev/null 2>&1 || true
      fi
      
      # Determine labels based on branch type
      labels=""
      if echo "$branch" | grep -qE "^feature/"; then
        labels="enhancement"
      elif echo "$branch" | grep -qE "^fix/"; then
        labels="bug"
      elif echo "$branch" | grep -qE "^docs/"; then
        labels="documentation"
      elif echo "$branch" | grep -qE "^refactor/"; then
        labels="refactor"
      fi
      
      # Create PR with labels if available
      if [ -n "$labels" ]; then
        pr_url=$(gh pr create \
          --base "$base_branch" \
          --title "$title" \
          --body-file PR_DESCRIPTION.md \
          --head "$branch" \
          --label "$labels" 2>&1)
      else
        pr_url=$(gh pr create \
          --base "$base_branch" \
          --title "$title" \
          --body-file PR_DESCRIPTION.md \
          --head "$branch" 2>&1)
      fi
      
      if [ $? -eq 0 ]; then
        echo "✅ Pull request created: $pr_url"
        # Extract PR number from URL
        pr_number=$(echo "$pr_url" | grep -oE '/pull/[0-9]+' | grep -oE '[0-9]+' || echo "")
        if [ -n "$pr_number" ]; then
          # Try to add auto-reviewer if configured (optional)
          if [ -n "$GITHUB_AUTO_REVIEWER" ]; then
            gh pr edit "$pr_number" --add-reviewer "$GITHUB_AUTO_REVIEWER" 2>/dev/null || true
          fi
          echo "🌐 Opening PR in browser..."
          gh pr view "$pr_number" --web 2>/dev/null || open "$pr_url" 2>/dev/null || true
        fi
      else
        echo "⚠️  Failed to auto-create PR"
        echo "   PR description is in PR_DESCRIPTION.md"
        echo "   Create manually: npm run pr:create"
      fi
    else
      echo "✅ PR already exists for this branch"
      echo "🌐 Opening PR in browser..."
      gh pr view "$existing_pr" --web 2>/dev/null || true
    fi
  else
    echo "💡 PR description ready in PR_DESCRIPTION.md"
    echo "   Install GitHub CLI to auto-create PRs: brew install gh && gh auth login"
  fi
else
  # Push failed
  exit 1
fi

