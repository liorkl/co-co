import { beforeEach, describe, expect, it, vi } from "vitest";

const mockLimit = vi.fn();
const mockSlidingWindow = vi.fn();
const redisCtor = vi.fn();

vi.mock("@upstash/redis", () => ({
  Redis: class {
    constructor(config: { url: string; token: string }) {
      redisCtor(config);
    }
  },
}));

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    static slidingWindow = mockSlidingWindow;
    limit = mockLimit;
    constructor(options: unknown) {
      Object.assign(this, options);
    }
  },
}));

function resetEnv() {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
}

describe("limit", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    resetEnv();
  });

  it("allows requests when redis config missing", async () => {
    const { limit } = await import("@/lib/rateLimit");
    const result = await limit("user-key");
    expect(result).toEqual({ success: true });
    expect(redisCtor).not.toHaveBeenCalled();
    expect(mockLimit).not.toHaveBeenCalled();
  });

  it("enforces API rate limit when configuration present", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.com";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    mockSlidingWindow.mockReturnValue("sliding-window-instance");
    mockLimit.mockResolvedValue({ success: false, limit: 60 });

    const { limit } = await import("@/lib/rateLimit");
    const result = await limit("user-key", "api");

    expect(redisCtor).toHaveBeenCalledWith({
      url: "https://example.com",
      token: "token",
    });
    expect(mockSlidingWindow).toHaveBeenCalledWith(60, "10 m");
    expect(mockLimit).toHaveBeenCalledWith("user-key");
    expect(result).toEqual({ success: false, limit: 60 });
  });

  it("enforces auth limit independently", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.com";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    const authLimitMock = vi.fn().mockResolvedValue({ success: true });
    const apiLimitMock = vi.fn().mockResolvedValue({ success: false });

    mockSlidingWindow.mockImplementation((max: number) => `window-${max}`);

    vi.doMock("@upstash/ratelimit", () => {
      class MockRatelimit {
        static slidingWindow = mockSlidingWindow;
        limit = (key: string) => Promise.resolve({ success: true });
        constructor(options: { limiter: string; prefix: string }) {
          if (options.prefix === "ff:auth") {
            this.limit = authLimitMock;
          } else {
            this.limit = apiLimitMock;
          }
        }
      }
      return { Ratelimit: MockRatelimit };
    });

    const { limit } = await import("@/lib/rateLimit");
    await limit("auth-key", "auth");
    await limit("api-key", "api");

    expect(mockSlidingWindow).toHaveBeenNthCalledWith(1, 5, "10 m");
    expect(mockSlidingWindow).toHaveBeenNthCalledWith(2, 60, "10 m");
    expect(authLimitMock).toHaveBeenCalledWith("auth-key");
    expect(apiLimitMock).toHaveBeenCalledWith("api-key");
  });
});


