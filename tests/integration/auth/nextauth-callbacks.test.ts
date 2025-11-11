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

vi.mock("next-auth/providers/email", () => ({
  default: (options: any) => ({
    id: "email",
    type: "email",
    name: "Email",
    options,
  }),
}));

vi.mock("@/lib/db", () => ({
  get prisma() {
    if (!prismaHolder.prisma) {
      throw new Error("Prisma client requested before test database setup.");
    }
    return prismaHolder.prisma;
  },
}));

describeIfDatabaseConfigured("NextAuth callbacks", () => {
  type AuthCallbacks = NonNullable<(typeof import("@/auth.config"))["authConfig"]["callbacks"]>;
  let callbacks: AuthCallbacks;

  beforeAll(async () => {
    const { prisma } = await setupTestDatabase();
    prismaHolder.prisma = prisma;
    const { authConfig } = await import("@/auth.config");
    callbacks = authConfig.callbacks!;
  }, 60000);

  afterEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    prismaHolder.prisma = null;
    await teardownTestDatabase();
  });

  it("creates a new user with default CEO role on first sign in", async () => {
    const prisma = getTestPrismaClient();
    const result = await callbacks.signIn?.({
      user: { email: "new-user@example.com" } as any,
      account: { provider: "email" } as any,
    } as any);

    expect(result).toBe(true);
    const user = await prisma.user.findUnique({ where: { email: "new-user@example.com" } });
    expect(user).not.toBeNull();
    expect(user?.role).toBe("CEO");
  });

  it("returns false when email missing in sign in payload", async () => {
    const result = await callbacks.signIn?.({
      user: {} as any,
      account: { provider: "email" } as any,
    } as any);

    expect(result).toBe(false);
  });

  it("does not duplicate existing users when signing in again", async () => {
    const prisma = getTestPrismaClient();
    const existing = await prisma.user.create({
      data: { email: "existing@example.com", role: "CTO" },
    });

    const result = await callbacks.signIn?.({
      user: { email: "existing@example.com", id: existing.id } as any,
      account: { provider: "email" } as any,
    } as any);

    expect(result).toBe(true);
    const users = await prisma.user.findMany({ where: { email: "existing@example.com" } });
    expect(users).toHaveLength(1);
    expect(users[0]?.role).toBe("CTO");
  });

  it("enriches session with user metadata", async () => {
    const prisma = getTestPrismaClient();
    const user = await prisma.user.create({
      data: {
        email: "session-user@example.com",
        role: "CTO",
        onboarded: true,
      },
    });

    const session = await callbacks.session?.({
      session: { user: {} } as any,
      token: { email: "session-user@example.com" } as any,
    } as any);

    expect((session as any).userId).toBe(user.id);
    expect((session as any).role).toBe("CTO");
    expect((session as any).onboarded).toBe(true);
  });
});


