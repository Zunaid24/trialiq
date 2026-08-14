import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

type Intelligence = any;
let result: Intelligence;

// This suite is the source of truth for the automated AI quality gates. It can
// run manually in headed mode, or from /test.html in headless mode.
test.describe("TrialIQ AI output quality benchmark", () => {
  test.setTimeout(120_000);

  test.beforeAll(async ({ browser }) => {
    const email = process.env.PLAYWRIGHT_EMAIL;
    const password = process.env.PLAYWRIGHT_PASSWORD;

    if (!email || !password) {
      throw new Error(
        "PLAYWRIGHT_EMAIL and PLAYWRIGHT_PASSWORD must be configured for the AI quality benchmark."
      );
    }

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto("/auth");
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/password/i).fill(password);
      await page.getByRole("button", { name: /sign in/i }).click();
      await page.waitForURL(/\/dashboard/, { timeout: 15_000 });

      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().includes("/api/clinical-intelligence") &&
          response.request().method() === "POST",
        { timeout: 105_000 }
      );

      await page.goto("/dashboard/clinical-intelligence");

      const response = await responsePromise;
      expect(response.ok()).toBeTruthy();

      const payload = await response.json();
      expect(payload.success).toBeTruthy();
      result = payload.result;

      if (process.env.PLAYWRIGHT_RESULT_FILE) {
        await fs.mkdir(path.dirname(process.env.PLAYWRIGHT_RESULT_FILE), { recursive: true });
        await fs.writeFile(
          process.env.PLAYWRIGHT_RESULT_FILE,
          JSON.stringify(result, null, 2),
          "utf8"
        );
      }

      await expect(
        page.getByRole("heading", { name: /Priority findings/i })
      ).toBeVisible({ timeout: 10_000 });
    } finally {
      await context.close();
    }
  }, 180_000);

  test("01 — returns a decision-level executive conclusion", () => {
    expect(String(result.executiveDecision)).not.toHaveLength(0);
  });

  test("02 — distinguishes review readiness from confidence", () => {
    expect(["Decision-Ready", "Review Required", "Not Decision-Ready"]).toContain(result.decisionReadiness);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
  });

  test("03 — produces prioritized findings", () => expect(result.priorityFindings.length).toBeGreaterThan(0));
  test("04 — every priority finding has evidence", () => result.priorityFindings.forEach((f: any) => expect(f.evidence?.length).toBeGreaterThan(0)));
  test("05 — every evidence item identifies a source", () => result.priorityFindings.flatMap((f: any) => f.evidence || []).forEach((e: any) => expect(String(e.sourceId)).not.toHaveLength(0)));
  test("06 — findings explain why they matter", () => result.priorityFindings.forEach((f: any) => expect(String(f.whyItMatters)).not.toHaveLength(0)));
  test("07 — findings include operational actions", () => result.priorityFindings.forEach((f: any) => expect(String(f.recommendedAction)).not.toHaveLength(0)));
  test("08 — missing evidence is surfaced", () => expect(Array.isArray(result.dataGaps)).toBeTruthy());
  test("09 — protocol impact is represented separately", () => expect(result.protocolImpact).toBeTruthy());
  test("10 — safety assessment is represented separately", () => expect(result.safetyAssessment).toBeTruthy());
  test("11 — cross-document relationships are explicit", () => expect(Array.isArray(result.crossDocumentLinks)).toBeTruthy());

  test("12 — single-participant evidence is not promoted to population incidence", () => {
    const text = JSON.stringify(result).toLowerCase();

    // Reject an actual population-level conclusion, while allowing the model
    // to explicitly state that such a conclusion has NOT been established.
    expect(text).not.toMatch(
      /population[- ]level (incidence|rate|signal) (is|was|has been) established/
    );

    // Require explicit single-participant framing.
    expect(text).toMatch(/single[- ]participant/);

    // Require the model to acknowledge that population-level inference is not
    // supported by the available evidence.
    expect(text).toMatch(
      /does not (establish|support|permit).{0,100}population[- ]level/
    );
  });

  test("13 — temporal association is not presented as causality", () => expect(JSON.stringify(result).toLowerCase()).not.toMatch(/proves? .*causality|confirmed .*causal relationship/));

  test("14 — undocumented eligibility evidence remains reviewable", () => {
    const eligibilityText = [
      result.executiveDecision,
      result.executiveSummary,
      ...(result.priorityFindings || []).map((f: any) => [f.title, f.finding, f.interpretation, f.status].join(" ")),
      ...(result.dataGaps || []).map((g: any) => [g.gap, g.whyItMatters, g.nextAction].join(" ")),
      JSON.stringify(result.protocolImpact),
    ].join(" ").toLowerCase();
    expect(eligibilityText).toMatch(/eligib|exclusion|washout/);
    expect(eligibilityText).toMatch(/review|required|unconfirmed|cannot be confirmed|not met|missing|pending/);
    expect(eligibilityText).not.toMatch(/undocumented[^.]{0,120}(met|eligible|confirmed)/);
  });

  test("15 — recommendations remain operational", () => expect(JSON.stringify(result).toLowerCase()).not.toMatch(/increase dose|decrease dose|start treatment|stop treatment/));
  test("16 — every coordinator action has a reason", () => result.coordinatorActions.forEach((a: any) => expect(String(a.reason)).not.toHaveLength(0)));
  test("17 — audit counts are present", () => { expect(result.auditSummary.sourcesReviewed).toBeGreaterThan(0); expect(result.auditSummary.evidenceBackedFindings).toBeGreaterThanOrEqual(0); expect(result.auditSummary.unresolvedItems).toBeGreaterThanOrEqual(0); });
  test("18 — evidence quality uses controlled vocabulary", () => expect(["High", "Moderate", "Low"]).toContain(result.evidenceQuality));
  test("19 — confidence rationale is present", () => expect(String(result.confidenceRationale)).not.toHaveLength(0));
  test("20 — model provenance is exposed for auditability", () => expect(String(result.aiModel)).not.toHaveLength(0));
  test("21 — lab findings are connected to protocol impact when supported", () => { const text = JSON.stringify(result).toLowerCase(); expect(text).toMatch(/hemoglobin|anc|platelet|creatinine|alt|ast/); expect(text).toMatch(/protocol|eligib/); });
  test("22 — medication reasoning does not invent a prohibited-medication conclusion", () => { const text = JSON.stringify(result).toLowerCase(); expect(text).toMatch(/prednisone|medication/); expect(text).not.toMatch(/prednisone (is|was) (definitely|confirmed) prohibited/); });
  test("23 — protocol deviation reasoning addresses operational or data-integrity impact", () => { const text = JSON.stringify(result).toLowerCase(); expect(text).toMatch(/deviation|day 21|visit window/); expect(text).toMatch(/impact|safety|data|assessment|review/); });
  test("24 — medical coding reasoning does not fabricate final dictionary codes", () => { const text = JSON.stringify(result).toLowerCase(); expect(text).toMatch(/coding|meddra/); expect(text).not.toMatch(/final (meddra|dictionary) (code|id|identifier) is \d+/); });
  test("25 — overall decision coherence reflects unresolved evidence", () => { const text = JSON.stringify(result).toLowerCase(); expect(text).toMatch(/review required|not decision-ready|pending|unresolved|cannot (confirm|finalize)/); expect(result.dataGaps.length).toBeGreaterThan(0); });

  // Scenario-quality gates. These deliberately stay output-focused; UI, role,
  // workflow and persistence behavior are covered by later test-suite phases.
  test("26 — evidence lineage survives into the decision narrative", () => {
    const text = JSON.stringify(result).toLowerCase();
    const sourceIds = (result.priorityFindings || []).flatMap((f: any) => f.evidence || []).map((e: any) => String(e.sourceId).toLowerCase()).filter(Boolean);
    expect(sourceIds.length).toBeGreaterThan(0);
    expect(sourceIds.some((id: string) => text.includes(id))).toBeTruthy();
  });

  test("27 — unsupported claims are suppressed when source evidence is incomplete", () => {
    const text = JSON.stringify(result).toLowerCase();
    expect(text).not.toMatch(/definitively eligible|definitively caused|proves? the event was caused|confirmed prohibited medication/);
  });

  test("28 — unresolved evidence creates an actionable review step", () => {
    const actions = [
      ...(result.priorityFindings || []).map((f: any) => f.recommendedAction),
      ...(result.dataGaps || []).map((g: any) => g.nextAction),
      ...(result.coordinatorActions || []).map((a: any) => a.action),
    ].map(String).join(" ").toLowerCase();
    expect(actions.length).toBeGreaterThan(20);
    expect(actions).toMatch(/review|confirm|verify|assess|check|document|obtain|repeat|reconcile/);
  });

  test("29 — why-it-matters statements are specific enough for reviewer triage", () => {
    const reasons = (result.priorityFindings || []).map((f: any) => String(f.whyItMatters || "").trim());
    expect(reasons.length).toBeGreaterThan(0);
    expect(reasons.every((reason: string) => reason.length >= 20)).toBeTruthy();
  });

  test("30 — longitudinal context is preserved across dates and visit timing", () => {
    const text = JSON.stringify(result).toLowerCase();
    expect(text).toMatch(/05-aug|aug-2026|day 15|day 21|visit window|01-aug/);
    expect(text).toMatch(/temporal|timeline|after|before|window|date|day/);
  });

  test("31 — contradiction and uncertainty are represented rather than silently resolved", () => {
    const text = JSON.stringify(result).toLowerCase();
    expect(text).toMatch(/not documented|not provided|uncertain|unclear|cannot confirm|pending|requires review|missing/);
  });

  test("32 — sparse or incomplete source evidence does not produce definitive clinical treatment instructions", () => {
    const text = JSON.stringify(result).toLowerCase();
    expect(text).not.toMatch(/increase dose|decrease dose|start treatment|stop treatment|definitive diagnosis|confirmed causal relationship/);
    expect(text).toMatch(/review|assessment|evidence|uncertain|pending|confirm/);
  });

  test("33 — the output preserves the required evidence-to-decision chain", () => {
    expect(result.priorityFindings?.length).toBeGreaterThan(0);
    expect(result.dataGaps?.length).toBeGreaterThan(0);
    expect(String(result.executiveDecision)).not.toHaveLength(0);
    expect(String(result.decisionReadiness)).not.toHaveLength(0);
    expect((result.priorityFindings || []).every((f: any) => String(f.whyItMatters || "").length > 0)).toBeTruthy();
    expect((result.priorityFindings || []).every((f: any) => String(f.recommendedAction || "").length > 0)).toBeTruthy();
  });
});
