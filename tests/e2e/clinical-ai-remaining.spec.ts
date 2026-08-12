import { test, expect } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const email = process.env.PLAYWRIGHT_EMAIL;
const password = process.env.PLAYWRIGHT_PASSWORD;

const cases = [
  {
    name: "Protocol Deviations",
    path: "/dashboard/workspace/deviations",
    endpoint: "/api/deviations",
    demo: "Load Demo",
    analyze: "Detect Protocol Deviations",
    content: /deviation|protocol|finding|evidence|review/i,
  },
  {
    name: "Safety Signals",
    path: "/dashboard/workspace/safety",
    endpoint: "/api/safety",
    demo: "Load Demo",
    analyze: "Detect Safety Signals",
    content: /safety|signal|risk|finding|evidence|review/i,
  },
  {
    name: "Medical Coding",
    path: "/dashboard/workspace/medical-coding",
    endpoint: "/api/medical-coding",
    demo: "Load Demo",
    analyze: "Analyze & Suggest Codes",
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

      await page.goto(`${baseURL}${item.path}`);
      await page.getByRole("button", { name: item.demo }).click();

      const responsePromise = page.waitForResponse(
        response => response.url().includes(item.endpoint) && response.request().method() === "POST",
        { timeout: 60000 }
      );

      await page.getByRole("button", { name: item.analyze }).click();

      const response = await responsePromise;
      const body = await response.json();

      console.log(`${item.name} API STATUS:`, response.status());
      console.log(`${item.name} API RESPONSE:`, JSON.stringify(body, null, 2));

      expect(
        response.ok(),
        `${item.name} API returned HTTP ${response.status()}: ${JSON.stringify(body)}`
      ).toBeTruthy();

      const serialized = JSON.stringify(body);

      expect(serialized.length).toBeGreaterThan(100);
      expect(serialized).toMatch(item.content);
      await expect(page.locator("body")).not.toContainText(/application error|internal server error/i);
    });
  }
});
