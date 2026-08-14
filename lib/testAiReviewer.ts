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
    evidence?: { url?: string; visibleText?: string; screenshotBase64?: string };
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
  return String(error);
}

function isQuotaError(error: unknown) {
  const value = error as any;
  const message = getErrorMessage(error).toLowerCase();
  return value?.status === 429 || value?.code === 429 || message.includes("resource_exhausted") || message.includes("quota exceeded") || message.includes("too many requests");
}

function getRetryAfterSeconds(error: unknown) {
  const message = getErrorMessage(error);
  const match = message.match(/retry(?:delay| in)?[^0-9]{0,20}(\d+(?:\.\d+)?)\s*s/i);
  return match ? Math.ceil(Number(match[1])) : null;
}

export async function reviewQualitySuite(input: ReviewInput) {
  if (!process.env.GEMINI_API_KEY) return { status: "SKIPPED", reason: "GEMINI_API_KEY is not configured for the AI review layer.", model: MODEL, overallScore: null, reviews: [] };

  const system = `
You are TrialIQ's AI Quality Reviewer. Playwright establishes whether an automated requirement passed; you evaluate whether the tested experience is clear, efficient, accessible, trustworthy and improvable.

Do not invent product behavior. Review only supplied test facts, visible UI text, screenshots and AI output. A passing assertion does not mean the experience is good. A failed assertion is a factual failure and should not be reframed as a UX preference.

For UI suites, review visual hierarchy, task clarity, interaction flow, accessibility cues, content clarity, feedback/state handling, cognitive load and reviewer efficiency. For AI suites, review evidence grounding, reasoning quality, uncertainty, decision usefulness, traceability and operational usefulness.

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
    "strengths":[""],
    "issues":[{"severity":"High | Medium | Low","issue":"","evidence":""}],
    "recommendations":[{"priority":"P0 | P1 | P2","recommendation":"","expectedImpact":""}],
    "reviewNotes":""
  }]
}

Score guidance: 90-100 excellent, 80-89 good, 70-79 needs improvement, below 70 critical. Focus on product quality revealed by the evidence.`;

  const parts: Array<Record<string, unknown>> = [{
    text: `${system}\n\nSUITE:\n${input.suite}\n\nTEST DATA:\n${JSON.stringify(input.tests.map(({ evidence, ...test }) => ({ ...test, evidence: evidence ? { url: evidence.url, visibleText: evidence.visibleText } : undefined })), null, 2)}\n\nAI RESULT (when available):\n${JSON.stringify(input.aiResult ?? null, null, 2)}`,
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
        error: getErrorMessage(error),
        retryAfterSeconds,
        overallSummary: "The automated suite completed, but the AI review layer could not run because the model quota is currently exhausted.",
      };
    }

    throw error;
  }
}
