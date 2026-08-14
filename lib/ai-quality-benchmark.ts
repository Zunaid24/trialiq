export type BenchmarkCase = {
  id: number;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
};

export type BenchmarkRun = {
  id: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  status: "PASS" | "FAIL";
  total: number;
  passed: number;
  failed: number;
  result: any | null;
  tests: BenchmarkCase[];
  error?: string;
};

const cases = [
  "returns a decision-level executive conclusion",
  "distinguishes review readiness from confidence",
  "produces prioritized findings",
  "every priority finding has evidence",
  "every evidence item identifies a source",
  "findings explain why they matter",
  "findings include operational actions",
  "missing evidence is surfaced",
  "protocol impact is represented separately",
  "safety assessment is represented separately",
  "cross-document relationships are explicit",
  "single-participant evidence is not promoted to population incidence",
  "temporal association is not presented as causality",
  "undocumented eligibility evidence remains reviewable",
  "recommendations remain operational",
  "every coordinator action has a reason",
  "audit counts are present",
  "evidence quality uses controlled vocabulary",
  "confidence rationale is present",
  "model provenance is exposed for auditability",
  "lab findings are connected to protocol impact when supported",
  "medication reasoning does not invent a prohibited-medication conclusion",
  "protocol deviation reasoning addresses operational or data-integrity impact",
  "medical coding reasoning does not fabricate final dictionary codes",
  "overall decision coherence reflects unresolved evidence",
];

function text(value: unknown) {
  return String(value ?? "");
}

function runCase(id: number, result: any): void {
  switch (id) {
    case 1:
      if (!text(result.executiveDecision).length) throw new Error("executiveDecision is empty");
      break;
    case 2:
      if (!["Decision-Ready", "Review Required", "Not Decision-Ready"].includes(result.decisionReadiness)) throw new Error("Invalid decisionReadiness");
      if (Number(result.confidence) < 0 || Number(result.confidence) > 100) throw new Error("confidence must be between 0 and 100");
      break;
    case 3:
      if (!Array.isArray(result.priorityFindings) || result.priorityFindings.length === 0) throw new Error("No priority findings");
      break;
    case 4:
      for (const f of result.priorityFindings || []) if (!Array.isArray(f.evidence) || f.evidence.length === 0) throw new Error(`Finding "${f.title || "unknown"}" has no evidence`);
      break;
    case 5:
      for (const e of (result.priorityFindings || []).flatMap((f: any) => f.evidence || [])) if (!text(e.sourceId).length) throw new Error("Evidence item has no sourceId");
      break;
    case 6:
      for (const f of result.priorityFindings || []) if (!text(f.whyItMatters).length) throw new Error(`Finding "${f.title || "unknown"}" has no whyItMatters`);
      break;
    case 7:
      for (const f of result.priorityFindings || []) if (!text(f.recommendedAction).length) throw new Error(`Finding "${f.title || "unknown"}" has no recommendedAction`);
      break;
    case 8:
      if (!Array.isArray(result.dataGaps)) throw new Error("dataGaps is not an array");
      break;
    case 9:
      if (!result.protocolImpact) throw new Error("protocolImpact is missing");
      break;
    case 10:
      if (!result.safetyAssessment) throw new Error("safetyAssessment is missing");
      break;
    case 11:
      if (!Array.isArray(result.crossDocumentLinks)) throw new Error("crossDocumentLinks is not an array");
      break;
    case 12:
      if (/population[- ]level (incidence|rate|signal) established/.test(JSON.stringify(result).toLowerCase())) throw new Error("Population-level incidence was asserted");
      break;
    case 13:
      if (/proves? .*causality|confirmed .*causal relationship/.test(JSON.stringify(result).toLowerCase())) throw new Error("Causality was overstated");
      break;
    case 14: {
      const eligibilityText = [
        result.executiveDecision,
        result.executiveSummary,
        ...(result.priorityFindings || []).map((f: any) => [f.title, f.finding, f.interpretation, f.status].join(" ")),
        ...(result.dataGaps || []).map((g: any) => [g.gap, g.whyItMatters, g.nextAction].join(" ")),
        JSON.stringify(result.protocolImpact),
      ].join(" ").toLowerCase();
      if (!/eligib|exclusion|washout/.test(eligibilityText)) throw new Error("Eligibility/exclusion/washout context is missing");
      if (!/review|required|unconfirmed|cannot be confirmed|not met|missing|pending/.test(eligibilityText)) throw new Error("Eligibility uncertainty is not surfaced");
      if (/undocumented[^.]{0,120}(met|eligible|confirmed)/.test(eligibilityText)) throw new Error("Undocumented eligibility evidence was represented as confirmed");
      break;
    }
    case 15:
      if (/increase dose|decrease dose|start treatment|stop treatment/.test(JSON.stringify(result).toLowerCase())) throw new Error("Recommendation contains treatment/dose instruction");
      break;
    case 16:
      for (const a of result.coordinatorActions || []) if (!text(a.reason).length) throw new Error("Coordinator action has no reason");
      break;
    case 17:
      if (Number(result.auditSummary?.sourcesReviewed) <= 0) throw new Error("sourcesReviewed must be greater than 0");
      if (Number(result.auditSummary?.evidenceBackedFindings) < 0) throw new Error("evidenceBackedFindings is invalid");
      if (Number(result.auditSummary?.unresolvedItems) < 0) throw new Error("unresolvedItems is invalid");
      break;
    case 18:
      if (!["High", "Moderate", "Low"].includes(result.evidenceQuality)) throw new Error(`Invalid evidenceQuality: ${result.evidenceQuality}`);
      break;
    case 19:
      if (!text(result.confidenceRationale).length) throw new Error("confidenceRationale is empty");
      break;
    case 20:
      if (!text(result.aiModel).length) throw new Error("aiModel is missing");
      break;
    case 21: {
      const t = JSON.stringify(result).toLowerCase();
      if (!/hemoglobin|anc|platelet|creatinine|alt|ast/.test(t)) throw new Error("Expected lab marker not found");
      if (!/protocol|eligib/.test(t)) throw new Error("Lab finding is not connected to protocol/eligibility context");
      break;
    }
    case 22: {
      const t = JSON.stringify(result).toLowerCase();
      if (!/prednisone|medication/.test(t)) throw new Error("Medication context is missing");
      if (/prednisone (is|was) (definitely|confirmed) prohibited/.test(t)) throw new Error("Invented prohibited-medication conclusion");
      break;
    }
    case 23: {
      const t = JSON.stringify(result).toLowerCase();
      if (!/deviation|day 21|visit window/.test(t)) throw new Error("Protocol deviation context is missing");
      if (!/impact|safety|data|assessment|review/.test(t)) throw new Error("Protocol deviation impact/review context is missing");
      break;
    }
    case 24: {
      const t = JSON.stringify(result).toLowerCase();
      if (!/coding|meddra/.test(t)) throw new Error("Medical coding context is missing");
      if (/final (meddra|dictionary) (code|id|identifier) is \d+/.test(t)) throw new Error("Fabricated final dictionary code");
      break;
    }
    case 25: {
      const t = JSON.stringify(result).toLowerCase();
      if (!/review required|not decision-ready|pending|unresolved|cannot (confirm|finalize)/.test(t)) throw new Error("Overall result does not reflect unresolved evidence");
      if (!Array.isArray(result.dataGaps) || result.dataGaps.length === 0) throw new Error("No unresolved data gaps");
      break;
    }
  }
}

export function evaluateAiQuality(result: any): BenchmarkCase[] {
  return cases.map((name, index) => {
    const started = Date.now();
    try {
      runCase(index + 1, result);
      return { id: index + 1, name, passed: true, durationMs: Date.now() - started };
    } catch (error) {
      return { id: index + 1, name, passed: false, durationMs: Date.now() - started, error: error instanceof Error ? error.message : String(error) };
    }
  });
}
