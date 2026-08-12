import { test, expect, Page } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const email = process.env.PLAYWRIGHT_EMAIL;
const password = process.env.PLAYWRIGHT_PASSWORD;

test.describe("TrialIQ live clinical AI QA — Eligibility", () => {
  test.skip(!email || !password, "QA credentials are not configured");
  test.setTimeout(120_000);

  async function signIn(page: Page) {
    await page.goto(`${baseURL}/auth`);
    await page.getByLabel(/email/i).fill(email!);
    await page.getByLabel(/password/i).fill(password!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  }

  test("runs the demo Eligibility analysis and returns a structured clinical review", async ({ page }) => {
    await signIn(page);
    await page.goto(`${baseURL}/dashboard/workspace/eligibility`);

    await expect(page.getByRole("button", { name: /load demo case/i })).toBeVisible();
    await page.getByRole("button", { name: /load demo case/i }).click();

    await expect(page.getByText(/protocol-demo\.pdf/i)).toBeVisible();
    await expect(page.getByText(/participant-demo\.pdf/i)).toBeVisible();

    const responsePromise = page.waitForResponse(
      (response) => response.url().includes("/api/analyze") && response.request().method() === "POST",
      { timeout: 30_000 }
    );

    await page.getByRole("button", { name: /analyze eligibility/i }).click();

    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();

    const payload = await response.json();
    expect(payload.success).toBeTruthy();
    expect(payload.result).toBeTruthy();

    const result = payload.result;
    expect(typeof result.screeningResult).toBe("string");
    expect(typeof result.executiveSummary === "string" || typeof result.reasonForIneligibility === "string").toBeTruthy();
    expect(result.criteriaEvaluation).toBeTruthy();
    expect(Array.isArray(result.criteriaEvaluation.inclusion)).toBeTruthy();
    expect(Array.isArray(result.criteriaEvaluation.exclusion)).toBeTruthy();
    expect(Array.isArray(result.pendingAssessments)).toBeTruthy();
    expect(Array.isArray(result.recommendations)).toBeTruthy();
    expect(typeof result.confidence).toBe("number");
    expect(typeof result.evidenceQuality).toBe("string");

    await expect(page.getByText(/AI-assisted eligibility review/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/Eligibility criteria review/i)).toBeVisible();
    await expect(page.getByText(/Clinical review actions/i)).toBeVisible();
    await expect(page.getByText(/Coordinator recommendations/i)).toBeVisible();

    await page.screenshot({ path: "test-results/eligibility-ai-report.png", fullPage: true });
  });
});
