import { test, expect } from "@playwright/test";
import { PrismaClient, Role } from "@prisma/client";
import {
  ensurePlaywrightEnv,
  getDatabaseUrl,
  getPlaywrightBaseURL,
} from "./support/env";
import {
  resetPrismaForE2E,
  toVectorBuffer,
} from "./support/prisma";
import { normalizeMagicLink } from "./support/url";

ensurePlaywrightEnv();

const prisma = new PrismaClient({
  datasources: { db: { url: getDatabaseUrl() } },
});

const BASE_URL = getPlaywrightBaseURL();

test.describe("Onboarding journeys", () => {
  test.beforeEach(async () => {
    await resetPrismaForE2E(prisma);
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("CEO signs in via magic link, completes onboarding, and sees matches", async ({ page, request }) => {
    const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const ceoEmail = `ceo-e2e-${uniqueSuffix}@test.founderfinder.com`;
    const ctoEmails = [
      `cto-one-${uniqueSuffix}@test.founderfinder.com`,
      `cto-two-${uniqueSuffix}@test.founderfinder.com`,
    ];

    // Seed CEO user with summary + embedding so matching has a baseline vector
    const ceo = await prisma.user.create({
      data: {
        email: ceoEmail,
        role: Role.CEO,
        onboarded: false,
      },
    });

    await prisma.profileSummary.create({
      data: {
        userId: ceo.id,
        ai_summary_text: "Seed-stage CEO looking for a technical partner",
      },
    });

    await prisma.embedding.create({
      data: {
        userId: ceo.id,
        role: Role.CEO,
        source: "summary",
        vector: toVectorBuffer([1, 0]),
      },
    });

    // Seed two strong CTO matches with profile + tech background + embeddings
    const counterpartData = [
      {
        email: ctoEmails[0],
        name: "CTO One",
        location: "NYC",
        timezone: "EST",
        availability: "Full-time",
        commitment: "High",
        stack: "React",
        experience: 7,
        domains: "SaaS",
        trackRecord: "Built SaaS platforms",
        vector: [1, 0.1],
      },
      {
        email: ctoEmails[1],
        name: "CTO Two",
        location: "SF",
        timezone: "PST",
        availability: "Part-time",
        commitment: "Medium",
        stack: "Node.js",
        experience: 5,
        domains: "FinTech",
        trackRecord: "Built payments systems",
        vector: [0.85, 0.2],
      },
    ];

    for (const data of counterpartData) {
      await prisma.user.create({
        data: {
          email: data.email,
          role: Role.CTO,
          profile: {
            create: {
              name: data.name,
              location: data.location,
              timezone: data.timezone,
              availability: data.availability,
              commitment: data.commitment,
            },
          },
          techBackground: {
            create: {
              primary_stack: data.stack,
              years_experience: data.experience,
              domains: data.domains,
              track_record: data.trackRecord,
            },
          },
          profileSummary: {
            create: {
              ai_summary_text: `${data.name} summary`,
            },
          },
          embeddings: {
            create: {
              role: Role.CTO,
              source: "summary",
              vector: toVectorBuffer(data.vector),
            },
          },
        },
      });
    }

    // Request a magic link via the test signin endpoint
    const response = await request.get(
      `${BASE_URL}/api/test/signin?email=${encodeURIComponent(ceoEmail)}`
    );
    expect(response.ok()).toBeTruthy();

    const { magicLink } = await response.json();
    expect(magicLink).toBeTruthy();
    const normalizedLink = normalizeMagicLink(magicLink, BASE_URL);

    // Complete sign-in flow via magic link
    await page.goto(normalizedLink);
    await page.waitForURL(/\/onboarding\/role$/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Select your role" })).toBeVisible();

    // Choose CEO role
    await page.getByRole("button", { name: "I am a CEO" }).click();
    await page.waitForURL(/\/onboarding\/ceo$/, { timeout: 10_000 });

    // Fill onboarding form
    const ceoInputs = page.locator("form input");
    await ceoInputs.nth(0).fill("Alice CEO");
    await ceoInputs.nth(1).fill("New York");
    await ceoInputs.nth(2).fill("Seed");
    await ceoInputs.nth(3).fill("AI");
    await ceoInputs.nth(4).fill("5%");
    await ceoInputs.nth(5).fill("$80k");
    await page
      .locator("form textarea")
      .fill("Looking for a partner to lead AI product development.");

    await page.getByRole("button", { name: "Save and see matches" }).click();

    // Verify redirect to matches page with seeded CTO profiles
    await page.waitForURL(/\/matches$/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Your Matches" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "CTO One" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "CTO Two" }).first()).toBeVisible();

    // Ensure match cards include key details from seed data
    await expect(page.getByText("Full-time")).toBeVisible();
    await expect(page.getByText("React")).toBeVisible();

    // Confirm onboarding flag flipped in database
    const refreshedCeo = await prisma.user.findUnique({ where: { id: ceo.id } });
    expect(refreshedCeo?.onboarded).toBe(true);

    // User can sign out and return to landing page
    await page.getByRole("link", { name: "Sign out" }).click();
    await page.waitForURL(/\/$/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "FounderFinder" })).toBeVisible();
  });

  test("CTO completes onboarding and sees matched CEOs", async ({ page, request }) => {
    const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const ctoEmail = `cto-e2e-${uniqueSuffix}@test.founderfinder.com`;
    const ceoEmails = [
      `ceo-one-${uniqueSuffix}@test.founderfinder.com`,
      `ceo-two-${uniqueSuffix}@test.founderfinder.com`,
    ];

    // Seed CTO user with summary + embedding so matching has a baseline vector
    const cto = await prisma.user.create({
      data: {
        email: ctoEmail,
        role: Role.CTO,
        onboarded: false,
      },
    });

    await prisma.profileSummary.create({
      data: {
        userId: cto.id,
        ai_summary_text: "CTO looking to scale products",
      },
    });

    await prisma.embedding.create({
      data: {
        userId: cto.id,
        role: Role.CTO,
        source: "summary",
        vector: toVectorBuffer([0.9, 0.2]),
      },
    });

    // Seed two CEO matches with startup information and embeddings
    const ceoSeedData = [
      {
        email: ceoEmails[0],
        name: "CEO One",
        location: "Boston",
        stage: "Series A",
        domain: "HealthTech",
        description: "Building remote patient monitoring tools",
        equity: "4%",
        salary: "$120k",
        vector: [0.92, 0.15],
      },
      {
        email: ceoEmails[1],
        name: "CEO Two",
        location: "Austin",
        stage: "Seed",
        domain: "DevTools",
        description: "Helping teams manage feature flags",
        equity: "3%",
        salary: "$100k",
        vector: [0.88, 0.25],
      },
    ];

    for (const data of ceoSeedData) {
      const user = await prisma.user.create({
        data: {
          email: data.email,
          role: Role.CEO,
          profile: {
            create: {
              name: data.name,
              location: data.location,
            },
          },
          startup: {
            create: {
              stage: data.stage,
              domain: data.domain,
              description: data.description,
              equity_offer: data.equity,
              salary_offer: data.salary,
            },
          },
          profileSummary: {
            create: {
              ai_summary_text: `${data.name} summary`,
            },
          },
          embeddings: {
            create: {
              role: Role.CEO,
              source: "summary",
              vector: toVectorBuffer(data.vector),
            },
          },
        },
      });

      // Give CEOs baseline onboarding status to simulate active founders
      await prisma.user.update({ where: { id: user.id }, data: { onboarded: true } });
    }

    // Request magic link for CTO
    const response = await request.get(
      `${BASE_URL}/api/test/signin?email=${encodeURIComponent(ctoEmail)}`
    );
    expect(response.ok()).toBeTruthy();
    const { magicLink } = await response.json();
    expect(magicLink).toBeTruthy();
    const normalizedLink = normalizeMagicLink(magicLink, BASE_URL);

    // Complete sign-in flow via magic link
    await page.goto(normalizedLink);
    await page.waitForURL(/\/onboarding\/role$/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Select your role" })).toBeVisible();

    // Choose CTO role
    await page.getByRole("button", { name: "I am a CTO" }).click();
    await page.waitForURL(/\/onboarding\/cto$/, { timeout: 10_000 });

    // Fill CTO onboarding form
    const ctoInputs = page.locator("form input");
    await ctoInputs.nth(0).fill("Bob CTO");
    await ctoInputs.nth(1).fill("San Francisco");
    await ctoInputs.nth(2).fill("TypeScript");
    await ctoInputs.nth(3).fill("6");
    await ctoInputs.nth(4).fill("FinTech");
    await ctoInputs.nth(5).fill("Built scalable payment systems.");
    await page
      .locator("form textarea")
      .fill("Seeking a visionary CEO with strong go-to-market experience.");

    await page.getByRole("button", { name: "Save and see matches" }).click();

    // Verify redirect to matches page with seeded CEO profiles
    await page.waitForURL(/\/matches$/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Your Matches" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "CEO One" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "CEO Two" }).first()).toBeVisible();

    // Ensure match cards include startup-specific details
    await expect(page.getByText("HealthTech")).toBeVisible();
    await expect(page.getByText("Series A")).toBeVisible();

    // Confirm onboarding flag flipped in database
    const refreshedCto = await prisma.user.findUnique({ where: { id: cto.id } });
    expect(refreshedCto?.onboarded).toBe(true);
  });
});


