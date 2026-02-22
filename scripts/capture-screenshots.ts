import { chromium } from "playwright";

const BASE_URL = "http://localhost:3000";
const SCREENSHOTS_DIR = "docs/screenshots";

async function captureScreenshots() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  console.log("Capturing screenshots...\n");

  // Landing page
  console.log("1. Landing page...");
  await page.goto(BASE_URL);
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/01-landing.png` });

  // Sign in page
  console.log("2. Sign in page...");
  await page.goto(`${BASE_URL}/auth/signin`);
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/02-signin.png` });

  // Use test auth to log in (if available)
  console.log("3. Logging in as test user...");
  try {
    await page.goto(`${BASE_URL}/api/test/auth?email=sarah.chen@test.founderfinder.com`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
  } catch (e) {
    console.log("   (test auth not available, skipping authenticated pages)");
  }

  // Role selection page
  console.log("4. Onboarding role selection...");
  await page.goto(`${BASE_URL}/onboarding/role`);
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/03-role-selection.png` });

  // CEO onboarding
  console.log("5. CEO onboarding form...");
  await page.goto(`${BASE_URL}/onboarding/ceo`);
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/04-ceo-onboarding.png` });

  // Matches page (may be empty if no matches)
  console.log("6. Matches page...");
  await page.goto(`${BASE_URL}/matches`);
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/05-matches.png` });

  await browser.close();
  console.log(`\nDone! Screenshots saved to ${SCREENSHOTS_DIR}/`);
}

captureScreenshots().catch(console.error);
