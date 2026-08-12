import { test, expect } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const email = process.env.PLAYWRIGHT_EMAIL;
const password = process.env.PLAYWRIGHT_PASSWORD;

test.describe("TrialIQ Lab Intelligence result UI QA", () => {
  test.skip(!email || !password, "QA credentials are not configured");
  test.setTimeout(120_000);

  test("renders the clinical result and evidence-oriented review state", async ({ page }) => {
    await page.goto(`${baseURL}/auth`);
    await page.getByLabel(/email/i).fill(email!);
    await page.getByLabel(/password/i).fill(password!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto(`${baseURL}/dashboard/workspace/lab-intelligence`);
    await page.getByRole("button", { name: "Load Demo" }).click();

    const responsePromise = page.waitForResponse(
      response => response.url().includes("/api/lab-intelligence") && response.request().method() === "POST",
      { timeout: 60_000 }
    );

    await page.getByRole("button", { name: "Analyze Laboratory Results" }).click();
    const response = await responsePromise;
    const payload = await response.json();

    expect(
      response.ok(),
      `Lab Intelligence API returned HTTP ${response.status()}: ${JSON.stringify(payload)}`
    ).toBeTruthy();
    expect(payload.success).toBeTruthy();
    expect(payload.result).toBeTruthy();

    const result = payload.result;
    expect(Array.isArray(result.labs)).toBeTruthy();
    expect(result.labs.length).toBeGreaterThan(0);
    expect(typeof result.screeningReadiness).toBe("string");
    expect(typeof result.evidenceQuality).toBe("string");
    expect(Array.isArray(result.followUpActions)).toBeTruthy();

    // Verify the UI renders clinically meaningful result content rather than only completing the API call.
    await expect(page.locator("body")).toContainText(/Lab Intelligence|laboratory/i, { timeout: 30_000 });
    await expect(page.locator("body")).toContainText(/Hemoglobin/i);
    await expect(page.locator("body")).toContainText(/Creatinine/i);
    await expect(page.locator("body")).toContainText(/ALT/i);
    await expect(page.locator("body")).toContainText(/Requires Review/i);
    await expect(page.locator("body")).toContainText(/Protocol-Relevant Concerns|Follow-up Actions|Missing Laboratory Information/i);
    await expect(page.locator("body")).not.toContainText(/application error|internal server error/i);

    await page.screenshot({ path: "test-results/lab-result-ui.png", fullPage: true });
  });
});
