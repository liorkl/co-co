import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock prisma before importing routes
vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    verificationToken: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock next-auth/jwt
vi.mock("next-auth/jwt", () => ({
  encode: vi.fn().mockResolvedValue("mock-token"),
}));

describe("Test endpoint production guards", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  describe("/api/test/auth", () => {
    it("returns 403 when NODE_ENV is production and ALLOW_TEST_AUTH is not set", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("ALLOW_TEST_AUTH", "");

      const { GET } = await import("@/app/api/test/auth/route");

      const request = new Request("http://localhost/api/test/auth?email=test@test.founderfinder.com");
      const response = await GET(request);

      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ error: "Not available in production" });
    });

    it("returns 403 when NODE_ENV is undefined and ALLOW_TEST_AUTH is not set", async () => {
      vi.stubEnv("NODE_ENV", "");
      vi.stubEnv("ALLOW_TEST_AUTH", "");

      const { GET } = await import("@/app/api/test/auth/route");

      const request = new Request("http://localhost/api/test/auth?email=test@test.founderfinder.com");
      const response = await GET(request);

      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ error: "Not available in production" });
    });

    it("returns 403 when NODE_ENV is an unexpected value and ALLOW_TEST_AUTH is not set", async () => {
      vi.stubEnv("NODE_ENV", "staging");
      vi.stubEnv("ALLOW_TEST_AUTH", "");

      const { GET } = await import("@/app/api/test/auth/route");

      const request = new Request("http://localhost/api/test/auth?email=test@test.founderfinder.com");
      const response = await GET(request);

      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ error: "Not available in production" });
    });

    it("allows access when ALLOW_TEST_AUTH is true (for CI)", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("ALLOW_TEST_AUTH", "true");

      const { GET } = await import("@/app/api/test/auth/route");

      const request = new Request("http://localhost/api/test/auth?email=test@test.founderfinder.com");
      const response = await GET(request);

      // Should not be 403 - will fail for other reasons (missing user) but passes guard
      expect(response.status).not.toBe(403);
    });
  });

  describe("/api/test/signin", () => {
    it("returns 403 when NODE_ENV is production and ALLOW_TEST_AUTH is not set", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("ALLOW_TEST_AUTH", "");

      const { GET } = await import("@/app/api/test/signin/route");

      const request = new Request("http://localhost/api/test/signin?email=test@test.founderfinder.com");
      const response = await GET(request);

      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ error: "Not available in production" });
    });

    it("returns 403 when NODE_ENV is undefined and ALLOW_TEST_AUTH is not set", async () => {
      vi.stubEnv("NODE_ENV", "");
      vi.stubEnv("ALLOW_TEST_AUTH", "");

      const { GET } = await import("@/app/api/test/signin/route");

      const request = new Request("http://localhost/api/test/signin?email=test@test.founderfinder.com");
      const response = await GET(request);

      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ error: "Not available in production" });
    });

    it("returns 403 when NODE_ENV is an unexpected value and ALLOW_TEST_AUTH is not set", async () => {
      vi.stubEnv("NODE_ENV", "staging");
      vi.stubEnv("ALLOW_TEST_AUTH", "");

      const { GET } = await import("@/app/api/test/signin/route");

      const request = new Request("http://localhost/api/test/signin?email=test@test.founderfinder.com");
      const response = await GET(request);

      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ error: "Not available in production" });
    });

    it("allows access when ALLOW_TEST_AUTH is true (for CI)", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("ALLOW_TEST_AUTH", "true");

      const { GET } = await import("@/app/api/test/signin/route");

      const request = new Request("http://localhost/api/test/signin?email=test@test.founderfinder.com");
      const response = await GET(request);

      // Should not be 403 - will fail for other reasons (missing user) but passes guard
      expect(response.status).not.toBe(403);
    });
  });
});
