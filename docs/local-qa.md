# Local QA workflow

Local development and QA are the source of truth while the Vercel deployment quota is constrained.

```powershell
npm run build
npm run dev
npx playwright test tests/e2e/decision-layer.spec.ts --workers=1
npx playwright test tests/e2e/ai-output-quality.spec.ts --workers=1 --headed
```

Before a production deployment, run the focused AI-quality suite and manually inspect representative clinical outputs for evidence, reasoning, uncertainty, actionability and decision readiness.
