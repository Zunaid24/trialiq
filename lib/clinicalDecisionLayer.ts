export type DecisionReadiness = "Decision-Ready" | "Review Required" | "Not Decision-Ready";

export interface DecisionLayerInput {
  evidenceBackedFindings?: number;
  unresolvedItems?: number;
  highPriorityFindings?: number;
  contradictions?: number;
  missingEvidence?: number;
}

export interface DecisionLayerResult {
  readiness: DecisionReadiness;
  reviewPressure: "Low" | "Moderate" | "High";
  reasons: string[];
}

export function evaluateDecisionReadiness(input: DecisionLayerInput): DecisionLayerResult {
  const evidence = input.evidenceBackedFindings ?? 0;
  const unresolved = input.unresolvedItems ?? 0;
  const high = input.highPriorityFindings ?? 0;
  const contradictions = input.contradictions ?? 0;
  const gaps = input.missingEvidence ?? 0;
  const reasons: string[] = [];

  if (evidence === 0) reasons.push("No evidence-backed findings are available.");
  if (contradictions > 0) reasons.push(`${contradictions} evidence conflict${contradictions === 1 ? "" : "s"} require review.`);
  if (gaps > 0) reasons.push(`${gaps} evidence gap${gaps === 1 ? "" : "s"} may change the assessment.`);
  if (high > 0) reasons.push(`${high} high-priority finding${high === 1 ? "" : "s"} require attention.`);

  const pressureScore = high * 3 + unresolved + contradictions * 2 + gaps;
  const reviewPressure = pressureScore >= 5 ? "High" : pressureScore >= 2 ? "Moderate" : "Low";

  if (evidence === 0 || contradictions > 0) return { readiness: "Not Decision-Ready", reviewPressure, reasons };
  if (unresolved > 0 || gaps > 0 || high > 0) return { readiness: "Review Required", reviewPressure, reasons };
  return { readiness: "Decision-Ready", reviewPressure, reasons };
}
