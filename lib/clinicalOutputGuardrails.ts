export function hardenClinicalOutput(module: string, result: any, sourceText = "") {
  if (!result || typeof result !== "object") return result;

  if (module === "Laboratory Intelligence" && Array.isArray(result.labs)) {
    for (const lab of result.labs) {
      if (!lab || typeof lab !== "object" || typeof lab.unit !== "string") continue;
      lab.unit = lab.unit
        .replace(/×10\s*n\s*\/L/gi, "×10⁹/L")
        .replace(/x10\s*n\s*\/L/gi, "×10⁹/L")
        .replace(/×10\^?9\s*\/L/gi, "×10⁹/L");
    }
  }

  if (module === "Safety Signal Detection" && Array.isArray(result.signals)) {
    const participantCount = Number(result.participantsReviewed);
    if (participantCount === 1) {
      result.signals = result.signals.map((signal: any) => {
        if (!signal || typeof signal !== "object") return signal;
        if (signal.status === "Potential Signal") signal.status = "Pattern Observed";
        if (signal.frequency && !String(signal.frequency).includes("single-participant")) {
          signal.frequency = `${signal.frequency} — single-participant observation`;
        }
        return signal;
      });
      result.notablePatterns = Array.isArray(result.notablePatterns) ? result.notablePatterns : [];
      const note = "Single-participant observation; this dataset does not establish a population-level safety signal.";
      if (!result.notablePatterns.includes(note)) result.notablePatterns.push(note);
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
            // Prevent unsupported diagnostic alternatives such as inferring migraine from headache.
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
    if (missing.length > 0 && result.reviewStatus === "Confirmed") {
      result.reviewStatus = "Requires Review";
    }
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
