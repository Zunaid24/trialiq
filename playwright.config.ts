import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 180_000,
  reporter: [
    ["list"],
    [
      "json",
      {
        outputFile:
          process.env.PLAYWRIGHT_REPORT_FILE || "test-reports/latest/results.json",
      },
    ],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    // Web test runner defaults to headless. Set PLAYWRIGHT_HEADLESS=false
    // only when deliberately running Playwright manually with a visible browser.
    headless: process.env.PLAYWRIGHT_HEADLESS !== "false",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
