import { test, expect } from "@playwright/test";

test.describe("TrialIQ clinical intelligence quality", () => {
  test.beforeEach(async ({ page }) => { await page.goto("/dashboard/clinical-intelligence"); await expect(page.getByText(/From evidence to decisions/i)).toBeVisible(); });
  test("separates decision readiness from finding support", async ({ page }) => { await expect(page.getByText(/Decision readiness/i)).toBeVisible(); await expect(page.getByText(/finding confidence|support/i).first()).toBeVisible(); await expect(page.getByText(/evidence completeness/i)).toBeVisible(); });
  test("shows deterministic protocol impact", async ({ page }) => { await expect(page.getByText(/Protocol impact/i)).toBeVisible(); await expect(page.getByText(/Observed:/i).first()).toBeVisible(); });
  test("surfaces evidence gaps and decision-changing evidence", async ({ page }) => { await expect(page.getByText(/Evidence gaps/i)).toBeVisible(); await expect(page.getByText(/What would change the conclusion/i)).toBeVisible(); });
  test("shows causality separately from clinical finding", async ({ page }) => { await expect(page.getByText(/Causality:/i).first()).toBeVisible(); });
  test("shows cross-document reasoning", async ({ page }) => { await expect(page.getByText(/Cross-document connections/i)).toBeVisible(); });
  test("shows operational actions with evidence context", async ({ page }) => { await expect(page.getByText(/Coordinator action plan/i)).toBeVisible(); await expect(page.getByText(/Immediate|Next Review|Monitor/i).first()).toBeVisible(); });
  test("shows an output quality score", async ({ page }) => { await expect(page.getByText(/Output quality/i)).toBeVisible(); });
  test("does not present the result as a final medical decision", async ({ page }) => { await expect(page.getByText(/does not independently establish final eligibility/i)).toBeVisible(); });
});
