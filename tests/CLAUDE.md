# Tests

## Runners

- **Unit & integration:** Vitest (`tests/unit/`, `tests/integration/`)
- **E2E:** Playwright (`tests/e2e/`)
- Setup file: `tests/setupTests.ts` (imports `@testing-library/jest-dom/vitest`)

## Commands

```bash
npm run test:unit        # Vitest unit tests
npm run test:integration # Vitest integration tests
npm run test:e2e         # Playwright (requires running server)
npm run test:e2e:smoke   # Full smoke: build → start server → run tests

# Run a single file
npx vitest run tests/unit/lib/match.test.ts
```

## Directory Layout

```
tests/
  unit/lib/        # Pure function tests (ai, embeddings, match, rateLimit, env)
  integration/     # API route + DB tests (require DATABASE_URL)
  integration/auth/
  integration/flows/
  e2e/             # Playwright browser tests
  e2e/support/
  helpers/
    db.ts          # DB test helpers (seeding, cleanup)
    ai.test.ts     # AI mock helpers
```

## Mocks & Test Environment

- `MOCK_OPENAI=true` — use mock AI responses (avoids real API quota)
- `NEXT_PUBLIC_SHOW_DEV_LOGIN=true` — show dev quick-login panel
- `ALLOW_TEST_AUTH=true` — enable test auth endpoints in CI
- DB helpers live in `tests/helpers/db.ts`

## Coverage Thresholds

85% statements / functions / lines, 71% branches. Tests fail below these.

## Conventions

- Unit tests import from `lib/` directly — never from `app/`
- Integration tests use `tests/helpers/db.ts` for seeding and cleanup
- E2E tests target `localhost:3000` (dev) or `localhost:3310` (smoke build)
- Don't mock Prisma in integration tests — use the real DB with test data
