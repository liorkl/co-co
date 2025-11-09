# Quick Git Setup

## Step 1: Configure Git (if not already done)

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Step 2: Make Initial Commit

```bash
# Files are already staged, just commit:
git commit -m "feat: initial project setup with Next.js, Prisma, and AI matching"

# Or if you want to review what's staged first:
git status
```

## Step 3: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `FounderFinder` (or your choice)
3. Choose Public or Private
4. **Don't** initialize with README, .gitignore, or license
5. Click "Create repository"

## Step 4: Connect and Push

```bash
# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/FounderFinder.git

# Or if you prefer SSH:
# git remote add origin git@github.com:YOUR_USERNAME/FounderFinder.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## That's it! 🎉

Your code is now on GitHub. The CI workflow will run automatically on future pushes.

For more details:

- `README.md` → “Git & GitHub Workflow”
- `docs/GITHUB_MCP_SETUP.md` for Cursor + MCP tooling

