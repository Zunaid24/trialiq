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