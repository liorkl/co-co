import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";

const envFiles = [".env.test.local", ".env.test", ".env.local", ".env"];
for (const file of envFiles) {
  const resolved = path.resolve(process.cwd(), file);
  if (existsSync(resolved)) {
    loadEnv({ path: resolved, override: false });
  }
}

type TestDbContext = {
  prisma: PrismaClient;
  schema: string;
};

let context: TestDbContext | null = null;

function ensureTestDatabaseUrl(): { baseUrl: string; urlWithSchema: string; schema: string } {
  const baseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!baseUrl) {
    throw new Error(
      "TEST_DATABASE_URL (preferred) or DATABASE_URL must be set before running integration tests."
    );
  }

  const schema = `test_${randomUUID().replace(/-/g, "")}`;
  const url = new URL(baseUrl);
  url.searchParams.set("schema", schema);
  return { baseUrl, urlWithSchema: url.toString(), schema };
}

async function createSchema(prisma: PrismaClient, schema: string) {
  await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
}

async function dropSchema(prisma: PrismaClient, schema: string) {
  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
}

export async function setupTestDatabase(): Promise<TestDbContext> {
  if (context) {
    return context;
  }

  const { baseUrl, urlWithSchema, schema } = ensureTestDatabaseUrl();

  const adminClient = new PrismaClient({
    datasources: { db: { url: baseUrl } },
  });
  await createSchema(adminClient, schema);
  await adminClient.$disconnect();

  // Run migrations against the isolated schema
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: urlWithSchema,
    },
  });

  // Ensure the schema matches the latest Prisma model definitions even if no migrations exist yet.
  execSync("npx prisma db push --skip-generate", {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: urlWithSchema,
    },
  });

  const prisma = new PrismaClient({
    datasources: { db: { url: urlWithSchema } },
  });

  context = { prisma, schema };
  return context;
}

export async function teardownTestDatabase() {
  if (!context) return;

  const { prisma, schema } = context;
  await dropSchema(prisma, schema);
  await prisma.$disconnect();
  context = null;
}

export async function resetDatabase() {
  if (!context) {
    throw new Error("resetDatabase called before setupTestDatabase.");
  }

  const { prisma, schema } = context;
  const tables = (await prisma.$queryRawUnsafe<{ tablename: string }[]>(
    `SELECT tablename FROM pg_tables WHERE schemaname = '${schema}'`
  )).map((row) => `"${schema}"."${row.tablename}"`);

  if (tables.length > 0) {
    const truncateStatement = `TRUNCATE TABLE ${tables.join(", ")} RESTART IDENTITY CASCADE;`;
    await prisma.$executeRawUnsafe(truncateStatement);
  }
}

export function getTestPrismaClient(): PrismaClient {
  if (!context) {
    throw new Error("Prisma client requested before calling setupTestDatabase.");
  }

  return context.prisma;
}

export async function seedUsers(prisma: PrismaClient, users: Prisma.UserCreateInput[]) {
  return Promise.all(users.map((data) => prisma.user.create({ data })));
}

export async function seedProfileSummaries(
  prisma: PrismaClient,
  summaries: Prisma.ProfileSummaryCreateManyInput[]
) {
  if (summaries.length === 0) return [];
  await prisma.profileSummary.createMany({ data: summaries });
  return prisma.profileSummary.findMany({
    where: { userId: { in: summaries.map((summary) => summary.userId) } },
  });
}

export async function seedEmbeddings(
  prisma: PrismaClient,
  embeddings: Prisma.EmbeddingCreateManyInput[]
) {
  if (embeddings.length === 0) return [];
  const embeddingsWithIds: Array<Prisma.EmbeddingCreateManyInput & { id: string }> = embeddings.map(
    (embedding) => {
      const id = embedding.id ?? randomUUID();
      return { ...embedding, id };
    }
  );
  await prisma.embedding.createMany({ data: embeddingsWithIds });
  const created = await prisma.embedding.findMany({
    where: { id: { in: embeddingsWithIds.map((embedding) => embedding.id) } },
  });
  const createdById = new Map(created.map((embedding) => [embedding.id, embedding]));
  return embeddingsWithIds.map((embedding) => {
    const record = createdById.get(embedding.id);
    if (!record) {
      throw new Error(`Failed to fetch embedding with id ${embedding.id}`);
    }
    return record;
  });
}

export async function seedProfiles(
  prisma: PrismaClient,
  profiles: Prisma.ProfileCreateManyInput[]
) {
  if (profiles.length === 0) return [];
  await prisma.profile.createMany({ data: profiles });
  return prisma.profile.findMany({ where: { userId: { in: profiles.map((profile) => profile.userId) } } });
}

export async function seedStartups(
  prisma: PrismaClient,
  startups: Prisma.StartupCreateManyInput[]
) {
  if (startups.length === 0) return [];
  await prisma.startup.createMany({ data: startups });
  return prisma.startup.findMany({ where: { userId: { in: startups.map((startup) => startup.userId) } } });
}

export async function seedTechBackgrounds(
  prisma: PrismaClient,
  techBackgrounds: Prisma.TechBackgroundCreateManyInput[]
) {
  if (techBackgrounds.length === 0) return [];
  await prisma.techBackground.createMany({ data: techBackgrounds });
  return prisma.techBackground.findMany({
    where: { userId: { in: techBackgrounds.map((tech) => tech.userId) } },
  });
}


