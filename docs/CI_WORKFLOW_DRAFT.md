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

### 3. Required Secrets

- `TEST_DATABASE_URL`  
  Connection string to the dedicated Neon test branch (or local Postgres). Used by integration tests and Prisma during CI.
  - Prefer the **direct Neon endpoint (without `-pooler`)** so Prisma’s schema sync can run DDL statements. Your application runtime can still use the pooled host for `DATABASE_URL`.

- `DATABASE_URL` (optional if `TEST_DATABASE_URL` covers all tests)  
  Some scripts default to `DATABASE_URL`; set it to the same test DB to be safe.

- `NEXTAUTH_SECRET`  
  Needed if authentication-related code executes during integration tests or future e2e runs. Use a randomly generated value (e.g., `openssl rand -base64 32`).

- `RESEND_API_KEY` (optional)  
  Only required when tests invoke email flows. If omitted, ensure email-sending code is mocked.

- `OPENAI_API_KEY` (optional)  
  Needed if tests exercise OpenAI-dependent logic. Prefer mocking to avoid external calls; otherwise supply a restricted key.

- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (optional)  
  Required only if rate limiter is active during tests.

### 4. Environment Variables (non-secret)
- `NODE_ENV: test`
- `CI: true`


