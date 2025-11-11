import { defineConfig, devices } from "@playwright/test";
import { ensurePlaywrightEnv, getPlaywrightBaseURL } from "./tests/e2e/support/env";

ensurePlaywrightEnv();
const baseURL = getPlaywrightBaseURL();
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: {
    timeout: 5_000,
  },
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  workers: 1,
  use: {
    baseURL,
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: devices["Desktop Chrome"],
    },
  ],
  outputDir: "tmp/playwright-output",
});

