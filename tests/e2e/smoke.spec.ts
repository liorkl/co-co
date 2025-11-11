import { test, expect } from "@playwright/test";
import { ensurePlaywrightEnv } from "./support/env";

ensurePlaywrightEnv();

test.describe("Landing page smoke test", () => {
  test("shows hero content and auth links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "FounderFinder" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign up" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  });
});


