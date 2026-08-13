export type EvidencePack = {
  study?: { studyTitle?: string; participantId?: string };
  sources?: { id: string; type?: string; facts?: string[] }[];
};

export type ProtocolCheck = {
  criterion: string;
  measuredValue: string;
  threshold: string;
  impact: string;
  status: "Met" | "Not Met" | "Pending" | "Requires Review";
  evidence: { sourceId: string; fact: string }[];
};

const criteria = [
  { name: "Hemoglobin", pattern: /Hemoglobin\s+(\d+(?:\.\d+)?)/i },
  { name: "ANC", pattern: /ANC\s+(\d+(?:\.\d+)?)/i },
  { name: "Platelets", pattern: /Platelets\s+(\d+(?:\.\d+)?)/i },
  { name: "Creatinine", pattern: /Creatinine\s+(\d+(?:\.\d+)?)/i },
  { name: "ALT", pattern: /ALT\s+(\d+(?:\.\d+)?)/i },
  { name: "AST", pattern: /AST\s+(\d+(?:\.\d+)?)/i },
  { name: "Total bilirubin", pattern: /Total bilirubin\s+(\d+(?:\.\d+)?)/i },
] as const;

function thresholdFor(fact: string) {
  const match = fact.match(/threshold:\s*(>=|<=|>|<)\s*(\d+(?:\.\d+)?)/i);
  return match ? { operator: match[1], value: Number(match[2]) } : null;
}

function passes(value: number, operator: string, threshold: number) {
  if (operator === ">=") return value >= threshold;
  if (operator === "<=") return value <= threshold;
  if (operator === ">") return value > threshold;
  return value < threshold;
}

export function deriveDeterministicProtocolChecks(pack: EvidencePack): ProtocolCheck[] {
  const sources = Array.isArray(pack?.sources) ? pack.sources : [];
  const protocol = sources.find((source) => /protocol/i.test(source.type || source.id));
  if (!protocol?.facts?.length) return [];

  return criteria.flatMap((criterion): ProtocolCheck[] => {
    const protocolFact = protocol.facts?.find((fact) => new RegExp(`${criterion.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+screening threshold`, "i").test(fact));
    const threshold = protocolFact ? thresholdFor(protocolFact) : null;
    if (!protocolFact || !threshold) return [];

    const labSources = sources.filter((source) => /laboratory|lab/i.test(source.type || source.id));
    const measured = labSources.flatMap((source) => (source.facts || []).map((fact) => ({ sourceId: source.id, fact }))).find((entry) => criterion.pattern.test(entry.fact));
    if (!measured) return [{ criterion: `${criterion.name} screening threshold`, measuredValue: "Not available", threshold: protocolFact, impact: "A measured value is not available in the supplied laboratory evidence, so this criterion cannot be determined.", status: "Pending", evidence: [{ sourceId: protocol.id, fact: protocolFact }] }];

    const match = measured.fact.match(criterion.pattern);
    const value = match ? Number(match[1]) : NaN;
    if (!Number.isFinite(value)) return [];
    const met = passes(value, threshold.operator, threshold.value);
    return [{
      criterion: `${criterion.name} screening threshold`,
      measuredValue: String(value),
      threshold: protocolFact,
      impact: met ? `${criterion.name} is within the supplied protocol screening threshold.` : `${criterion.name} is outside the supplied protocol screening threshold and requires eligibility review.`,
      status: met ? "Met" : "Not Met",
      evidence: [{ sourceId: protocol.id, fact: protocolFact }, { sourceId: measured.sourceId, fact: measured.fact }],
    }];
  });
}

export function enrichEvidenceQuality(result: any, pack: EvidencePack) {
  const sources = Array.isArray(pack?.sources) ? pack.sources : [];
  const sourceIds = new Set(sources.map((source) => source.id));
  const used = new Set<string>();
  for (const finding of result.priorityFindings || []) for (const evidence of finding.evidence || []) if (sourceIds.has(evidence.sourceId)) used.add(evidence.sourceId);
  const gaps = Array.isArray(result.dataGaps) ? result.dataGaps.length : 0;
  const sourceCoverage = sourceIds.size ? Math.round((used.size / sourceIds.size) * 100) : 0;
  const evidenceBacked = (result.priorityFindings || []).filter((finding: any) => Array.isArray(finding.evidence) && finding.evidence.length).length;
  const findingCoverage = (result.priorityFindings || []).length ? Math.round((evidenceBacked / result.priorityFindings.length) * 100) : 0;
  const completeness = Math.max(0, Math.min(100, Math.round(sourceCoverage * 0.45 + findingCoverage * 0.35 + Math.max(0, 100 - gaps * 15) * 0.2)));
  result.evidenceCompleteness = completeness;
  result.auditSummary = { ...(result.auditSummary || {}), sourcesReviewed: sources.length, evidenceBackedFindings: evidenceBacked };
  return result;
}
