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

vi.mock("@/lib/db", () => ({
  get prisma() {
    if (!prismaHolder.prisma) {
      throw new Error("Prisma client requested before test database setup.");
    }
    return prismaHolder.prisma;
  },
}));

const toVector = (values: number[]) => Buffer.from(new Float32Array(values).buffer);

describeIfDatabaseConfigured("findMatchesFor integration", () => {
  let findMatchesFor: typeof import("@/lib/match").findMatchesFor;

  beforeAll(async () => {
    const { prisma } = await setupTestDatabase();
    prismaHolder.prisma = prisma;
    ({ findMatchesFor } = await import("@/lib/match"));
  }, 60000);

  afterEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    prismaHolder.prisma = null;
    await teardownTestDatabase();
  });

  it("returns counterpart role embeddings ordered by cosine similarity", async () => {
    const prisma = getTestPrismaClient();

    const ceo = await prisma.user.create({
      data: { email: "ceo@example.com", role: "CEO" },
    });

    await prisma.embedding.create({
      data: {
        userId: ceo.id,
        role: "CEO",
        source: "summary",
        vector: toVector([1, 0]),
      },
    });

    const perfectMatch = await prisma.user.create({
      data: { email: "cto-perfect@example.com", role: "CTO" },
    });
    await prisma.embedding.create({
      data: {
        userId: perfectMatch.id,
        role: "CTO",
        source: "summary",
        vector: toVector([1, 0]),
      },
    });

    const closeMatch = await prisma.user.create({
      data: { email: "cto-close@example.com", role: "CTO" },
    });
    await prisma.embedding.create({
      data: {
        userId: closeMatch.id,
        role: "CTO",
        source: "summary",
        vector: toVector([1, 1]),
      },
    });

    const ignoredDifferentSource = await prisma.user.create({
      data: { email: "cto-other-source@example.com", role: "CTO" },
    });
    await prisma.embedding.create({
      data: {
        userId: ignoredDifferentSource.id,
        role: "CTO",
        source: "full",
        vector: toVector([0, 1]),
      },
    });

    const ignoredSameRole = await prisma.user.create({
      data: { email: "ceo-other@example.com", role: "CEO" },
    });
    await prisma.embedding.create({
      data: {
        userId: ignoredSameRole.id,
        role: "CEO",
        source: "summary",
        vector: toVector([0, 1]),
      },
    });

    const matches = await findMatchesFor(ceo.id, "CEO");

    expect(matches.map((m) => m.userId)).toEqual([perfectMatch.id, closeMatch.id]);
    expect(matches[0]?.score).toBeCloseTo(1, 5);
    expect(matches[1]?.score).toBeCloseTo(0.7071, 4);
  });
});


