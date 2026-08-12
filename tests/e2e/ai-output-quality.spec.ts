import { test, expect } from "@playwright/test";

test.describe("TrialIQ AI output quality contract", () => {
  test("clinical intelligence exposes decision-oriented evidence", async ({ page }) => {
    await page.goto("/dashboard/clinical-intelligence");
    await expect(page.getByText(/From evidence to decisions/i)).toBeVisible();
    await expect(page.getByText(/Priority findings/i)).toBeVisible();
    await expect(page.getByText(/Protocol impact/i)).toBeVisible();
  });

  test("clinical memory exposes longitudinal intelligence context", async ({ page }) => {
    await page.goto("/dashboard/memory");
    await expect(page.getByText(/Clinical Memory/i).first()).toBeVisible();
    await expect(page.getByText(/Recurring risk patterns/i)).toBeVisible();
  });

  test("review queue exposes persisted decision workflow", async ({ page }) => {
    await page.goto("/dashboard/review-queue");
    await expect(page.getByText(/Review Queue/i).first()).toBeVisible();
    await expect(page.getByText(/Work the decisions/i)).toBeVisible();
  });
});
