export interface OutputQuality {
  evidenceCoverage: number;
  actionability: number;
  specificity: number;
  unresolvedEvidence: number;
  overall: number;
}

interface ClinicalFinding {
  evidence?: unknown;
  recommendedAction?: unknown;
  whyItMatters?: unknown;
}

interface ClinicalResult {
  priorityFindings?: unknown;
  dataGaps?: unknown;
}

export function scoreClinicalOutput(result: unknown): OutputQuality {
  const value = (result ?? {}) as ClinicalResult;
  const findings = Array.isArray(value.priorityFindings) ? value.priorityFindings as ClinicalFinding[] : [];
  const evidenceBacked = findings.filter((finding) => Array.isArray(finding.evidence) && finding.evidence.length > 0).length;
  const actionable = findings.filter((finding) => String(finding.recommendedAction ?? "").trim().length >= 20).length;
  const specific = findings.filter((finding) => String(finding.whyItMatters ?? "").trim().length >= 30).length;
  const gaps = Array.isArray(value.dataGaps) ? value.dataGaps.length : 0;
  const ratio = (count: number) => findings.length ? Math.round((count / findings.length) * 100) : 0;
  const evidenceCoverage = ratio(evidenceBacked);
  const actionability = ratio(actionable);
  const specificity = ratio(specific);
  const unresolvedEvidence = Math.min(100, gaps * 20);
  const overall = Math.max(0, Math.min(100, Math.round(
    evidenceCoverage * 0.4 + actionability * 0.3 + specificity * 0.3 - unresolvedEvidence * 0.1,
  )));
  return { evidenceCoverage, actionability, specificity, unresolvedEvidence, overall };
}
