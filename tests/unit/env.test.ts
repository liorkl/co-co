import { describe, expect, it, afterEach, vi } from "vitest";

const requiredEnv = {
  DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
  NEXTAUTH_SECRET: "secret",
  NEXTAUTH_URL: "http://localhost:3000",
  RESEND_API_KEY: "resend-key",
  EMAIL_FROM: "founder@example.com",
  OPENAI_API_KEY: "openai-key",
  UPSTASH_REDIS_REST_URL: "https://upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "redis-token",
};

afterEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
});

async function importEnvModule() {
  return import("@/lib/env");
}

describe("env schema", () => {
  it("parses environment variables when all required values are provided", async () => {
    for (const [key, value] of Object.entries(requiredEnv)) {
      vi.stubEnv(key, value);
    }

    const { env } = await importEnvModule();

    expect(env).toMatchObject({
      DATABASE_URL: requiredEnv.DATABASE_URL,
      NEXTAUTH_SECRET: requiredEnv.NEXTAUTH_SECRET,
      RESEND_API_KEY: requiredEnv.RESEND_API_KEY,
      EMAIL_FROM: requiredEnv.EMAIL_FROM,
      OPENAI_API_KEY: requiredEnv.OPENAI_API_KEY,
    });
  });

  it("throws a validation error when a required variable is missing", async () => {
    for (const [key, value] of Object.entries(requiredEnv)) {
      if (key === "NEXTAUTH_SECRET") {
        vi.stubEnv(key, "");
      } else {
        vi.stubEnv(key, value);
      }
    }

    await expect(importEnvModule()).rejects.toThrow(/NEXTAUTH_SECRET/i);
  });
});


