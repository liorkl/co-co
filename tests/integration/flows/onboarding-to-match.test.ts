import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
  getTestPrismaClient,
  resetDatabase,
  setupTestDatabase,
  teardownTestDatabase,
} from "../../helpers/db";

const hasDatabaseUrl = Boolean(process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL);
const describeIfDatabaseConfigured = hasDatabaseUrl ? describe : describe.skip;

const prismaHolder: { prisma: PrismaClient | null } = { prisma: null };
const authMock = vi.fn();
const summarizeMock = vi.fn();
const upsertEmbeddingMock = vi.fn();
const buildMatchRationaleMock = vi.fn();

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

vi.mock("@/lib/ai", () => ({
  summarizeProfile: (...args: Parameters<typeof summarizeMock>) => summarizeMock(...args),
  buildMatchRationale: (...args: Parameters<typeof buildMatchRationaleMock>) =>
    buildMatchRationaleMock(...args),
}));

vi.mock("@/lib/embeddings", () => ({
  upsertEmbedding: (...args: Parameters<typeof upsertEmbeddingMock>) =>
    upsertEmbeddingMock(...args),
}));

const toVectorBuffer = (values: number[]) => Buffer.from(new Float32Array(values).buffer);

describeIfDatabaseConfigured("Onboarding flow through match preview", () => {
  let submitHandler: typeof import("@/app/api/interview/submit/route").POST;
  let matchPreviewHandler: typeof import("@/app/api/match/preview/route").POST;

  beforeAll(async () => {
    const { prisma } = await setupTestDatabase();
    prismaHolder.prisma = prisma;
    ({ POST: submitHandler } = await import("@/app/api/interview/submit/route"));
    ({ POST: matchPreviewHandler } = await import("@/app/api/match/preview/route"));
  }, 60000);

  afterEach(async () => {
    authMock.mockReset();
    summarizeMock.mockReset();
    upsertEmbeddingMock.mockReset();
    buildMatchRationaleMock.mockReset();
    await resetDatabase();
  });

  afterAll(async () => {
    prismaHolder.prisma = null;
    await teardownTestDatabase();
  });

  it("lets a newly onboarded CEO see enriched matches", async () => {
    const prisma = getTestPrismaClient();

    // Existing CTO in the system with embedding data
    const [cto, ceo] = await prisma.$transaction([
      prisma.user.create({
        data: {
          email: "cto@example.com",
          role: "CTO",
          profile: {
            create: {
              name: "CTO Example",
              location: "Remote",
              timezone: "UTC",
              availability: "Full-time",
              commitment: "High",
            },
          },
          techBackground: {
            create: {
              primary_stack: "TypeScript",
              years_experience: 6,
              domains: "SaaS",
              track_record: "Built matching platforms",
            },
          },
          profileSummary: {
            create: { ai_summary_text: "Experienced CTO ready to partner." },
          },
          embeddings: {
            create: [
              {
                role: "CTO",
                source: "summary",
                vector: toVectorBuffer([0.92, 0.1, 0.05]),
              },
            ],
          },
        },
      }),
      prisma.user.create({
        data: { email: "ceo@example.com", role: "CEO" },
      }),
    ]);

    summarizeMock.mockResolvedValue("Visionary CEO summary");
    buildMatchRationaleMock.mockResolvedValue("Aligned mission and complementary skills");
    upsertEmbeddingMock.mockImplementation(async (userId, role, _text, source) => {
      await prisma.embedding.create({
        data: {
          userId,
          role,
          source,
          vector: toVectorBuffer([1, 0.1, 0.05]),
        },
      });
    });

    authMock.mockResolvedValueOnce({ userId: ceo.id, role: "CEO" });
    const request = new Request("http://localhost/api/interview/submit", {
      method: "POST",
      body: JSON.stringify({
        role: "CEO",
        structured: {
          name: "Founder Example",
          location: "Remote",
          stage: "Seed",
          domain: "AI",
          description: "Building cofounder discovery tools",
          equity_offer: "5%",
          salary_offer: "$90k",
        },
        freeText: "Looking for a technical partner",
      }),
    });

    const submitResponse = await submitHandler(request);
    expect(submitResponse.status).toBe(200);

    authMock.mockResolvedValueOnce({ userId: ceo.id, role: "CEO" });

    const matchResponse = await matchPreviewHandler();
    expect(matchResponse.status).toBe(200);
    const payload = await matchResponse.json();

    expect(payload.matches).toHaveLength(1);
    expect(payload.matches[0]).toMatchObject({
      userId: cto.id,
      rationale: "Aligned mission and complementary skills",
      score: expect.any(Number),
      name: "CTO Example",
      location: "Remote",
    });

    const ceoRecord = await prisma.user.findUnique({ where: { id: ceo.id } });
    expect(ceoRecord?.onboarded).toBe(true);

    const ceoSummary = await prisma.profileSummary.findUnique({ where: { userId: ceo.id } });
    expect(ceoSummary?.ai_summary_text).toBe("Visionary CEO summary");
  });
});


