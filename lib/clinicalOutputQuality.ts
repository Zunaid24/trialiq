export interface OutputQuality { evidenceCoverage: number; actionability: number; specificity: number; unresolvedEvidence: number; overall: number; }

export function scoreClinicalOutput(result: any): OutputQuality {
  const findings = Array.isArray(result?.priorityFindings) ? result.priorityFindings : [];
  const evidenceBacked = findings.filter((f: any) => Array.isArray(f?.evidence) && f.evidence.length > 0).length;
  const actionable = findings.filter((f: any) => String(f?.recommendedAction ?? "").trim().length >= 20).length;
  const specific = findings.filter((f: any) => String(f?.whyItMatters ?? "").trim().length >= 30).length;
  const gaps = Array.isArray(result?.dataGaps) ? result.dataGaps.length : 0;
  const ratio = (n: number) => findings.length ? Math.round((n / findings.length) * 100) : 0;
  const evidenceCoverage = ratio(evidenceBacked);
  const actionability = ratio(actionable);
  const specificity = ratio(specific);
  const unresolvedEvidence = Math.min(100, gaps * 20);
  const overall = Math.round(evidenceCoverage * 0.4 + actionability * 0.3 + specificity * 0.3 - unresolvedEvidence * 0.1);
  return { evidenceCoverage, actionability, specificity, unresolvedEvidence, overall: Math.max(0, Math.min(100, overall)) };
}
