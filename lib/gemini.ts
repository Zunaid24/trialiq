import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

function cleanJson(text: string) {
  return text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

/* ============================================================
   ELIGIBILITY SCREENING
============================================================ */

export async function analyzeClinicalTrial(
  protocol: string,
  participant: string
) {
  const prompt = `
You are an expert Clinical Research Coordinator with extensive experience in oncology clinical trials.

Analyze the Clinical Trial Protocol and Participant Medical Summary.

Determine eligibility by comparing every applicable inclusion and exclusion criterion.

Return ONLY valid JSON.

{
  "participantId": "",
  "studyTitle": "",
  "sponsor": "",
  "eligible": false,
  "screeningResult": "",
  "eligibilityScore": 0,
  "reasonForIneligibility": "",
  "executiveSummary": "",
  "criteriaEvaluation": {
    "inclusion": [
      {
        "criterion": "",
        "expected": "",
        "actual": "",
        "status": ""
      }
    ],
    "exclusion": [
      {
        "criterion": "",
        "expected": "",
        "actual": "",
        "status": ""
      }
    ]
  },
  "pendingAssessments": [
    {
      "assessment": "",
      "status": "",
      "clinicalImpact": ""
    }
  ],
  "recommendations": [],
  "confidence": 0
}

Rules:

- Compare the participant against the actual protocol.
- Do not invent missing medical information.
- Mark unavailable information as Pending.
- Identify the exact reason for ineligibility.
- Include all important inclusion and exclusion criteria.
- Return JSON only.

PROTOCOL:

${protocol}

PARTICIPANT:

${participant}
`;

  let response;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      break;
    } catch (error: any) {
      if (error?.status === 503 && attempt < 3) {
        console.log(
          `Gemini busy. Retrying eligibility analysis (${attempt}/3)...`
        );

        await new Promise((resolve) =>
          setTimeout(resolve, 3000)
        );

        continue;
      }

      throw error;
    }
  }

  if (!response) {
    throw new Error("Gemini did not return a response.");
  }

  const text = cleanJson(response.text ?? "");

  return JSON.parse(text);
}

/* ============================================================
   PROTOCOL INTELLIGENCE
============================================================ */

export async function analyzeProtocol(protocol: string) {
  const prompt = `
You are a Senior Clinical Research Associate.

Read the clinical trial protocol carefully.

Extract clinically important information that would save a clinical research coordinator time.

Return ONLY valid JSON.

{
  "studyTitle": "",
  "phase": "",
  "sponsor": "",
  "indication": "",
  "objective": "",
  "studyDesign": "",
  "population": "",
  "executiveSummary": "",
  "inclusionCriteria": [],
  "exclusionCriteria": [],
  "visitSchedule": [],
  "labRequirements": [],
  "safetyMonitoring": [],
  "primaryEndpoints": [],
  "secondaryEndpoints": [],
  "coordinatorChecklist": [],
  "riskFlags": []
}

Rules:

- Use only information present in the protocol.
- Do not invent requirements.
- Keep criteria concise but clinically meaningful.
- Highlight requirements that require coordinator attention.
- Extract visit timing when available.
- Extract laboratory requirements.
- Extract safety monitoring requirements.
- Extract primary and secondary endpoints.
- Identify protocol risks or operational complexity.
- Return JSON only.

CLINICAL TRIAL PROTOCOL:

${protocol}
`;

  let response;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      break;
    } catch (error: any) {
      if (error?.status === 503 && attempt < 3) {
        console.log(
          `Gemini busy. Retrying protocol analysis (${attempt}/3)...`
        );

        await new Promise((resolve) =>
          setTimeout(resolve, 3000)
        );

        continue;
      }

      throw error;
    }
  }

  if (!response) {
    throw new Error("Gemini did not return a response.");
  }

  const text = cleanJson(response.text ?? "");

  return JSON.parse(text);
}

/* ============================================================
   PATIENT MATCHING
============================================================ */

export async function analyzePatientMatching(patient: string) {
  const prompt = `
You are an expert clinical trial matching specialist.

Analyze the following patient medical summary.

The goal is NOT to invent specific clinical trials.

Instead, determine what types of clinical trials this patient may be suitable for based ONLY on the available medical information.

Identify:

- Patient clinical profile
- Disease and stage
- Relevant biomarkers
- Performance status
- Previous treatments
- Important laboratory findings
- Potential trial characteristics
- Clinical concerns
- Missing information
- Recommended next actions

Return ONLY valid JSON.

{
  "patientProfile": {
    "age": "",
    "gender": "",
    "diagnosis": "",
    "diseaseStage": "",
    "ecog": "",
    "biomarkers": [],
    "priorTreatments": []
  },

  "trialProfile": {
    "preferredTrialTypes": [],
    "preferredPhases": [],
    "preferredIndications": [],
    "importantEligibilityFactors": []
  },

  "matchingSignals": [
    {
      "factor": "",
      "value": "",
      "relevance": ""
    }
  ],

  "clinicalConcerns": [
    {
      "concern": "",
      "impact": ""
    }
  ],

  "missingInformation": [
    {
      "item": "",
      "reason": ""
    }
  ],

  "recommendedTrialCharacteristics": [],

  "nextSteps": [],

  "confidence": 0
}

Rules:

- Do not invent patient information.
- Do not invent biomarkers.
- Do not claim the patient is eligible for a specific trial.
- Use "Unknown" when information is unavailable.
- Missing information must be explicitly identified.
- Focus on information useful to a clinical research coordinator.
- Return JSON only.

PATIENT MEDICAL SUMMARY:

${patient}
`;

  let response;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      break;
    } catch (error: any) {
      if (error?.status === 503 && attempt < 3) {
        console.log(
          `Gemini busy. Retrying patient matching (${attempt}/3)...`
        );

        await new Promise((resolve) =>
          setTimeout(resolve, 3000)
        );

        continue;
      }

      throw error;
    }
  }

  if (!response) {
    throw new Error("Gemini did not return a response.");
  }

  let text = response.text ?? "";

  text = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(text);
}

/* ============================================================
   SOURCE DOCUMENT REVIEW
============================================================ */

export async function analyzeDocumentReview(
  document: string,
  fileName?: string
) {
  const prompt = `
You are an expert Clinical Research Coordinator
reviewing source documents for a clinical trial.

Analyze the following clinical source document.

The purpose is to reduce manual document review time.

Extract ONLY clinically relevant information that can
help a research coordinator make decisions or identify
follow-up actions.

Return ONLY valid JSON.

{
  "documentType": "",
  "patientId": "",
  "clinicalSummary": "",

  "keyFindings": [
    {
      "finding": "",
      "clinicalRelevance": ""
    }
  ],

  "abnormalFindings": [
    {
      "finding": "",
      "value": "",
      "clinicalImpact": ""
    }
  ],

  "criticalFindings": [
    {
      "finding": "",
      "reason": "",
      "urgency": ""
    }
  ],

  "missingInformation": [
    {
      "item": "",
      "reason": ""
    }
  ],

  "riskFlags": [
    {
      "risk": "",
      "severity": "",
      "reason": ""
    }
  ],

  "recommendedActions": [],

  "confidence": 0
}

Rules:

- Use ONLY information present in the document.
- Do not invent patient information.
- Do not invent diagnoses.
- Do not invent laboratory values.
- Do not provide treatment recommendations.
- Distinguish abnormal findings from critical findings.
- If information is unavailable, identify it as missing.
- Focus on information that saves coordinator review time.
- Keep the output concise and clinically useful.
- Return JSON only.

DOCUMENT NAME:

${fileName ?? "Unknown"}

SOURCE DOCUMENT:

${document}
`;

  let response;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      break;
    } catch (error: any) {
      if (error?.status === 503 && attempt < 3) {
        console.log(
          `Gemini busy. Retrying document review (${attempt}/3)...`
        );

        await new Promise((resolve) =>
          setTimeout(resolve, 3000)
        );

        continue;
      }

      throw error;
    }
  }

  if (!response) {
    throw new Error(
      "Gemini did not return a response."
    );
  }

  let text = response.text ?? "";

  text = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(text);
}

/* ============================================================
   VISIT & SCHEDULE INTELLIGENCE
============================================================ */

export async function analyzeVisitIntelligence(
  protocol: string
) {
  const prompt = `
You are an expert Clinical Research Coordinator.

Analyze the clinical trial protocol and convert its
visit schedule into a concise coordinator-ready workflow.

Extract ONLY information explicitly supported by the protocol.

Return ONLY valid JSON.

{
  "studyTitle": "",
  "visitSummary": "",
  "visits": [
    {
      "visit": "",
      "timing": "",
      "window": "",
      "purpose": "",
      "assessments": [],
      "labs": [],
      "imaging": [],
      "procedures": [],
      "safetyChecks": [],
      "coordinatorActions": [],
      "criticalRequirements": []
    }
  ],
  "criticalWindows": [],
  "overallCoordinatorActions": [],
  "riskFlags": [],
  "confidence": 0
}

Rules:

- Do not invent visits.
- Do not invent visit windows.
- Do not invent laboratory requirements.
- Do not invent imaging requirements.
- Use "Not specified" when the protocol does not provide information.
- Preserve protocol terminology.
- Focus on information that reduces manual coordinator work.
- Highlight time-sensitive or easily missed requirements.
- Return JSON only.

CLINICAL TRIAL PROTOCOL:

${protocol}
`;

  let response;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      break;
    } catch (error: any) {
      if (error?.status === 503 && attempt < 3) {
        console.log(
          `Gemini busy. Retrying visit analysis (${attempt}/3)...`
        );

        await new Promise((resolve) =>
          setTimeout(resolve, 3000)
        );

        continue;
      }

      throw error;
    }
  }

  if (!response) {
    throw new Error(
      "Gemini did not return a response."
    );
  }

  let text = response.text ?? "";

  text = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(text);
}

/* ============================================================
   LAB INTELLIGENCE
============================================================ */

export async function analyzeLabIntelligence(
  document: string
) {
  const prompt = `
You are an expert Clinical Research Coordinator
specializing in clinical trial laboratory review.

Analyze the laboratory information contained in the
following clinical document.

The objective is to reduce manual review time.

Identify laboratory values, abnormalities, critical
values, missing information and protocol-relevant
follow-up considerations.

Return ONLY valid JSON.

{
  "patientId": "",
  "summary": "",
  "screeningReadiness": "",
  "labs": [
    {
      "test": "",
      "value": "",
      "unit": "",
      "referenceRange": "",
      "status": "",
      "clinicalSignificance": ""
    }
  ],
  "protocolViolations": [],
  "missingLabs": [],
  "criticalValues": [],
  "followUpActions": [],
  "confidence": 0
}

Rules:

- Use ONLY laboratory information explicitly present
  in the document.
- Do not invent laboratory values.
- Do not invent reference ranges.
- Do not diagnose the patient.
- Do not claim a protocol violation unless the
  protocol threshold is actually available.
- If a required laboratory value cannot be determined,
  identify it as missing.
- Use these statuses where appropriate:
  Normal, Abnormal, Critical, Missing, Unknown.
- Focus on information useful to a clinical research
  coordinator.
- Return JSON only.

LABORATORY DOCUMENT:

${document}
`;

  let response;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      break;
    } catch (error: any) {
      if (error?.status === 503 && attempt < 3) {
        console.log(
          `Gemini busy. Retrying lab analysis (${attempt}/3)...`
        );

        await new Promise((resolve) =>
          setTimeout(resolve, 3000)
        );

        continue;
      }

      throw error;
    }
  }

  if (!response) {
    throw new Error(
      "Gemini did not return a response."
    );
  }

  let text = response.text ?? "";

  text = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(text);
}
/* ============================================================
   CLINICAL DATA RECONCILIATION
============================================================ */

export async function analyzeClinicalReconciliation(
  documents: Record<string, string>
) {
  const documentText = Object.entries(
    documents
  )
    .map(
      ([name, text]) =>
        `\n\n===== ${name.toUpperCase()} =====\n${text}`
    )
    .join("");

  const prompt = `
You are an expert Clinical Research Coordinator
performing cross-document clinical data reconciliation.

Review the available clinical documents together.

Your task is to identify information that does not
agree across documents, missing information, conflicting
dates, inconsistent medication/event details, and items
requiring coordinator review.

Do NOT determine trial eligibility.

Do NOT invent information.

Return ONLY valid JSON.

{
  "patientId": "",
  "summary": "",

  "discrepancies": [
    {
      "category": "",
      "issue": "",
      "sources": [],
      "severity": "",
      "details": ""
    }
  ],

  "dateConflicts": [
    {
      "event": "",
      "dates": [],
      "sources": [],
      "issue": ""
    }
  ],

  "missingInformation": [
    {
      "item": "",
      "reason": "",
      "relatedSource": ""
    }
  ],

  "crossDocumentFindings": [
    {
      "finding": "",
      "supportingSources": [],
      "clinicalRelevance": ""
    }
  ],

  "coordinatorActions": [],

  "confidence": 0
}

Rules:

- Compare information across documents.
- Only report a discrepancy when the available
  documents actually support the comparison.
- Do not assume that different information is a
  discrepancy if the documents refer to different
  time periods.
- Pay particular attention to dates.
- Pay attention to medication start/stop dates.
- Compare adverse event timing with medications.
- Compare laboratory findings with safety records.
- Compare protocol deviation dates with visit/lab dates.
- Identify missing information only when its absence
  is evident from the available records.
- Preserve the source terminology.
- Do not provide treatment recommendations.
- Do not diagnose the participant.
- Do not make an eligibility decision.
- If there are no discrepancies, return an empty array.
- Return JSON only.

CLINICAL DOCUMENTS:

${documentText}
`;

  let response;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      break;
    } catch (error: any) {
      if (
        error?.status === 503 &&
        attempt < 3
      ) {
        await new Promise((resolve) =>
          setTimeout(resolve, 3000)
        );

        continue;
      }

      throw error;
    }
  }

  if (!response) {
    throw new Error(
      "Gemini did not return a response."
    );
  }

  let text = response.text ?? "";

  text = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(text);
}

/* ============================================================
   ADVERSE EVENT ASSESSMENT
============================================================ */

export async function analyzeAdverseEvent(
  document: string,
  fileName?: string
) {
  const prompt = `
You are an expert Clinical Research Coordinator
specializing in clinical trial safety documentation.

Analyze the following adverse event document.

Extract and structure the information available in
the source document.

Your job is to help the coordinator organize the
event for investigator and safety-team review.

Do NOT independently determine whether the event
is reportable.

Do NOT invent information.

Return ONLY valid JSON.

{
  "patientId": "",
  "event": "",
  "onsetDate": "",
  "resolutionDate": "",
  "severity": "",
  "seriousness": "",
  "causality": "",
  "actionTaken": "",
  "outcome": "",

  "hospitalization": false,
  "death": false,
  "lifeThreatening": false,

  "expectedness": "",

  "eventSummary": "",

  "followUpRequired": [],

  "reportingConsiderations": [],

  "coordinatorActions": [],

  "missingInformation": [],

  "confidence": 0
}

Rules:

- Use only information explicitly present in the document.
- Do not invent dates.
- Do not invent severity.
- Do not invent causality.
- Do not diagnose the participant.
- Do not independently determine reportability.
- Do not make treatment recommendations.
- If a field is unavailable, use an empty string.
- Boolean fields should be false unless the document
  explicitly supports true.
- Reporting considerations should identify information
  that the safety team or investigator may need to review.
- Coordinator actions should be operational follow-up,
  not medical treatment decisions.
- Return JSON only.

DOCUMENT NAME:

${fileName ?? "Unknown"}

ADVERSE EVENT DOCUMENT:

${document}
`;

  let response;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      break;
    } catch (error: any) {
      if (
        error?.status === 503 &&
        attempt < 3
      ) {
        console.log(
          `Gemini busy. Retrying AE analysis (${attempt}/3)...`
        );

        await new Promise((resolve) =>
          setTimeout(resolve, 3000)
        );

        continue;
      }

      throw error;
    }
  }

  if (!response) {
    throw new Error(
      "Gemini did not return a response."
    );
  }

  let text = response.text ?? "";

  text = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(text);
}

/* ============================================================
   MEDICATION REVIEW
============================================================ */

export async function analyzeMedicationReview(
  document: string,
  fileName?: string
) {
  const prompt = `
You are an expert Clinical Research Coordinator
specializing in clinical trial medication review.

Analyze the provided concomitant medication document.

Your purpose is to structure medication information
and identify items that require protocol or coordinator
review.

Do NOT independently declare a medication prohibited
unless the provided document explicitly states this.

Do NOT invent protocol restrictions.

Do NOT provide treatment recommendations.

Do NOT diagnose the participant.

Return ONLY valid JSON.

{
  "patientId": "",

  "summary": "",

  "medications": [
    {
      "name": "",
      "dose": "",
      "frequency": "",
      "route": "",
      "indication": "",
      "startDate": "",
      "stopDate": "",
      "status": ""
    }
  ],

  "potentialProtocolConcerns": [
    {
      "medication": "",
      "concern": "",
      "reason": "",
      "priority": ""
    }
  ],

  "dateIssues": [
    {
      "medication": "",
      "issue": "",
      "details": ""
    }
  ],

  "missingInformation": [
    {
      "medication": "",
      "missing": "",
      "reason": ""
    }
  ],

  "coordinatorActions": [],

  "protocolReviewRequired": [],

  "confidence": 0
}

Rules:

- Extract only information present in the document.
- Do not invent medication doses.
- Do not invent medication dates.
- Do not invent indications.
- If a field is unavailable, use an empty string.
- Preserve medication names as documented.
- Identify potential protocol concerns only when
  supported by the available information.
- Do not assume a medication is prohibited.
- Flag items that require checking against the
  active clinical trial protocol.
- Identify incomplete medication information.
- Identify inconsistent or unusual dates when supported.
- Coordinator actions must be operational follow-up.
- Do not make clinical treatment recommendations.
- Return JSON only.

DOCUMENT NAME:

${fileName ?? "Unknown"}

MEDICATION DOCUMENT:

${document}
`;

  let response;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      break;
    } catch (error: any) {
      if (
        error?.status === 503 &&
        attempt < 3
      ) {
        console.log(
          `Gemini busy. Retrying medication review (${attempt}/3)...`
        );

        await new Promise((resolve) =>
          setTimeout(resolve, 3000)
        );

        continue;
      }

      throw error;
    }
  }

  if (!response) {
    throw new Error(
      "Gemini did not return a response."
    );
  }

  let text = response.text ?? "";

  text = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(text);
}

/* ============================================================
   PROTOCOL DEVIATION DETECTION
============================================================ */

export async function analyzeProtocolDeviation(
  protocol: string,
  participantRecord: string
) {
  const prompt = `
You are an expert Clinical Research Associate
specializing in clinical trial protocol compliance.

Compare the Clinical Trial Protocol with the
Participant Record.

Your task is to identify potential protocol deviations
by comparing what the protocol requires with what the
participant record documents as having occurred.

IMPORTANT:

- Do not invent information.
- Do not assume that something happened if it is not
  documented.
- Do not classify something as a deviation when the
  available information is insufficient.
- Clearly distinguish confirmed deviations from items
  requiring review.
- Use the protocol as the source of requirements.
- Use the participant record as the source of actual
  documented events.
- Do not make medical treatment recommendations.
- Do not make regulatory decisions.
- Investigator or study-team review may be required.

Return ONLY valid JSON.

{
  "studyTitle": "",
  "participantId": "",
  "deviationCount": 0,
  "overallRisk": "",
  "summary": "",

  "deviations": [
    {
      "category": "",
      "description": "",
      "protocolRequirement": "",
      "actualEvent": "",
      "date": "",
      "severity": "",
      "impact": "",
      "evidence": "",
      "status": ""
    }
  ],

  "missingInformation": [
    ""
  ],

  "recommendedActions": [
    ""
  ],

  "investigatorReviewRequired": false,

  "confidence": 0
}

DEVIATION CATEGORIES MAY INCLUDE:

- Missed Visit
- Out-of-Window Visit
- Missing Assessment
- Incorrect Procedure
- Incorrect Timing
- Incorrect Dose
- Unscheduled Procedure
- Eligibility-related Deviation
- Safety-related Deviation
- Documentation Deviation
- Other Protocol Deviation

STATUS VALUES SHOULD REFLECT THE EVIDENCE:

- Confirmed
- Potential
- Requires Review

SEVERITY:

Use the terminology supported by the source
documents. If severity is not explicitly defined,
use a cautious classification such as:

- Low
- Moderate
- High
- Requires Review

Do not invent a severity classification when the
available evidence does not support one.

ANALYSIS REQUIREMENTS:

1. Extract relevant protocol requirements.

2. Identify the participant events that correspond
   to those requirements.

3. Compare required versus documented events.

4. Pay particular attention to:
   - Visit windows
   - Visit dates
   - Required assessments
   - Laboratory assessments
   - Procedures
   - Medication administration
   - Dose and timing
   - Safety assessments
   - Required documentation

5. For every potential deviation provide evidence.

6. If the protocol requires something but the
   participant record does not provide enough
   information to determine whether it occurred,
   put it in missingInformation or mark it
   Requires Review rather than automatically
   declaring a deviation.

7. Recommended actions should be operational,
   such as:
   - Verify source documentation
   - Confirm visit date
   - Obtain missing assessment
   - Notify investigator
   - Document deviation
   - Review impact

Do not provide patient treatment advice.

CLINICAL TRIAL PROTOCOL:

${protocol}

PARTICIPANT RECORD:

${participantRecord}
`;

  let response;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      break;
    } catch (error: any) {
      if (
        error?.status === 503 &&
        attempt < 3
      ) {
        console.log(
          `Gemini busy. Retrying deviation analysis (${attempt}/3)...`
        );

        await new Promise((resolve) =>
          setTimeout(resolve, 3000)
        );

        continue;
      }

      throw error;
    }
  }

  if (!response) {
    throw new Error(
      "Gemini did not return a response."
    );
  }

  let text = response.text ?? "";

  text = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(text);
}

/* ============================================================
   SAFETY SIGNAL DETECTION
============================================================ */

export async function analyzeSafetySignals(
  document: string,
  fileName?: string
) {
  const prompt = `
You are an expert Clinical Research Associate and
clinical safety specialist.

Analyze the provided clinical trial safety dataset.

The dataset may contain adverse events and safety
information from multiple participants.

Your task is to identify potential patterns or
signals that may warrant further clinical review.

IMPORTANT:

- Do NOT establish causality.
- Do NOT conclude that a treatment or investigational
  product caused an event.
- Do NOT diagnose participants.
- Do NOT recommend treatment.
- Do NOT invent information.
- Do NOT invent event frequencies.
- Only use information contained in the document.
- Distinguish observed patterns from causal conclusions.
- A potential signal is a pattern requiring further
  investigation, not a confirmed safety finding.

Return ONLY valid JSON.

{
  "studyTitle": "",
  "participantsReviewed": 0,
  "eventsReviewed": 0,
  "signalsDetected": 0,
  "overallSafetyStatus": "",
  "summary": "",

  "signals": [
    {
      "signal": "",
      "description": "",
      "eventType": "",
      "affectedParticipants": [],
      "eventCount": 0,
      "severityPattern": "",
      "seriousEvents": 0,
      "evidence": "",
      "priority": "",
      "status": ""
    }
  ],

  "notablePatterns": [
    ""
  ],

  "missingInformation": [
    ""
  ],

  "recommendedActions": [
    ""
  ],

  "clinicalReviewRequired": false,

  "confidence": 0
}

SIGNAL IDENTIFICATION:

Look for patterns such as:

- The same adverse event occurring in multiple
  participants.
- Increased frequency of a particular event.
- Multiple serious events of the same type.
- Repeated events affecting the same organ system.
- Similar events occurring within a similar time period.
- Clusters of severity or seriousness.
- Events that appear unusual within the provided
  dataset.

Do NOT call something a safety signal simply because
it is a serious event.

PRIORITY:

Use:

- High
- Moderate
- Low
- Review

STATUS:

Use:

- Potential Signal
- Pattern Observed
- Requires Review

EVIDENCE:

Evidence must reference the actual information
contained in the supplied dataset.

For affectedParticipants, use only participant IDs
that appear in the source document.

If the dataset does not contain enough information
to evaluate a pattern, explain this in
missingInformation.

RECOMMENDED ACTIONS:

Actions should be operational and review-oriented,
for example:

- Review source records.
- Review event timelines.
- Confirm event coding.
- Review seriousness classification.
- Review related concomitant medications.
- Escalate to the appropriate safety team.
- Perform additional clinical review.

Do not provide patient treatment advice.

DOCUMENT NAME:

${fileName ?? "Unknown"}

SAFETY DATA:

${document}
`;

  let response;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      break;
    } catch (error: any) {
      if (
        error?.status === 503 &&
        attempt < 3
      ) {
        console.log(
          `Gemini busy. Retrying safety analysis (${attempt}/3)...`
        );

        await new Promise((resolve) =>
          setTimeout(resolve, 3000)
        );

        continue;
      }

      throw error;
    }
  }

  if (!response) {
    throw new Error(
      "Gemini did not return a response."
    );
  }

  let text = response.text ?? "";

  text = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(text);
}

/* ============================================================
   MEDICAL CODING INTELLIGENCE
============================================================ */

export async function analyzeMedicalCoding(
  document: string,
  fileName?: string
) {
  const prompt = `
You are an expert Clinical Research Associate and
clinical terminology specialist with experience in
clinical trial medical coding.

Analyze the supplied clinical source document.

Extract clinically relevant medical terms and provide
AI-assisted coding suggestions.

PRIMARY CODING FOCUS:

1. MedDRA
   - Verbatim Term
   - Preferred Term
   - System Organ Class

2. ICD-10
   - Suggested diagnosis code where appropriate

Do NOT invent a code when the source information is
insufficient.

IMPORTANT:

- Do not diagnose the participant.
- Do not invent medical conditions.
- Do not invent medications.
- Do not invent codes.
- Do not claim that an AI suggestion is an approved
  final medical code.
- Clearly identify all suggestions as requiring
  qualified human coder review.
- Preserve the terminology used in the source document.
- Use only information present in the document.
- If a precise code cannot be determined, explain why.
- Distinguish source terminology from normalized
  terminology and AI suggestions.

Return ONLY valid JSON.

{
  "studyTitle": "",
  "participantId": "",
  "documentType": "",

  "termsReviewed": 0,
  "codingSuggestions": 0,
  "reviewRequired": 0,

  "summary": "",

  "codingItems": [
    {
      "verbatimTerm": "",
      "normalizedTerm": "",
      "context": "",

      "dictionary": "",

      "meddra": {
        "preferredTerm": "",
        "systemOrganClass": ""
      },

      "icd10": {
        "code": "",
        "description": ""
      },

      "confidence": 0,

      "evidence": "",

      "alternativeSuggestions": [],

      "status": ""
    }
  ],

  "uncodedTerms": [
    {
      "term": "",
      "reason": ""
    }
  ],

  "recommendedActions": [],

  "humanReviewRequired": true,

  "confidence": 0
}

STATUS VALUES:

- Suggested
- Review Required
- Insufficient Information
- Not Codeable

DICTIONARY:

Use:

- MedDRA
- ICD-10
- MedDRA + ICD-10

Do not claim a specific dictionary version unless
the source document provides it.

MEDDRA:

For adverse events and medical conditions, provide:

- Preferred Term
- System Organ Class

Only provide a suggestion when the clinical term
supports it.

ICD-10:

Provide an ICD-10 code only when the documented
condition is sufficiently specific.

If the source only says something vague such as
"pain" or "abnormal result", do not invent a highly
specific diagnosis.

EVIDENCE:

Every coding suggestion must include the relevant
source wording or a concise description of the source
evidence.

ALTERNATIVE SUGGESTIONS:

Include alternatives only when there is genuine
terminology ambiguity.

CONFIDENCE:

0-100.

Use lower confidence when:

- The source term is ambiguous.
- The documentation is incomplete.
- Multiple coding interpretations are possible.
- The clinical context is insufficient.

RECOMMENDED ACTIONS:

Examples:

- Confirm terminology against source documentation.
- Review suggested MedDRA Preferred Term.
- Confirm System Organ Class.
- Confirm ICD-10 specificity.
- Obtain clarification from the investigator.
- Complete qualified medical coder review.

Do not provide treatment recommendations.

DOCUMENT:

${fileName ?? "Unknown"}

CLINICAL SOURCE DOCUMENT:

${document}
`;

  let response;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      break;
    } catch (error: any) {
      if (
        error?.status === 503 &&
        attempt < 3
      ) {
        console.log(
          `Gemini busy. Retrying medical coding analysis (${attempt}/3)...`
        );

        await new Promise((resolve) =>
          setTimeout(resolve, 3000)
        );

        continue;
      }

      throw error;
    }
  }

  if (!response) {
    throw new Error(
      "Gemini did not return a response."
    );
  }

  let text = response.text ?? "";

  text = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(text);
}