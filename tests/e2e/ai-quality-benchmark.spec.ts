import { test, expect } from "@playwright/test";

type Intelligence = any;
let result: Intelligence;

// This suite intentionally focuses on AI output quality rather than navigation or button mechanics.
// One authenticated live model call feeds 25 independent quality gates.
test.describe("TrialIQ AI output quality benchmark", () => {
  test.beforeAll(async ({ browser }) => {
    const baseURL =
      process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
    const email = process.env.PLAYWRIGHT_EMAIL;
    const password = process.env.PLAYWRIGHT_PASSWORD;

    if (!email || !password) {
      throw new Error(
        "PLAYWRIGHT_EMAIL and PLAYWRIGHT_PASSWORD must be configured for the AI quality benchmark."
      );
    }

    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();

    try {
      // Authenticate through the real TrialIQ UI so the Supabase session
      // established by the browser is available to the protected API route.
      await page.goto("/auth");
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/password/i).fill(password);
      await page.getByRole("button", { name: /sign in/i }).click();
      await expect(page).toHaveURL(/\/dashboard/);

      const sourceResponse = await context.request.get(
        "/demo/clinical-intelligence-evidence.json"
      );
      expect(sourceResponse.ok()).toBeTruthy();

      const evidencePack = await sourceResponse.json();

      const response = await context.request.post(
        "/api/clinical-intelligence",
        {
          data: { evidencePack },
        }
      );

      expect(response.ok()).toBeTruthy();

      const payload = await response.json();
      expect(payload.success).toBeTruthy();

      result = payload.result;
    } finally {
      await context.close();
    }
  });

  test("01 — returns a decision-level executive conclusion", () =>
    expect(String(result.executiveDecision)).not.toHaveLength(0)
  );

  test("02 — distinguishes review readiness from confidence", () => {
    expect(["Decision-Ready", "Review Required", "Not Decision-Ready"]).toContain(
      result.decisionReadiness
    );
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
  });

  test("03 — produces prioritized findings", () =>
    expect(result.priorityFindings.length).toBeGreaterThan(0)
  );

  test("04 — every priority finding has evidence", () =>
    result.priorityFindings.forEach((f: any) =>
      expect(f.evidence?.length).toBeGreaterThan(0)
    )
  );

  test("05 — every evidence item identifies a source", () =>
    result.priorityFindings
      .flatMap((f: any) => f.evidence || [])
      .forEach((e: any) =>
        expect(String(e.sourceId)).not.toHaveLength(0)
      )
  );

  test("06 — findings explain why they matter", () =>
    result.priorityFindings.forEach((f: any) =>
      expect(String(f.whyItMatters)).not.toHaveLength(0)
    )
  );

  test("07 — findings include operational actions", () =>
    result.priorityFindings.forEach((f: any) =>
      expect(String(f.recommendedAction)).not.toHaveLength(0)
    )
  );

  test("08 — missing evidence is surfaced", () =>
    expect(Array.isArray(result.dataGaps)).toBeTruthy()
  );

  test("09 — protocol impact is represented separately", () =>
    expect(result.protocolImpact).toBeTruthy()
  );

  test("10 — safety assessment is represented separately", () =>
    expect(result.safetyAssessment).toBeTruthy()
  );

  test("11 — cross-document relationships are explicit", () =>
    expect(Array.isArray(result.crossDocumentLinks)).toBeTruthy()
  );

  test("12 — single-participant evidence is not promoted to population incidence", () => {
    const text = JSON.stringify(result).toLowerCase();
    expect(text).not.toMatch(
      /population[- ]level (incidence|rate|signal) established/
    );
  });

  test("13 — temporal association is not presented as causality", () => {
    const text = JSON.stringify(result).toLowerCase();
    expect(text).not.toMatch(
      /proves? .*causality|confirmed .*causal relationship/
    );
  });

  test("14 — undocumented eligibility evidence remains reviewable", () => {
    const text = JSON.stringify(result).toLowerCase();
    expect(text).not.toMatch(/undocumented.*(met|eligible|confirmed)/);
  });

  test("15 — recommendations remain operational", () => {
    const text = JSON.stringify(result).toLowerCase();
    expect(text).not.toMatch(
      /increase dose|decrease dose|start treatment|stop treatment/
    );
  });

  test("16 — every coordinator action has a reason", () =>
    result.coordinatorActions.forEach((a: any) =>
      expect(String(a.reason)).not.toHaveLength(0)
    )
  );

  test("17 — audit counts are present", () => {
    expect(result.auditSummary.sourcesReviewed).toBeGreaterThan(0);
    expect(result.auditSummary.evidenceBackedFindings).toBeGreaterThanOrEqual(0);
    expect(result.auditSummary.unresolvedItems).toBeGreaterThanOrEqual(0);
  });

  test("18 — evidence quality uses controlled vocabulary", () =>
    expect(["High", "Moderate", "Low"]).toContain(result.evidenceQuality)
  );

  test("19 — confidence rationale is present", () =>
    expect(String(result.confidenceRationale)).not.toHaveLength(0)
  );

  test("20 — model provenance is exposed for auditability", () =>
    expect(String(result.aiModel)).not.toHaveLength(0)
  );

  test("21 — lab findings are connected to protocol impact when supported", () => {
    const text = JSON.stringify(result).toLowerCase();
    expect(text).toMatch(/hemoglobin|anc|platelet|creatinine|alt|ast/);
    expect(text).toMatch(/protocol|eligib/);
  });

  test("22 — medication reasoning does not invent a prohibited-medication conclusion", () => {
    const text = JSON.stringify(result).toLowerCase();
    expect(text).toMatch(/prednisone|medication/);
    expect(text).not.toMatch(
      /prednisone (is|was) (definitely|confirmed) prohibited/
    );
  });

  test("23 — protocol deviation reasoning addresses operational or data-integrity impact", () => {
    const text = JSON.stringify(result).toLowerCase();
    expect(text).toMatch(/deviation|day 21|visit window/);
    expect(text).toMatch(/impact|safety|data|assessment|review/);
  });

  test("24 — medical coding reasoning does not fabricate final dictionary codes", () => {
    const text = JSON.stringify(result).toLowerCase();
    expect(text).toMatch(/coding|meddra/);
    expect(text).not.toMatch(
      /final (meddra|dictionary) (code|id|identifier) is \d+/
    );
  });

  test("25 — overall decision coherence reflects unresolved evidence", () => {
    const text = JSON.stringify(result).toLowerCase();
    expect(text).toMatch(
      /review required|not decision-ready|pending|unresolved|cannot (confirm|finalize)/
    );
    expect(result.dataGaps.length).toBeGreaterThan(0);
  });
});
