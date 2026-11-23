# Contributing to TrialIQ

Thanks for looking. TrialIQ reviews clinical trial evidence, so contributions here carry a bit more weight than usual — a wrong threshold or a confidently stated inference is not just a bug.

## The one rule with no exceptions

**Never add real patient data.** No participant records, no medical summaries, no protocol documents from a real study, no screenshots containing them — not in a commit, not in an issue, not in a test fixture, not in a pull request description.

All demo material in this repository is synthetic and marked as such (`public/demo/`, `docs/demo-source-records/`). If you need a new case to test against, invent one in the same style: an invented study, an invented participant id, values chosen to exercise the check. If you are unsure whether something counts, it counts — leave it out and describe the shape of the problem instead.

Credentials follow the same rule: `.env*` is ignored and stays ignored. New settings go in `.env.example` with placeholder values.

## Getting set up

```bash
npm install
cp .env.example .env.local
npm run dev                # http://localhost:3000
```

You need your own Supabase project and Gemini API key. The bundled demo documents let you walk the whole flow without supplying anything of your own.

```bash
npm run lint
npm run test:smoke         # fast Playwright check
npm run test:e2e           # full suite
```

## What would help

- **Criteria extraction** — protocol formats that parse badly, criteria the extractor misses or misreads.
- **Derived checks** — a lab or threshold comparison that is wrong, or a unit conversion that is missing. These are deterministic and testable; a failing case is a good pull request on its own.
- **The fact / interpretation boundary** — anywhere the output states an interpretation as an observed fact. This is the thing that matters most in a tool like this.
- **Evidence completeness** — criteria that should be reported as pending but are silently skipped.
- **Accessibility and UI** — the review screens are dense; they can be clearer.
- **Tests** — Playwright specs for flows that have none.

## How we think about output

Read [`docs/clinical-decision-model.md`](docs/clinical-decision-model.md) before changing anything that produces findings. Two things hold throughout:

1. Every material statement is classified — observed fact, derived check, interpretation, potential relationship, or recommended action. A change that blurs those categories will be asked to change.
2. Missing evidence is reported, never filled in. If a protocol criterion is not covered by the source documents, the correct output is *pending*, not a guess.

## Pull requests

- One problem per pull request.
- `npm run lint` and `npm run test:smoke` should pass.
- Say how you checked it. For an extraction or threshold change, include the synthetic case that fails before and passes after.
- If your change affects what the tool claims or how confident it sounds, say so explicitly in the description.

## Reporting a problem

Open an issue with the synthetic input, what TrialIQ produced, and what you expected. A finding that is wrong in a *clinically meaningful* way — a criterion marked met that is not — is worth flagging as such, so it gets looked at first.

Do not put real study or patient material in an issue. Reproduce it with synthetic data.

## Licence and conduct

TrialIQ is licensed under AGPL-3.0; by contributing you agree your contribution is licensed under the same terms. By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).
