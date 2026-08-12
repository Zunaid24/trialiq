# Clinical decision intelligence model

## Output hierarchy

TrialIQ separates every material statement into:

1. **Observed fact** — directly present in a source.
2. **Derived check** — deterministic comparison, such as a laboratory value against a protocol threshold.
3. **Interpretation** — contextual reasoning across supported facts.
4. **Potential relationship** — plausible connection that requires confirmation.
5. **Recommended action** — operational review step.

## Three scores, not one

- **Finding confidence:** support for an individual finding.
- **Evidence completeness:** coverage and quality of the supplied evidence pack.
- **Decision readiness:** whether the available evidence is sufficient for the next human decision.

A high-confidence finding can coexist with a low decision-readiness state when critical evidence is missing.

## Decision states

### Decision-Ready
Evidence is sufficiently complete, consistent and supported for the defined review decision.

### Review Required
The evidence is meaningful, but unresolved findings, high-priority issues or gaps require human review.

### Not Decision-Ready
The evidence is too incomplete or contradictory to support a responsible decision.

## Risk-based review

The decision layer prioritizes issues that can affect:

- participant safety review
- eligibility/enrollment
- protocol compliance
- data integrity
- coding quality
- coordinator workload

## Longitudinal behavior

When previous evidence is available, TrialIQ should prefer:

`Known finding → new observation → delta → interpretation → decision impact`

rather than regenerating an isolated summary.
