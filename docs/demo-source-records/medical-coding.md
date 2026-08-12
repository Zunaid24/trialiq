# Medical Coding Intelligence — Clinical Source Extract

**Study:** TRIALIQ-001  
**Participant:** P-1042  
**Source document:** Clinical Source / Adverse Event and Medical History Extract  
**Coding workflow:** Preliminary AI-assisted coding suggestions for qualified human review  
**Dataset:** Synthetic / demonstration only

## Verbatim clinical terms

| Date | Classification in source | Verbatim term | Context |
|---|---|---|---|
| 05-May-2026 | Adverse event | Severe headache | Approximately 6 hours after study treatment |
| 07-May-2026 | Adverse event | Nausea | Intermittent; approximately 2 hours |
| 09-May-2026 | Adverse event | Elevated blood pressure | 158/96 mmHg during scheduled assessment |
| 12-May-2026 | Adverse event | Skin rash on trunk | Mild erythematous rash; no blistering documented |
| 18-May-2026 | Adverse event | Insomnia | Difficulty sleeping for three nights |
| 25-May-2026 | Adverse event | Abdominal pain | Mild intermittent postprandial discomfort |
| 02-Jun-2026 | Past medical history | Type 2 diabetes mellitus | Documented by investigator |
| 02-Jun-2026 | Past medical history | Hypertension | Documented by investigator |

## Source-level coding observations
- The six terms dated 05-May through 25-May are documented in the extract as adverse-event terms.
- The two terms dated 02-Jun are documented as past medical history.
- The source provides clinical wording and context but does not provide final dictionary codes.
- No active dictionary version is specified in the source.
- Causality is not established by the source extract.

## Coding rules for demonstration
1. Preserve the verbatim term and source context.
2. Normalize terminology only where the documented wording supports the normalization.
3. Keep adverse-event terminology separate from past medical history.
4. Do not infer a new diagnosis solely from a symptom or measurement.
5. Do not invent numeric MedDRA or ICD-10 codes.
6. Record dictionary version as unavailable when it is not supplied.
7. All suggestions require qualified human medical coder review before use.

## Example review questions
- Does “Elevated blood pressure” remain an observation/investigation finding rather than being automatically converted to the history term “Hypertension”?
- Does “Severe headache” support normalization to “Headache” without adding unsupported diagnoses?
- Is the selected MedDRA term appropriate for the documented context and active dictionary version?

## Missing source information
- Active MedDRA dictionary version.
- Numeric dictionary codes.
- Final coding disposition.
- Any organization-specific coding conventions.

**Synthetic fictional data for software demonstration only.**