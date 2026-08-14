import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const MODEL = process.env.TEST_REVIEW_MODEL || "gemini-3.6-flash";

type ReviewInput = {
  suite: string;
  tests: Array<{
    id: number;
    name: string;
    passed: boolean;
    durationMs: number;
    error?: string;
    evidence?: {
      url?: string;
      visibleText?: string;
      controls?: string[];
      screenshotBase64?: string;
    };
  }>;
  aiResult?: unknown;
};

function extractJson(text: string) {
  const cleaned = text.replace(/^\uFEFF/, "").replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("AI quality reviewer returned no JSON object.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  try { return JSON.stringify(error); } catch { return String(error); }
}

function getErrorCode(error: unknown) {
  const value = error as any;
  return value?.status ?? value?.code ?? value?.error?.status ?? value?.error?.code ?? value?.details?.code ?? value?.cause?.code ?? null;
}

function isQuotaError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();
  const code = getErrorCode(error);
  return code === 429 || code === "429" || code === "resource_exhausted" || code === "RESOURCE_EXHAUSTED" || message.includes("resource_exhausted") || message.includes("quota exceeded") || message.includes("too many requests") || message.includes("generate_content_free_tier_requests");
}

function getRetryAfterSeconds(error: unknown) {
  const message = getErrorMessage(error);
  const retryMatch = message.match(/retry(?:delay|\s+in)?[^0-9]{0,30}(\d+(?:\.\d+)?)\s*s/i);
  if (retryMatch) return Math.ceil(Number(retryMatch[1]));
  const detailMatch = message.match(/retryDelay[^0-9]{0,20}(\d+(?:\.\d+)?)\s*s/i);
  return detailMatch ? Math.ceil(Number(detailMatch[1])) : null;
}

function quotaSummary(error: unknown, retryAfterSeconds: number | null) {
  const value = error as any;
  const quotaModel = value?.error?.details?.find?.((detail: any) => detail?.quotaFailure)?.quotaFailure?.violations?.[0]?.quotaDimensions?.model;
  const model = quotaModel || MODEL;
  return retryAfterSeconds
    ? `Gemini quota is exhausted for ${model}. The automated tests completed; AI review was skipped. Retry after approximately ${retryAfterSeconds}s or use a model/project with available quota.`
    : `Gemini quota is exhausted for ${model}. The automated tests completed; AI review was skipped. Increase quota, wait for the provider reset, or configure another review model.`;
}

export async function reviewQualitySuite(input: ReviewInput) {
  if (!process.env.GEMINI_API_KEY) return { status: "SKIPPED", reason: "GEMINI_API_KEY is not configured for the AI review layer.", model: MODEL, overallScore: null, reviews: [] };

  const system = `
You are TrialIQ's AI Quality Reviewer. Playwright establishes whether an automated requirement passed; you evaluate whether the tested product experience is actually good and what should be improved.

IMPORTANT DIAGNOSIS RULE:
A failing automated test is NOT automatically an AI defect. A passing automated test is NOT automatically a good product experience.
For every test, determine the most likely ROOT CAUSE LAYER from exactly one of:
- AI_OUTPUT: the model's reasoning/content/evidence interpretation is wrong, unsupported, unsafe or incomplete.
- UI: the underlying product UI does not correctly expose, present or support otherwise-correct behavior/output.
- FLOW: the user journey, interaction sequence, state handling or navigation makes a correct capability difficult, blocked or confusing.
- TEST: the Playwright assertion/selector/test expectation is incorrect or too broad for the actual product behavior.
- INFRASTRUCTURE: environment, provider quota, network, authentication, runner or other infrastructure caused the failure.
- NONE: no meaningful defect is supported by the supplied evidence.

For AI suites, if the AI output is correct but the product presentation or user journey is deficient, recommend changing the UI or FLOW rather than changing good AI behavior. Only recommend AI_OUTPUT changes when the supplied model output itself is deficient.
For UI suites, inspect screenshots, visible text, controls, URLs and test errors. Review visual hierarchy, task clarity, interaction flow, accessibility cues, content clarity, feedback/state handling, cognitive load and reviewer efficiency.
For AI suites, inspect the captured AI result for evidence grounding, reasoning quality, uncertainty, decision usefulness, traceability and operational usefulness. When a test fails, compare the assertion failure with the actual captured result before assigning root cause.
Never invent UI behavior, AI behavior, evidence or screenshots. If the supplied evidence cannot establish a root cause, use NONE and say what evidence is missing.
Recommendations must target the selected rootCauseLayer. Do not recommend modifying a correct AI output merely to make a test pass.

Return ONLY valid JSON:
{
  "status":"COMPLETE",
  "model":"",
  "overallScore":0,
  "overallSummary":"",
  "reviews":[{
    "testId":0,
    "score":0,
    "verdict":"Strong | Good | Needs Improvement | Critical",
    "rootCauseLayer":"AI_OUTPUT | UI | FLOW | TEST | INFRASTRUCTURE | NONE",
    "rootCauseConfidence":0,
    "isProductDefect":true,
    "strengths":[""],
    "issues":[{"severity":"High | Medium | Low","issue":"","evidence":""}],
    "recommendations":[{"priority":"P0 | P1 | P2","layer":"AI_OUTPUT | UI | FLOW | TEST | INFRASTRUCTURE","recommendation":"","expectedImpact":""}],
    "reviewNotes":""
  }]
}

Score guidance: 90-100 excellent, 80-89 good, 70-79 needs improvement, below 70 critical. Use rootCauseLayer NONE when the test is healthy and no supported improvement is necessary. Use TEST when the assertion itself is the problem. Use UI/FLOW when correct AI behavior is poorly presented or hard to use. Use AI_OUTPUT only when the model result itself is wrong or deficient.`;

  const parts: Array<Record<string, unknown>> = [{
    text: `${system}\n\nSUITE:\n${input.suite}\n\nTEST DATA:\n${JSON.stringify(input.tests.map(({ evidence, ...test }) => ({
      ...test,
      evidence: evidence ? { url: evidence.url, visibleText: evidence.visibleText, controls: evidence.controls } : undefined,
    })), null, 2)}\n\nAI RESULT (when available):\n${JSON.stringify(input.aiResult ?? null, null, 2)}`,
  }];

  for (const test of input.tests) {
    if (!test.evidence?.screenshotBase64) continue;
    parts.push({ text: `Screenshot evidence for test ${test.id}: ${test.name}` });
    parts.push({ inlineData: { mimeType: "image/jpeg", data: test.evidence.screenshotBase64 } });
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts }],
      config: { responseMimeType: "application/json", temperature: 0.1 },
    });

    const parsed = extractJson(response.text ?? "");
    return { ...parsed, status: "COMPLETE", model: MODEL };
  } catch (error) {
    if (isQuotaError(error)) {
      const retryAfterSeconds = getRetryAfterSeconds(error);
      return {
        status: "QUOTA_LIMITED",
        model: MODEL,
        overallScore: null,
        reviews: [],
        error: quotaSummary(error, retryAfterSeconds),
        retryAfterSeconds,
        overallSummary: "The deterministic test suite completed, but the optional AI review layer was unavailable because the Gemini quota is exhausted. No test result was changed or retried.",
      };
    }

    return {
      status: "ERROR",
      model: MODEL,
      overallScore: null,
      reviews: [],
      error: getErrorMessage(error),
      overallSummary: "The deterministic test suite completed, but the AI review layer encountered an error. The automated test results remain authoritative.",
    };
  }
}
