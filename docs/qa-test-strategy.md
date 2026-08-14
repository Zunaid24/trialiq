# TrialIQ QA test strategy

The QA system is intentionally built in layers so a passing suite tells us what improved and what still needs coverage.

## Phase 1 — AI quality

Current automated suite: **33 gates**.

It evaluates the Clinical Intelligence result itself: decision readiness, evidence lineage, uncertainty, unsupported-claim suppression, reviewer actions, safety, protocol impact, auditability and decision coherence.

### Deferred AI cases

These are intentionally not forced into the current output benchmark because they require a different test mechanism:

- new vs recurring finding distinction
- review-pressure calculation
- malformed model JSON recovery
- user-scoped finding persistence
- cross-session longitudinal persistence
- sparse-evidence fixture variations

Those should be added with controlled fixtures/mocks rather than brittle text assertions.

## Phase 2 — UI tests

Test the product as a user sees it:

- navigation and routing
- page loading and empty states
- buttons, tabs, filters and drawers
- forms and validation
- loading/error/success states
- responsive behavior
- accessibility and keyboard interaction
- visual/report rendering

## Phase 3 — Role-based tests

Run the same workflows under each supported permission model and verify both allowed and forbidden actions.

Suggested matrix:

- Study coordinator
- Clinical reviewer
- Medical reviewer / safety role
- Admin
- Read-only / analyst

Each role gets explicit positive and negative permission cases.

## Phase 4 — Scenario-based tests

Test complete operational journeys rather than isolated pages.

Examples:

1. New participant enters screening → eligibility review → unresolved evidence → coordinator action.
2. Abnormal labs → protocol impact → safety review → decision readiness.
3. Adverse event → causality uncertainty → coding review → final reviewer action.
4. Protocol deviation → operational impact → data-integrity assessment → closure.
5. Conflicting source documents → reconciliation → review queue → decision.

## Phase 5 — Competitor benchmark

The final layer compares TrialIQ against defined competitor capabilities and reviewer outcomes, not superficial UI similarity.

For every competitor benchmark we record:

- task
- expected reviewer outcome
- TrialIQ result
- competitor result/source
- evidence quality
- workflow effort
- explainability/auditability
- safety/uncertainty behavior
- pass/fail and improvement opportunity

## Test runner principle

All phases should eventually use the same `/test.html` control plane:

`/test.html → Start Test → headless Playwright → timestamped run → result page → historical trend`

Credentials remain in local environment configuration and are never entered into the web UI.
