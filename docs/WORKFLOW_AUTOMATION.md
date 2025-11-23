# Automated Commit & Review Workflow

This document describes the automated commit workflow that integrates pre-commit verification with Cursor's AGENT REVIEW feature.

## Overview

The `commit:review` workflow automates the complete development cycle:
1. **Pre-commit verification** - Runs all checks before committing
2. **Commit** - Commits changes with your message
3. **AGENT REVIEW wait** - Waits for Cursor's AGENT REVIEW to complete
4. **Bug detection** - Checks for BugBot comments in GitHub PR
5. **Auto-fix loop** - If bugs found, prompts for fixes and re-verifies
6. **Push** - Pushes only when all checks pass

## Usage

### Basic Usage

```bash
npm run commit:review "fix: add validation to prevent empty form submission"
```

### With Specific Files

```bash
npm run commit:review "feat: implement new feature" app/components/NewFeature.tsx
```

### Direct Script Usage

```bash
./scripts/commit-with-review.sh "your commit message" [files...]
```

## Workflow Steps

### 1. Pre-commit Verification

The script runs the following checks in order:
- ✅ **Lint check** - `npm run lint`
- ✅ **Type check** - `npx tsc --noEmit`
- ✅ **Unit tests** - `npm run test:unit`
- ✅ **Integration tests** - `npm run test:integration` (if available)
- ✅ **E2E smoke tests** - `npm run test:e2e:smoke:nobuild` (optional, can be skipped)

**Note**: If any check fails, the workflow stops and you must fix the issues before continuing.

### 2. Commit

After all checks pass, changes are committed with your provided message.

### 3. AGENT REVIEW Wait

The script waits for Cursor's AGENT REVIEW to complete:
- Checks for BugBot comments in the GitHub PR
- Polls every 10 seconds
- Maximum wait time: 5 minutes
- If no PR exists, continues without waiting

### 4. Bug Detection

The script checks for bugs in two ways:
1. **BugBot comments** - Specifically looks for `cursor[bot]` comments containing "### Bug:"
2. **Review comments** - Checks for any review comments on the PR

### 5. Auto-fix Loop

If bugs are detected:
1. Script pauses and shows bug summaries
2. You fix the bugs manually
3. Press Enter to continue
4. Script re-runs all pre-commit checks
5. Commits the fixes
6. Waits for AGENT REVIEW again
7. Repeats until no bugs found (max 5 iterations)

### 6. Push

Once all checks pass and no bugs are found:
- Changes are pushed to the remote branch
- PR is automatically created/updated (if using `git-push-with-pr.sh`)

## Configuration

### Environment Variables

- `SKIP_E2E_SMOKE_CHECK=1` - Skip E2E smoke tests
- `SKIP_PRE_PUSH_CHECKS=1` - Skip all pre-commit checks (not recommended)

### Script Configuration

Edit `scripts/commit-with-review.sh` to adjust:
- `MAX_REVIEW_WAIT_TIME` - Maximum time to wait for AGENT REVIEW (default: 300s)
- `REVIEW_CHECK_INTERVAL` - How often to check for bugs (default: 10s)
- `MAX_BUG_FIX_ITERATIONS` - Maximum bug fix cycles (default: 5)

## Integration with Cursor AGENT REVIEW

### How It Works

1. **Local AGENT REVIEW**: After you commit, Cursor IDE automatically runs AGENT REVIEW on your changes
2. **GitHub BugBot**: If bugs are found, Cursor's BugBot adds review comments to your PR
3. **Automated Detection**: The script polls the PR for BugBot comments
4. **Feedback Loop**: When bugs are found, you fix them and the cycle repeats

### Best Practices

1. **Wait for AGENT REVIEW**: After committing, wait a few seconds for AGENT REVIEW to start
2. **Review Bug Comments**: Read BugBot comments carefully - they often include specific file locations
3. **Fix Systematically**: Address bugs one at a time, then re-run the workflow
4. **Verify Fixes**: The script automatically re-runs all checks after fixes

## Troubleshooting

### AGENT REVIEW Not Detected

- **No PR exists**: Create a PR first, then the script can check for bugs
- **Timeout**: Increase `MAX_REVIEW_WAIT_TIME` if AGENT REVIEW takes longer
- **Manual check**: Run `gh pr view <pr-number>` to see review comments manually

### Bugs Not Detected

- **Check PR manually**: Visit the PR on GitHub to see BugBot comments
- **Verify GitHub CLI**: Ensure `gh auth status` shows you're authenticated
- **Check script**: Run `./scripts/check-pr-bugs.sh <pr-number>` manually

### Pre-commit Checks Fail

- **Fix lint errors**: Run `npm run lint` to see specific issues
- **Fix type errors**: Run `npx tsc --noEmit` to see type errors
- **Fix test failures**: Run `npm run test:unit` to see test failures
- **Skip temporarily**: Use environment variables to skip specific checks (not recommended)

## Example Workflow

```bash
# 1. Make your changes
vim app/components/NewFeature.tsx

# 2. Run the automated workflow
npm run commit:review "feat: add new feature component"

# 3. Script runs pre-commit checks
# ✅ Lint passed
# ✅ Type check passed
# ✅ Unit tests passed

# 4. Script commits changes
# ✅ Changes committed

# 5. Script waits for AGENT REVIEW
# ⏳ Waiting for AGENT REVIEW...
# ⏳ Still waiting... (30s elapsed)

# 6. Bugs detected!
# ❌ Found 2 bug(s) in PR review
# Bug summaries:
#   - Text input validation missing whitespace trimming
#   - Review button shows on wrong step

# 7. Fix bugs manually, then press Enter
# [You fix the bugs...]
# Press Enter after you've fixed the bugs...

# 8. Script re-runs checks and commits fixes
# ✅ All pre-commit checks passed
# ✅ Changes committed

# 9. Script waits for AGENT REVIEW again
# ⏳ Waiting for AGENT REVIEW...

# 10. No bugs found!
# ✅ No bugs found in PR review
# ✅ All checks passed! Ready to push.

# 11. Script pushes changes
# ✅ Changes pushed successfully
# ✅ Workflow completed successfully!
```

## Related Scripts

- `scripts/check-pr-bugs.sh` - Helper script to count BugBot comments
- `scripts/git-push-with-pr.sh` - Handles push and PR creation
- `scripts/git-hooks/pre-push` - Pre-push verification hooks

