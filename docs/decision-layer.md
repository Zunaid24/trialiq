# Clinical decision layer

The decision layer sits after evidence extraction and before the user-facing review state.

It answers:

1. Is the evidence sufficient for a decision?
2. How much review pressure remains?
3. What prevents closure?

## States

- **Decision-Ready** — evidence-backed findings exist and no unresolved evidence, contradiction, or high-priority review item remains.
- **Review Required** — evidence exists but unresolved items, gaps, or priority findings remain.
- **Not Decision-Ready** — there is no evidence-backed finding or contradictions prevent a reliable decision.

The layer is deliberately conservative. It does not create clinical facts or replace clinician judgment.
