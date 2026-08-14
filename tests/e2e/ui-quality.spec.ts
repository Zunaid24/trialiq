import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const email = process.env.PLAYWRIGHT_EMAIL;
const password = process.env.PLAYWRIGHT_PASSWORD;

async function signIn(page: Page) {
  if (!email || !password) {
    throw new Error("PLAYWRIGHT_EMAIL and PLAYWRIGHT_PASSWORD must be configured for authenticated UI tests.");
  }

  await page.goto("/auth");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.afterEach(async ({ page }, testInfo) => {
  const evidenceDir = process.env.PLAYWRIGHT_EVIDENCE_DIR;
  if (!evidenceDir || testInfo.status === "skipped") return;

  const id = Number(String(testInfo.title).match(/^(\d+)/)?.[1] || 0);
  if (!id) return;

  await fs.mkdir(evidenceDir, { recursive: true });
  const screenshotPath = path.join(evidenceDir, `${String(id).padStart(2, "0")}.jpg`);
  const evidencePath = path.join(evidenceDir, `${String(id).padStart(2, "0")}.json`);

  let visibleText = "";
  let controls: string[] = [];
  try {
    visibleText = await page.locator("body").innerText({ timeout: 3_000 });
    controls = await page.locator("button, a, input, select, textarea").evaluateAll((elements) =>
      elements.slice(0, 80).map((element) => {
        const node = element as HTMLElement;
        const label = node.getAttribute("aria-label") || node.getAttribute("name") || node.innerText || ("value" in node ? String((node as HTMLInputElement).value) : "");
        return `${element.tagName.toLowerCase()}: ${label.trim().replace(/\s+/g, " ")}`;
      }).filter(Boolean)
    );
  } catch {}

  try {
    await page.screenshot({ path: screenshotPath, type: "jpeg", quality: 60, fullPage: true });
  } catch {}

  await fs.writeFile(evidencePath, JSON.stringify({
    testId: id,
    testName: testInfo.title,
    status: testInfo.status,
    durationMs: testInfo.duration,
    url: page.url(),
    visibleText: visibleText.slice(0, 30_000),
    controls,
    screenshotPath,
  }, null, 2), "utf8");
});

test.describe("TrialIQ UI quality — public", () => {
  test("01 — landing page exposes the primary workspace CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/TrialIQ/i);
    await expect(page.locator("header").getByRole("link", { name: /launch workspace/i })).toBeVisible();
  });

  test("02 — auth page exposes usable sign-in controls", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("03 — auth form has keyboard-focusable controls", async ({ page }) => {
    await page.goto("/auth");
    await page.getByLabel(/email/i).focus();
    await expect(page.getByLabel(/email/i)).toBeFocused();
    await page.getByLabel(/password/i).focus();
    await expect(page.getByLabel(/password/i)).toBeFocused();
    await page.getByRole("button", { name: /sign in/i }).focus();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeFocused();
  });
});

test.describe("TrialIQ UI quality — authenticated navigation", () => {
  test.skip(!email || !password, "QA credentials are not configured");

  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("04 — dashboard renders the core application navigation", async ({ page }) => {
    await expect(page.getByText(/TrialIQ AI/i).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /review queue/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /clinical workspace/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /analytics/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /reports/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /settings/i })).toBeVisible();
  });

  test("05 — review queue route loads", async ({ page }) => {
    await page.getByRole("link", { name: /review queue/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/review-queue/);
  });

  test("06 — clinical workspace route loads", async ({ page }) => {
    await page.getByRole("link", { name: /clinical workspace/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/workspace/);
  });

  test("07 — analytics route loads", async ({ page }) => {
    await page.getByRole("link", { name: /analytics/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/analytics/);
  });

  test("08 — reports route loads", async ({ page }) => {
    await page.getByRole("link", { name: /reports/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/reports/);
  });

  test("09 — settings route loads", async ({ page }) => {
    await page.getByRole("link", { name: /settings/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/settings/);
  });

  test("10 — clinical intelligence page exposes the evidence-to-decision workflow", async ({ page }) => {
    await page.goto("/dashboard/clinical-intelligence");
    await expect(page.getByRole("heading", { name: /from evidence to decisions/i })).toBeVisible({ timeout: 15_000 });
    const intelligenceAction = page.getByRole("button", { name: /refresh intelligence|connecting evidence/i });
    await expect(intelligenceAction).toBeVisible({ timeout: 15_000 });
  });

  test("11 — clinical intelligence exposes its core review sections", async ({ page }) => {
    await page.goto("/dashboard/clinical-intelligence");
    await expect(page.getByRole("heading", { name: /priority findings/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /cross-document connections/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /protocol impact/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /safety assessment/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /evidence gaps/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /coordinator action plan/i })).toBeVisible({ timeout: 15_000 });
  });

  test("12 — clinical intelligence presents the reviewer disclaimer", async ({ page }) => {
    await page.goto("/dashboard/clinical-intelligence");
    await expect(page.getByText(/does not independently establish final eligibility/i)).toBeVisible({ timeout: 15_000 });
  });
});
