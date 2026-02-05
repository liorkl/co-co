# Contributing to FounderFinder

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. **Set up git hooks** (recommended):
   ```bash
   npm run setup:hooks
   ```
   This installs pre-push hooks that automatically generate PR descriptions before pushing.
4. Set up environment variables (see README.md)
5. Run database migrations: `npx prisma migrate dev`
6. Start development server: `npm run dev`

## Git Workflow

### Branch Naming
Branches must tell a short story: **what is changing, for which surface, and why it matters.**

**Format:** `<type>/<area>-<action>-<context>-<outcome>`

**Examples:**
- `feat/matching-expand-skill-filters-to-unblock-discovery`
- `fix/auth-magic-link-copy-to-raise-activation-rate`
- `chore/devops-strengthen-prepush-guardrails-for-naming`
- `ci/playwright-seed-onboarding-data-to-keep-ci-green`

**Branch guardrails (enforced by git hooks):**
- Prefix with one of `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`, `test/`, `ci/`, or `infra/`
- Provide **at least four** hyphen-separated tokens describing area, action, context, and desired outcome
- Minimum length: 24 characters
- Avoid vague words like `update`, `misc`, `stuff`, `wip`
- If you genuinely need a shorter or experimental branch, set `SKIP_BRANCH_NAME_CHECK=1` when pushing (not recommended)

### Single-Purpose Branches
**Each branch should focus on a single task or goal.** Mixing different tasks in one branch makes it difficult to understand the purpose (the "what" and "why") and complicates code review, debugging, and rollback.

**When to create separate branches:**
- Different features or fixes
- Different types of changes (e.g., code changes vs. documentation)
- Changes that serve different purposes or solve different problems
- When the branch name would need "and" to describe multiple unrelated changes

**Examples:**
- ❌ **Bad:** `fix/auth-and-ci-workflow` - Two unrelated fixes
- ✅ **Good:** `fix/auth-session-expiry` and `fix/ci-workflow-prisma-before-tsc` - Separate branches

- ❌ **Bad:** `feat/user-profile-and-email-notifications` - Two different objectives
- ✅ **Good:** `feat/user-profile-editing-flow` and `feat/email-notification-settings` - Separate branches

**If you're unsure whether changes belong in separate branches, ask before committing.** It's better to clarify upfront than to split branches later.

### Commit Messages
Commit summaries must encode both **what changed** and **why it was necessary**. The pre-push hook blocks commits that are too short or that omit keywords signalling intent (`because`, `so that`, or `to ...`). We still follow Conventional Commits for the beginning of the line.

**Format:** `<type>(optional-scope): <what> because|so that|to <why>`

**Examples:**
- `feat(onboarding): add CEO flow because activation stalled on missing prompts`
- `fix(auth): harden magic link hashing so that reuse attacks fail`
- `ci(playwright): seed onboarding fixtures to keep smoke suite determinisitic`
- `chore(devops): extend branch guardrails to reinforce descriptive naming`

**Best Practices (guardrails enforce the first two):**
- Minimum 50 characters in the summary line
- Include an explicit why using `because`, `so that`, or `to ...`
- Use present tense ("add" not "added")
- Keep the first line under ~90 characters where possible; add details in the body
- Reference issues when applicable: `fix(auth): ... because ... (#123)`

> Tip: Hooks auto-prefill the subject from the branch name. Edit the trailing explanation instead of rewriting from scratch.

### Pre-Push Checklist
**Always run CI locally before pushing.** There's no value in pushing code that will fail CI checks.

**Required steps before every push:**

**Option 1: Use the convenience script (recommended)**
```bash
# Full CI check (includes npm ci - use when dependencies changed)
npm run ci:local

# Quick CI check (skips npm ci - use for faster iteration)
npm run ci:verify
```

**Option 2: Run steps manually**
```bash
# 1. Install dependencies (if package.json changed)
npm ci

# 2. Generate Prisma Client (if schema changed)
DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public" npx prisma generate

# 3. Run linting
npm run lint

# 4. Run type checking
npx tsc --noEmit
```

### Pull Request Process
1. Create a branch from `main` or `develop`
2. Make your changes
3. **Run CI locally** (see Pre-Push Checklist above)
4. Ensure all tests pass and linting is clean
5. **Push and create PR** (fully automated):
   ```bash
   npm run push
   ```
   This will:
   - Auto-generate PR description
   - Push your branch
   - Automatically create PR with the description (if GitHub CLI is installed)
6. **Double-check the PR title** – it should mirror the branch naming guideline and explicitly mention both the change and the motivation (`... so that ...` / `... because ...`). Edit it in GitHub if the automation uses an older commit subject.
   
   **Alternative:** Use regular `git push`, then:
   ```bash
   npm run pr:create
   ```
   This will push and create PR in one command.
   
   **Using Cursor's "Create PR" button:**
   ```bash
   # Before clicking "Create PR" in Cursor:
   npm run pr:cursor
   ```
   This ensures the description is ready and opens it for easy copy-paste.
   
   **Note:** The pre-push hook automatically generates the description when you push,
   so it's usually already ready. The `pr:cursor` command just ensures it's up-to-date
   and opens it for convenience.
   
   **Manual option:** If you prefer full manual control:
   ```bash
   npm run pr:description  # Generate description
   git push                # Push branch
   # Then create PR in Cursor/GitHub and copy description from PR_DESCRIPTION.md
   ```
6. Address any review feedback

### Pre-push Guardrails
- Direct pushes to `main` or `develop` are blocked by default. Create a feature branch and open a PR instead.
- Every push automatically runs `npm run lint`, `npx tsc --noEmit`, and `npm run test:unit` (if defined). Fix failures before reattempting.
- The hook now also executes the Playwright smoke harness via `npm run test:e2e:smoke`, which builds the app, boots a production server on `127.0.0.1:3310`, and verifies the landing page. Override once with `SKIP_E2E_SMOKE_CHECK=1` if you're in an emergency where the smoke test is temporarily unstable (not recommended).
- The hook fetches `origin/main` and blocks the push if your branch is missing the latest commits. Rebase/merge first, or set `SKIP_MAIN_SYNC_CHECK=1` to override once (not recommended).
- Branch names must follow `<type>/<area>-<action>-<context>-<outcome>` and be at least 24 characters (e.g. `fix/auth-magic-link-copy-to-raise-activation-rate`). Override once with `SKIP_BRANCH_NAME_CHECK=1` if you really must (not recommended).
- The latest commit summary must include a reason clause (`because`, `so that`, or `to ...`) and be at least 50 characters. Override once with `SKIP_COMMIT_MESSAGE_CHECK=1` (not recommended).
- To skip the other checks once, set `SKIP_PRE_PUSH_CHECKS=1`. To push to a protected branch, set `ALLOW_PROTECTED_BRANCH_PUSH=1`.
- Hooks install automatically via `npm install`. Reinstall manually with `npm run setup:hooks`.

### Multi-Agent / Parallel Workflow
When several developers or Cursor agents work simultaneously, follow this branch discipline to avoid conflicts:

1. **Always sync `main` first**
   ```bash
   git checkout main
   git pull --ff-only
   ```
   Or use the helper to refresh & create a branch in one step:
   ```bash
   npm run branch:new -- feat/matching-short-description-update
   ```
2. **Create or resume a feature branch per task**
   ```bash
   git checkout -b feat/matching-short-description-update   # new branch
   # or git checkout feat/matching-short-description-update # existing branch
   ```
3. **Keep work isolated**
   - Commit only the files relevant to that task.
   - Stash or commit WIP changes before switching branches (`git stash push -m "context"`).
4. **Run local verification on every update**
   - `npm run test:unit`
   - `npm run lint`
   - `npx tsc --noEmit`
   - Any integration/E2E suites that apply to the change.
5. **Push and create/update the PR**
   ```bash
   git push origin feat/matching-short-description-update
   npm run pr:description   # regenerates summary + checks
   ```
6. **After merge, clean up**
   ```bash
   git checkout main
   git pull --ff-only
   git branch -d feat/matching-short-description-update
   git push origin --delete feat/matching-short-description-update
   ```

> Tip: Enable branch protection on `main` (required reviews, passing checks, up-to-date merges) and rely on the pre-push guardrails above so every branch stays healthy before landing.

### Commit Message & PR Title Helpers
- New commits automatically pre-fill their message from the branch name (thanks to a `prepare-commit-msg` hook). Edit it as needed, but don’t leave generic subjects.
- Auto PR creation (`npm run push` / `npm run pr:create`) formats PR titles from the branch name if no conventional-commit-style subject is found.
- Clear branch names produce clear commit and PR titles—use the branch naming convention above.

### Keeping Main Branch Green
**The `main` branch must always be green (all CI checks passing).**

**Before merging to main:**
1. **Update your branch with latest main:**
   ```bash
   git checkout main
   git pull origin main
   git checkout your-branch
   git rebase main  # or git merge main
   ```

2. **Run CI locally after rebase/merge:**
   ```bash
   # Use the convenience script
   npm run ci:local
   
   # Or run manually:
   npm ci
   DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public" npx prisma generate
   npm run lint
   npx tsc --noEmit
   ```

3. **Fix any conflicts or issues** before pushing

4. **Push and verify CI passes** on GitHub Actions

**Note:** GitHub Actions automatically runs CI on pull requests, but running locally first saves time and prevents broken builds. Consider adding a pre-merge CI check in GitHub Actions that runs the full test suite against the merged result (GitHub's "Require branches to be up to date before merging" setting helps ensure this).

## Code Style

- Use TypeScript for all new code
- Follow ESLint rules
- Use Prettier for formatting (if configured)
- Write self-documenting code with clear variable names
- Add comments for complex logic

## Security Standards

Security is a first-class concern. Follow these standards for all code changes:

### API Endpoints
- **Always validate input with Zod** - Never trust user input. Use Zod schemas to validate all request bodies, query params, and route params.
- **Validate early, fail fast** - Validation should happen at the start of the handler, before any business logic.
- **Return generic error messages** - Don't leak internal details. Use `{ error: "Invalid request" }` not `{ error: "SQL syntax error at line 42" }`.

### Authentication & Secrets
- **Never log sensitive data** - No API keys, tokens, secrets, passwords, or magic links in logs. Even partial values (prefixes) can aid attacks.
- **Fail loudly on missing secrets in production** - Use explicit checks that throw errors, not silent fallbacks.
- **Guard test/dev endpoints** - Any endpoint that bypasses normal auth MUST check `NODE_ENV === "development" || NODE_ENV === "test"` and return 403 otherwise.

### Logging
- **Log what happened, not sensitive details** - Good: `"Email sent successfully"`. Bad: `"Email sent to user@example.com with token abc123"`.
- **Use boolean flags for presence checks** - Log `hasApiKey: !!process.env.API_KEY` not the key itself.

### Environment Variables
- **Never commit `.env` files** - Only `.env.example` with placeholder values.
- **Validate env vars at startup** - Use Zod or similar to validate required env vars exist before the app starts.

### Lessons Learned
When security issues are discovered and fixed, document them here to prevent recurrence:

1. **2026-01-21: Sensitive data in logs** - Auth config was logging API key prefixes and magic link URLs. Fixed by removing sensitive fields from log statements.
2. **2026-01-21: Weak secret fallback** - NEXTAUTH_SECRET had a hardcoded fallback that would work in production. Fixed by throwing error if not set in production.
3. **2026-01-21: Missing input validation** - API endpoints accepted unvalidated JSON. Fixed by adding Zod schemas to all mutation endpoints.
4. **2026-01-21: Unguarded test endpoint** - `/api/test/signin` had no production check. Fixed by adding explicit NODE_ENV guard.
5. **2026-01-21: Secret in documentation** - NEXTAUTH_SECRET value was committed in SETUP_ENV.md as an "example". Never put real or example secrets in committed files - always use obvious placeholders like `<generate-your-own>`. Secret was rotated and docs updated.

## GitHub Automation

### Automated PR Creation

The project includes automated PR creation that:
- Auto-generates PR descriptions from commits
- Auto-labels PRs based on branch type (`feat/` → `enhancement`, `fix/` → `bug`, etc.)
- Opens PRs in browser after creation
- Supports auto-reviewer assignment (via `GITHUB_AUTO_REVIEWER` env var)

**Usage:**
```bash
# Push and auto-create PR
npm run push

# Or manually create PR
npm run pr:create
```

### GitHub API Helper

Advanced GitHub operations via `github-api-helper.sh`:

```bash
# List all repository labels
npm run github:labels

# Setup standard labels (bug, enhancement, documentation, etc.)
npm run github:setup-labels

# Get detailed PR information
npm run github:pr-details

# Add labels to current PR
./scripts/github-api-helper.sh add-labels bug high-priority

# Add reviewers to current PR
./scripts/github-api-helper.sh add-reviewers username
```

### GitHub MCP Server (Optional)

For AI-driven GitHub operations, set up the GitHub MCP server:

1. See `docs/GITHUB_MCP_SETUP.md` for detailed setup instructions
2. Enables natural language GitHub commands in Cursor
3. Complements existing GitHub CLI automation

**Quick Setup:**
```bash
# Automated setup (uses remote GitHub-hosted server, no Docker needed)
npm run github:mcp:setup

# Or see docs/GITHUB_MCP_SETUP.md for manual setup
```

## Testing

Before submitting a PR:
- **Run all CI checks locally** (see Pre-Push Checklist above)
- Run `npm run lint`
- Run `npx tsc --noEmit` to check types
- Test manually in development environment
- Ensure your branch is up to date with `main` and CI passes after merge

