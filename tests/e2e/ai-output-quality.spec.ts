import { test, expect } from "@playwright/test";

test.describe("TrialIQ AI output quality contract", () => {
  test("clinical workspace exposes evidence-oriented review", async ({ page }) => {
    await page.goto("/dashboard/clinical-workspace");
    await expect(page.getByText(/evidence|clinical/i).first()).toBeVisible();
  });

  test("clinical memory exposes persisted intelligence context", async ({ page }) => {
    await page.goto("/dashboard/memory");
    await expect(page.getByText(/clinical memory/i).first()).toBeVisible();
  });
});
