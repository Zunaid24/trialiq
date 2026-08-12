const MODEL_CHAIN = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
] as const;

function collectSourceReferences(value: unknown, output = new Set<string>()): Set<string> {
  if (!value || typeof value !== "object") return output;

  if (Array.isArray(value)) {
    for (const item of value) collectSourceReferences(item, output);
    return output;
  }

  for (const [key, child] of Object.entries(value)) {
    if (key === "sourceReference" && typeof child === "string" && child.trim()) {
      output.add(child.trim());
    } else {
      collectSourceReferences(child, output);
    }
  }

  return output;
}

export function addClinicalAuditMetadata(result: any, module: string) {
  const sourceReferences = Array.from(collectSourceReferences(result));
  const reviewStatus =
    result?.reviewStatus ??
    result?.screeningResult ??
    result?.overallSafetyStatus ??
    (result?.investigatorReviewRequired || result?.clinicalReviewRequired || result?.humanReviewRequired
      ? "Requires Review"
      : "Review status not explicitly returned");

  return {
    ...result,
    audit: {
      module,
      generatedAt: new Date().toISOString(),
      modelStrategy: "Gemini multi-model fallback chain",
      configuredModels: MODEL_CHAIN,
      fallbackEnabled: true,
      modelUsed: result?.aiModel ?? "Not exposed by analysis engine",
      fallbackUsed: result?.aiFallbackUsed ?? null,
      extractionConfidence: result?.confidence ?? null,
      assessmentConfidence: result?.assessmentConfidence ?? null,
      reviewStatus,
      sourceReferences,
    },
  };
}
