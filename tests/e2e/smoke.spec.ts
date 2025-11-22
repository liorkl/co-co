import { test, expect } from "@playwright/test";
import { ensurePlaywrightEnv } from "./support/env";

ensurePlaywrightEnv();

test.describe("Landing page smoke test", () => {
  test("shows hero content and segmented CTAs", async ({ page }) => {
    await page.goto("/");
    // Check new landing page structure
    await expect(
      page.getByRole("heading", { name: /Find Your Perfect/i })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /I'm a CEO/i })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /I'm a CTO/i })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Sign in/i })).toBeVisible();
  });
});


