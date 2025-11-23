#!/bin/bash
# Automated commit workflow with pre-commit verification and post-commit AGENT REVIEW
# Usage: ./scripts/commit-with-review.sh [commit-message] [files...]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MAX_REVIEW_WAIT_TIME=300  # Maximum time to wait for AGENT REVIEW (5 minutes)
REVIEW_CHECK_INTERVAL=10  # Check every 10 seconds
MAX_BUG_FIX_ITERATIONS=5  # Maximum iterations of bug fixes

# Colors for output
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }

# Step 1: Pre-commit verification
run_pre_commit_checks() {
  info "Running pre-commit verification..."
  
  # Lint check
  info "Running lint check..."
  if ! npm run lint --silent >/dev/null 2>&1; then
    error "Lint check failed"
    return 1
  fi
  success "Lint check passed"
  
  # Type check
  info "Running type check..."
  if ! npx tsc --noEmit >/dev/null 2>&1; then
    error "Type check failed"
    return 1
  fi
  success "Type check passed"
  
  # Unit tests
  info "Running unit tests..."
  if ! npm run test:unit --silent >/dev/null 2>&1; then
    error "Unit tests failed"
    return 1
  fi
  success "Unit tests passed"
  
  # Integration tests (if available)
  if npm run test:integration --silent >/dev/null 2>&1; then
    info "Running integration tests..."
    if ! npm run test:integration --silent >/dev/null 2>&1; then
      error "Integration tests failed"
      return 1
    fi
    success "Integration tests passed"
  else
    warning "Integration tests not available, skipping"
  fi
  
  # E2E smoke tests (optional, can be skipped if database not available)
  if [ "${SKIP_E2E_SMOKE_CHECK:-0}" != "1" ]; then
    info "Running E2E smoke tests..."
    if npm run test:e2e:smoke:nobuild >/dev/null 2>&1; then
      success "E2E smoke tests passed"
    else
      warning "E2E smoke tests failed or database unavailable (continuing anyway)"
    fi
  else
    info "Skipping E2E smoke tests (SKIP_E2E_SMOKE_CHECK=1)"
  fi
  
  success "All pre-commit checks passed"
  return 0
}

# Step 2: Commit changes
commit_changes() {
  local commit_msg="$1"
  shift
  local files=("$@")
  
  if [ -z "$commit_msg" ]; then
    error "Commit message is required"
    return 1
  fi
  
  info "Staging changes..."
  if [ ${#files[@]} -eq 0 ]; then
    git add -A
  else
    git add "${files[@]}"
  fi
  
  info "Committing changes..."
  if git commit -m "$commit_msg"; then
    success "Changes committed successfully"
    return 0
  else
    error "Commit failed"
    return 1
  fi
}

# Step 3: Wait for AGENT REVIEW and check for bugs
wait_for_agent_review() {
  local pr_number="$1"
  
  if [ -z "$pr_number" ]; then
    # Try to get PR number from current branch
    local branch=$(git branch --show-current)
    if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
      pr_number=$(gh pr list --head "$branch" --json number --jq '.[0].number' 2>/dev/null || echo "")
    fi
  fi
  
  if [ -z "$pr_number" ] || [ "$pr_number" = "null" ]; then
    warning "No PR found for current branch. AGENT REVIEW will happen locally in Cursor IDE."
    warning "After AGENT REVIEW completes, push manually or run this script again."
    return 0
  fi
  
  info "Waiting for AGENT REVIEW on PR #$pr_number..."
  info "Checking for BugBot comments every ${REVIEW_CHECK_INTERVAL}s (max ${MAX_REVIEW_WAIT_TIME}s)..."
  
  local elapsed=0
  local last_bug_count=0
  
  while [ $elapsed -lt $MAX_REVIEW_WAIT_TIME ]; do
    sleep $REVIEW_CHECK_INTERVAL
    elapsed=$((elapsed + REVIEW_CHECK_INTERVAL))
    
    # Check for BugBot comments using our helper script
    if [ -f "./scripts/check-pr-bugs.sh" ]; then
      local bug_count=$(./scripts/check-pr-bugs.sh "$pr_number" 2>/dev/null || echo "0")
      
      if [ "$bug_count" != "0" ]; then
        if [ "$bug_count" != "$last_bug_count" ] || [ "$last_bug_count" = "0" ]; then
          error "AGENT REVIEW found $bug_count bug(s)!"
          return 1  # Bugs found
        fi
      fi
      
      last_bug_count="$bug_count"
    else
      # Fallback: check for any PR comments from cursor[bot]
      if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
        local owner_repo=$(gh repo view --json owner,name --jq '{owner: .owner.login, name: .name}' 2>/dev/null || echo '{"owner":"","name":""}')
        local owner=$(echo "$owner_repo" | jq -r '.owner' 2>/dev/null || echo "")
        local repo_name=$(echo "$owner_repo" | jq -r '.name' 2>/dev/null || echo "")
        
        if [ -n "$owner" ] && [ -n "$repo_name" ]; then
          local bug_count=$(gh api "repos/$owner/$repo_name/pulls/$pr_number/comments" --jq '[.[] | select(.user.login == "cursor[bot"]) | select(.body | contains("### Bug:"))] | length' 2>/dev/null || echo "0")
          
          if [ "$bug_count" != "0" ]; then
            error "AGENT REVIEW found $bug_count bug(s)!"
            return 1  # Bugs found
          fi
        fi
      fi
    fi
    
    # Show progress
    if [ $((elapsed % 30)) -eq 0 ]; then
      info "Still waiting for AGENT REVIEW... (${elapsed}s elapsed)"
    fi
  done
  
  warning "AGENT REVIEW timeout reached. Assuming no bugs found."
  return 0
}

# Step 4: Check for bugs in PR
check_for_bugs() {
  local pr_number="$1"
  
  if [ -z "$pr_number" ] || [ "$pr_number" = "null" ]; then
    return 0  # No PR, no bugs
  fi
  
  info "Checking PR #$pr_number for bugs..."
  
  # Use our bug checker script
  if [ -f "./scripts/check-pr-bugs.sh" ]; then
    local bug_count=$(./scripts/check-pr-bugs.sh "$pr_number" 2>/dev/null || echo "0")
    
    if [ "$bug_count" != "0" ]; then
      error "Found $bug_count bug(s) in PR review"
      
      # Show bug summaries from BugBot
      if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
        info "Bug summaries from BugBot:"
        local owner_repo=$(gh repo view --json owner,name --jq '{owner: .owner.login, name: .name}' 2>/dev/null || echo '{"owner":"","name":""}')
        local owner=$(echo "$owner_repo" | jq -r '.owner' 2>/dev/null || echo "")
        local repo_name=$(echo "$owner_repo" | jq -r '.name' 2>/dev/null || echo "")
        
        if [ -n "$owner" ] && [ -n "$repo_name" ]; then
          gh api "repos/$owner/$repo_name/pulls/$pr_number/comments" --jq '.[] | select(.user.login == "cursor[bot"]) | select(.body | contains("### Bug:")) | "  - \(.body | split("\n")[0] | sub("### Bug: "; ""))"' 2>/dev/null | head -10 || true
        fi
      fi
      
      return 1  # Bugs found
    fi
  else
    # Fallback: check for any review comments
    if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
      local review_comments=$(gh pr view "$pr_number" --json reviewComments --jq '.reviewComments | length' 2>/dev/null || echo "0")
      
      if [ "$review_comments" != "0" ]; then
        error "Found $review_comments review comments (likely bugs)"
        return 1  # Bugs found
      fi
    fi
  fi
  
  success "No bugs found in PR review"
  return 0
}

# Step 5: Push changes
push_changes() {
  info "Pushing changes to remote..."
  
  if git push; then
    success "Changes pushed successfully"
    return 0
  else
    error "Push failed"
    return 1
  fi
}

# Main workflow
main() {
  local commit_msg="$1"
  shift
  local files=("$@")
  
  if [ -z "$commit_msg" ]; then
    error "Usage: $0 <commit-message> [files...]"
    exit 1
  fi
  
  info "Starting automated commit workflow with AGENT REVIEW..."
  echo ""
  
  # Step 1: Pre-commit checks
  if ! run_pre_commit_checks; then
    error "Pre-commit checks failed. Fix issues before committing."
    exit 1
  fi
  echo ""
  
  # Step 2: Commit
  if ! commit_changes "$commit_msg" "${files[@]}"; then
    error "Commit failed"
    exit 1
  fi
  echo ""
  
  # Step 3: Wait for AGENT REVIEW
  local branch=$(git branch --show-current)
  local pr_number=""
  if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
    pr_number=$(gh pr list --head "$branch" --json number --jq '.[0].number' 2>/dev/null || echo "")
  fi
  
  info "Waiting for Cursor AGENT REVIEW to complete..."
  info "Note: AGENT REVIEW runs automatically after commit in Cursor IDE"
  echo ""
  
  # Wait a bit for AGENT REVIEW to start
  sleep 5
  
  # Check for bugs (with timeout)
  local bugs_found=0
  local iteration=0
  
  while [ $iteration -lt $MAX_BUG_FIX_ITERATIONS ]; do
    iteration=$((iteration + 1))
    
    if [ $iteration -gt 1 ]; then
      info "Bug fix iteration #$iteration"
      echo ""
      
      # Re-run pre-commit checks after fixes
      if ! run_pre_commit_checks; then
        error "Pre-commit checks failed after bug fixes"
        exit 1
      fi
      echo ""
      
      # Commit fixes
      if ! commit_changes "fix: address AGENT REVIEW feedback (iteration $iteration)"; then
        error "Failed to commit bug fixes"
        exit 1
      fi
      echo ""
    fi
    
    # Wait for AGENT REVIEW
    if wait_for_agent_review "$pr_number"; then
      # No bugs found or timeout
      bugs_found=0
      break
    else
      # Bugs found
      bugs_found=1
      warning "Bugs detected by AGENT REVIEW"
      echo ""
      info "Please review the bugs and fix them."
      info "The script will wait for you to make fixes, then run again automatically."
      echo ""
      read -p "Press Enter after you've fixed the bugs (or Ctrl+C to exit): "
      echo ""
    fi
  done
  
  if [ $bugs_found -eq 1 ] && [ $iteration -ge $MAX_BUG_FIX_ITERATIONS ]; then
    error "Maximum bug fix iterations reached. Please fix bugs manually."
    exit 1
  fi
  
  # Final check for bugs
  if [ -n "$pr_number" ] && [ "$pr_number" != "null" ]; then
    if ! check_for_bugs "$pr_number"; then
      warning "Bugs still present in PR. Review manually before pushing."
      info "To push anyway, run: git push"
      exit 1
    fi
  fi
  
  echo ""
  success "All checks passed! Ready to push."
  echo ""
  
  # Step 6: Push
  if push_changes; then
    success "Workflow completed successfully!"
    return 0
  else
    error "Push failed"
    exit 1
  fi
}

# Run main workflow
main "$@"

