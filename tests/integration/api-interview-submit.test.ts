import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
  getTestPrismaClient,
  resetDatabase,
  setupTestDatabase,
  teardownTestDatabase,
} from "../helpers/db";

const hasDatabaseUrl = Boolean(process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL);
const describeIfDatabaseConfigured = hasDatabaseUrl ? describe : describe.skip;

const prismaHolder: { prisma: PrismaClient | null } = { prisma: null };
const authMock = vi.fn();
const limitMock = vi.fn();
const summarizeMock = vi.fn();
const upsertEmbeddingMock = vi.fn();

vi.mock("@/lib/db", () => ({
  get prisma() {
    if (!prismaHolder.prisma) {
      throw new Error("Prisma client requested before test database setup.");
    }
    return prismaHolder.prisma;
  },
}));

vi.mock("@/auth", () => ({
  auth: () => authMock(),
}));

vi.mock("@/lib/rateLimit", () => ({
  limit: (key: string, kind?: "auth" | "api") => limitMock(key, kind),
}));

vi.mock("@/lib/ai", () => ({
  summarizeProfile: (...args: Parameters<typeof summarizeMock>) => summarizeMock(...args),
}));

vi.mock("@/lib/embeddings", () => ({
  upsertEmbedding: (...args: Parameters<typeof upsertEmbeddingMock>) =>
    upsertEmbeddingMock(...args),
}));

describeIfDatabaseConfigured("POST /api/interview/submit", () => {
  let handler: typeof import("@/app/api/interview/submit/route").POST;

  beforeAll(async () => {
    const { prisma } = await setupTestDatabase();
    prismaHolder.prisma = prisma;
    ({ POST: handler } = await import("@/app/api/interview/submit/route"));
  }, 60000);

  afterEach(async () => {
    authMock.mockReset();
    limitMock.mockReset();
    summarizeMock.mockReset();
    upsertEmbeddingMock.mockReset();
    await resetDatabase();
  });

  afterAll(async () => {
    prismaHolder.prisma = null;
    await teardownTestDatabase();
  });

  it("returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValue(null);
    limitMock.mockResolvedValue({ success: true });

    const request = new Request("http://localhost/api/interview/submit", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await handler(request);
    expect(response.status).toBe(401);
  });

  it("returns 429 when rate limit is exceeded", async () => {
    const prisma = getTestPrismaClient();
    const user = await prisma.user.create({ data: { email: "member@example.com", role: "CEO" } });

    authMock.mockResolvedValue({ userId: user.id });
    limitMock.mockResolvedValue({ success: false });

    const request = new Request("http://localhost/api/interview/submit", {
      method: "POST",
      body: JSON.stringify({ role: "CEO", structured: {}, freeText: "" }),
    });

    const response = await handler(request);
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "Rate limit" });
  });

  it("persists CEO interview data and triggers summary + embedding", async () => {
    const prisma = getTestPrismaClient();
    const user = await prisma.user.create({
      data: { email: "ceo@example.com", role: "CEO" },
    });

    authMock.mockResolvedValue({ userId: user.id, role: "CEO" });
    limitMock.mockResolvedValue({ success: true });
    summarizeMock.mockResolvedValue("Concise CEO summary");
    upsertEmbeddingMock.mockResolvedValue(undefined);

    const payload = {
      role: "CEO" as const,
      structured: {
        name: "Alice",
        location: "NYC",
        stage: "Seed",
        domain: "AI",
        description: "Building cofounder matching",
        equity_offer: "5%",
        salary_offer: "$80k",
      },
      freeText: "I love empowering CTOs.",
    };

    const request = new Request("http://localhost/api/interview/submit", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const response = await handler(request);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });

    const interview = await prisma.interviewResponse.findFirst({ where: { userId: user.id } });
    expect(interview).not.toBeNull();
    expect(interview?.structured).toMatchObject(payload.structured);

    const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
    expect(profile).toMatchObject({
      name: "Alice",
      location: "NYC",
    });

    const startup = await prisma.startup.findUnique({ where: { userId: user.id } });
    expect(startup).toMatchObject({
      stage: "Seed",
      domain: "AI",
      description: "Building cofounder matching",
      equity_offer: "5%",
      salary_offer: "$80k",
    });

    const userRecord = await prisma.user.findUnique({ where: { id: user.id } });
    expect(userRecord?.onboarded).toBe(true);

    const summary = await prisma.profileSummary.findUnique({ where: { userId: user.id } });
    expect(summary?.ai_summary_text).toBe("Concise CEO summary");

    expect(summarizeMock).toHaveBeenCalledWith({
      role: "CEO",
      structured: payload.structured,
      freeText: payload.freeText,
    });
    expect(upsertEmbeddingMock).toHaveBeenCalledWith(user.id, "CEO", "Concise CEO summary", "summary");
  });

  it("persists CTO interview data and triggers summary + embedding", async () => {
    const prisma = getTestPrismaClient();
    const user = await prisma.user.create({
      data: { email: "cto@example.com", role: "CTO" },
    });

    authMock.mockResolvedValue({ userId: user.id, role: "CTO" });
    limitMock.mockResolvedValue({ success: true });
    summarizeMock.mockResolvedValue("CTO summary");
    upsertEmbeddingMock.mockResolvedValue(undefined);

    const payload = {
      role: "CTO" as const,
      structured: {
        name: "Bob",
        location: "SF",
        primary_stack: "TypeScript",
        years_experience: "6",
        domains: "FinTech",
        track_record: "Scaled payments infra",
      },
      freeText: "Looking for a visionary CEO.",
    };

    const request = new Request("http://localhost/api/interview/submit", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const response = await handler(request);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });

    const techBackground = await prisma.techBackground.findUnique({ where: { userId: user.id } });
    expect(techBackground).toMatchObject({
      primary_stack: "TypeScript",
      years_experience: 6,
      domains: "FinTech",
      track_record: "Scaled payments infra",
    });

    const userRecord = await prisma.user.findUnique({ where: { id: user.id } });
    expect(userRecord?.onboarded).toBe(true);

    expect(summarizeMock).toHaveBeenCalledWith({
      role: "CTO",
      structured: payload.structured,
      freeText: payload.freeText,
    });
    expect(upsertEmbeddingMock).toHaveBeenCalledWith(user.id, "CTO", "CTO summary", "summary");
  });

  // Input validation tests
  describe("input validation", () => {
    it("returns 400 for invalid JSON", async () => {
      const prisma = getTestPrismaClient();
      const user = await prisma.user.create({ data: { email: "user@example.com", role: "CEO" } });

      authMock.mockResolvedValue({ userId: user.id });
      limitMock.mockResolvedValue({ success: true });

      const request = new Request("http://localhost/api/interview/submit", {
        method: "POST",
        body: "not valid json",
      });

      const response = await handler(request);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Invalid JSON" });
    });

    it("returns 400 for invalid role", async () => {
      const prisma = getTestPrismaClient();
      const user = await prisma.user.create({ data: { email: "user@example.com", role: "CEO" } });

      authMock.mockResolvedValue({ userId: user.id });
      limitMock.mockResolvedValue({ success: true });

      const request = new Request("http://localhost/api/interview/submit", {
        method: "POST",
        body: JSON.stringify({ role: "INVALID", structured: {}, freeText: "" }),
      });

      const response = await handler(request);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Invalid request data");
    });

    it("returns 400 when role is missing", async () => {
      const prisma = getTestPrismaClient();
      const user = await prisma.user.create({ data: { email: "user@example.com", role: "CEO" } });

      authMock.mockResolvedValue({ userId: user.id });
      limitMock.mockResolvedValue({ success: true });

      const request = new Request("http://localhost/api/interview/submit", {
        method: "POST",
        body: JSON.stringify({ structured: {}, freeText: "" }),
      });

      const response = await handler(request);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Invalid request data");
    });

    it("returns 400 when structured data field exceeds max length", async () => {
      const prisma = getTestPrismaClient();
      const user = await prisma.user.create({ data: { email: "user@example.com", role: "CEO" } });

      authMock.mockResolvedValue({ userId: user.id });
      limitMock.mockResolvedValue({ success: true });

      const request = new Request("http://localhost/api/interview/submit", {
        method: "POST",
        body: JSON.stringify({
          role: "CEO",
          structured: { name: "a".repeat(6000) }, // Exceeds 5000 char limit
          freeText: "",
        }),
      });

      const response = await handler(request);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Invalid request data");
    });

    it("returns 400 when freeText exceeds max length", async () => {
      const prisma = getTestPrismaClient();
      const user = await prisma.user.create({ data: { email: "user@example.com", role: "CEO" } });

      authMock.mockResolvedValue({ userId: user.id });
      limitMock.mockResolvedValue({ success: true });

      const request = new Request("http://localhost/api/interview/submit", {
        method: "POST",
        body: JSON.stringify({
          role: "CEO",
          structured: {},
          freeText: "a".repeat(11000), // Exceeds 10000 char limit
        }),
      });

      const response = await handler(request);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Invalid request data");
    });
  });
});


