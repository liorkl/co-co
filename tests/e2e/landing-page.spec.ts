import { test, expect } from "@playwright/test";
import { ensurePlaywrightEnv } from "./support/env";

ensurePlaywrightEnv();

test.describe("Landing page", () => {
  test("displays hero section with value proposition", async ({ page }) => {
    await page.goto("/");
    
    // Check hero heading
    await expect(
      page.getByRole("heading", { name: /Find Your Perfect/i })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Cofounder Match/i })
    ).toBeVisible();
    
    // Check value proposition text
    await expect(
      page.getByText(/AI-powered matching connects/i)
    ).toBeVisible();
  });

  test("displays segmented CTAs for CEO and CTO", async ({ page }) => {
    await page.goto("/");
    
    // Check CEO CTA
    const ceoButton = page.getByRole("link", { name: /I'm a CEO/i });
    await expect(ceoButton).toBeVisible();
    await expect(ceoButton).toHaveAttribute("href", /\/auth\/signup\?role=CEO/);
    await expect(page.getByText(/Find your technical cofounder/i)).toBeVisible();
    
    // Check CTO CTA
    const ctoButton = page.getByRole("link", { name: /I'm a CTO/i });
    await expect(ctoButton).toBeVisible();
    await expect(ctoButton).toHaveAttribute("href", /\/auth\/signup\?role=CTO/);
    await expect(page.getByText(/Find your business cofounder/i)).toBeVisible();
  });

  test("displays value bullets section", async ({ page }) => {
    await page.goto("/");
    
    // Check value bullets are visible
    await expect(page.getByText(/AI-Powered Matching/i)).toBeVisible();
    await expect(page.getByText(/Fast Onboarding/i)).toBeVisible();
    await expect(page.getByText(/Privacy First/i)).toBeVisible();
    await expect(page.getByText(/Quality Over Quantity/i)).toBeVisible();
    await expect(page.getByText(/Curated Introductions/i)).toBeVisible();
    await expect(page.getByText(/Free to Start/i)).toBeVisible();
  });

  test("displays testimonials section", async ({ page }) => {
    await page.goto("/");
    
    // Check testimonials heading
    await expect(
      page.getByRole("heading", { name: /Trusted by Founders/i })
    ).toBeVisible();
    
    // Check at least one testimonial is visible
    await expect(
      page.getByText(/Found my technical cofounder/i)
    ).toBeVisible();
  });

  test("displays final CTA section", async ({ page }) => {
    await page.goto("/");
    
    // Check final CTA heading
    await expect(
      page.getByRole("heading", { name: /Ready to Find Your Cofounder/i })
    ).toBeVisible();
    
    // Check CTA buttons
    await expect(
      page.getByRole("link", { name: /Start as CEO/i })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Start as CTO/i })
    ).toBeVisible();
  });

  test("CEO CTA navigates to signup with role parameter", async ({ page }) => {
    await page.goto("/");
    
    const ceoButton = page.getByRole("link", { name: /I'm a CEO/i });
    await ceoButton.click();
    
    await expect(page).toHaveURL(/\/auth\/signup\?role=CEO/);
    await expect(page.getByText(/Join FounderFinder as a CEO/i)).toBeVisible();
  });

  test("CTO CTA navigates to signup with role parameter", async ({ page }) => {
    await page.goto("/");
    
    const ctoButton = page.getByRole("link", { name: /I'm a CTO/i });
    await ctoButton.click();
    
    await expect(page).toHaveURL(/\/auth\/signup\?role=CTO/);
    await expect(page.getByText(/Join FounderFinder as a CTO/i)).toBeVisible();
  });

  test("sign in link is visible and navigates correctly", async ({ page }) => {
    await page.goto("/");
    
    const signInLink = page.getByRole("link", { name: /Sign in/i });
    await expect(signInLink).toBeVisible();
    await signInLink.click();
    
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test("is mobile responsive", async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    
    // Hero should still be visible
    await expect(
      page.getByRole("heading", { name: /Find Your Perfect/i })
    ).toBeVisible();
    
    // CTAs should stack vertically on mobile
    const ceoButton = page.getByRole("link", { name: /I'm a CEO/i });
    const ctoButton = page.getByRole("link", { name: /I'm a CTO/i });
    await expect(ceoButton).toBeVisible();
    await expect(ctoButton).toBeVisible();
  });
});


