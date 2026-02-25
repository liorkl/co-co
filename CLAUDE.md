# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run lint             # ESLint
npx tsc --noEmit         # Type check

# Database
npm run prisma:generate  # Generate Prisma client (run after schema changes)
npm run prisma:migrate   # Run migrations (dev)

# Testing
npm run test:unit        # Unit tests (Vitest)
npm run test:integration # Integration tests
npm run test:e2e         # E2E tests (Playwright, requires running server)
npm run test:e2e:smoke   # Full smoke test (builds, starts server, runs tests)

# Run single test file
npx vitest run tests/unit/lib/match.test.ts

# CI verification (run before pushing)
npm run ci:verify        # Quick: lint + typecheck (skips npm ci)
npm run ci:local         # Full: npm ci + lint + typecheck
```

## Git Workflow

**Never push directly to main.** Always create a feature branch and open a PR.

**Branch naming (enforced by hooks):** `<type>/<area>-<action>-<context>-<outcome>` (min 24 chars)
- Examples: `feat/matching-expand-skill-filters-to-unblock-discovery`, `fix/auth-magic-link-copy-to-raise-activation-rate`
- Types: `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`, `test/`, `ci/`, `infra/`

**Commit messages (enforced):** Must include `because`, `so that`, or `to` explaining why (min 50 chars)
- Example: `feat(onboarding): add CEO flow because activation stalled on missing prompts`

**Push workflow:**
```bash
npm run push             # Runs checks, pushes, creates/updates PR automatically
```

**Pre-push hooks run:** lint, typecheck, unit tests, E2E smoke tests, and sync check with main.

## Architecture

**Full-stack Next.js 14 (App Router)** application for CEO-CTO matching.

### Core Data Flow
1. **Auth**: Email magic links (NextAuth.js + Resend)
2. **Onboarding**: Role selection → role-specific interview questionnaire
3. **Profile Processing**: Interview responses → AI summary (GPT-4o-mini) → vector embedding (text-embedding-3-small)
4. **Matching**: Cosine similarity on embeddings → AI-generated match rationale

### Key Directories
- `app/api/` - API routes (interview submit, match preview, user role, intro requests)
- `lib/` - Core business logic:
  - `ai.ts` - OpenAI summarization & rationale generation
  - `embeddings.ts` - Embedding generation & persistence
  - `match.ts` - Cosine similarity matching algorithm
  - `rateLimit.ts` - Upstash rate limiting
- `prisma/schema.prisma` - Database models (User, Profile, Startup, TechBackground, Embedding, Match, IntroRequest)

### Database
PostgreSQL with **pgvector** extension for vector similarity. Key models:
- `User` with `role` (CEO/CTO) and related `Profile`, `Startup` (CEO), or `TechBackground` (CTO)
- `Embedding` stores vector representations for matching
- `Match` stores pre-computed match scores and AI rationale

### Testing Structure
- `tests/unit/` - Vitest unit tests for lib functions
- `tests/integration/` - API route & DB integration tests
- `tests/e2e/` - Playwright browser tests
- Coverage thresholds: 85% statements/functions/lines, 71% branches

## Environment Variables

Required: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `OPENAI_API_KEY`

Optional: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (rate limiting)

### Testing & Development Variables

- `MOCK_OPENAI=true` - Use mock AI responses instead of real OpenAI API (for testing without API quota)
- `NEXT_PUBLIC_SHOW_DEV_LOGIN=true` - Show dev quick-login panel on signin page (test users only)
- `ALLOW_TEST_AUTH=true` - Allow test auth endpoints in production builds (for CI E2E tests)

## Security Standards

@CONTRIBUTING.md
