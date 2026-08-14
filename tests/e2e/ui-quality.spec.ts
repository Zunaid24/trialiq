import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const email = process.env.PLAYWRIGHT_EMAIL;
const password = process.env.PLAYWRIGHT_PASSWORD;

const clinicalIntelligenceFixture = {
  success: true,
  result: {
    studyTitle: "TrialIQ UI QA Study",
    participantId: "P-001",
    executiveDecision: "Review required before final decision",
    decisionReadiness: "Review Required",
    executiveSummary: "The evidence supports targeted reviewer follow-up before a final decision.",
    priorityFindings: [
      {
        priority: "High",
        title: "Eligibility evidence requires review",
        finding: "One decision-critical source remains incomplete.",
        findingType: "Eligibility",
        whyItMatters: "The missing source could change the reviewer assessment.",
        interpretation: "Treat the finding as unresolved pending verification.",
        evidence: [{ sourceId: "QA-001", fact: "Example source evidence." }],
        missingEvidence: ["Eligibility confirmation"],
        recommendedAction: "Review and confirm the missing evidence.",
        status: "Requires Review",
        confidence: 82,
      },
    ],
    crossDocumentLinks: [
      {
        title: "Source relationship",
        relationship: "Related evidence across documents",
        clinicalRelevance: "The relationship should be reviewed together.",
        evidence: [{ sourceId: "QA-001", fact: "Example linked evidence." }],
        status: "Review Required",
      },
    ],
    protocolImpact: {
      affectedCriteria: [
        {
          criterion: "Protocol screening criterion",
          impact: "Reviewer confirmation is required.",
          measuredValue: "Pending",
          threshold: "Required",
          evidence: [{ sourceId: "QA-001", fact: "Example protocol evidence." }],
          status: "Pending",
        },
      ],
      overallImpact: "One supplied criterion remains pending review.",
    },
    safetyAssessment: {
      signals: [
        {
          title: "Safety signal",
          interpretation: "Requires reviewer assessment of the supplied evidence.",
          evidence: [{ sourceId: "QA-001", fact: "Example safety evidence." }],
          status: "Review Required",
        },
      ],
      overallAssessment: "Safety interpretation remains subject to reviewer assessment.",
    },
    dataGaps: [
      {
        gap: "Missing source evidence",
        whyItMatters: "The missing evidence could change the assessment.",
        sourceIds: ["QA-001"],
        nextAction: "Obtain and review the missing source.",
      },
    ],
    whatWouldChangeConclusion: [
      {
        evidenceNeeded: "Eligibility confirmation",
        reason: "This evidence could change the decision readiness.",
        priority: "Next Review",
      },
    ],
    coordinatorActions: [
      {
        priority: "High",
        action: "Verify the unresolved evidence.",
        reason: "The evidence is required for reviewer triage.",
        sourceIds: ["QA-001"],
      },
    ],
    auditSummary: { sourcesReviewed: 1, evidenceBackedFindings: 1, unresolvedItems: 1 },
    evidenceQuality: "Moderate",
    evidenceCompleteness: 75,
    confidence: 82,
    confidenceRationale: "Confidence reflects the available evidence and unresolved gaps.",
    limitations: ["UI fixture only"],
    reviewPressure: "High",
    decisionReasons: ["One source remains unresolved."],
    quality: { evidenceCoverage: 80, actionability: 80, specificity: 80, unresolvedEvidence: 20, overall: 80 },
    aiModel: "UI QA Fixture",
  },
};

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

async function mockClinicalIntelligence(page: Page) {
  await page.route("**/api/clinical-intelligence", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(clinicalIntelligenceFixture),
    });
  });
}

async function captureUiEvidence(page: Page, testInfo: Parameters<Parameters<typeof test.afterEach>[0]>[0]) {
  const root = process.env.PLAYWRIGHT_EVIDENCE_DIR;
  if (!root) return;

  const match = testInfo.title.match(/^(\d+)/);
  const id = Number(match?.[1] || 0);
  if (!id) return;

  const screenshotPath = path.join(root, `${String(id).padStart(2, "0")}.png`);
  const evidencePath = path.join(root, `${String(id).padStart(2, "0")}.json`);
  await fs.mkdir(root, { recursive: true });

  try {
    await page.screenshot({ path: screenshotPath, fullPage: true });
  } catch {}

  let visibleText = "";
  try { visibleText = (await page.locator("body").innerText()).slice(0, 30000); } catch {}

  let controls: string[] = [];
  try {
    controls = await page.locator("button,a,input,select,textarea").evaluateAll((nodes) => nodes.slice(0, 200).map((node) => {
      const element = node as HTMLElement;
      const input = node as HTMLInputElement;
      return `${node.tagName.toLowerCase()} | text=${(element.innerText || "").trim().slice(0, 120)} | aria=${node.getAttribute("aria-label") || ""} | name=${input.name || ""} | type=${input.type || ""}`;
    }));
  } catch {}

  await fs.writeFile(evidencePath, JSON.stringify({
    testId: id,
    testName: testInfo.title,
    url: page.url(),
    visibleText,
    controls,
    screenshotPath,
    capturedAt: new Date().toISOString(),
  }, null, 2), "utf8");
}

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
    await mockClinicalIntelligence(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await captureUiEvidence(page, testInfo);
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
    await expect(page.getByRole("button", { name: /refresh intelligence/i })).toBeVisible({ timeout: 15_000 });
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
