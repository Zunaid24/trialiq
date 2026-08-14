import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const MODELS = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite"] as const;

const SYSTEM = `
You are TrialIQ's cross-document clinical trial intelligence engine. Think like a clinical data review team, not a document summarizer.

MISSION:
Connect protocol requirements, participant records, laboratory results, medications, adverse events, deviations, safety and coding evidence into traceable review intelligence. Optimize for decision quality, risk-based review and reviewer time saved.

EVIDENCE HIERARCHY:
1. OBSERVED FACT — directly stated in a supplied source.
2. DERIVED CHECK — deterministic comparison of an observed value with a supplied protocol requirement.
3. INTERPRETATION — reasoned meaning of one or more supported facts.
4. POTENTIAL RELATIONSHIP — plausible connection that still needs confirmation.
5. RECOMMENDED ACTION — operational review step, never treatment advice.
Never present a derived check or interpretation as an observed fact.

NON-NEGOTIABLE RULES:
- Use only supplied source facts. Never invent thresholds, dates, doses, diagnoses, codes, page numbers, causality, reportability or regulatory conclusions.
- Every material finding must cite one or more source IDs.
- Absence of documentation is not evidence of absence.
- If sources conflict, surface the conflict explicitly.
- Never turn a single-participant observation into a population-level signal.
- Never make a final medical, eligibility, safety-reportability or coding decision.
- Temporal association is not causality. State timing separately from causal interpretation.
- A missing assessment must remain Pending/Review Required, not negative.
- Recommendations must be operational and specific.

POPULATION INFERENCE GUARDRAIL:
- Treat participant-level evidence as participant-level evidence unless supplied sources explicitly contain population-level data.
- When the evidence is limited to a single participant, you MUST explicitly state that population-level inference is not supported.
- In the output, populate populationInference with supported=false, scope="Single Participant", and a concise rationale that uses the phrase "does not support population-level inference".
- Never imply that a single participant establishes, confirms, or demonstrates a population incidence, rate, or safety signal.

DECISION VALUE:
- Prioritize findings that can change enrollment/eligibility, participant safety review, protocol compliance, data integrity, coding quality or coordinator workload.
- Explain WHY the finding changes the next decision.
- Identify exactly what evidence would change the conclusion.
- Prefer risk-based prioritization over exhaustive repetition.
- Distinguish finding confidence from evidence completeness and decision readiness.
- Surface new-vs-known changes when prior evidence exists.

Return ONLY valid JSON. No markdown fences, comments, trailing commas, or explanatory text.
`;

function extractJsonObject(text: string) {
  const cleaned = text.replace(/^\uFEFF/, "").replace(/```json/gi, "").replace(/```/g, "").replace(/\u0000/g, "").trim();
  const start = cleaned.indexOf("{");
  if (start < 0) throw new Error("Clinical intelligence returned no JSON object.");
  let depth = 0; let inString = false; let escaped = false;
  for (let i = start; i < cleaned.length; i += 1) {
    const char = cleaned[i];
    if (inString) { if (escaped) escaped = false; else if (char === "\\") escaped = true; else if (char === '"') inString = false; continue; }
    if (char === '"') { inString = true; continue; }
    if (char === "{") depth += 1;
    if (char === "}") { depth -= 1; if (depth === 0) return cleaned.slice(start, i + 1); }
  }
  throw new Error("Clinical intelligence returned an incomplete JSON object.");
}

function repairJsonSyntax(input: string) {
  let output = input;
  output = output.replace(/(^|\n)\s*\/\/.*(?=\n|$)/g, "$1");
  output = output.replace(/\/\*[\s\S]*?\*\//g, "");
  output = output.replace(/,\s*([}\]])/g, "$1");
  output = output.replace(/([\{,]\s*)([A-Za-z_$][A-Za-z0-9_$-]*)\s*:/g, '$1"$2":');
  output = output.replace(/([\{,]\s*)'([A-Za-z_$][A-Za-z0-9_$-]*)'\s*:/g, '$1"$2":');
  return output;
}

function parseJson(text: string) {
  const extracted = extractJsonObject(text);
  try { return JSON.parse(extracted); } catch (firstError) {
    const repaired = repairJsonSyntax(extracted);
    try { return JSON.parse(repaired); } catch (secondError) {
      const position = secondError instanceof SyntaxError ? secondError.message : firstError instanceof SyntaxError ? firstError.message : "unknown JSON parse error";
      throw new Error(`Clinical intelligence returned malformed JSON after syntax repair: ${position}`);
    }
  }
}

function enforcePopulationInferenceGuardrail(result: any) {
  const participantId = typeof result?.participantId === "string" ? result.participantId.trim() : "";
  const existing = result?.populationInference;

  if (existing && typeof existing === "object") {
    existing.supported = existing.supported === true && !participantId;
    if (!existing.scope) existing.scope = participantId ? "Single Participant" : "Unknown";
    if (!existing.rationale || participantId) {
      existing.rationale = participantId
        ? "The available evidence is participant-level and does not support population-level inference."
        : existing.rationale || "Population-level inference requires explicit population-level source evidence.";
    }
    return;
  }

  result.populationInference = participantId
    ? {
        supported: false,
        scope: "Single Participant",
        rationale: "The available evidence is participant-level and does not support population-level inference.",
      }
    : {
        supported: false,
        scope: "Unknown",
        rationale: "Population-level inference requires explicit population-level source evidence.",
      };
}

export async function analyzeClinicalIntelligence(evidencePack: unknown) {
  const prompt = `
Build an executive Clinical Intelligence assessment for the supplied study evidence.

Return exactly this shape:
{
  "studyTitle":"",
  "participantId":"",
  "executiveDecision":"",
  "decisionReadiness":"Decision-Ready | Review Required | Not Decision-Ready",
  "executiveSummary":"",
  "populationInference":{"supported":false,"scope":"Single Participant | Population | Unknown","rationale":""},
  "priorityFindings":[
    {
      "priority":"Critical | High | Moderate",
      "title":"",
      "finding":"",
      "findingType":"Observed Fact | Derived Check | Interpretation | Temporal Association | Potential Relationship | Data Quality Issue | Decision Impact",
      "whyItMatters":"",
      "interpretation":"",
      "causality":"Not Established | Possible | Supported by supplied evidence | Not applicable",
      "evidence":[{"sourceId":"","fact":""}],
      "missingEvidence":[],
      "recommendedAction":"",
      "status":"Confirmed | Potential | Requires Review",
      "confidence":0
    }
  ],
  "crossDocumentLinks":[{"title":"","relationship":"","clinicalRelevance":"","evidence":[{"sourceId":"","fact":""}],"status":"Confirmed | Potential | Requires Review"}],
  "protocolImpact":{"affectedCriteria":[{"criterion":"","impact":"","evidence":[{"sourceId":"","fact":""}],"status":"Met | Not Met | Pending | Requires Review"}],"overallImpact":""},
  "safetyAssessment":{"signals":[{"title":"","interpretation":"","evidence":[{"sourceId":"","fact":""}],"status":"Pattern Observed | Potential Signal | Requires Review"}],"overallAssessment":""},
  "dataGaps":[{"gap":"","whyItMatters":"","sourceIds":[],"nextAction":""}],
  "whatWouldChangeConclusion":[{"evidenceNeeded":"","reason":"","priority":"Immediate | Next Review | Monitor"}],
  "coordinatorActions":[{"priority":"Immediate | Next Review | Monitor","action":"","reason":"","sourceIds":[]}],
  "auditSummary":{"sourcesReviewed":0,"evidenceBackedFindings":0,"unresolvedItems":0},
  "evidenceQuality":"High | Moderate | Low",
  "confidence":0,
  "confidenceRationale":"",
  "limitations":[]
}

QUALITY BAR:
- Never use generic actions such as 'review the patient' or 'monitor closely'. State what to verify, why, and which source supports it.
- For protocol thresholds, state measured value + protocol requirement + decision impact. Do not rely on reference ranges when a protocol threshold is supplied.
- For medication/event timing, state temporal association and keep causality separate.
- For deviations, explain potential data-integrity and operational impact without inventing severity.
- For clusters, preserve the single-participant limitation.
- For undocumented exclusion criteria, use Pending/Review Required.
- Explicitly identify contradictions and what evidence resolves them.
- If prior measurements are supplied, distinguish new change from known finding and quantify direction/magnitude when possible.
- Every recommendation must be actionable for a reviewer or coordinator.
- If participantId identifies a single participant, populationInference.supported MUST be false and populationInference.rationale MUST explicitly say that the evidence does not support population-level inference.

EVIDENCE PACK:\n${JSON.stringify(evidencePack, null, 2)}`;

  let lastError: unknown;
  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({ model, contents: `${SYSTEM}\n${prompt}`, config: { responseMimeType: "application/json", temperature: 0.1 } });
      const result = parseJson(response.text ?? "");
      if (result && typeof result === "object") {
        enforcePopulationInferenceGuardrail(result);
        result.aiModel = model;
        result.aiFallbackUsed = model !== MODELS[0];
      }
      return result;
    } catch (error) { lastError = error; }
  }
  throw lastError ?? new Error("Clinical intelligence analysis failed.");
}
