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

Return ONLY valid JSON.
`;

function parseJson(text: string) {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Clinical intelligence returned invalid JSON.");
  return JSON.parse(cleaned.slice(start, end + 1));
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
