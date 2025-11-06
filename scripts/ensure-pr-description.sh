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
# Compare against the branch ref file which updates on each commit
branch_ref=".git/refs/heads/$branch"
if [ ! -f "PR_DESCRIPTION.md" ] || [ ! -f "$branch_ref" ] || [ "PR_DESCRIPTION.md" -ot "$branch_ref" ]; then
  if command -v npm >/dev/null 2>&1; then
    npm run pr:description >/dev/null 2>&1 || true
  fi
fi

# Also update the PR template to point to the generated description
# This way Cursor's "Create PR" might pick it up
if [ -f "PR_DESCRIPTION.md" ]; then
  # Copy generated description to a location GitHub CLI might use
  cp PR_DESCRIPTION.md .github/PULL_REQUEST_BODY.md 2>/dev/null || true
fi

exit 0

