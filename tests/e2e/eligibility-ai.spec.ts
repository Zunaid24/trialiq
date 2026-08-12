import { test, expect } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const email = process.env.PLAYWRIGHT_EMAIL;
const password = process.env.PLAYWRIGHT_PASSWORD;

test.describe("TrialIQ Eligibility clinical QA", () => {
  test.skip(!email || !password, "QA credentials are not configured");

  test("authenticated user can open the Eligibility workspace", async ({ page }) => {
    await page.goto(`${baseURL}/auth`);
    await page.getByLabel(/email/i).fill(email!);
    await page.getByLabel(/password/i).fill(password!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    const workspaceLink = page.getByRole("link", { name: /clinical workspace/i });
    await expect(workspaceLink).toBeVisible();
    await workspaceLink.click();

    await expect(page).toHaveURL(/\/workspace/i);
    await expect(page.getByText(/eligibility/i).first()).toBeVisible();
  });

  test("eligibility UI exposes evidence-oriented review states", async ({ page }) => {
    await page.goto(`${baseURL}/auth`);
    await page.getByLabel(/email/i).fill(email!);
    await page.getByLabel(/password/i).fill(password!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole("link", { name: /clinical workspace/i }).click();
    await expect(page).toHaveURL(/\/workspace/i);

    const eligibility = page.getByText(/eligibility/i).first();
    await expect(eligibility).toBeVisible();
    await eligibility.click();

    // Clinical QA does not assert exact LLM prose. It verifies that the
    // workflow exposes an evidence/review-oriented result surface when data
    // is available, rather than treating the model response as authoritative.
    await expect(
      page.getByText(/evidence|review|confidence|criterion|finding/i).first()
    ).toBeVisible();
  });
});
