import { test, expect, Page } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const email = process.env.PLAYWRIGHT_EMAIL;
const password = process.env.PLAYWRIGHT_PASSWORD;

test.describe("TrialIQ shared AI state UI QA", () => {
  test.skip(!email || !password, "QA credentials are not configured");

  async function signIn(page: Page) {
    await page.goto(`${baseURL}/auth`);
    await page.getByLabel(/email/i).fill(email!);
    await page.getByLabel(/password/i).fill(password!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  }

  test("Lab Intelligence prevents duplicate analysis clicks while a request is pending", async ({ page }) => {
    await signIn(page);
    await page.goto(`${baseURL}/dashboard/workspace/lab-intelligence`);
    await page.getByRole("button", { name: "Load Demo" }).click();

    await expect(page.getByText(/lab-demo\.pdf/i)).toBeVisible();
    const analyze = page.getByRole("button", { name: "Analyze Laboratory Results" });
    await expect(analyze).toBeEnabled();

    // Hold the API request so the test can inspect the in-flight UI state without
    // relying on Gemini output or consuming multiple AI requests.
    await page.route("**/api/lab-intelligence", async route => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await route.continue();
    });

    const responsePromise = page.waitForResponse(
      response => response.url().includes("/api/lab-intelligence") && response.request().method() === "POST",
      { timeout: 60_000 }
    );

    await analyze.click();

    // The application may disable the Analyze button or replace it with a loading
    // state. Either behavior is valid; what matters is that another Analyze button
    // cannot remain enabled while the request is in flight.
    await expect.poll(async () => {
      const count = await analyze.count();
      if (count === 0) return "hidden";
      return (await analyze.isDisabled()) ? "disabled" : "enabled";
    }, { timeout: 5_000 }).toMatch(/hidden|disabled/);

    await expect(page.locator("body")).not.toContainText(/application error|internal server error/i);

    const response = await responsePromise;
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(500);
  });

  test("Lab Intelligence surfaces a recoverable API error instead of an application crash", async ({ page }) => {
    await signIn(page);
    await page.goto(`${baseURL}/dashboard/workspace/lab-intelligence`);
    await page.getByRole("button", { name: "Load Demo" }).click();

    await page.route("**/api/lab-intelligence", async route => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ success: false, message: "Synthetic QA failure" }),
      });
    });

    await page.getByRole("button", { name: "Analyze Laboratory Results" }).click();

    await expect(page.locator("body")).not.toContainText(/application error|internal server error/i);
    await expect(page.getByRole("button", { name: "Analyze Laboratory Results" })).toBeEnabled({ timeout: 10_000 });
  });
});
