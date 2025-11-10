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

HOST="${PLAYWRIGHT_SMOKE_HOST:-127.0.0.1}"
PORT="${PLAYWRIGHT_SMOKE_PORT:-3310}"
BASE_URL="http://$HOST:$PORT"

echo "🚀 Starting Next.js server on ${BASE_URL}..."
npm run start -- --hostname "$HOST" --port "$PORT" >/dev/null &
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
PLAYWRIGHT_BASE_URL="$BASE_URL" npm run test:e2e

echo "✅ Smoke test completed."

