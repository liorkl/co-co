import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  : undefined;

export const rlAuth = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 m"),
  prefix: "ff:auth",
}) : undefined;

export const rlApi = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "10 m"),
  prefix: "ff:api",
}) : undefined;

export async function limit(key: string, kind: "auth" | "api" = "api") {
  const rl = kind === "auth" ? rlAuth : rlApi;
  if (!rl) return { success: true } as const;
  return rl.limit(key);
}


