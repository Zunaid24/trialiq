import { test, expect } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";


test.describe("TrialIQ authentication session lifecycle", () => {
  test.skip(
    !process.env.PLAYWRIGHT_EMAIL || !process.env.PLAYWRIGHT_PASSWORD,
    "QA credentials are not configured"
  );

  test("authenticated session survives a full page reload", async ({ page }) => {
    await page.goto(`${baseURL}/auth`);
    await page.getByLabel(/email/i).fill(process.env.PLAYWRIGHT_EMAIL!);
    await page.getByLabel(/password/i).fill(process.env.PLAYWRIGHT_PASSWORD!);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("link", { name: /review queue/i })).toBeVisible();

    await page.reload();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("link", { name: /clinical workspace/i })).toBeVisible();
    await expect(page.getByText(/TrialIQ AI/i).first()).toBeVisible();
    await expect(page).not.toHaveURL(/\/auth/);
  });
});
