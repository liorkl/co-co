#!/bin/bash
# Ensure PR description is always up-to-date
# This can be called before any PR creation operation

set -e

branch=$(git branch --show-current)
base_branch="main"

# Only generate for feature branches
if [ "$branch" = "$base_branch" ] || [ "$branch" = "develop" ]; then
  exit 0
fi

# Generate if missing or outdated
# Compare against the latest commit timestamp (more reliable than .git/HEAD or refs files)
if [ ! -f "PR_DESCRIPTION.md" ]; then
  # File doesn't exist, generate it
  if command -v npm >/dev/null 2>&1; then
    npm run pr:description >/dev/null 2>&1 || true
  fi
else
  # File exists, check if it's older than the latest commit
  latest_commit_time=$(git log -1 --format=%ct HEAD 2>/dev/null || echo "0")
  file_mtime=$(stat -f %m "PR_DESCRIPTION.md" 2>/dev/null || stat -c %Y "PR_DESCRIPTION.md" 2>/dev/null || echo "0")
  
  if [ "$latest_commit_time" -gt "$file_mtime" ]; then
    # Latest commit is newer than the file, regenerate
    if command -v npm >/dev/null 2>&1; then
      npm run pr:description >/dev/null 2>&1 || true
    fi
  fi
fi

# Also update the PR template to point to the generated description
# This way Cursor's "Create PR" might pick it up
if [ -f "PR_DESCRIPTION.md" ]; then
  # Copy generated description to a location GitHub CLI might use
  cp PR_DESCRIPTION.md .github/PULL_REQUEST_BODY.md 2>/dev/null || true
fi

exit 0

