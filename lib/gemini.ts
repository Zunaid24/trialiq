import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// Prefer the strongest stable Flash model, then fall back to the existing
// model and finally a high-throughput Flash-Lite model when the primary
// model is temporarily unavailable or quota-limited.
const MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
] as const;

const STANDARD = `
You are TrialIQ's clinical-trial operations intelligence engine. Write for clinical research coordinators, CRAs, investigators, safety teams and qualified medical coders.

EVIDENCE RULES:
- Use only facts explicitly present in the supplied documents/protocol.
- Never invent patient facts, diagnoses, labs, dates, doses, thresholds, visit windows, codes, frequencies or protocol requirements.
- Distinguish documented SOURCE FACTS, PROTOCOL REQUIREMENTS and AI INTERPRETATION.
- If evidence is absent, use "Not documented", "Unknown" or "Insufficient evidence".
- Never silently resolve conflicting documents; surface the conflict.
- Clinically meaningful findings must include concise evidence and sourceReference when available. Never fabricate page/section numbers.
- Recommendations are operational review actions only, never treatment advice.
- Do not independently establish final eligibility, causality, reportability, regulatory significance or final medical coding.

STYLE:
- Specific, concise, clinical-research terminology; no generic chatbot filler.
- Use Confirmed, Potential, Requires Review or Insufficient Evidence where applicable.
- confidence is 0-100 and reflects evidence completeness/consistency, not probability of clinical truth.
- evidenceQuality is High, Moderate or Low.

Return ONLY valid JSON. No markdown fences.
`;

function parseJson(text: string) {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  return JSON.parse(start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned);
}

function getErrorStatus(error: any): number | undefined {
  const direct = Number(error?.status ?? error?.code);
  if (Number.isFinite(direct) && direct > 0) return direct;

  const message = String(error?.message ?? "");
  const match = message.match(/(?:code|status)["':\s]+(\d{3})/i);
  return match ? Number(match[1]) : undefined;
}

function isQuotaError(error: any) {
  const status = getErrorStatus(error);
  const message = String(error?.message ?? error ?? "").toLowerCase();
  return status === 429 || message.includes("resource_exhausted") || message.includes("quota exceeded");
}

function isTransientError(error: any) {
  const status = getErrorStatus(error);
  return [500, 502, 503, 504].includes(status ?? -1);
}

async function run(module: string, prompt: string) {
  let lastError: any;

  for (const model of MODELS) {
    // Quota errors should move immediately to the next model. Transient
    // server errors get one short retry on the current model first.
    const maxAttempts = 2;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: `${STANDARD}\nMODULE: ${module}\n\n${prompt}`,
          config: { responseMimeType: "application/json" },
        });

        return parseJson(response.text ?? "");
      } catch (error: any) {
        lastError = error;
        const status = getErrorStatus(error);
        const quotaError = isQuotaError(error);
        const transientError = isTransientError(error);

        // 429/quota: don't waste another request against the exhausted model.
        if (quotaError) break;

        // 5xx: retry once, then move to the next model.
        if (transientError && attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          continue;
        }

        // Non-retryable client/request errors should surface immediately.
        if (!transientError) {
          throw error;
        }

        break;
      }
    }
  }

  throw lastError ?? new Error("Clinical AI analysis failed across all configured models.");
}

export async function analyzeClinicalTrial(protocol: string, participant: string) {
  return run("Eligibility Screening", `
Compare every applicable inclusion and exclusion criterion.
Return:
{
 "participantId":"", "studyTitle":"", "sponsor":"", "eligible":false,
 "screeningResult":"Eligible | Not Eligible | Pending Review", "eligibilityScore":0,
 "reasonForIneligibility":"", "executiveSummary":"",
 "criteriaEvaluation":{
  "inclusion":[{"criterion":"","expected":"","actual":"","status":"Met | Not Met | Pending | Requires Review","evidence":"","sourceReference":"","reviewRequired":false}],
  "exclusion":[{"criterion":"","expected":"","actual":"","status":"Met | Not Met | Pending | Requires Review","evidence":"","sourceReference":"","reviewRequired":false}]
 },
 "pendingAssessments":[{"assessment":"","status":"","clinicalImpact":"","evidence":"","sourceReference":""}],
 "recommendations":[], "evidenceQuality":"High | Moderate | Low", "confidence":0,
 "confidenceRationale":"", "limitations":[]
}
Rules: A missing criterion is Pending, not automatically failed. Mark Not Met only when supplied evidence contradicts the protocol. Do not let an overall score override an individual criterion.

PROTOCOL:\n${protocol}\n\nPARTICIPANT:\n${participant}`);
}

export async function analyzeProtocol(protocol: string) {
  return run("Protocol Intelligence", `
Extract coordinator-ready protocol intelligence. Keep the following arrays as strings for UI compatibility.
Return:
{
 "studyTitle":"","phase":"","sponsor":"","indication":"","objective":"","studyDesign":"","population":"","executiveSummary":"",
 "inclusionCriteria":[],"exclusionCriteria":[],"visitSchedule":[],"labRequirements":[],"safetyMonitoring":[],"primaryEndpoints":[],"secondaryEndpoints":[],"coordinatorChecklist":[],"riskFlags":[],
 "evidenceQuality":"High | Moderate | Low","confidence":0,"confidenceRationale":"","limitations":[]
}
Rules: never invent requirements, thresholds, visit timing/windows, labs, endpoints or safety rules. Include source section wording inline when explicitly present.

PROTOCOL:\n${protocol}`);
}

export async function analyzePatientMatching(patient: string) {
  return run("Patient Trial-Profile Matching", `
Do not name or invent specific trials and do not make a final eligibility decision.
Return:
{
 "patientProfile":{"age":"","gender":"","diagnosis":"","diseaseStage":"","ecog":"","biomarkers":[],"priorTreatments":[]},
 "trialProfile":{"preferredTrialTypes":[],"preferredPhases":[],"preferredIndications":[],"importantEligibilityFactors":[]},
 "matchingSignals":[{"factor":"","value":"","relevance":"","evidence":"","sourceReference":"","status":"Confirmed | Potential | Requires Review | Insufficient Evidence"}],
 "clinicalConcerns":[{"concern":"","impact":"","evidence":"","sourceReference":"","status":""}],
 "missingInformation":[{"item":"","reason":"","sourceReference":""}],
 "recommendedTrialCharacteristics":[],"nextSteps":[],"evidenceQuality":"High | Moderate | Low","confidence":0,"confidenceRationale":"","limitations":[]
}
Do not infer biomarkers, stage, ECOG or prior treatment from diagnosis alone.

PATIENT:\n${patient}`);
}

export async function analyzeDocumentReview(document: string, fileName?: string) {
  return run("Source Document Review", `
Return:
{
 "documentType":"","patientId":"","clinicalSummary":"",
 "keyFindings":[{"finding":"","clinicalRelevance":"","evidence":"","sourceReference":"","status":""}],
 "abnormalFindings":[{"finding":"","value":"","clinicalImpact":"","evidence":"","sourceReference":"","status":""}],
 "criticalFindings":[{"finding":"","reason":"","urgency":"","evidence":"","sourceReference":"","status":"Requires Review"}],
 "missingInformation":[{"item":"","reason":""}],
 "riskFlags":[{"risk":"","severity":"","reason":"","evidence":"","sourceReference":"","status":""}],
 "recommendedActions":[],"evidenceQuality":"High | Moderate | Low","confidence":0,"confidenceRationale":"","limitations":[]
}
Rules: distinguish abnormal from critical; do not diagnose or recommend treatment.

DOCUMENT NAME: ${fileName ?? "Unknown"}\nSOURCE DOCUMENT:\n${document}`);
}

export async function analyzeVisitIntelligence(protocol: string) {
  return run("Visit and Schedule Intelligence", `
Return:
{
 "studyTitle":"","visitSummary":"",
 "visits":[{"visit":"","timing":"","window":"","purpose":"","assessments":[],"labs":[],"imaging":[],"procedures":[],"safetyChecks":[],"coordinatorActions":[],"criticalRequirements":[],"evidence":"","sourceReference":"","status":"Confirmed | Requires Review"}],
 "criticalWindows":[],"overallCoordinatorActions":[],"riskFlags":[],"evidenceQuality":"High | Moderate | Low","confidence":0,"confidenceRationale":"","limitations":[]
}
Never invent a visit, window, assessment, lab, imaging requirement or timing. Use Not specified when absent.

PROTOCOL:\n${protocol}`);
}

export async function analyzeLabIntelligence(document: string) {
  return run("Laboratory Intelligence", `
Return:
{
 "patientId":"","summary":"","screeningReadiness":"",
 "labs":[{"test":"","value":"","unit":"","referenceRange":"","status":"Normal | Abnormal | Critical | Missing | Unknown","clinicalSignificance":"","evidence":"","sourceReference":"","reviewRequired":false}],
 "protocolViolations":[],"missingLabs":[],"criticalValues":[],"followUpActions":[],"evidenceQuality":"High | Moderate | Low","confidence":0,"confidenceRationale":"","limitations":[]
}
Rules: never invent reference ranges. Do not call a value Critical without source/protocol support. Do not claim a protocol violation without an explicit threshold/requirement. Do not diagnose.

LAB DOCUMENT:\n${document}`);
}

export async function analyzeClinicalReconciliation(documents: Record<string, string>) {
  const text = Object.entries(documents).map(([name, value]) => `\n===== ${name} =====\n${value}`).join("\n");
  return run("Clinical Data Reconciliation", `
Return:
{
 "patientId":"","summary":"",
 "discrepancies":[{"category":"","issue":"","sources":[],"severity":"","details":"","evidence":"","status":"Confirmed | Potential | Requires Review"}],
 "dateConflicts":[{"event":"","dates":[],"sources":[],"issue":"","evidence":"","status":""}],
 "missingInformation":[{"item":"","reason":"","relatedSource":""}],
 "crossDocumentFindings":[{"finding":"","supportingSources":[],"clinicalRelevance":"","evidence":"","status":""}],
 "coordinatorActions":[],"evidenceQuality":"High | Moderate | Low","confidence":0,"confidenceRationale":"","limitations":[]
}
Rules: different dates are not a conflict when they refer to different events/time periods. Do not silently choose between conflicting sources.

DOCUMENTS:\n${text}`);
}

export async function analyzeAdverseEvent(document: string, fileName?: string) {
  return run("Adverse Event Assessment", `
Return:
{
 "patientId":"","event":"","onsetDate":"","resolutionDate":"","severity":"","seriousness":"","causality":"","actionTaken":"","outcome":"",
 "hospitalization":false,"death":false,"lifeThreatening":false,"expectedness":"","eventSummary":"",
 "followUpRequired":[],"reportingConsiderations":[],"coordinatorActions":[],"missingInformation":[],
 "evidence":"","sourceReference":"","reviewStatus":"Confirmed | Requires Review | Insufficient Evidence","evidenceQuality":"High | Moderate | Low","confidence":0,"confidenceRationale":"","limitations":[]
}
Rules: booleans true only with explicit support. Do not infer seriousness, causality, expectedness or reportability.

DOCUMENT NAME: ${fileName ?? "Unknown"}\nAE DOCUMENT:\n${document}`);
}

export async function analyzeMedicationReview(document: string, fileName?: string) {
  return run("Concomitant Medication Review", `
Return:
{
 "patientId":"","summary":"",
 "medications":[{"name":"","dose":"","frequency":"","route":"","indication":"","startDate":"","stopDate":"","status":"","evidence":"","sourceReference":""}],
 "potentialProtocolConcerns":[{"medication":"","concern":"","reason":"","priority":"","evidence":"","sourceReference":"","status":"Potential | Requires Review | Confirmed"}],
 "dateIssues":[{"medication":"","issue":"","details":"","evidence":"","sourceReference":""}],
 "missingInformation":[{"medication":"","missing":"","reason":""}],"coordinatorActions":[],"protocolReviewRequired":[],
 "evidenceQuality":"High | Moderate | Low","confidence":0,"confidenceRationale":"","limitations":[]
}
Rules: never declare a medication prohibited unless the supplied protocol explicitly establishes the restriction.

DOCUMENT NAME: ${fileName ?? "Unknown"}\nMEDICATION DOCUMENT:\n${document}`);
}

export async function analyzeProtocolDeviation(protocol: string, participantRecord: string) {
  return run("Protocol Deviation Detection", `
Return:
{
 "studyTitle":"","participantId":"","deviationCount":0,"overallRisk":"","summary":"",
 "deviations":[{"category":"","description":"","protocolRequirement":"","actualEvent":"","date":"","severity":"","impact":"","evidence":"","sourceReference":"","status":"Confirmed | Potential | Requires Review"}],
 "missingInformation":[],"recommendedActions":[],"investigatorReviewRequired":false,"evidenceQuality":"High | Moderate | Low","confidence":0,"confidenceRationale":"","limitations":[]
}
Rules: Confirmed requires an explicit protocol requirement plus documented contrary event. Missing participant documentation is not proof the event did not occur. Never invent severity or regulatory impact.

PROTOCOL:\n${protocol}\n\nPARTICIPANT RECORD:\n${participantRecord}`);
}

export async function analyzeSafetySignals(document: string, fileName?: string) {
  return run("Safety Signal Detection", `
Return:
{
 "studyTitle":"","participantsReviewed":0,"eventsReviewed":0,"signalsDetected":0,"overallSafetyStatus":"","summary":"",
 "signals":[{"signal":"","description":"","eventType":"","affectedParticipants":[],"eventCount":0,"affectedParticipantCount":0,"denominator":0,"frequency":"","severityPattern":"","seriousEvents":0,"temporalPattern":"","evidence":"","sourceReference":"","priority":"High | Moderate | Low | Review","status":"Potential Signal | Pattern Observed | Requires Review"}],
 "notablePatterns":[],"missingInformation":[],"recommendedActions":[],"clinicalReviewRequired":false,"evidenceQuality":"High | Moderate | Low","confidence":0,"confidenceRationale":"","limitations":[]
}
Rules: count only supplied data. Never invent denominators/frequencies. Prefer n/N and percentage when N is available. Do not infer causality or treatment-relatedness. A single serious event is not automatically a safety signal.

DOCUMENT NAME: ${fileName ?? "Unknown"}\nSAFETY DATA:\n${document}`);
}

export async function analyzeMedicalCoding(document: string, fileName?: string) {
  return run("Medical Coding Intelligence", `
Return:
{
 "studyTitle":"","participantId":"","documentType":"","termsReviewed":0,"codingSuggestions":0,"reviewRequired":0,"summary":"",
 "codingItems":[{"verbatimTerm":"","normalizedTerm":"","context":"","dictionary":"MedDRA | ICD-10 | MedDRA + ICD-10","dictionaryVersion":"","meddra":{"preferredTerm":"","systemOrganClass":""},"icd10":{"code":"","description":""},"confidence":0,"evidence":"","sourceReference":"","alternativeSuggestions":[],"status":"Suggested | Review Required | Insufficient Information | Not Codeable"}],
 "uncodedTerms":[{"term":"","reason":"","evidence":"","sourceReference":""}],"recommendedActions":[],"humanReviewRequired":true,"evidenceQuality":"High | Moderate | Low","confidence":0,"confidenceRationale":"","limitations":[]
}
Rules: never invent a code. Do not diagnose from vague documentation. Preserve verbatim terminology. Every suggestion requires qualified human coder review. Do not claim a dictionary version unless actually available/configured.

DOCUMENT NAME: ${fileName ?? "Unknown"}\nCLINICAL DOCUMENT:\n${document}`);
}
