# Git & GitHub Setup Guide

## Initial Git Configuration

If you haven't configured git yet, set your identity:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

Or for this repository only:

```bash
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

## Making Your First Commit

1. **Stage all files:**
   ```bash
   git add .
   ```

2. **Make your initial commit:**
   ```bash
   git commit -m "feat: initial project setup"
   ```

## Creating a GitHub Repository

1. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Name it `FounderFinder` (or your preferred name)
   - Choose public or private
   - Do NOT initialize with README, .gitignore, or license (we already have these)

2. **Connect your local repository to GitHub:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/FounderFinder.git
   # Or if using SSH:
   # git remote add origin git@github.com:YOUR_USERNAME/FounderFinder.git
   ```

3. **Push your code:**
   ```bash
   git branch -M main
   git push -u origin main
   ```

## Branch Strategy

### Recommended Workflow

1. **Main branch** (`main`):
   - Production-ready code
   - Protected branch (in GitHub settings)
   - Only merge via pull requests

2. **Develop branch** (optional):
   ```bash
   git checkout -b develop
   git push -u origin develop
   ```
   - Integration branch for features
   - Merge to `main` when ready for release

3. **Feature branches**:
   ```bash
   git checkout -b feature/your-feature-name
   # Make changes
   git commit -m "feat: your feature description"
   git push -u origin feature/your-feature-name
   ```

## GitHub Repository Settings

### Recommended Settings

1. **Branch Protection Rules** (for `main`):
   - Go to Settings → Branches
   - Add rule for `main`
   - Enable: "Require pull request reviews before merging"
   - Enable: "Require status checks to pass"

2. **Secrets** (for CI/CD):
   - Go to Settings → Secrets and variables → Actions
   - Add secrets for deployment (if needed):
     - `DATABASE_URL`
     - `NEXTAUTH_SECRET`
     - etc.

3. **Webhooks** (optional):
   - Set up webhooks for deployment services (Vercel, etc.)

## Git Best Practices

### Commit Messages
Use conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

### Commit Frequency
- Commit often, push regularly
- Make small, logical commits
- Each commit should be a complete, working change

### Before Committing
- Run `npm run lint` to check for errors
- Run `npx tsc --noEmit` to verify types
- Test your changes locally

## CI/CD

The repository includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that:
- Runs on push to `main` or `develop`
- Runs on pull requests
- Checks linting and TypeScript compilation
- Generates Prisma Client

Enable it by pushing to GitHub - GitHub Actions will run automatically.

## Useful Commands

```bash
# Check status
git status

# View commit history
git log --oneline

# See what files changed
git diff

# Stash changes temporarily
git stash
git stash pop

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Create and switch to new branch
git checkout -b feature/new-feature

# Merge branch
git checkout main
git merge feature/new-feature

# Delete local branch
git branch -d feature/new-feature

# Delete remote branch
git push origin --delete feature/new-feature
```

