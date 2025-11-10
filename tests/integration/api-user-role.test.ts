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

describeIfDatabaseConfigured("POST /api/user/role", () => {
  let handler: typeof import("@/app/api/user/role/route").POST;

  beforeAll(async () => {
    const { prisma } = await setupTestDatabase();
    prismaHolder.prisma = prisma;
    ({ POST: handler } = await import("@/app/api/user/role/route"));
  }, 60000);

  afterEach(async () => {
    authMock.mockReset();
    await resetDatabase();
  });

  afterAll(async () => {
    prismaHolder.prisma = null;
    await teardownTestDatabase();
  });

  it("returns 401 when the request is unauthenticated", async () => {
    authMock.mockResolvedValue(null);

    const request = new Request("http://localhost/api/user/role", {
      method: "POST",
      body: JSON.stringify({ role: "CEO" }),
    });

    const response = await handler(request);
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns 400 when the provided role is invalid", async () => {
    const prisma = getTestPrismaClient();
    const user = await prisma.user.create({
      data: { email: "member@example.com", role: "CEO" },
    });

    authMock.mockResolvedValue({ userId: user.id });

    const request = new Request("http://localhost/api/user/role", {
      method: "POST",
      body: JSON.stringify({ role: "FOUNDER" }),
    });

    const response = await handler(request);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid role" });

    const persisted = await prisma.user.findUnique({ where: { id: user.id } });
    expect(persisted?.role).toBe("CEO");
  });

  it("updates the user role when the request is valid", async () => {
    const prisma = getTestPrismaClient();
    const user = await prisma.user.create({
      data: { email: "member@example.com", role: "CEO" },
    });

    authMock.mockResolvedValue({ userId: user.id });

    const request = new Request("http://localhost/api/user/role", {
      method: "POST",
      body: JSON.stringify({ role: "CTO" }),
    });

    const response = await handler(request);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });

    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated?.role).toBe("CTO");
  });
});


