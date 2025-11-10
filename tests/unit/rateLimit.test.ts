import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("limit helper", () => {
  it("returns success when redis is not configured", async () => {
    vi.unstubAllEnvs();

    const { limit } = await import("@/lib/rateLimit");

    await expect(limit("user-1")).resolves.toEqual({ success: true });
    await expect(limit("user-1", "auth")).resolves.toEqual({ success: true });
  });

  it("delegates to Upstash ratelimit when redis credentials are provided", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");

    const limitSpy = vi.fn().mockResolvedValue({ success: false, reason: "throttled" });
    const slidingWindowSpy = vi.fn().mockReturnValue("limiter");

    const ratelimitInstances: Array<{ options: any }> = [];

    const RedisMock = vi.fn(function RedisMock(this: any, config) {
      (this as any).config = config;
    });

    vi.doMock("@upstash/redis", () => ({
      Redis: RedisMock,
    }));

    vi.doMock("@upstash/ratelimit", () => {
      const Ratelimit = vi.fn(function Ratelimit(this: any, options) {
        ratelimitInstances.push({ options });
        (this as any).limit = limitSpy;
      }) as unknown as typeof import("@upstash/ratelimit").Ratelimit;

      (Ratelimit as any).slidingWindow = slidingWindowSpy;

      return { Ratelimit };
    });

    const { limit } = await import("@/lib/rateLimit");

    expect(slidingWindowSpy).toHaveBeenNthCalledWith(1, 5, "10 m");
    expect(slidingWindowSpy).toHaveBeenNthCalledWith(2, 60, "10 m");
    expect(ratelimitInstances).toHaveLength(2);
    expect(ratelimitInstances[0]?.options).toMatchObject({ prefix: "ff:auth" });
    expect(ratelimitInstances[1]?.options).toMatchObject({ prefix: "ff:api" });

    await limit("api-user"); // defaults to api limiter (second constructor call)
    await limit("auth-user", "auth");

    expect(limitSpy).toHaveBeenCalledTimes(2);
    expect(limitSpy).toHaveBeenNthCalledWith(1, "api-user");
    expect(limitSpy).toHaveBeenNthCalledWith(2, "auth-user");
  });
});


