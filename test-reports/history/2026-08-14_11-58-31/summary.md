# TrialIQ AI Quality Benchmark

## Run

- **Timestamp:** 2026-08-14T11:58:31.548Z
- **Status:** FAIL
- **Playwright exit code:** 1
- **Total:** 0
- **Passed:** 0
- **Failed:** 0
- **Skipped:** 0
- **Flaky:** 0
- **Pass rate:** 0.0%

## Test target

`tests/e2e/ai-quality-benchmark.spec.ts`

## Purpose

This run evaluates TrialIQ's AI output quality across decision readiness, evidence grounding, clinical reasoning, safety, operational recommendations, auditability, provenance, and decision coherence.

## Stored artifacts

- Latest machine-readable result: `test-reports/latest/results.json`
- Latest summary: `test-reports/latest/summary.md`
- Historical run: `test-reports/history/2026-08-14_11-58-31/`

## Git workflow

Commit the generated `test-reports/` directory after each benchmark run so results can be compared across AI refinements.

## Integrity check

The runner treats a missing/empty Playwright report as a failed benchmark. A zero-test run can no longer be incorrectly reported as PASS.
