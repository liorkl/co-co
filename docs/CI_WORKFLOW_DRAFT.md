## CI Workflow Outline

### 1. Trigger
- `push` to `main`
- `pull_request` targeting `main`

### 2. Jobs

#### job: `build-and-test`
- **Runs-on:** `ubuntu-latest`
- **Environment setup:**
  - `actions/checkout@v4`
  - `actions/setup-node@v4` with `node-version: 20`
  - Cache `~/.npm` using `actions/cache@v4`
- **Steps:**
  1. `npm ci`
  2. `npx prisma generate`
  3. `npm run lint`
  4. `npx tsc --noEmit`
  5. `npm run test:unit`
  6. `npm run test:integration`
  7. `npx playwright install --with-deps`
  8. `npm run build`
  9. `npm run test:e2e:smoke:nobuild` (reuses the freshly built bundle, starts the server on `127.0.0.1:3310`, waits for readiness, runs Playwright, and tears down automatically)

#### Future Enhancements
- Consider introducing a build matrix (e.g., Node versions or operating systems) and gating the Playwright smoke step so it executes only on the primary environment. This keeps coverage while controlling runtime.

### 3. Required Secrets

- `TEST_DATABASE_URL`  
  Connection string to the dedicated Neon test branch (or local Postgres). Used by integration tests and Prisma during CI. Falls back to `DATABASE_URL`, which itself falls back to a dummy local connection if no secrets are configured.
  - Prefer the **direct Neon endpoint (without `-pooler`)** so Prisma’s schema sync can run DDL statements. Your application runtime can still use the pooled host for `DATABASE_URL`.

- `DATABASE_URL` (optional if `TEST_DATABASE_URL` covers all tests)  
  Some scripts default to `DATABASE_URL`; set it to the same test DB to be safe.

- `NEXTAUTH_SECRET` / `AUTH_SECRET`  
  Currently defaulted to `local-ci-secret` when unset so the smoke test can run without storing secrets in GitHub. Still supply a real secret (e.g., `openssl rand -base64 32`) in production or when mirroring deployed behaviour.

- `RESEND_API_KEY` (optional)  
  Only required when tests invoke email flows. If omitted, ensure email-sending code is mocked.

- `OPENAI_API_KEY` (optional)  
  Needed if tests exercise OpenAI-dependent logic. Prefer mocking to avoid external calls; otherwise supply a restricted key.

- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (optional)  
  Required only if rate limiter is active during tests.

### 4. Environment Variables (non-secret)
- `NODE_ENV: test`
- `CI: true`


