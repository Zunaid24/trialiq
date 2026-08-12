const gapPattern = /\b(not documented|unknown|insufficient evidence|not provided|not available|cannot be determined|pending|unable to determine|not established)\b/i;

function sourceIds(value: any): string[] {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.trim()) : [];
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
    if (gapPattern.test(String(finding.finding ?? "")) && finding.status === "Confirmed") {
      finding.status = "Requires Review";
    }
    return Boolean(String(finding.title ?? finding.finding ?? "").trim());
  });

  for (const link of result.crossDocumentLinks) {
    if (!link || typeof link !== "object") continue;
    if (sourceIds(link.evidence).length === 0 && Array.isArray(link.evidence)) link.status = "Requires Review";
  }

  if (result.protocolImpact?.affectedCriteria) {
    for (const criterion of result.protocolImpact.affectedCriteria) {
      if (!criterion || typeof criterion !== "object") continue;
      const evidence = Array.isArray(criterion.evidence) ? criterion.evidence : [];
      if ((criterion.status === "Met" || criterion.status === "Not Met") && evidence.length === 0) {
        criterion.status = "Requires Review";
      }
    }
  }

  if (result.safetyAssessment?.signals) {
    for (const signal of result.safetyAssessment.signals) {
      if (!signal || typeof signal !== "object") continue;
      if (!Array.isArray(signal.evidence) || signal.evidence.length === 0) signal.status = "Requires Review";
    }
  }

  const unresolved = result.dataGaps.length;
  const unsupported = result.priorityFindings.filter((item: any) => item.status === "Requires Review").length;
  result.auditSummary = {
    ...(result.auditSummary ?? {}),
    unresolvedItems: unresolved,
    evidenceBackedFindings: result.priorityFindings.filter((item: any) => Array.isArray(item.evidence) && item.evidence.length > 0).length,
  };

  if (unresolved > 0 || unsupported > 0) {
    result.decisionReadiness = "Review Required";
    result.confidence = Math.min(Number(result.confidence ?? 100), unsupported > 0 ? 82 : 90);
  }

  return result;
}
