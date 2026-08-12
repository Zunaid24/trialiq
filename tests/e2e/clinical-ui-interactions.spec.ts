import { test, expect, Page } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const email = process.env.PLAYWRIGHT_EMAIL;
const password = process.env.PLAYWRIGHT_PASSWORD;

test.describe("TrialIQ clinical module UI interaction QA", () => {
  test.skip(!email || !password, "QA credentials are not configured");

  const modules = [
    { name: "Lab Intelligence", path: "/dashboard/workspace/lab-intelligence", demo: /load demo/i, analyze: /analyze laboratory results/i },
    { name: "Medication Review", path: "/dashboard/workspace/medications", demo: /load demo medication/i, analyze: /analyze medications/i },
    { name: "Adverse Events", path: "/dashboard/workspace/adverse-events", demo: /load demo event/i, analyze: /assess adverse event/i },
    { name: "Protocol Deviations", path: "/dashboard/workspace/deviations", demo: /load demo/i, analyze: /detect protocol deviations/i },
    { name: "Safety Signals", path: "/dashboard/workspace/safety", demo: /load demo/i, analyze: /detect safety signals/i },
    { name: "Medical Coding", path: "/dashboard/workspace/medical-coding", demo: /load demo/i, analyze: /analyze & suggest codes/i },
  ];

  async function signIn(page: Page) {
    await page.goto(`${baseURL}/auth`);
    await page.getByLabel(/email/i).fill(email!);
    await page.getByLabel(/password/i).fill(password!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  }

  for (const module of modules) {
    test(`${module.name} follows the standard demo-to-analysis interaction pattern`, async ({ page }) => {
      await signIn(page);
      await page.goto(`${baseURL}${module.path}`);
      await expect(page.locator("body")).not.toContainText(/application error|internal server error/i);

      const demo = page.getByRole("button", { name: module.demo });
      await expect(demo).toBeVisible();
      await expect(demo).toBeEnabled();
      await demo.click();

      const analyze = page.getByRole("button", { name: module.analyze });
      await expect(analyze).toBeVisible();
      await expect(analyze).toBeEnabled();
      await expect(page.locator("body")).not.toContainText(/application error|internal server error/i);
    });
  }
});
