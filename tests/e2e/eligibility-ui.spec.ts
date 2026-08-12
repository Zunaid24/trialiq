import { test, expect } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const email = process.env.PLAYWRIGHT_EMAIL;
const password = process.env.PLAYWRIGHT_PASSWORD;

test.describe("TrialIQ Eligibility UI interaction QA", () => {
  test.skip(!email || !password, "QA credentials are not configured");

  test("demo case loads and analysis controls transition correctly", async ({ page }) => {
    await page.goto(`${baseURL}/auth`);
    await page.getByLabel(/email/i).fill(email!);
    await page.getByLabel(/password/i).fill(password!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto(`${baseURL}/dashboard/workspace/eligibility`);

    const loadDemo = page.getByRole("button", { name: /load demo case/i });
    await expect(loadDemo).toBeVisible();
    await expect(loadDemo).toBeEnabled();

    await loadDemo.click();

    await expect(page.getByText(/protocol-demo\.pdf/i)).toBeVisible();
    await expect(page.getByText(/participant-demo\.pdf/i)).toBeVisible();

    const analyze = page.getByRole("button", { name: /analyze eligibility/i });
    await expect(analyze).toBeVisible();
    await expect(analyze).toBeEnabled();

    await expect(page.locator("body")).not.toContainText(/application error|internal server error/i);
  });
});
