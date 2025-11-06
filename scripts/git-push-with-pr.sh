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
if [ ! -f "PR_DESCRIPTION.md" ] || [ "PR_DESCRIPTION.md" -ot ".git/HEAD" ]; then
  echo "📝 Auto-generating PR description..."
  npm run pr:description >/dev/null 2>&1 || true
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
      
      # Create PR
      pr_url=$(gh pr create \
        --base "$base_branch" \
        --title "$title" \
        --body-file PR_DESCRIPTION.md \
        --head "$branch" 2>&1)
      
      if [ $? -eq 0 ]; then
        echo "✅ Pull request created: $pr_url"
      else
        echo "⚠️  Failed to auto-create PR"
        echo "   PR description is in PR_DESCRIPTION.md"
        echo "   Create manually: npm run pr:create"
      fi
    else
      echo "✅ PR already exists for this branch"
    fi
  else
    echo "💡 PR description ready in PR_DESCRIPTION.md"
    echo "   Install GitHub CLI to auto-create PRs: brew install gh && gh auth login"
  fi
else
  # Push failed
  exit 1
fi

