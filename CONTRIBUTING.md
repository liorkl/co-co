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
Branches should be descriptive, concise, and self-explanatory. Both humans and AI agents should be able to quickly understand what the branch does and why it exists.

**Format:** `<type>/<what>-<why>`

**Examples:**
- `feature/user-profile-editing` - Clear: adds profile editing feature
- `fix/auth-session-expiry` - Clear: fixes session expiration bug
- `fix/ci-workflow-prisma-before-tsc-lint-ts-errors` - Clear: fixes CI workflow order and lint/TS errors
- `refactor/match-algorithm-performance` - Clear: refactors matching for better performance
- `docs/api-endpoints-authentication` - Clear: documents auth endpoints

**Best Practices:**
- Use kebab-case (lowercase with hyphens)
- Include the "what" (the change) and "why" (the reason) when helpful
- Keep it under 50 characters when possible
- Avoid abbreviations unless they're universally understood

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

- ❌ **Bad:** `feature/user-profile-and-email-notifications` - Two different features
- ✅ **Good:** `feature/user-profile-editing` and `feature/email-notifications` - Separate branches

**If you're unsure whether changes belong in separate branches, ask before committing.** It's better to clarify upfront than to split branches later.

### Commit Messages
Commit messages should follow conventional commits format and be descriptive enough that both humans and AI agents can understand the change and its purpose at a glance.

**Format:** `<type>: <what> [optional: why]`

**Examples:**
- `feat: add CEO onboarding form with multi-step validation`
- `fix: resolve authentication session expiry after 24h`
- `fix(ci): generate Prisma Client before TypeScript type check`
- `fix(ci): fix ESLint and TypeScript errors in auth routes`
- `docs: update README with Neon database setup instructions`
- `refactor: optimize matching algorithm for better performance`

**Best Practices:**
- Use present tense ("add" not "added")
- First line should be under 72 characters
- Add detailed explanation in body if needed (separated by blank line)
- Reference issue numbers when applicable: `fix: resolve session bug (#123)`

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

<<<<<<< HEAD
### Pre-push Guardrails
- Direct pushes to `main` or `develop` are blocked by default. Create a feature branch and open a PR instead.
- Every push automatically runs `npm run lint`, `npx tsc --noEmit`, and `npm run test:unit` (if defined). Fix failures before reattempting.
- To override once (not recommended), set `SKIP_PRE_PUSH_CHECKS=1` to skip checks or `ALLOW_PROTECTED_BRANCH_PUSH=1` to push to a protected branch.
- Hooks install automatically via `npm install`. Reinstall manually with `npm run setup:hooks`.

### Multi-Agent / Parallel Workflow
When several developers or Cursor agents work simultaneously, follow this branch discipline to avoid conflicts:

1. **Always sync `main` first**
   ```bash
   git checkout main
   git pull --ff-only
   ```
2. **Create or resume a feature branch per task**
   ```bash
   git checkout -b feature/short-description   # new branch
   # or git checkout feature/short-description # existing branch
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
   git push origin feature/short-description
   npm run pr:description   # regenerates summary + checks
   ```
6. **After merge, clean up**
   ```bash
   git checkout main
   git pull --ff-only
   git branch -d feature/short-description
   git push origin --delete feature/short-description
   ```

> Tip: Enable branch protection on `main` (required reviews, passing checks, up-to-date merges) and rely on the pre-push guardrails above so every branch stays healthy before landing.

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

## GitHub Automation

### Automated PR Creation

The project includes automated PR creation that:
- Auto-generates PR descriptions from commits
- Auto-labels PRs based on branch type (`feature/` → `enhancement`, `fix/` → `bug`, etc.)
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

