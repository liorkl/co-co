import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  getTestPrismaClient,
  resetDatabase,
  seedUsers,
  setupTestDatabase,
  teardownTestDatabase,
} from "../helpers/db";

const hasDatabaseUrl = Boolean(process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL);
const describeIfDatabaseConfigured = hasDatabaseUrl ? describe : describe.skip;

describeIfDatabaseConfigured("database test helpers", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalTestDatabaseUrl = process.env.TEST_DATABASE_URL;

  beforeAll(async () => {
    await setupTestDatabase();
  }, 60000);

  afterEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it("does not mutate process environment variables", async () => {
    expect(process.env.DATABASE_URL).toBe(originalDatabaseUrl);
    expect(process.env.TEST_DATABASE_URL).toBe(originalTestDatabaseUrl);
  });

  it("cleans and reseeds data via resetDatabase", async () => {
    const prisma = getTestPrismaClient();

    await seedUsers(prisma, [
      { email: "integration-user@example.com", name: "Integration User" },
    ]);

    expect(await prisma.user.count()).toBe(1);

    await resetDatabase();

    expect(await prisma.user.count()).toBe(0);

    await seedUsers(prisma, [
      { email: "integration-user@example.com", name: "Integration User" },
    ]);

    expect(await prisma.user.count()).toBe(1);
  });
});

