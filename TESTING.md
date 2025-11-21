# Testing Guide - FounderFinder

This guide covers the automated testing strategy for FounderFinder, including unit tests, integration tests, and end-to-end (E2E) tests.

## Testing Strategy Overview

FounderFinder uses a three-tier testing approach:

1. **Unit Tests** - Test individual functions and modules in isolation
2. **Integration Tests** - Test API routes, database interactions, and service integrations
3. **E2E Tests** - Test complete user flows in a real browser environment

All tests run automatically in CI/CD on every push and pull request.

## Quick Start

```bash
# Run all unit tests
npm run test:unit

# Run all integration tests
npm run test:integration

# Run E2E smoke tests (builds app, starts server, runs tests)
npm run test:e2e:smoke

# Run all E2E tests (requires server running)
npm run test:e2e

# Run E2E tests with UI (interactive debugging)
npm run test:e2e:ui
```

## Test Organization

```
tests/
├── unit/              # Unit tests for lib/ functions
│   ├── lib/           # Tests for core library functions
│   └── *.test.ts      # Other unit tests
├── integration/       # Integration tests
│   ├── api/           # API route tests
│   ├── auth/          # Authentication tests
│   ├── flows/         # End-to-end flow tests
│   └── db-helpers.test.ts
└── e2e/               # Playwright E2E tests
    ├── auth/          # Authentication flows
    ├── matches/       # Match viewing
    ├── onboarding-flow.spec.ts
    └── smoke.spec.ts  # Quick smoke test
```

## Unit Tests

Unit tests verify individual functions and modules in isolation, using mocks for external dependencies.

### What's Tested

- **`lib/match.ts`** - Match scoring and ordering logic
- **`lib/embeddings.ts`** - Embedding generation and persistence
- **`lib/ai.ts`** - AI summary and rationale generation
- **`lib/rateLimit.ts`** - Rate limiting with fallbacks
- **`lib/env.ts`** - Environment variable validation

### Running Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run specific test file
npm run test:unit -- tests/unit/lib/match.test.ts

# Run in watch mode
npm run test -- tests/unit
```

### Writing Unit Tests

Unit tests use Vitest with jsdom environment. Example:

```typescript
import { describe, it, expect, vi, afterEach } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("MyFunction", () => {
  it("should do something", () => {
    // Test implementation
  });
});
```

**Best Practices:**
- Mock external dependencies (OpenAI, Prisma, etc.)
- Use `vi.stubEnv()` instead of `delete process.env` for environment variables
- Reset modules and mocks in `afterEach` to prevent test pollution
- Keep tests focused on a single behavior

## Integration Tests

Integration tests verify API routes, database interactions, and service integrations using real database connections.

### What's Tested

- **API Routes:**
  - `/api/interview/submit` - CEO/CTO interview submission
  - `/api/match/preview` - Match preview with enrichment
  - `/api/user/role` - User role updates
- **Authentication:** NextAuth callbacks (signIn, session)
- **Flows:** End-to-end onboarding-to-match flow
- **Database:** Prisma helpers and schema isolation
- **Matching:** `findMatchesFor` with cosine similarity

### Running Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific test file
npm run test:integration -- tests/integration/api-match-preview.test.ts
```

### Database Setup

Integration tests use isolated Prisma schemas to prevent test interference:

```typescript
import { setupTestDatabase, teardownTestDatabase, getTestPrismaClient } from "@/tests/helpers/db";

beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await teardownTestDatabase();
});
```

**Configuration:**
- Set `TEST_DATABASE_URL` in your environment (or it falls back to `DATABASE_URL`)
- Use the **direct Neon endpoint** (without `-pooler` suffix) for `TEST_DATABASE_URL`
- Tests automatically create and drop isolated schemas

### Writing Integration Tests

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupTestDatabase, teardownTestDatabase, getTestPrismaClient } from "@/tests/helpers/db";

describe("API Route", () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it("should handle requests", async () => {
    const prisma = getTestPrismaClient();
    // Test implementation with real database
  });
});
```

**Best Practices:**
- Use `prisma.$transaction` for batching database operations
- Mock external services (OpenAI, Resend) but use real database
- Clean up test data in `afterAll` or use `resetDatabase()`
- Set explicit timeouts for slower operations

## End-to-End (E2E) Tests

E2E tests verify complete user flows in a real browser using Playwright.

### What's Tested

- **Authentication:** Magic link signup and signin flows
- **Onboarding:** CEO and CTO onboarding journeys
- **Matches:** Enriched match display for onboarded users
- **Smoke:** Landing page verification

### Running E2E Tests

```bash
# Run smoke tests (builds app, starts server, runs tests)
npm run test:e2e:smoke

# Run all E2E tests (requires server running)
npm run test:e2e

# Run with UI for debugging
npm run test:e2e:ui

# Skip build step (if already built)
npm run test:e2e:smoke:nobuild
```

### Server Setup

E2E tests require a running Next.js server:

```bash
# Option 1: Use smoke script (recommended)
npm run test:e2e:smoke

# Option 2: Manual setup
npm run build
npm run start -- --hostname 127.0.0.1 --port 3310
# In another terminal:
npm run test:e2e
```

### Environment Variables

E2E tests use these environment variables:

- `PLAYWRIGHT_BASE_URL` - Base URL for tests (default: `http://127.0.0.1:3310`)
- `NEXTAUTH_URL` - Must match `PLAYWRIGHT_BASE_URL`
- `DATABASE_URL` or `TEST_DATABASE_URL` - Database connection

### Writing E2E Tests

```typescript
import { test, expect } from "@playwright/test";
import { resetPrismaForE2E } from "@/tests/e2e/support/prisma";
import { normalizeMagicLink } from "@/tests/e2e/support/url";

test.beforeEach(async () => {
  await resetPrismaForE2E();
});

test("should complete user flow", async ({ page }) => {
  await page.goto("/");
  // Test implementation
});
```

**Best Practices:**
- Reset database state in `beforeEach` using `resetPrismaForE2E()`
- Use `normalizeMagicLink()` for magic link URLs to handle host mismatches
- Wait for elements with `expect(locator).toBeVisible()` instead of fixed timeouts
- Use Playwright's built-in waiting mechanisms (`waitForURL`, etc.)

### Debugging E2E Tests

```bash
# Run with UI
npm run test:e2e:ui

# View test artifacts
npx playwright show-report

# View trace for failed test
npx playwright show-trace tmp/playwright-output/path-to-trace.zip
```

Artifacts (videos, screenshots, traces) are saved to `tmp/playwright-output/`.

## CI/CD Testing

All tests run automatically in GitHub Actions on every push and pull request.

### CI Pipeline

The CI workflow (`.github/workflows/ci.yml`) runs:

1. **Lint** - ESLint checks
2. **Type Check** - TypeScript compilation
3. **Unit Tests** - All unit tests
4. **Integration Tests** - All integration tests
5. **E2E Smoke Tests** - Critical E2E flows

### Pre-push Hooks

Git pre-push hooks enforce quality gates before pushing:

- Branch naming conventions
- Commit message format
- Branch freshness (must be up-to-date with `main`)
- Local verification (lint, type check, unit tests, E2E smoke)

To skip pre-push checks temporarily:

```bash
SKIP_E2E_SMOKE_CHECK=1 git push
```

**Note:** Skipping checks is not recommended and should only be used for emergency fixes.

## Test Coverage

Coverage reports are generated automatically:

```bash
# Run tests with coverage
npm run test:unit -- --coverage

# View HTML report
open coverage/index.html
```

Coverage thresholds are enforced:
- **Statements:** 80%
- **Branches:** 75%
- **Functions:** 80%
- **Lines:** 80%

## Manual Testing

For manual testing workflows, see the sections below.

### Testing Authentication Flow

#### Option 1: Browser Sign Out (Recommended)

1. **Sign Out:**
   - Go to: http://localhost:3000/auth/signout
   - This will clear your session and redirect you to the home page

2. **Clear Browser Data (Optional but recommended):**
   - Open Developer Tools (F12 or Cmd+Option+I)
   - Go to Application tab (Chrome) or Storage tab (Firefox)
   - Clear cookies for `localhost:3000`
   - Or use Incognito/Private mode for a completely fresh test

#### Option 2: Use a Different Email

Simply use a different email address when requesting a magic link. This will create a new user account.

#### Option 3: Clear Database (For Complete Reset)

If you want to completely reset your test data:

```bash
# Connect to your Neon database and delete test users
# Or use Prisma Studio to manually delete users
npx prisma studio
```

### Complete Manual Testing Flow

1. **Start Fresh**
   - Clear browser cookies or use Incognito mode
   - Or visit: http://localhost:3000/auth/signout

2. **Sign In**
   - Go to: http://localhost:3000
   - Click "Get started"
   - Enter your email address
   - Click "Send magic link"

3. **Check Email**
   - Check your email inbox (and spam folder)
   - Click the "Sign in" link in the email

4. **Expected Flow**
   - ✅ Magic link should redirect to `/onboarding/role`
   - ✅ You should see the role selection page (CEO or CTO)
   - ✅ After selecting a role, you should be redirected to the appropriate onboarding flow

5. **Verify Authentication**
   - You should be redirected automatically based on your auth status
   - Check terminal logs for authentication events
   - Check browser console for any errors

### Debugging Tips

#### Check Terminal Logs

Look for these log messages:
- `📧 Attempting to send email:` - Email sending started
- `✅ Email sent successfully!` - Email sent
- `🔐 signIn callback triggered:` - User signing in
- `🔀 Redirect callback:` - Redirect happening

#### Check Database

```bash
# View your database in Prisma Studio
npx prisma studio
```

Check these tables:
- `User` - Should have your user record
- `VerificationToken` - Should have recent tokens (they get deleted after use)
- `Session` - Should have your active session

### Common Issues

1. **Magic link redirects to sign-in page:**
   - Check terminal logs for errors
   - Verify `NEXTAUTH_SECRET` is set
   - Check if token expired (24 hours max)

2. **Email not arriving:**
   - Check spam folder
   - Verify Resend API key is correct
   - Check Resend dashboard for delivery status

3. **Infinite redirect loop:**
   - Clear all cookies
   - Check browser console for errors
   - Verify `NEXTAUTH_URL` is set correctly

## Quick Reference

```bash
# Testing
npm run test:unit              # Run unit tests
npm run test:integration       # Run integration tests
npm run test:e2e:smoke         # Run E2E smoke tests
npm run test:e2e               # Run all E2E tests
npm run test:e2e:ui            # Run E2E tests with UI

# Development
npm run dev                     # Start dev server
npm run build                   # Build for production
npm run start                   # Start production server

# Database
npx prisma studio               # Open Prisma Studio
npx prisma migrate dev          # Run migrations
npx prisma generate             # Generate Prisma client

# Utilities
npm run verify:neon             # Check database connection
npm run test:email <email>      # Send test email
npm run verify:email <id>       # Verify email was sent
```

## Best Practices

1. **Write tests first** - Follow TDD when possible
2. **Keep tests isolated** - Each test should be independent
3. **Use descriptive names** - Test names should describe what they test
4. **Mock external services** - Don't make real API calls in unit tests
5. **Clean up** - Reset state between tests
6. **Run tests locally** - Before pushing, run the full test suite
7. **Fix flaky tests** - Don't ignore intermittent failures
8. **Maintain coverage** - Keep coverage above thresholds

## Troubleshooting

### Tests failing in CI but passing locally

- Check environment variables are set correctly
- Verify database migrations are applied
- Ensure all dependencies are installed (`npm ci`)

### E2E tests timing out

- Check server is running and accessible
- Verify `PLAYWRIGHT_BASE_URL` matches server URL
- Increase timeout if needed (but prefer fixing the root cause)

### Integration tests failing

- Verify `TEST_DATABASE_URL` is set correctly
- Check database has pgvector extension installed
- Ensure test database has schema creation permissions

### Coverage below thresholds

- Add tests for uncovered code paths
- Review coverage report to identify gaps
- Consider if uncovered code is actually needed
