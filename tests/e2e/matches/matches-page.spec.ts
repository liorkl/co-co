import { test, expect } from "@playwright/test";
import { PrismaClient, Role } from "@prisma/client";
import {
  ensurePlaywrightEnv,
  getPlaywrightBaseURL,
  getDatabaseUrl,
} from "../support/env";
import {
  resetPrismaForE2E,
  toVectorBuffer,
} from "../support/prisma";

ensurePlaywrightEnv();

const BASE_URL = getPlaywrightBaseURL();
const prisma = new PrismaClient({
  datasources: { db: { url: getDatabaseUrl() } },
});

test.describe("Matches page", () => {
  test.beforeEach(async () => {
    await resetPrismaForE2E(prisma);
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("shows enriched matches for an onboarded CEO", async ({ page, request }) => {
    const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const ceoEmail = `ceo-matches-${uniqueSuffix}@test.founderfinder.com`;

    const ceo = await prisma.user.create({
      data: {
        email: ceoEmail,
        role: Role.CEO,
        onboarded: true,
        profileSummary: {
          create: { ai_summary_text: "Seed CEO building climate tech." },
        },
        embeddings: {
          create: {
            role: Role.CEO,
            source: "summary",
            vector: toVectorBuffer([1, 0, 0]),
          },
        },
      },
    });

    const ctoAlpha = await prisma.user.create({
      data: {
        email: `cto-alpha-${uniqueSuffix}@test.founderfinder.com`,
        role: Role.CTO,
      },
    });
    const ctoBeta = await prisma.user.create({
      data: {
        email: `cto-beta-${uniqueSuffix}@test.founderfinder.com`,
        role: Role.CTO,
      },
    });

    await prisma.profile.create({
      data: {
        userId: ctoAlpha.id,
        name: "CTO Alpha",
        location: "Berlin",
        timezone: "CET",
        availability: "Full-time",
        commitment: "High",
      },
    });
    await prisma.techBackground.create({
      data: {
        userId: ctoAlpha.id,
        primary_stack: "Python",
        years_experience: 8,
        domains: "ClimateTech",
        track_record: "Built carbon accounting systems",
      },
    });
    await prisma.profileSummary.create({
      data: {
        userId: ctoAlpha.id,
        ai_summary_text: "Experienced CTO focused on sustainability.",
      },
    });
    await prisma.embedding.create({
      data: {
        userId: ctoAlpha.id,
        role: Role.CTO,
        source: "summary",
        vector: toVectorBuffer([0.9, 0.1, 0.2]),
      },
    });

    await prisma.profile.create({
      data: {
        userId: ctoBeta.id,
        name: "CTO Beta",
        location: "Toronto",
      },
    });
    await prisma.profileSummary.create({
      data: {
        userId: ctoBeta.id,
        ai_summary_text: "North American CTO with growth-stage experience.",
      },
    });
    await prisma.embedding.create({
      data: {
        userId: ctoBeta.id,
        role: Role.CTO,
        source: "summary",
        vector: toVectorBuffer([0.82, 0.05, 0.1]),
      },
    });

    const response = await request.get(
      `${BASE_URL}/api/test/signin?email=${encodeURIComponent(ceoEmail)}`
    );
    expect(response.ok()).toBeTruthy();
    const { magicLink } = await response.json();
    expect(magicLink).toBeTruthy();

    await page.goto(magicLink);
    await page.waitForURL(/\/matches$/, { timeout: 15_000 });

    await expect(page.getByRole("heading", { name: "Your Matches" })).toBeVisible();

    await expect(page.getByRole("heading", { name: "CTO Alpha" })).toBeVisible();
    await expect(page.getByText("Berlin")).toBeVisible();
    await expect(page.getByText("Python")).toBeVisible();
    await expect(page.getByText("Carbon accounting systems", { exact: false })).toBeVisible();

    await expect(page.getByRole("heading", { name: "CTO Beta" })).toBeVisible();
    await expect(page.getByText("Toronto")).toBeVisible();
  });
});


