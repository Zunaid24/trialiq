# TrialIQ Playwright QA

This directory is the foundation for browser-based regression and clinical workflow QA.

## Local setup

Install Playwright in the development environment:

```bash
npm install -D @playwright/test
npx playwright install chromium
```

Run the suite against a local app or a dedicated QA deployment. Never put production credentials in source control.

Recommended environment variables:

```text
PLAYWRIGHT_BASE_URL=https://trialiq-ai.vercel.app
PLAYWRIGHT_EMAIL=<dedicated QA account>
PLAYWRIGHT_PASSWORD=<dedicated QA password>
```

## QA layers

1. **Smoke** — landing page, auth, dashboard shell, navigation, sign out.
2. **Workspace** — every module opens, upload/analysis states, findings and review flow.
3. **Clinical AI** — synthetic cases for eligibility, protocol deviations, AEs, safety, labs, medications, reconciliation and coding.
4. **Enterprise** — notifications, search, reports/PDF, profile/password, roles and team management.
5. **Visual** — screenshots at important workflow checkpoints.

## Clinical AI assertions

AI tests should assert structured behavior, not exact prose. Examples:

- Missing evidence must produce `Insufficient Evidence` or an equivalent review state.
- Conflicting source documents must be surfaced as conflicting evidence.
- Protocol-derived conclusions must include the protocol rule/section when available.
- Clinical findings must expose evidence/source context and reviewer action.
- Safety outputs must not convert a potential signal into confirmed causality.
- Coding outputs must remain AI suggestions requiring qualified human verification.

Use synthetic/non-identifiable clinical data only.
