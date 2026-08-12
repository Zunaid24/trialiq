export function hardenClinicalOutput(module: string, result: any, sourceText = "") {
  if (!result || typeof result !== "object") return result;

  const normalizeLabText = (value: string) =>
    value
      .replace(/×10\s*n\s*\/L/gi, "×10⁹/L")
      .replace(/x10\s*n\s*\/L/gi, "×10⁹/L")
      .replace(/×10\^?9\s*\/L/gi, "×10⁹/L")
      .replace(/x10\^?9\s*\/L/gi, "×10⁹/L");

  const normalizeLabOutput = (value: any): any => {
    if (typeof value === "string") return normalizeLabText(value);
    if (Array.isArray(value)) return value.map(normalizeLabOutput);
    if (value && typeof value === "object") {
      for (const key of Object.keys(value)) value[key] = normalizeLabOutput(value[key]);
    }
    return value;
  };

  const isEvidenceGap = (value: unknown) =>
    /\b(not documented|unknown|insufficient evidence|not provided|not available|cannot be determined|pending(?:\s|$)|unable to determine)\b/i.test(
      String(value ?? "")
    );

  const hardenEligibilityEvidence = () => {
    const groups = [
      result?.criteriaEvaluation?.inclusion,
      result?.criteriaEvaluation?.exclusion,
    ].filter(Array.isArray) as any[][];

    let pendingCount = 0;
    let correctedUnsupportedMet = 0;

    for (const criteria of groups) {
      for (const criterion of criteria) {
        if (!criterion || typeof criterion !== "object") continue;

        const actualGap = isEvidenceGap(criterion.actual);
        const evidenceGap = isEvidenceGap(criterion.evidence);
        const status = String(criterion.status ?? "");

        // Absence of documentation is never proof that a criterion was met.
        // This is deliberately deterministic so the model cannot turn a
        // missing source field into a positive eligibility finding.
        if (status === "Met" && (actualGap || evidenceGap)) {
          criterion.status = "Pending";
          criterion.reviewRequired = true;
          correctedUnsupportedMet += 1;
        }

        if (criterion.status === "Pending" || criterion.status === "Requires Review") {
          criterion.reviewRequired = true;
          pendingCount += 1;
        }
      }
    }

    if (pendingCount > 0) {
      result.pendingAssessments = Array.isArray(result.pendingAssessments) ? result.pendingAssessments : [];
      result.confidence = Math.min(Number(result.confidence ?? 100), correctedUnsupportedMet > 0 ? 85 : 90);

      const hasDefinitiveFailure = groups.some((criteria) =>
        criteria.some((criterion) => criterion?.status === "Not Met")
      );

      if (!hasDefinitiveFailure && result.screeningResult === "Eligible") {
        result.eligible = false;
        result.screeningResult = "Pending Review";
      }
    }
  };

  if (module === "Laboratory Intelligence") normalizeLabOutput(result);

  if (module === "Eligibility Screening") hardenEligibilityEvidence();

  if (module === "Safety Signal Detection" && Array.isArray(result.signals)) {
    const participantCount = Number(result.participantsReviewed);
    if (participantCount === 1) {
      result.signals = result.signals.map((signal: any) => {
        if (!signal || typeof signal !== "object") return signal;
        signal.status = "Pattern Observed";
        if (signal.frequency && !String(signal.frequency).includes("single-participant observation")) {
          signal.frequency = `${signal.frequency} — single-participant observation`;
        }
        return signal;
      });

      result.notablePatterns = Array.isArray(result.notablePatterns) ? result.notablePatterns : [];
      const note = "Single-participant observation; this dataset does not establish a population-level safety signal.";
      if (!result.notablePatterns.includes(note)) result.notablePatterns.push(note);

      result.overallSafetyStatus = "Requires Review — Pattern Observed";
      result.summary = `${String(result.summary ?? "").replace(/\.$/, "")}. This is a single-participant observation and does not establish a population-level safety signal.`;
    }
  }

  if (module === "Medical Coding Intelligence" && Array.isArray(result.codingItems)) {
    for (const item of result.codingItems) {
      if (!item || typeof item !== "object") continue;
      if (Array.isArray(item.alternativeSuggestions)) {
        item.alternativeSuggestions = item.alternativeSuggestions
          .filter((value: any) => typeof value === "string" && value.trim())
          .filter((value: string, index: number, arr: string[]) => arr.indexOf(value) === index)
          .filter((value: string) => {
            const normalized = value.toLowerCase().trim();
            const source = sourceText.toLowerCase();
            const diagnosticTerms = ["migraine", "pneumonia", "sepsis", "heart failure", "stroke", "cancer"];
            return !diagnosticTerms.includes(normalized) || source.includes(normalized);
          })
          .slice(0, 3);
      }
      if (item.status === "Suggested") item.status = "Review Required";
    }
    result.humanReviewRequired = true;
  }

  if (module === "Adverse Event Assessment") {
    const missing = Array.isArray(result.missingInformation) ? result.missingInformation : [];
    if (missing.length > 0 && result.reviewStatus === "Confirmed") result.reviewStatus = "Requires Review";
  }

  if (module === "Concomitant Medication Review" && Array.isArray(result.potentialProtocolConcerns)) {
    for (const concern of result.potentialProtocolConcerns) {
      if (!concern || typeof concern !== "object") continue;
      if (/washout|restriction|prohibited|restricted/i.test(String(concern.concern ?? ""))) {
        concern.status = "Requires Review";
      }
    }
  }

  return result;
}
