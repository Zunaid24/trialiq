import { test, expect } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const email = process.env.PLAYWRIGHT_EMAIL;
const password = process.env.PLAYWRIGHT_PASSWORD;

test.describe("TrialIQ live clinical AI QA — Lab Intelligence", () => {
  test.skip(!email || !password, "QA credentials are not configured");

  test("runs the demo laboratory analysis and returns a structured clinical result", async ({ page }) => {
    await page.goto(baseURL);
    await page.getByRole("link", { name: "Sign in" }).click();
    await page.getByRole("textbox", { name: "Email" }).fill(email!);
    await page.getByRole("textbox", { name: "Password" }).fill(password!);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await page.getByRole("link", { name: "Clinical Workspace" }).click();
    await page.getByRole("link", { name: "Lab Intelligence Identify" }).click();
    await page.getByRole("button", { name: "Load Demo" }).click();

    const responsePromise = page.waitForResponse(
      response => response.url().includes("/api/lab-intelligence") && response.request().method() === "POST",
      { timeout: 60000 }
    );

    await page.getByRole("button", { name: "Analyze Laboratory Results" }).click();
    const response = await responsePromise;

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    const serialized = JSON.stringify(result);

    expect(serialized.length).toBeGreaterThan(100);
    expect(serialized).toMatch(/lab|laboratory|result|finding|abnormal|clinical|evidence/i);

    await expect(page.locator("body")).not.toContainText(/application error|internal server error/i);
    await page.screenshot({ path: "test-results/lab-intelligence-ai-report.png", fullPage: true });

    test.info().annotations.push({
      type: "clinical-ai",
      description: "Live Lab Intelligence analysis response was returned successfully and contained clinical result/evidence content.",
    });
  });
});
