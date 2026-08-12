# Concomitant Medication Review — Screening & Recent History

**Study:** TRIALIQ-101  
**Participant:** PT-1042  
**Source document:** Concomitant Medication Record — Screening Review  
**Review purpose:** Identify current medications, recent medication history, missing medication details, and protocol-review dependencies.  
**Dataset:** Synthetic / demonstration only

## Current medications

| Medication | Dose | Frequency | Route | Indication | Start date | Status |
|---|---|---|---|---|---|---|
| Ondansetron | 8 mg | Twice daily PRN | Not documented | Nausea | Not documented | Active |
| Metformin | 500 mg | Twice daily | Not documented | Type 2 diabetes | Not documented | Active |
| Lisinopril | 10 mg | Once daily | Not documented | Hypertension | Not documented | Active |
| Omeprazole | 20 mg | Once daily | Not documented | Dyspepsia | Not documented | Active |

## Recent medication history

| Medication | Start | Stop | Dose | Frequency | Route | Indication | Status |
|---|---|---|---|---|---|---|---|
| Prednisone | 01-Aug-2026 | 05-Aug-2026 | Not documented | Not documented | Not documented | Not fully documented | Discontinued |
| Amoxicillin | 20-Jul-2026 | 27-Jul-2026 | Not documented | Not documented | Not documented | Not documented | Discontinued |

## Source observations
- Prednisone is documented as a short recent course, but the medical indication is incomplete.
- Dose, frequency, and route are not documented for the recent medication history.
- Start dates and routes are not documented for the current medication list.
- Amoxicillin is documented as a completed course without an indication.

## Protocol-review boundary
The source record does not define prohibited medications, washout durations, or protocol-specific restrictions. Recent medication use must therefore be surfaced for review rather than labeled prohibited without explicit protocol evidence.

## Required coordinator follow-up
1. Obtain the full indication, dose, frequency, and route for Prednisone.
2. Obtain the indication, dose, frequency, and route for Amoxicillin.
3. Obtain start dates and routes for current medications.
4. Compare the Prednisone course against the active protocol's corticosteroid restrictions and washout rules, if any.
5. Document the protocol reference used for any medication-related conclusion.

## Evidence and review rules
- Preserve medication dates exactly as documented.
- Distinguish active medications from completed/recent medications.
- Do not infer a missing indication from the medication name alone.
- Do not convert a protocol-review question into a confirmed violation without protocol evidence.

**Synthetic fictional data for software demonstration only.**