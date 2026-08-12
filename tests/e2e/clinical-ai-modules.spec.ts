import { test, expect } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const email = process.env.PLAYWRIGHT_EMAIL;
const password = process.env.PLAYWRIGHT_PASSWORD;

const cases = [
  { name: "Lab Intelligence", path: "/dashboard/workspace/lab-intelligence", terms: /lab|result|finding|review|evidence/i },
  { name: "Medication Review", path: "/dashboard/workspace/medications", terms: /medication|drug|review|finding|evidence/i },
  { name: "Adverse Events", path: "/dashboard/workspace/adverse-events", terms: /adverse|event|severity|review|evidence/i },
  { name: "Protocol Deviations", path: "/dashboard/workspace/deviations", terms: /deviation|protocol|review|finding|evidence/i },
  { name: "Safety Signals", path: "/dashboard/workspace/safety", terms: /safety|signal|risk|review|evidence/i },
  { name: "Medical Coding", path: "/dashboard/workspace/medical-coding", terms: /coding|code|clinical|review|evidence/i },
];

async function signIn(page: Parameters<typeof test>[0]) {}

test.describe("TrialIQ live clinical AI module QA", () => {
  test.skip(!email || !password, "QA credentials are not configured");

  test.beforeEach(async ({ page }) => {
    await page.goto(`${baseURL}/auth`);
    await page.getByLabel(/email/i).fill(email!);
    await page.getByLabel(/password/i).fill(password!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  for (const item of cases) {
    test(`${item.name} exposes a real analysis/review surface`, async ({ page }) => {
      await page.goto(`${baseURL}${item.path}`);
      await expect(page).toHaveURL(new RegExp(item.path.replaceAll("/", "\\/")));

      await expect(
        page.getByText(item.terms).first()
      ).toBeVisible({ timeout: 10000 });

      // We deliberately do not assert exact LLM wording. The test verifies
      // that the module exposes a clinical evidence/review surface before
      // deeper module-specific cases are added.
      await expect(page.locator("body")).not.toContainText(/application error|internal server error/i);
    });
  }
});
