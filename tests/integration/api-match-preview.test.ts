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
const findMatchesMock = vi.fn();
const buildRationaleMock = vi.fn();

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

vi.mock("@/lib/match", () => ({
  findMatchesFor: (...args: Parameters<typeof findMatchesMock>) => findMatchesMock(...args),
}));

vi.mock("@/lib/ai", () => ({
  buildMatchRationale: (...args: Parameters<typeof buildRationaleMock>) =>
    buildRationaleMock(...args),
}));

describeIfDatabaseConfigured("POST /api/match/preview", () => {
  let handler: typeof import("@/app/api/match/preview/route").POST;

  beforeAll(async () => {
    const { prisma } = await setupTestDatabase();
    prismaHolder.prisma = prisma;
    ({ POST: handler } = await import("@/app/api/match/preview/route"));
  }, 60000);

  afterEach(async () => {
    authMock.mockReset();
    limitMock.mockReset();
    findMatchesMock.mockReset();
    buildRationaleMock.mockReset();
    await resetDatabase();
  });

  afterAll(async () => {
    prismaHolder.prisma = null;
    await teardownTestDatabase();
  });

  it("returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValue(null);
    limitMock.mockResolvedValue({ success: true });

    const response = await handler();
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns 429 when rate limited", async () => {
    const prisma = getTestPrismaClient();
    const user = await prisma.user.create({ data: { email: "ceo@example.com", role: "CEO" } });
    await prisma.profileSummary.create({
      data: { userId: user.id, ai_summary_text: "CEO summary" },
    });

    authMock.mockResolvedValue({ userId: user.id, role: "CEO" });
    limitMock.mockResolvedValue({ success: false });

    const response = await handler();
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "Rate limit" });
  });

  it("returns enriched matches with rationale and profile details", async () => {
    const prisma = getTestPrismaClient();
    const [ceo, cto1, cto2] = await prisma.$transaction([
      prisma.user.create({
        data: {
          email: "ceo@example.com",
          role: "CEO",
          profileSummary: {
            create: { ai_summary_text: "CEO summary" },
          },
        },
      }),
      prisma.user.create({
        data: {
          email: "cto1@example.com",
          role: "CTO",
          profile: {
            create: {
              name: "CTO One",
              location: "NYC",
              timezone: "EST",
              availability: "Full-time",
              commitment: "High",
            },
          },
          techBackground: {
            create: {
              primary_stack: "React",
              years_experience: 7,
              domains: "SaaS",
              track_record: "Built SaaS platforms",
            },
          },
          profileSummary: {
            create: { ai_summary_text: "CTO One summary" },
          },
        },
      }),
      prisma.user.create({
        data: {
          email: "cto2@example.com",
          role: "CTO",
          profile: {
            create: {
              name: "CTO Two",
              location: "SF",
            },
          },
          techBackground: {
            create: {
              primary_stack: "Node.js",
              years_experience: 5,
              domains: "FinTech",
              track_record: "Built payments systems",
            },
          },
          profileSummary: {
            create: { ai_summary_text: "CTO Two summary" },
          },
        },
      }),
    ]);

    authMock.mockResolvedValue({ userId: ceo.id, role: "CEO" });
    limitMock.mockResolvedValue({ success: true });
    findMatchesMock.mockResolvedValue([
      { userId: cto1.id, score: 0.95 },
      { userId: cto2.id, score: 0.85 },
    ]);
    buildRationaleMock.mockResolvedValue("Great fit");

    const response = await handler();
    expect(response.status).toBe(200);
    const payload = await response.json();

    expect(payload).toEqual({
      matches: [
        expect.objectContaining({
          userId: cto1.id,
          score: 0.95,
          rationale: "Great fit",
          name: "CTO One",
          location: "NYC",
          techBackground: expect.objectContaining({
            primary_stack: "React",
            years_experience: 7,
          }),
        }),
        expect.objectContaining({
          userId: cto2.id,
          score: 0.85,
          rationale: "Great fit",
          name: "CTO Two",
          techBackground: expect.objectContaining({
            primary_stack: "Node.js",
            years_experience: 5,
          }),
        }),
      ],
    });

    expect(findMatchesMock).toHaveBeenCalledWith(ceo.id, "CEO");
    expect(buildRationaleMock).toHaveBeenCalledTimes(2);
  }, 30000); // Increased timeout for database operations
});


