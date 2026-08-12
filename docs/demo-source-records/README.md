# TrialIQ Demo Source Records

These synthetic source records are the canonical, human-readable evidence package used to design and validate TrialIQ's clinical AI demonstrations. They are intentionally more detailed than toy prompts so the product can demonstrate document-grounded extraction, protocol-aware reasoning, missing-information handling, evidence traceability, and human review boundaries.

## What makes these records useful

Each record is designed to contain a realistic mix of:

- Document metadata and source context.
- Structured clinical observations and tables.
- Positive findings and normal findings.
- Explicit missing or pending information.
- Operational follow-up actions.
- Protocol boundaries and decision rules.
- Evidence-oriented interpretation guidance.
- Clear distinctions between observation, review status, and confirmed conclusion.

## Quality principles

1. **Synthetic only.** No real patient data is used.
2. **Missing information stays missing.** The AI should not fill gaps with plausible clinical facts.
3. **Source evidence takes precedence.** Conclusions should be traceable to documented values or statements.
4. **Protocol thresholds are authoritative only when explicitly supplied.** A laboratory reference range must not be substituted for a study criterion.
5. **Pending is different from failure.** Missing documentation should not automatically become a negative eligibility finding.
6. **Observations are not diagnoses or population signals.** A single-participant observation must not be presented as a population-level safety signal.
7. **Temporal association is not causality.** Adverse-event causality remains qualified unless explicitly established in the source.
8. **Coding remains human-reviewed.** AI coding suggestions do not replace qualified medical coder review.
9. **Operational conclusions remain qualified.** Regulatory reporting, sponsor notification, CAPA, dose modification, and similar actions require the applicable source rule.

## Records

- `lab-intelligence.md` — screening hematology and chemistry panel with abnormal, normal, and missing protocol context.
- `medication-review.md` — current medications, recent medication history, incomplete details, and protocol-review dependencies.
- `adverse-event.md` — initial ongoing adverse-event report with management, causality, expectedness, and follow-up gaps.
- `protocol-deviation.md` — two confirmed out-of-window deviations with operational impact and unresolved classification.
- `safety-signals.md` — cross-document safety observations explicitly constrained to a single participant.
- `medical-coding.md` — verbatim clinical terms with adverse-event versus medical-history context and coding guardrails.
- `protocol-eligibility.md` — synthetic protocol synopsis with explicit inclusion/exclusion thresholds and evidence rules.
- `participant-summary.md` — participant screening evidence designed to exercise Met / Not Met / Pending eligibility reasoning.

## Recommended demo workflow

1. Present the source document to the relevant TrialIQ module.
2. Extract structured facts while preserving dates, units, and source context.
3. Compare only against protocol rules that are actually available.
4. Surface missing information and review dependencies.
5. Produce a qualified clinical/operational assessment.
6. Keep human review visible wherever the evidence is incomplete or the decision requires investigator, coordinator, sponsor, or qualified coder judgment.

**Synthetic fictional data for software demonstration only.**