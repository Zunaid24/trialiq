const gapPattern = /\b(not documented|unknown|insufficient evidence|not provided|not available|cannot be determined|pending|unable to determine|not established)\b/i;
const allowedFindingTypes = new Set(["Observed Fact", "Derived Check", "Interpretation", "Temporal Association", "Potential Relationship", "Data Quality Issue", "Decision Impact"]);
function sourceIds(value: any): string[] { return Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.trim()) : []; }
function hasUnresolvedEligibilityEvidence(finding: any) {
  const text = JSON.stringify({
    title: finding?.title,
    finding: finding?.finding,
    interpretation: finding?.interpretation,
    missingEvidence: finding?.missingEvidence,
    recommendedAction: finding?.recommendedAction,
  }).toLowerCase();
  const hasMissingEvidence = Array.isArray(finding?.missingEvidence) && finding.missingEvidence.some((item: unknown) => String(item).trim());
  const eligibilityContext = /eligib|screen|exclusion|inclusion|washout|prohibited medication|dose|route/.test(text);
  return hasMissingEvidence && eligibilityContext;
}

export function hardenClinicalIntelligence(result: any) {
  if (!result || typeof result !== "object") return result;
  if (!Array.isArray(result.priorityFindings)) result.priorityFindings = [];
  if (!Array.isArray(result.crossDocumentLinks)) result.crossDocumentLinks = [];
  if (!Array.isArray(result.dataGaps)) result.dataGaps = [];
  if (!Array.isArray(result.coordinatorActions)) result.coordinatorActions = [];

  result.priorityFindings = result.priorityFindings.filter((finding: any) => {
    if (!finding || typeof finding !== "object") return false;
    const evidence = Array.isArray(finding.evidence) ? finding.evidence : [];
    if (evidence.length === 0) {
      finding.status = "Requires Review";
      finding.confidence = Math.min(Number(finding.confidence ?? 0), 55);
    }
    if (gapPattern.test(String(finding.finding ?? "")) && finding.status === "Confirmed") finding.status = "Requires Review";

    // Eligibility cannot be presented as confirmed when required supporting
    // evidence is still missing, even if the model separately reports a
    // deterministic protocol threshold failure. Keep the finding reviewable
    // and let the protocol layer distinguish "Not Met" from "Pending".
    if (hasUnresolvedEligibilityEvidence(finding)) {
      finding.status = "Requires Review";
      finding.confidence = Math.min(Number(finding.confidence ?? 0), 82);
    }

    if (!allowedFindingTypes.has(String(finding.findingType))) finding.findingType = "Interpretation";
    if (!finding.causality) finding.causality = "Not applicable";
    if (/temporal/i.test(String(finding.findingType)) && /supported by supplied evidence/i.test(String(finding.causality))) finding.causality = "Possible";
    finding.confidence = Math.max(0, Math.min(100, Number(finding.confidence ?? 0)));
    return Boolean(String(finding.title ?? finding.finding ?? "").trim());
  });

  for (const link of result.crossDocumentLinks) if (link && Array.isArray(link.evidence) && sourceIds(link.evidence).length === 0) link.status = "Requires Review";
  if (result.protocolImpact?.affectedCriteria) for (const criterion of result.protocolImpact.affectedCriteria) if (criterion && ["Met", "Not Met"].includes(criterion.status) && (!Array.isArray(criterion.evidence) || criterion.evidence.length === 0)) criterion.status = "Requires Review";
  if (result.safetyAssessment?.signals) for (const signal of result.safetyAssessment.signals) if (signal && (!Array.isArray(signal.evidence) || signal.evidence.length === 0)) signal.status = "Requires Review";

  const unresolved = result.dataGaps.length;
  const unsupported = result.priorityFindings.filter((item: any) => item.status === "Requires Review").length;
  result.auditSummary = { ...(result.auditSummary ?? {}), unresolvedItems: unresolved, evidenceBackedFindings: result.priorityFindings.filter((item: any) => Array.isArray(item.evidence) && item.evidence.length > 0).length };
  if (unresolved > 0 || unsupported > 0) {
    result.decisionReadiness = "Review Required";
    result.confidence = Math.min(Number(result.confidence ?? 100), unsupported > 0 ? 82 : 90);
  }
  return result;
}
