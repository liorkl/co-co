import { test, expect } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL;

test.skip(!baseURL, "Set PLAYWRIGHT_BASE_URL to run e2e smoke tests against a live environment.");

test.describe("Landing page smoke test", () => {
  test("shows hero content and auth links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "FounderFinder" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign up" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  });
});


