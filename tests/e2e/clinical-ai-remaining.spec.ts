import { test, expect } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const email = process.env.PLAYWRIGHT_EMAIL;
const password = process.env.PLAYWRIGHT_PASSWORD;

const cases = [
  {
    name: "Protocol Deviations",
    path: "/dashboard/workspace/deviations",
    endpoint: "/api/deviations",
    analyze: /Analyze.*Deviation/i,
    content: /deviation|protocol|finding|evidence|review/i,
  },
  {
    name: "Safety Signals",
    path: "/dashboard/workspace/safety",
    endpoint: "/api/safety",
    analyze: /Analyze.*Safety/i,
    content: /safety|signal|risk|finding|evidence|review/i,
  },
  {
    name: "Medical Coding",
    path: "/dashboard/workspace/medical-coding",
    endpoint: "/api/medical-coding",
    analyze: /Analyze.*Coding/i,
    content: /coding|code|clinical|finding|evidence|review/i,
  },
];

test.describe("TrialIQ live clinical AI QA — remaining modules", () => {
  test.skip(!email || !password, "QA credentials are not configured");

  for (const item of cases) {
    test(`${item.name} runs the demo analysis and returns a clinical result`, async ({ page }) => {
      await page.goto(`${baseURL}/auth`);
      await page.getByLabel(/email/i).fill(email!);
      await page.getByLabel(/password/i).fill(password!);
      await page.getByRole("button", { name: /sign in/i }).click();
      await expect(page).toHaveURL(/\/dashboard/);

      await page.getByRole("link", { name: /clinical workspace/i }).click();
      await page.getByRole("link", { name: new RegExp(item.name, "i") }).click();
      await page.getByRole("button", { name: "Load Demo" }).click();

      const responsePromise = page.waitForResponse(
        response => response.url().includes(item.endpoint) && response.request().method() === "POST",
        { timeout: 60000 }
      );

      await page.getByRole("button", { name: item.analyze }).click();

      const response = await responsePromise;
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      const serialized = JSON.stringify(body);

      expect(serialized.length).toBeGreaterThan(100);
      expect(serialized).toMatch(item.content);
      await expect(page.locator("body")).not.toContainText(/application error|internal server error/i);
    });
  }
});
