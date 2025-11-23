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
  # Check if the script exists in package.json without running it
  # npm pkg get returns the value (command) as a JSON string, or {} if not found
  integration_script=$(npm pkg get scripts.test:integration 2>/dev/null || echo "{}")
  if [ "$integration_script" != "{}" ] && [ "$integration_script" != "null" ] && [ -n "$integration_script" ]; then
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
  
  # Check if there are any staged changes to commit
  if ! git diff --cached --quiet; then
    info "Committing changes..."
    if git commit -m "$commit_msg"; then
      success "Changes committed successfully"
      return 0
    else
      error "Commit failed"
      return 1
    fi
  else
    warning "No changes to commit. Files may not have been modified."
    return 2  # Special return code for "no changes"
  fi
}

# Helper function to count all cursor[bot] comments (not just bugs)
count_cursor_bot_comments() {
  local pr_number="$1"
  local owner="$2"
  local repo_name="$3"
  
  if [ -z "$owner" ] || [ -z "$repo_name" ]; then
    echo "0"
    return 0
  fi
  
  if command -v jq >/dev/null 2>&1; then
    local comment_count=$(gh api "repos/$owner/$repo_name/pulls/$pr_number/comments" --jq '[.[] | select(.user.login == "cursor[bot]")] | length' 2>/dev/null || echo "0")
    echo "$comment_count"
  else
    # Fallback: use grep to count cursor[bot] comments
    local comments_json=$(gh api "repos/$owner/$repo_name/pulls/$pr_number/comments" 2>/dev/null || echo "[]")
    local comment_count=$(echo "$comments_json" | grep -o '"login":"cursor\[bot\]"' | wc -l | tr -d ' ')
    echo "${comment_count:-0}"
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
  
  # Get repository info for comment checking
  local owner=""
  local repo_name=""
  if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
    if command -v jq >/dev/null 2>&1; then
      local owner_repo=$(gh repo view --json owner,name --jq '{owner: .owner.login, name: .name}' 2>/dev/null || echo '{"owner":"","name":""}')
      owner=$(echo "$owner_repo" | jq -r '.owner' 2>/dev/null || echo "")
      repo_name=$(echo "$owner_repo" | jq -r '.name' 2>/dev/null || echo "")
    else
      local remote_url=$(git remote get-url origin 2>/dev/null || echo "")
      if [[ "$remote_url" =~ github.com[:/]([^/]+)/([^/]+) ]]; then
        owner="${BASH_REMATCH[1]}"
        repo_name="${BASH_REMATCH[2]%.git}"
      fi
    fi
  fi
  
  # Get initial bug count and comment count to distinguish old from new
  local initial_bug_count=0
  local initial_comment_count=0
  if [ -f "./scripts/check-pr-bugs.sh" ]; then
    local initial_bug_count_output
    initial_bug_count_output=$(./scripts/check-pr-bugs.sh "$pr_number" 2>&1)
    local initial_bug_check_exit=$?
    
    if [ $initial_bug_check_exit -eq 0 ]; then
      initial_bug_count="$initial_bug_count_output"
    fi
  fi
  
  if [ -n "$owner" ] && [ -n "$repo_name" ]; then
    initial_comment_count=$(count_cursor_bot_comments "$pr_number" "$owner" "$repo_name")
  fi
  
  local elapsed=0
  local last_bug_count="$initial_bug_count"
  local last_comment_count="$initial_comment_count"
  local review_started=0  # Track if AGENT REVIEW has started (any cursor[bot] comments exist)
  
  while [ $elapsed -lt $MAX_REVIEW_WAIT_TIME ]; do
    sleep $REVIEW_CHECK_INTERVAL
    elapsed=$((elapsed + REVIEW_CHECK_INTERVAL))
    
    # Check for BugBot comments using our helper script
    if [ -f "./scripts/check-pr-bugs.sh" ]; then
      local bug_count_output
      bug_count_output=$(./scripts/check-pr-bugs.sh "$pr_number" 2>&1)
      local bug_check_exit=$?
      
      if [ $bug_check_exit -ne 0 ]; then
        error "Failed to check for bugs: $bug_count_output"
        warning "Cannot verify bug status. Aborting to prevent pushing potentially broken code."
        return 1  # Error checking bugs - fail safe
      fi
      
      local bug_count="$bug_count_output"
      
      # Check for any cursor[bot] comments to detect if AGENT REVIEW has started/completed
      local current_comment_count=0
      if [ -n "$owner" ] && [ -n "$repo_name" ]; then
        current_comment_count=$(count_cursor_bot_comments "$pr_number" "$owner" "$repo_name")
      fi
      
      # If new comments appeared, AGENT REVIEW has started
      if [ "$current_comment_count" -gt "$initial_comment_count" ]; then
        review_started=1
        # If comment count increased but no new bugs, AGENT REVIEW completed successfully
        if [ "$bug_count" -le "$initial_bug_count" ]; then
          success "AGENT REVIEW completed - no new bugs found (total comments: $current_comment_count, bugs: $bug_count)"
          return 0  # AGENT REVIEW completed with no new bugs
        fi
      fi
      
      # Only report bugs if the count INCREASED (new bugs from current commit)
      # If bugs exist but count hasn't increased, those are old bugs - continue waiting
      if [ "$bug_count" -gt "$initial_bug_count" ]; then
        local new_bugs=$((bug_count - initial_bug_count))
        error "AGENT REVIEW found $new_bugs new bug(s) (total: $bug_count, existing: $initial_bug_count)!"
        return 1  # New bugs found
      fi
      
      last_bug_count="$bug_count"
      last_comment_count="$current_comment_count"
    else
      # Fallback: check for any PR comments from cursor[bot]
      if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
        if [ -z "$owner" ] || [ -z "$repo_name" ]; then
          local owner_repo=$(gh repo view --json owner,name --jq '{owner: .owner.login, name: .name}' 2>/dev/null || echo '{"owner":"","name":""}')
          owner=$(echo "$owner_repo" | jq -r '.owner' 2>/dev/null || echo "")
          repo_name=$(echo "$owner_repo" | jq -r '.name' 2>/dev/null || echo "")
        fi
        
        if [ -n "$owner" ] && [ -n "$repo_name" ]; then
          local bug_count=$(gh api "repos/$owner/$repo_name/pulls/$pr_number/comments" --jq '[.[] | select(.user.login == "cursor[bot]") | select(.body | contains("### Bug:"))] | length' 2>/dev/null || echo "0")
          local current_comment_count=$(count_cursor_bot_comments "$pr_number" "$owner" "$repo_name")
          
          # If new comments appeared, AGENT REVIEW has started
          if [ "$current_comment_count" -gt "$initial_comment_count" ]; then
            review_started=1
            # If comment count increased but no new bugs, AGENT REVIEW completed successfully
            if [ "$bug_count" -le "$initial_bug_count" ]; then
              success "AGENT REVIEW completed - no new bugs found (total comments: $current_comment_count, bugs: $bug_count)"
              return 0  # AGENT REVIEW completed with no new bugs
            fi
          fi
          
          # Only report bugs if the count INCREASED (new bugs from current commit)
          if [ "$bug_count" -gt "$initial_bug_count" ]; then
            local new_bugs=$((bug_count - initial_bug_count))
            error "AGENT REVIEW found $new_bugs new bug(s) (total: $bug_count, existing: $initial_bug_count)!"
            return 1  # New bugs found
          fi
        fi
      fi
    fi
    
    # Show progress
    if [ $((elapsed % 30)) -eq 0 ]; then
      if [ $review_started -eq 1 ]; then
        info "AGENT REVIEW in progress... (${elapsed}s elapsed, $last_comment_count comment(s), $last_bug_count bug(s))"
      else
        info "Waiting for AGENT REVIEW to start... (${elapsed}s elapsed)"
      fi
    fi
  done
  
  # Timeout reached - check one more time to see if AGENT REVIEW completed
  if [ -f "./scripts/check-pr-bugs.sh" ]; then
    local final_bug_count_output
    final_bug_count_output=$(./scripts/check-pr-bugs.sh "$pr_number" 2>&1)
    local final_bug_check_exit=$?
    
    if [ $final_bug_check_exit -ne 0 ]; then
      error "Failed to check for bugs after timeout: $final_bug_count_output"
      warning "Cannot verify bug status. Aborting to prevent pushing potentially broken code."
      return 1  # Error checking bugs - fail safe
    fi
    
    local final_bug_count="$final_bug_count_output"
    local final_comment_count=0
    if [ -n "$owner" ] && [ -n "$repo_name" ]; then
      final_comment_count=$(count_cursor_bot_comments "$pr_number" "$owner" "$repo_name")
    fi
    
    # If comments exist but no new bugs, AGENT REVIEW completed successfully
    if [ "$final_comment_count" -gt "$initial_comment_count" ] && [ "$final_bug_count" -le "$initial_bug_count" ]; then
      success "AGENT REVIEW completed - no new bugs found (total comments: $final_comment_count, bugs: $final_bug_count)"
      return 0  # AGENT REVIEW completed with no new bugs
    fi
    
    # Only report bugs if the count INCREASED (new bugs from current commit)
    if [ "$final_bug_count" -gt "$initial_bug_count" ]; then
      local new_bugs=$((final_bug_count - initial_bug_count))
      error "AGENT REVIEW found $new_bugs new bug(s) after timeout (total: $final_bug_count, existing: $initial_bug_count)!"
      return 1  # New bugs found
    fi
  else
    warning "check-pr-bugs.sh not found. Cannot verify bug status after timeout."
    return 1  # Fail safe
  fi
  
  # No bugs found after waiting - check if AGENT REVIEW started
  if [ $review_started -eq 1 ]; then
    success "AGENT REVIEW completed - no new bugs found"
    return 0  # AGENT REVIEW completed (comments exist, no new bugs)
  else
    warning "AGENT REVIEW timeout reached after ${MAX_REVIEW_WAIT_TIME}s."
    warning "No AGENT REVIEW comments detected. AGENT REVIEW may not have started, or may still be in progress."
    warning "Proceeding assuming no bugs. Check PR manually if uncertain."
    return 0  # Timeout, but no bugs detected and no review started
  fi
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
    local bug_count_output
    bug_count_output=$(./scripts/check-pr-bugs.sh "$pr_number" 2>&1)
    local bug_check_exit=$?
    
    if [ $bug_check_exit -ne 0 ]; then
      error "Failed to check for bugs: $bug_count_output"
      warning "Cannot verify bug status. Aborting to prevent pushing potentially broken code."
      return 1  # Error checking bugs - fail safe
    fi
    
    local bug_count="$bug_count_output"
    
    if [ "$bug_count" != "0" ]; then
      error "Found $bug_count bug(s) in PR review"
      
      # Show bug summaries from BugBot
      if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
        info "Bug summaries from BugBot:"
        local owner_repo=$(gh repo view --json owner,name --jq '{owner: .owner.login, name: .name}' 2>/dev/null || echo '{"owner":"","name":""}')
        local owner=$(echo "$owner_repo" | jq -r '.owner' 2>/dev/null || echo "")
        local repo_name=$(echo "$owner_repo" | jq -r '.name' 2>/dev/null || echo "")
        
        if [ -n "$owner" ] && [ -n "$repo_name" ]; then
          gh api "repos/$owner/$repo_name/pulls/$pr_number/comments" --jq '.[] | select(.user.login == "cursor[bot]") | select(.body | contains("### Bug:")) | "  - \(.body | split("\n")[0] | sub("### Bug: "; ""))"' 2>/dev/null | head -10 || true
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
  # Check for commit message argument before shifting
  if [ $# -eq 0 ]; then
    error "Usage: $0 <commit-message> [files...]"
    exit 1
  fi
  
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
  commit_changes "$commit_msg" "${files[@]}"
  local commit_result=$?
  
  if [ $commit_result -eq 2 ]; then
    # No changes to commit - this shouldn't happen on initial commit
    error "No changes to commit. Please make changes before running this script."
    exit 1
  elif [ $commit_result -ne 0 ]; then
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
  local commit_iteration=0  # Track actual commits made (separate from loop iteration)
  local has_uncommitted_fixes=0
  # Track files from initial commit to reuse for bug fix commits
  local tracked_files=("${files[@]}")
  
  while [ $iteration -lt $MAX_BUG_FIX_ITERATIONS ]; do
    iteration=$((iteration + 1))
    
    if [ $iteration -gt 1 ]; then
      info "Bug fix attempt #$iteration (commit #$commit_iteration)"
      echo ""
      
      # Re-run pre-commit checks after fixes
      if ! run_pre_commit_checks; then
        error "Pre-commit checks failed after bug fixes"
        exit 1
      fi
      echo ""
      
      # Commit fixes (use commit_iteration + 1 for the message since we'll increment after success)
      # Reuse the same files from initial commit to avoid staging unrelated changes
      commit_changes "fix: address AGENT REVIEW feedback (iteration $((commit_iteration + 1)))" "${tracked_files[@]}"
      local commit_result=$?
      
      if [ $commit_result -eq 2 ]; then
        # No changes to commit - user may have pressed Enter without making changes
        warning "No changes detected. Did you fix the bugs?"
        echo ""
        warning "Options:"
        info "  1. Press Enter to check for bugs again (without committing)"
        info "  2. Type 'skip' to proceed with push anyway (not recommended)"
        info "  3. Press Ctrl+C to exit"
        echo ""
        read -p "Your choice: " user_choice
        if [ "$user_choice" = "skip" ]; then
          warning "Skipping bug checks. Proceeding to push..."
          bugs_found=0  # Clear flag to allow push
          break
        fi
        echo ""
        # No commit was made, so skip AGENT REVIEW wait and check for bugs directly
        # If bugs still exist, inform the user and give them options
        if [ -n "$pr_number" ] && [ "$pr_number" != "null" ]; then
          if ! check_for_bugs "$pr_number"; then
            warning "Bugs still present in PR. No changes were made to fix them."
            echo ""
            info "Options:"
            info "  1. Fix bugs and run the script again"
            info "  2. Type 'skip' to proceed with push anyway (not recommended)"
            info "  3. Press Enter to exit"
            echo ""
            read -p "Your choice: " user_choice2
            if [ "$user_choice2" = "skip" ]; then
              warning "Skipping bug checks. Proceeding to push..."
              bugs_found=0  # Clear flag to allow push
              break
            else
              error "Exiting. Please fix bugs before continuing."
              exit 1
            fi
          else
            # No bugs found - user may have fixed them manually or bugs were resolved
            success "No bugs found in PR review"
            bugs_found=0
            break
          fi
        else
          # No PR - can't check for bugs, so exit
          warning "No PR found. Cannot verify bug status."
          error "Exiting. Please fix bugs and commit changes before continuing."
          exit 1
        fi
        # Note: All code paths above either break, exit, or continue to wait_for_agent_review
      elif [ $commit_result -ne 0 ]; then
        error "Failed to commit bug fixes"
        exit 1
      else
        # Successful commit - increment commit counter
        commit_iteration=$((commit_iteration + 1))
        echo ""
        has_uncommitted_fixes=0
      fi
    fi
    
    # Wait for AGENT REVIEW
    if wait_for_agent_review "$pr_number"; then
      # No bugs found - AGENT REVIEW completed successfully
      bugs_found=0
      break
    else
      # Bugs found - AGENT REVIEW detected issues
      bugs_found=1
      warning "Bugs detected by AGENT REVIEW (attempt $iteration/$MAX_BUG_FIX_ITERATIONS)"
      echo ""
      info "Please review the bugs and fix them."
      info "The script will wait for you to make fixes, then run again automatically."
      echo ""
      if [ $iteration -ge $MAX_BUG_FIX_ITERATIONS ]; then
        warning "Maximum iterations reached. You can:"
        info "  1. Fix bugs manually and push later"
        info "  2. Type 'skip' to proceed with push anyway (not recommended)"
        info "  3. Press Ctrl+C to exit"
        echo ""
        read -p "Your choice (Enter to exit, 'skip' to push anyway): " user_choice
        if [ "$user_choice" = "skip" ]; then
          warning "Skipping bug checks. Proceeding to push..."
          bugs_found=0  # Clear flag to allow push
          break
        else
          error "Exiting. Fix bugs manually and push when ready."
          exit 1
        fi
      else
        read -p "Press Enter after you've fixed the bugs, 'skip' to proceed anyway, or Ctrl+C to exit: " user_choice
        if [ "$user_choice" = "skip" ]; then
          warning "Skipping remaining bug checks. Proceeding to push..."
          bugs_found=0  # Clear flag to allow push
          break
        fi
      fi
      echo ""
      # Always set has_uncommitted_fixes when bugs are detected
      # The user will need to fix bugs, and those fixes need to be committed
      # The flag will be cleared when a commit is successfully made (line 388)
      has_uncommitted_fixes=1
    fi
  done
  
  # If we exited the loop with uncommitted fixes (e.g., on max iteration), commit them now
  # Only commit if there are actually uncommitted changes
  if [ $has_uncommitted_fixes -eq 1 ]; then
    # Check if there are any uncommitted changes before attempting to commit
    if ! git diff --quiet || ! git diff --cached --quiet; then
      info "Committing fixes from final iteration..."
      echo ""
      
      # Re-run pre-commit checks after fixes
      if ! run_pre_commit_checks; then
        error "Pre-commit checks failed after bug fixes"
        exit 1
      fi
      echo ""
      
      # Commit fixes (use commit_iteration + 1 for the message since we'll increment after success)
      # Reuse the same files from initial commit to avoid staging unrelated changes
      commit_changes "fix: address AGENT REVIEW feedback (iteration $((commit_iteration + 1)))" "${tracked_files[@]}"
      local commit_result=$?
      
      if [ $commit_result -eq 2 ]; then
        # No changes to commit - user may have pressed Enter without making changes
        warning "No changes detected. Did you fix the bugs?"
        warning "Skipping commit. Will check for bugs in existing code."
        echo ""
        # Don't wait for AGENT REVIEW since there's no new commit
        # Just proceed to final bug check
      elif [ $commit_result -ne 0 ]; then
        error "Failed to commit bug fixes"
        exit 1
      else
        # Successful commit - increment commit counter
        commit_iteration=$((commit_iteration + 1))
        echo ""
        
        # Wait for AGENT REVIEW to run on the newly committed fixes
        info "Waiting for AGENT REVIEW on final fix commit..."
        info "Note: AGENT REVIEW runs automatically after commit in Cursor IDE"
        echo ""
        
        # Wait a bit for AGENT REVIEW to start
        sleep 5
        
        # Wait for AGENT REVIEW to complete on the new commit
        if ! wait_for_agent_review "$pr_number"; then
          error "AGENT REVIEW found bugs in final fix commit. Please fix them manually."
          exit 1
        else
          # Successfully fixed bugs in final iteration - clear bugs_found flag
          bugs_found=0
        fi
      fi
    else
      # has_uncommitted_fixes is 1 but no actual changes exist
      # This happens when fixes were already committed but bugs were found again
      warning "No uncommitted changes found. Fixes may have already been committed."
      echo ""
    fi
  fi
  
  if [ $bugs_found -eq 1 ] && [ $iteration -ge $MAX_BUG_FIX_ITERATIONS ]; then
    error "Maximum bug fix iterations reached. Please fix bugs manually."
    exit 1
  fi
  
  # Final check for bugs
  if [ -n "$pr_number" ] && [ "$pr_number" != "null" ]; then
    if ! check_for_bugs "$pr_number"; then
      warning "Bugs still present in PR."
      echo ""
      info "Options:"
      info "  1. Fix bugs manually and push later"
      info "  2. Type 'force' to push anyway (not recommended)"
      info "  3. Press Enter to exit"
      echo ""
      read -p "Your choice: " user_choice
      if [ "$user_choice" != "force" ]; then
        warning "Exiting. Fix bugs manually and push when ready."
        info "To push anyway, run: git push"
        exit 1
      else
        warning "Force pushing despite bugs. This is not recommended."
        echo ""
      fi
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

