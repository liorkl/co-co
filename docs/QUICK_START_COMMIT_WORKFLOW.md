# Quick Start: Automated Commit & Review Workflow

## TL;DR

```bash
# Make your changes, then:
npm run commit:review "your commit message"

# The script will:
# 1. ✅ Run all checks (lint, types, tests)
# 2. 📝 Commit your changes
# 3. ⏳ Wait for AGENT REVIEW
# 4. 🐛 Check for bugs
# 5. 🔄 If bugs found: fix → verify → commit → repeat
# 6. 🚀 Push when clean
```

## What It Does

### Before Commit
- Runs lint check
- Runs type check  
- Runs unit tests
- Runs integration tests (if available)
- Runs E2E smoke tests (optional)

### After Commit
- Waits for Cursor AGENT REVIEW to complete
- Checks GitHub PR for BugBot comments
- If bugs found: prompts you to fix, then re-verifies
- If no bugs: pushes automatically

## Example

```bash
# 1. You make changes
vim app/components/Feature.tsx

# 2. Run the workflow
npm run commit:review "feat: add new feature component"

# Output:
# ℹ️  Running pre-commit verification...
# ✅ Lint check passed
# ✅ Type check passed
# ✅ Unit tests passed
# ✅ Changes committed successfully
# 
# ℹ️  Waiting for AGENT REVIEW...
# ❌ AGENT REVIEW found 2 bug(s)!
# Bug summaries:
#   - Text input validation missing whitespace trimming
#   - Review button shows on wrong step
# 
# [You fix the bugs...]
# Press Enter after you've fixed the bugs...
# 
# ✅ All pre-commit checks passed
# ✅ Changes committed
# ✅ No bugs found in PR review
# ✅ Changes pushed successfully
```

## Configuration

### Skip E2E Tests
```bash
SKIP_E2E_SMOKE_CHECK=1 npm run commit:review "your message"
```

### Manual Control
If you want to commit without the full workflow:
```bash
git add .
git commit -m "your message"
# Then manually check for bugs and push
```

## Troubleshooting

**"No PR found"** - Create a PR first, or the script will continue without bug checking

**"AGENT REVIEW timeout"** - AGENT REVIEW might take longer, check PR manually

**"Bugs not detected"** - Check PR manually: `gh pr view <pr-number>`

## See Also

- Full documentation: `docs/WORKFLOW_AUTOMATION.md`
- Script: `scripts/commit-with-review.sh`
- Bug checker: `scripts/check-pr-bugs.sh`


