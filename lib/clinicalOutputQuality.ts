export interface OutputQuality { evidenceCoverage: number; actionability: number; specificity: number; contradictionHandling: number; uncertaintyHandling: number; overall: number; }
interface ClinicalFinding { evidence?: unknown; recommendedAction?: unknown; whyItMatters?: unknown; missingEvidence?: unknown; status?: unknown; }
interface ClinicalResult { priorityFindings?: unknown; dataGaps?: unknown; crossDocumentLinks?: unknown; }
export function scoreClinicalOutput(result: unknown): OutputQuality {
  const value = (result ?? {}) as ClinicalResult;
  const findings = Array.isArray(value.priorityFindings) ? value.priorityFindings as ClinicalFinding[] : [];
  const evidenceBacked = findings.filter((f) => Array.isArray(f.evidence) && f.evidence.length > 0).length;
  const actionable = findings.filter((f) => String(f.recommendedAction ?? "").trim().length >= 30).length;
  const specific = findings.filter((f) => String(f.whyItMatters ?? "").trim().length >= 40).length;
  const uncertainty = findings.filter((f) => f.status !== "Confirmed" || (Array.isArray(f.missingEvidence) && f.missingEvidence.length > 0)).length;
  const links = Array.isArray(value.crossDocumentLinks) ? value.crossDocumentLinks as any[] : [];
  const conflicts = links.filter((link) => /conflict|contradiction|inconsistent/i.test(JSON.stringify(link))).length;
  const linksWithEvidence = links.filter((link) => Array.isArray(link.evidence) && link.evidence.length > 0).length;
  const ratio = (count: number) => findings.length ? Math.round((count / findings.length) * 100) : 0;
  const evidenceCoverage = ratio(evidenceBacked);
  const actionability = ratio(actionable);
  const specificity = ratio(specific);
  const uncertaintyHandling = findings.length ? Math.round((uncertainty / findings.length) * 100) : 0;
  const contradictionHandling = conflicts === 0 ? 100 : Math.round((linksWithEvidence / conflicts) * 100);
  const overall = Math.max(0, Math.min(100, Math.round(evidenceCoverage * .35 + actionability * .25 + specificity * .2 + uncertaintyHandling * .1 + contradictionHandling * .1)));
  return { evidenceCoverage, actionability, specificity, contradictionHandling, uncertaintyHandling, overall };
}
