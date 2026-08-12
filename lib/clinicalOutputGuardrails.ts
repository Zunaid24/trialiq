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
    /\b(not documented|unknown|insufficient evidence|not provided|not available|cannot be determined|pending(?:\s|$)|unable to determine|not established)\b/i.test(
      String(value ?? "")
    );

  const hasMeaningfulEvidence = (item: any) =>
    typeof item?.evidence === "string" && item.evidence.trim().length >= 12;

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

        if (status === "Met" && (actualGap || evidenceGap || !hasMeaningfulEvidence(criterion))) {
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

    const hasDefinitiveFailure = groups.some((criteria) =>
      criteria.some((criterion) => criterion?.status === "Not Met")
    );

    if (pendingCount > 0) {
      result.pendingAssessments = Array.isArray(result.pendingAssessments) ? result.pendingAssessments : [];
      result.confidence = Math.min(Number(result.confidence ?? 100), correctedUnsupportedMet > 0 ? 85 : 90);
      result.clinicalReviewRequired = true;
      result.decisionReadiness = "Not Decision-Ready";
      if (!hasDefinitiveFailure && result.screeningResult === "Eligible") {
        result.eligible = false;
        result.screeningResult = "Pending Review";
      }
    }

    if (hasDefinitiveFailure) {
      result.clinicalReviewRequired = true;
      result.decisionReadiness = "Not Decision-Ready";
    }
  };

  const hardenLabEvidence = () => {
    if (!Array.isArray(result.labs)) return;

    for (const lab of result.labs) {
      if (!lab || typeof lab !== "object") continue;
      if ((lab.status === "Abnormal" || lab.status === "Critical") && !hasMeaningfulEvidence(lab)) {
        lab.reviewRequired = true;
        lab.status = "Unknown";
        lab.clinicalSignificance = "Insufficient evidence for a reliable interpretation";
      }
      if (lab.status === "Critical" && !/(critical|urgent|life-threatening|panic)/i.test(`${lab.clinicalSignificance ?? ""} ${lab.evidence ?? ""}`)) {
        lab.status = "Abnormal";
        lab.reviewRequired = true;
      }
    }

    if (Array.isArray(result.protocolViolations)) {
      result.protocolViolations = result.protocolViolations.filter((violation: any) => {
        if (typeof violation === "string") return !isEvidenceGap(violation);
        return hasMeaningfulEvidence(violation) || Boolean(violation?.sourceReference);
      });
    }

    result.clinicalReviewRequired = result.labs.some((lab: any) => lab?.reviewRequired);
  };

  if (module === "Laboratory Intelligence") {
    normalizeLabOutput(result);
    hardenLabEvidence();
  }

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
      result.clinicalReviewRequired = true;
      result.decisionReadiness = "Not Decision-Ready";
      result.summary = `${String(result.summary ?? "").replace(/\.$/, "")}. This is a single-participant observation and does not establish a population-level safety signal.`;
    }

    for (const signal of result.signals) {
      if (!signal || typeof signal !== "object") continue;
      if (!hasMeaningfulEvidence(signal)) {
        signal.status = "Requires Review";
        signal.priority = "Review";
      }
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
      if (!hasMeaningfulEvidence(item)) item.status = "Review Required";
      if (item.icd10 && !item.icd10.code) item.icd10.description = "Not assigned — qualified coder review required";
    }
    result.humanReviewRequired = true;
    result.decisionReadiness = "Human Review Required";
  }

  if (module === "Adverse Event Assessment") {
    const missing = Array.isArray(result.missingInformation) ? result.missingInformation : [];
    if (missing.length > 0 && result.reviewStatus === "Confirmed") result.reviewStatus = "Requires Review";
    if (missing.length > 0 || result.resolutionDate === "Not documented" || result.expectedness === "Not documented") {
      result.reviewStatus = "Requires Review";
      result.clinicalReviewRequired = true;
      result.decisionReadiness = "Not Decision-Ready";
    }
    if (result.causality && isEvidenceGap(result.causality)) result.causality = "Not documented";
  }

  if (module === "Concomitant Medication Review" && Array.isArray(result.potentialProtocolConcerns)) {
    for (const concern of result.potentialProtocolConcerns) {
      if (!concern || typeof concern !== "object") continue;
      if (/washout|restriction|prohibited|restricted/i.test(String(concern.concern ?? ""))) {
        concern.status = "Requires Review";
      }
    }
    if (Array.isArray(result.missingInformation) && result.missingInformation.length > 0) {
      result.protocolReviewRequired = Array.isArray(result.protocolReviewRequired) ? result.protocolReviewRequired : [];
      result.clinicalReviewRequired = true;
      result.decisionReadiness = "Not Decision-Ready";
    }
  }

  if (module === "Protocol Deviation Detection") {
    if (Array.isArray(result.deviations)) {
      for (const deviation of result.deviations) {
        if (!deviation || typeof deviation !== "object") continue;
        const hasRequirement = Boolean(String(deviation.protocolRequirement ?? "").trim()) && !isEvidenceGap(deviation.protocolRequirement);
        const hasActual = Boolean(String(deviation.actualEvent ?? deviation.description ?? "").trim()) && !isEvidenceGap(deviation.actualEvent ?? deviation.description);
        if (deviation.status === "Confirmed" && (!hasRequirement || !hasActual || !hasMeaningfulEvidence(deviation))) {
          deviation.status = "Requires Review";
        }
        if (isEvidenceGap(deviation.severity)) deviation.severity = "Not documented";
        if (isEvidenceGap(deviation.impact)) deviation.impact = "Requires investigator assessment";
      }
    }
    result.investigatorReviewRequired = true;
    result.clinicalReviewRequired = true;
    result.decisionReadiness = "Human Review Required";
  }

  return result;
}
