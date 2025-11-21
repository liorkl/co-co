import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";

let initialized = false;

const ENV_FILES = [".env.test.local", ".env.test", ".env.local", ".env"];
const DEFAULT_BASE_URL = "http://localhost:3310";

export function ensurePlaywrightEnv() {
  if (initialized) return;

  for (const file of ENV_FILES) {
    const resolved = path.resolve(process.cwd(), file);
    if (existsSync(resolved)) {
      loadEnv({ path: resolved, override: false });
    }
  }

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? DEFAULT_BASE_URL;
  process.env.PLAYWRIGHT_BASE_URL = baseUrl;
  if (!process.env.NEXTAUTH_URL) {
    process.env.NEXTAUTH_URL = baseUrl;
  }

  const dbUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error(
      "TEST_DATABASE_URL or DATABASE_URL must be configured for Playwright tests."
    );
  }

  process.env.DATABASE_URL = dbUrl;
  if (!process.env.TEST_DATABASE_URL) {
    process.env.TEST_DATABASE_URL = dbUrl;
  }

  process.env.PRISMA_MIGRATE_NO_ADVISORY_LOCK = "1";

  initialized = true;
}

export function getPlaywrightBaseURL(): string {
  ensurePlaywrightEnv();
  return process.env.PLAYWRIGHT_BASE_URL as string;
}

export function getDatabaseUrl(): string {
  ensurePlaywrightEnv();
  return process.env.DATABASE_URL as string;
}


