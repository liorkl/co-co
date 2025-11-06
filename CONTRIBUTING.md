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
   
   **Manual option:** If you prefer manual control:
   ```bash
   npm run pr:description  # Generate description
   git push                # Push branch
   # Then create PR in Cursor/GitHub and copy description
   ```
6. Address any review feedback

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

## Testing

Before submitting a PR:
- **Run all CI checks locally** (see Pre-Push Checklist above)
- Run `npm run lint`
- Run `npx tsc --noEmit` to check types
- Test manually in development environment
- Ensure your branch is up to date with `main` and CI passes after merge

