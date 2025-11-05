# Contributing to FounderFinder

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see README.md)
4. Run database migrations: `npx prisma migrate dev`
5. Start development server: `npm run dev`

## Git Workflow

### Branch Naming
- `feature/your-feature-name` - New features
- `fix/your-bug-fix` - Bug fixes
- `docs/your-docs-update` - Documentation updates
- `refactor/your-refactor` - Code refactoring

### Commit Messages
Follow conventional commits format:
- `feat: add CEO onboarding form`
- `fix: resolve authentication session issue`
- `docs: update README with setup instructions`
- `refactor: simplify matching algorithm`

### Pull Request Process
1. Create a branch from `main` or `develop`
2. Make your changes
3. Ensure all tests pass and linting is clean
4. Create a pull request with a clear description
5. Address any review feedback

## Code Style

- Use TypeScript for all new code
- Follow ESLint rules
- Use Prettier for formatting (if configured)
- Write self-documenting code with clear variable names
- Add comments for complex logic

## Testing

Before submitting a PR:
- Run `npm run lint`
- Run `npx tsc --noEmit` to check types
- Test manually in development environment

