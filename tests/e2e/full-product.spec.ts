import { test, expect, Page } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const email = process.env.PLAYWRIGHT_EMAIL;
const password = process.env.PLAYWRIGHT_PASSWORD;

const routes = [
  ["Dashboard", "/dashboard"],
  ["Review Queue", "/dashboard/review-queue"],
  ["Clinical Workspace", "/dashboard/workspace"],
  ["Eligibility", "/dashboard/workspace/eligibility"],
  ["Protocol Intelligence", "/dashboard/workspace/protocol"],
  ["Lab Intelligence", "/dashboard/workspace/lab-intelligence"],
  ["Medication Review", "/dashboard/workspace/medications"],
  ["Adverse Events", "/dashboard/workspace/adverse-events"],
  ["Protocol Deviations", "/dashboard/workspace/deviations"],
  ["Safety Signals", "/dashboard/workspace/safety"],
  ["Reconciliation", "/dashboard/workspace/reconciliation"],
  ["Medical Coding", "/dashboard/workspace/medical-coding"],
  ["Visit Assistant", "/dashboard/workspace/visit-assistant"],
  ["Source Review", "/dashboard/workspace/source-review"],
  ["Patient Matching", "/dashboard/workspace/patient-matching"],
  ["Analytics", "/dashboard/analytics"],
  ["Reports", "/dashboard/reports"],
  ["Settings", "/dashboard/settings"],
  ["Team", "/dashboard/team"],
] as const;

async function signIn(page: Page) {
  await page.goto(`${baseURL}/auth`);
  await page.getByLabel(/email/i).fill(email!);
  await page.getByLabel(/password/i).fill(password!);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("TrialIQ full authenticated product QA", () => {
  test.skip(!email || !password, "QA credentials are not configured");

  test("dashboard exposes core enterprise navigation", async ({ page }) => {
    await signIn(page);
    for (const label of ["Review Queue", "Clinical Workspace", "Analytics", "Reports", "Settings"]) {
      await expect(page.getByRole("link", { name: new RegExp(label, "i") }).first()).toBeVisible();
    }
  });

  for (const [name, route] of routes) {
    test(`${name} route loads without application error`, async ({ page }) => {
      await signIn(page);
      await page.goto(`${baseURL}${route}`);
      await expect(page).toHaveURL(new RegExp(route.replaceAll("/", "\\/")));
      await expect(page.locator("body")).not.toContainText(/application error|internal server error|unhandled runtime error/i);
      await expect(page.locator("main")).toBeVisible();
    });
  }

  test("sign out returns the user to public authentication", async ({ page }) => {
    await signIn(page);
    const signOut = page.getByRole("button", { name: /sign out|logout/i }).first();
    await expect(signOut).toBeVisible();
    await signOut.click();
    await expect(page).toHaveURL(/\/(auth)?$/);
  });
});
