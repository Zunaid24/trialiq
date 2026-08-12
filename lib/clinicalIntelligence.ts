import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const MODELS = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite"] as const;

const SYSTEM = `
You are TrialIQ's cross-document clinical trial intelligence engine.
Your job is NOT to summarize documents independently. Connect documented evidence across protocol, participant, laboratory, medication, adverse-event, deviation, safety and coding records and produce decision-ready review intelligence for clinical research teams.

NON-NEGOTIABLE EVIDENCE RULES:
- Use only supplied source facts. Never invent facts, thresholds, diagnoses, dates, doses, codes, causality, reportability or regulatory conclusions.
- Every material finding must cite one or more source IDs from the supplied evidence pack.
- Separate FACT, PROTOCOL REQUIREMENT, INTERPRETATION and RECOMMENDED ACTION.
- Absence of documentation is not evidence of absence.
- A finding can be Confirmed only when the supplied evidence directly supports it.
- Potential relationships must be labeled Potential and explain what evidence would confirm them.
- Never turn a single-participant observation into a population-level signal.
- Never make a final medical, eligibility, safety-reportability or coding decision.
- Recommendations are operational review actions, not treatment advice.
- If sources conflict, surface the conflict instead of choosing silently.

VALUE RULES:
- Prioritize findings that change enrollment, participant safety review, protocol compliance, data integrity, coding quality or coordinator workload.
- Connect events across documents when the relationship is supported by dates, identifiers or explicit references.
- Explain WHY each finding matters, not merely WHAT was found.
- Identify missing evidence that could change the assessment.
- Prefer concise decision language over generic clinical prose.
- Confidence measures evidence completeness and consistency, not probability of clinical truth.

Return ONLY valid JSON. No markdown fences, comments, trailing commas, or explanatory text.
`;

/**
 * Extract the outer JSON object without attempting to reinterpret clinical text.
 * We deliberately track strings so a `}` inside quoted evidence cannot truncate the payload.
 */
function extractJsonObject(text: string) {
  const cleaned = text.replace(/^\uFEFF/, "").replace(/```json/gi, "").replace(/```/g, "").replace(/\u0000/g, "").trim();
  const start = cleaned.indexOf("{");
  if (start < 0) throw new Error("Clinical intelligence returned no JSON object.");

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < cleaned.length; i += 1) {
    const char = cleaned[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') { inString = true; continue; }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return cleaned.slice(start, i + 1);
    }
  }
  throw new Error("Clinical intelligence returned an incomplete JSON object.");
}

/**
 * Apply conservative syntax-only repairs. This does not invent values or alter
 * clinical wording; it only repairs common JSON formatting mistakes from LLMs.
 */
function repairJsonSyntax(input: string) {
  let output = input;

  // Remove JavaScript-style comments only when they occur outside quoted strings.
  output = output.replace(/(^|\n)\s*\/\/.*(?=\n|$)/g, "$1");
  output = output.replace(/\/\*[\s\S]*?\*\//g, "");

  // Remove trailing commas before object/array delimiters.
  output = output.replace(/,\s*([}\]])/g, "$1");

  // Gemini can occasionally emit an unquoted object key. Quote only identifiers
  // immediately following an object start/comma and immediately preceding `:`.
  output = output.replace(/([\{,]\s*)([A-Za-z_$][A-Za-z0-9_$-]*)\s*:/g, '$1"$2":');

  // Normalize accidental single-quoted keys only; do not rewrite single quotes
  // inside arbitrary clinical strings.
  output = output.replace(/([\{,]\s*)'([A-Za-z_$][A-Za-z0-9_$-]*)'\s*:/g, '$1"$2":');

  return output;
}

function parseJson(text: string) {
  const extracted = extractJsonObject(text);
  try {
    return JSON.parse(extracted);
  } catch (firstError) {
    const repaired = repairJsonSyntax(extracted);
    try {
      return JSON.parse(repaired);
    } catch (secondError) {
      const position = secondError instanceof SyntaxError ? secondError.message : firstError instanceof SyntaxError ? firstError.message : "unknown JSON parse error";
      throw new Error(`Clinical intelligence returned malformed JSON after syntax repair: ${position}`);
    }
  }
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
  "priorityFindings":[
    {
      "priority":"Critical | High | Moderate",
      "title":"",
      "finding":"",
      "whyItMatters":"",
      "interpretation":"",
      "evidence":[{"sourceId":"","fact":""}],
      "missingEvidence":[],
      "recommendedAction":"",
      "status":"Confirmed | Potential | Requires Review",
      "confidence":0
    }
  ],
  "crossDocumentLinks":[
    {
      "title":"",
      "relationship":"",
      "clinicalRelevance":"",
      "evidence":[{"sourceId":"","fact":""}],
      "status":"Confirmed | Potential | Requires Review"
    }
  ],
  "protocolImpact":{
    "affectedCriteria":[{"criterion":"","impact":"","evidence":[{"sourceId":"","fact":""}],"status":"Met | Not Met | Pending | Requires Review"}],
    "overallImpact":""
  },
  "safetyAssessment":{
    "signals":[{"title":"","interpretation":"","evidence":[{"sourceId":"","fact":""}],"status":"Pattern Observed | Potential Signal | Requires Review"}],
    "overallAssessment":""
  },
  "dataGaps":[{"gap":"","whyItMatters":"","sourceIds":[],"nextAction":""}],
  "coordinatorActions":[{"priority":"Immediate | Next Review | Monitor","action":"","reason":"","sourceIds":[]}],
  "auditSummary":{"sourcesReviewed":0,"evidenceBackedFindings":0,"unresolvedItems":0},
  "evidenceQuality":"High | Moderate | Low",
  "confidence":0,
  "confidenceRationale":"",
  "limitations":[]
}

QUALITY BAR:
- Do not produce generic statements such as 'review the patient' or 'monitor closely' without specifying the evidence and operational reason.
- If a lab is outside a protocol threshold, explicitly connect the measured value to the protocol requirement and explain the screening/operational impact.
- If medication timing and an adverse event are temporally related, call this a temporal association, not proof of causality.
- If a deviation affects a safety assessment, explain the potential data-integrity consequence.
- If multiple abnormalities cluster in one participant, describe the cluster while preserving the single-participant limitation.
- If a required exclusion assessment is undocumented, keep it Pending rather than calling it negative.
- Never invent page numbers. Use only supplied source IDs.

EVIDENCE PACK:\n${JSON.stringify(evidencePack, null, 2)}`;

  let lastError: unknown;
  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: `${SYSTEM}\n${prompt}`,
        config: { responseMimeType: "application/json", temperature: 0.15 },
      });
      const result = parseJson(response.text ?? "");
      if (result && typeof result === "object") {
        result.aiModel = model;
        result.aiFallbackUsed = model !== MODELS[0];
      }
      return result;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error("Clinical intelligence analysis failed.");
}
