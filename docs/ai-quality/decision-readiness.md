# Decision readiness quality gate

Decision readiness is a reviewer-facing state, not a model confidence score.

**Decision-Ready** means the evidence set is sufficiently complete for the current review state and contains no unresolved contradiction or blocking review item.

**Review Required** means evidence exists but the reviewer still has a meaningful unresolved item, evidence gap, or priority finding.

**Not Decision-Ready** means evidence is absent or internally contradictory enough that closure would be unsafe.

The UI should always show the reason for the state and the evidence that would move the case forward.
