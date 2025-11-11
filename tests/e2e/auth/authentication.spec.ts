import { test, expect } from "@playwright/test";
import { PrismaClient, Role } from "@prisma/client";
import {
  ensurePlaywrightEnv,
  getPlaywrightBaseURL,
  getDatabaseUrl,
} from "../support/env";
import { resetPrismaForE2E } from "../support/prisma";

ensurePlaywrightEnv();

const BASE_URL = getPlaywrightBaseURL();
const prisma = new PrismaClient({
  datasources: { db: { url: getDatabaseUrl() } },
});

test.describe("Authentication flows", () => {
  test.beforeEach(async () => {
    await resetPrismaForE2E(prisma);
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("allows a new founder to request a sign-up magic link", async ({ page }) => {
    const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const email = `signup-${uniqueSuffix}@test.founderfinder.com`;

    await page.goto("/auth/signup");
    await page.getByLabel("Email address").fill(email);
    await page.getByRole("button", { name: "Continue with email" }).click();

    await expect(page.getByText("Check your email!", { exact: false })).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();

    const tokenCount = await prisma.verificationToken.count({
      where: { identifier: email },
    });
    expect(tokenCount).toBe(1);
  });

  test("signs in an onboarded CEO via magic link and supports sign out", async ({
    page,
    request,
  }) => {
    const email = `ceo-auth-${Date.now()}@test.founderfinder.com`;

    await prisma.user.create({
      data: {
        email,
        role: Role.CEO,
        onboarded: true,
        profileSummary: {
          create: { ai_summary_text: "CEO ready to collaborate." },
        },
      },
    });

    const response = await request.get(
      `${BASE_URL}/api/test/signin?email=${encodeURIComponent(email)}`
    );
    expect(response.ok()).toBeTruthy();
    const { magicLink } = await response.json();
    expect(magicLink).toBeTruthy();

    await page.goto(magicLink);
    await page.waitForURL(/\/matches$/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Your Matches" })).toBeVisible();

    await page.getByRole("link", { name: "Sign out" }).click();
    await page.waitForURL(/\/$/, { timeout: 10_000 });
    await expect(page.getByRole("heading", { name: "FounderFinder" })).toBeVisible();
  });
});


