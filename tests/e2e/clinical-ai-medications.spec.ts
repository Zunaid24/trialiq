import { test, expect } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const email = process.env.PLAYWRIGHT_EMAIL;
const password = process.env.PLAYWRIGHT_PASSWORD;

test.describe("TrialIQ live clinical AI QA — Medication Review", () => {
  test.skip(!email || !password, "QA credentials are not configured");

  test("runs the demo medication analysis and returns a clinical result", async ({ page }) => {
    await page.goto(`${baseURL}/auth`);
    await page.getByLabel(/email/i).fill(email!);
    await page.getByLabel(/password/i).fill(password!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole("link", { name: /clinical workspace/i }).click();
    await page.getByRole("link", { name: /medication review/i }).click();
    await page.getByRole("button", { name: "Load Demo" }).click();

    const responsePromise = page.waitForResponse(
      response => response.url().includes("/api/medications") && response.request().method() === "POST",
      { timeout: 60000 }
    );

    await page.getByRole("button", { name: "Analyze Medications" }).click();

    const response = await responsePromise;
    const body = await response.json();

    console.log("MEDICATION API STATUS:", response.status());
    console.log("MEDICATION API RESPONSE:", JSON.stringify(body, null, 2));

    expect(response.ok(), `Medication API returned HTTP ${response.status()}: ${JSON.stringify(body)}`).toBeTruthy();

    const serialized = JSON.stringify(body);

    expect(serialized.length).toBeGreaterThan(100);
    expect(serialized).toMatch(/medication|drug|clinical|risk|finding|evidence|review/i);

    await expect(page.locator("body")).not.toContainText(/application error|internal server error/i);
  });
});
