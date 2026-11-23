# TrialIQ

**Open source clinical trial screening intelligence.** Upload a trial protocol and a participant's medical summary; TrialIQ extracts the evidence, checks it against the protocol's criteria, and shows what supports a screening decision — and what is still missing.

It is built to assist a human reviewer, not to replace one. Read [Scope and limitations](#scope-and-limitations) before you use it for anything real.

## What it does

TrialIQ separates every statement it makes into a hierarchy, so a reader can see what is fact and what is inference:

1. **Observed fact** — present directly in a source document
2. **Derived check** — a deterministic comparison, such as a lab value against a protocol threshold
3. **Interpretation** — reasoning across supported facts
4. **Potential relationship** — a plausible connection that needs confirmation
5. **Recommended action** — an operational review step

It reports three separate scores rather than one number: **finding confidence**, **evidence completeness**, and **decision readiness** — because a high-confidence finding can sit alongside missing critical evidence. Every review lands in one of three states: *Decision-Ready*, *Review Required*, or *Not Decision-Ready*.

See [`docs/clinical-decision-model.md`](docs/clinical-decision-model.md) for the full model.

## Workspaces

| Area | What it reviews |
|---|---|
| Eligibility | Protocol criteria against a participant's screening evidence |
| Patient matching | Candidate fit across a protocol's inclusion and exclusion criteria |
| Protocol | Protocol structure, criteria extraction, thresholds |
| Lab intelligence | Laboratory values against protocol ranges |
| Adverse events | AE capture, severity, relatedness and reporting gaps |
| Safety | Safety signals across the supplied evidence |
| Medications | Concomitant medication review |
| Medical coding | Coding consistency against source records |
| Deviations | Protocol deviation identification |
| Reconciliation | Cross-source consistency |
| Source review | Source document verification |
| Visit assistant | Visit-level evidence completeness |

## Running it

```bash
npm install
cp .env.example .env.local     # fill in your own keys
npm run dev                    # http://localhost:3000
```

You need a Supabase project and a Gemini API key — see `.env.example` for the full list. Demo documents are bundled in `public/demo/`, so you can walk the whole flow without supplying any records of your own.

```bash
npm run lint
npm run test:smoke             # Playwright smoke test
npm run test:e2e               # full end-to-end suite
```

## Scope and limitations

Read this part.

- **TrialIQ is decision support, not a decision.** It produces findings, gaps and recommended review steps. Eligibility determination is the investigator's, and the decision model is built around that: *Decision-Ready* means the evidence is sufficient for a human to decide, not that TrialIQ has decided.
- **It has not been clinically validated**, and it is not a medical device, not CE-marked, not FDA-cleared, and not qualified for any regulatory submission. Do not use it as the basis of a screening, enrolment, safety or reporting decision without independent verification by a qualified person.
- **It reads what you give it.** A criterion the source documents do not cover is reported as pending, not inferred. Extraction from PDFs is imperfect; check findings against the source.
- **Large language models make mistakes**, including confident ones. The fact/interpretation hierarchy exists so a reviewer can tell the two apart, but it does not make interpretations correct.
- **All bundled demo data is synthetic.** `public/demo/` and `docs/demo-source-records/` contain invented participants and an invented study. There is no patient data in this repository, and none should ever be added — see [CONTRIBUTING.md](CONTRIBUTING.md).
- **Running it on real participant data makes you the data controller.** Protocol documents and medical summaries you upload go to the configured model provider. Satisfy yourself about your legal basis, your provider's terms, and your institution's requirements before that happens.

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). The one rule with no exceptions: **never add real patient data**.

## Licence

GNU Affero General Public License v3.0 — see [LICENSE](LICENSE).

You may use, study, change and redistribute TrialIQ, including commercially. If you distribute a modified version, or run a modified version as a network service, your changes must be released under the same licence. For a licence without that obligation, get in touch.

TrialIQ was previously published under the MIT licence. Copies obtained under MIT stay under MIT — that grant cannot be withdrawn. Everything from this version on is AGPL-3.0.

## Built with

Next.js, TypeScript, Tailwind CSS, Supabase, Google Gemini, pdfjs-dist, Playwright.
