#!/bin/sh

# Local Playwright smoke harness (builds Next.js, starts server, runs tests).

set -eu

if [ "${SKIP_E2E_SMOKE_CHECK:-0}" = "1" ]; then
  echo "⏭️  Skipping e2e smoke test (SKIP_E2E_SMOKE_CHECK=1)."
  exit 0
fi

if [ "${SKIP_E2E_SMOKE_BUILD:-0}" != "1" ]; then
  echo "🏗️  Building Next.js application..."
  npm run build >/dev/null
else
  echo "⏭️  Skipping build step (SKIP_E2E_SMOKE_BUILD=1)."
fi

cleanup() {
  if [ -n "${NEXT_SERVER_PID:-}" ]; then
    kill "$NEXT_SERVER_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

HOST="${PLAYWRIGHT_SMOKE_HOST:-localhost}"
PORT="${PLAYWRIGHT_SMOKE_PORT:-3310}"
SCHEME="http"
BASE_URL="$SCHEME://$HOST:$PORT"

if [ -n "${PLAYWRIGHT_BASE_URL:-}" ]; then
  RAW_URL="$PLAYWRIGHT_BASE_URL"
  HOST="$(node -e "const u = new URL(process.argv[1]); console.log(u.hostname);" "$RAW_URL")"
  EXTRACTED_PORT="$(node -e "const u = new URL(process.argv[1]); console.log(u.port || '');" "$RAW_URL")"
  SCHEME="$(node -e "const u = new URL(process.argv[1]); console.log(u.protocol.replace(':',''));" "$RAW_URL")"
  # Only use extracted port if explicitly provided; otherwise use default for localhost, omit for standard ports (80/443)
  if [ -n "$EXTRACTED_PORT" ]; then
    PORT="$EXTRACTED_PORT"
    BASE_URL="$SCHEME://$HOST:$PORT"
  else
    # No explicit port in URL - use default for localhost, omit for remote hosts (standard ports 80/443)
    if [ "$HOST" = "localhost" ] || [ "$HOST" = "127.0.0.1" ]; then
      PORT="${PLAYWRIGHT_SMOKE_PORT:-3310}"
      BASE_URL="$SCHEME://$HOST:$PORT"
    else
      # Production/staging URLs without explicit port - don't add default port to BASE_URL
      # But still need PORT for server start command (will be ignored if server already running)
      PORT="${PLAYWRIGHT_SMOKE_PORT:-3310}"
      BASE_URL="$SCHEME://$HOST"
    fi
  fi
fi

DEFAULT_DB_URL="postgresql://postgres:postgres@localhost:5432/founderfinder_test?schema=public"

if [ -z "${TEST_DATABASE_URL:-}" ] && [ -z "${DATABASE_URL:-}" ]; then
  if [ "${ALLOW_E2E_FALLBACK_DB:-0}" = "1" ]; then
    DB_URL="$DEFAULT_DB_URL"
    echo "ℹ️  Using fallback DATABASE_URL for e2e smoke: $DB_URL"
  else
    echo "❌ TEST_DATABASE_URL or DATABASE_URL must be set for e2e smoke tests."
    echo "   (set ALLOW_E2E_FALLBACK_DB=1 to use the local fallback $DEFAULT_DB_URL)"
    exit 1
  fi
else
  DB_URL="${TEST_DATABASE_URL:-${DATABASE_URL:-}}"
fi

export DATABASE_URL="$DB_URL"
export TEST_DATABASE_URL="$DB_URL"
export PRISMA_MIGRATE_NO_ADVISORY_LOCK=1

echo "🗄️  Syncing Prisma schema to test database..."
npx prisma db push --skip-generate --accept-data-loss >/dev/null

echo "🚀 Starting Next.js server on ${BASE_URL}..."
NEXTAUTH_URL="$BASE_URL" OPENAI_API_KEY="" RESEND_API_KEY="" DATABASE_URL="${DATABASE_URL:-}" TEST_DATABASE_URL="${TEST_DATABASE_URL:-}" npm run start -- --hostname "$HOST" --port "$PORT" >/dev/null &
NEXT_SERVER_PID=$!

echo "⏳ Waiting for server readiness..."
if ! npx wait-on "$BASE_URL" >/dev/null; then
  echo "❌ Server failed to start for smoke test."
  exit 1
fi

if ! kill -0 "$NEXT_SERVER_PID" 2>/dev/null; then
  echo "❌ Next.js server exited unexpectedly during smoke setup."
  exit 1
fi

echo "🎭 Running Playwright smoke suite..."
PLAYWRIGHT_BASE_URL="$BASE_URL" NEXTAUTH_URL="$BASE_URL" OPENAI_API_KEY="" RESEND_API_KEY="" DATABASE_URL="${DATABASE_URL:-}" TEST_DATABASE_URL="${TEST_DATABASE_URL:-}" npm run test:e2e

echo "✅ Smoke test completed."

