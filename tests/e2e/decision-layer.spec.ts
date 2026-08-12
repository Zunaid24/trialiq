import { test, expect } from "@playwright/test";
import { evaluateDecisionReadiness } from "../../lib/clinicalDecisionLayer";

test.describe("TrialIQ decision readiness", () => {
  test("flags missing evidence as not decision-ready", () => {
    const result = evaluateDecisionReadiness({ evidenceBackedFindings: 0, missingEvidence: 2 });
    expect(result.readiness).toBe("Not Decision-Ready");
    expect(result.reviewPressure).toBe("Moderate");
  });

  test("flags unresolved high-priority findings for review", () => {
    const result = evaluateDecisionReadiness({ evidenceBackedFindings: 3, highPriorityFindings: 1, unresolvedItems: 1 });
    expect(result.readiness).toBe("Review Required");
    expect(result.reviewPressure).toBe("Moderate");
  });

  test("allows a clean evidence-backed case to be decision-ready", () => {
    const result = evaluateDecisionReadiness({ evidenceBackedFindings: 3 });
    expect(result.readiness).toBe("Decision-Ready");
    expect(result.reviewPressure).toBe("Low");
  });
});
