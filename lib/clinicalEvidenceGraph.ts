export type EvidenceNode = { id: string; type: string; label: string };
export type EvidenceRelationship = { from: string; to: string; relationship: string; whyItMatters: string; sourceIds: string[] };

export function buildEvidenceGraph(result: any): { nodes: EvidenceNode[]; relationships: EvidenceRelationship[] } {
  const nodes = new Map<string, EvidenceNode>();
  const relationships: EvidenceRelationship[] = [];
  const addNode = (id: string, type: string, label: string) => { if (id && !nodes.has(id)) nodes.set(id, { id, type, label }); };

  for (const finding of result?.priorityFindings || []) {
    const findingId = `finding:${String(finding.title || "finding")}`;
    addNode(findingId, "finding", String(finding.title || "Clinical finding"));
    for (const evidence of finding.evidence || []) {
      const sourceId = String(evidence.sourceId || "");
      if (!sourceId) continue;
      addNode(`source:${sourceId}`, "source", sourceId);
      relationships.push({ from: `source:${sourceId}`, to: findingId, relationship: "supports", whyItMatters: String(evidence.fact || "Source evidence supports this finding."), sourceIds: [sourceId] });
    }
  }
  for (const link of result?.crossDocumentLinks || []) {
    const title = String(link.title || "Cross-document relationship");
    const linkId = `link:${title}`;
    addNode(linkId, "relationship", title);
    const sourceIds = (link.evidence || []).map((item: any) => String(item.sourceId || "")).filter(Boolean);
    for (const sourceId of sourceIds) {
      addNode(`source:${sourceId}`, "source", sourceId);
      relationships.push({ from: `source:${sourceId}`, to: linkId, relationship: String(link.relationship || "related"), whyItMatters: String(link.clinicalRelevance || "Cross-document evidence is relevant to the review."), sourceIds: [sourceId] });
    }
  }
  return { nodes: Array.from(nodes.values()), relationships };
}
