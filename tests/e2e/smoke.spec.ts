import { test, expect } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";

test.describe("TrialIQ public smoke", () => {
  test("landing page loads with primary navigation", async ({ page }) => {
    await page.goto(baseURL);
    await expect(page).toHaveTitle(/TrialIQ/i);

    // The landing page intentionally contains multiple Launch Workspace CTAs.
    // Scope the assertion to the header so the smoke test verifies primary navigation
    // rather than failing on Playwright strict-mode ambiguity.
    await expect(page.locator("header").getByRole("link", { name: /launch workspace/i })).toBeVisible();
  });

  test("auth page loads", async ({ page }) => {
    await page.goto(`${baseURL}/auth`);
    await expect(page).toHaveURL(/\/auth/);
    await expect(page.getByRole("heading", { name: /sign in|welcome/i })).toBeVisible();
  });
});

test.describe("TrialIQ authenticated smoke", () => {
  test.skip(!process.env.PLAYWRIGHT_EMAIL || !process.env.PLAYWRIGHT_PASSWORD, "QA credentials are not configured");

  test("QA user can reach the dashboard and core navigation", async ({ page }) => {
    await page.goto(`${baseURL}/auth`);
    await page.getByLabel(/email/i).fill(process.env.PLAYWRIGHT_EMAIL!);
    await page.getByLabel(/password/i).fill(process.env.PLAYWRIGHT_PASSWORD!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await expect(page.getByText(/TrialIQ AI/i).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /review queue/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /clinical workspace/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /analytics/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /reports/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /settings/i })).toBeVisible();
  });
});
