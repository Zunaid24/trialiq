# TrialIQ local quality runner

The deployed `/test.html` page is a controller and results viewer. It never runs Playwright on Netlify.

## Architecture

1. Open the deployed `/test.html` page.
2. Click **Run AI Quality** or **Run UI Quality**.
3. Next.js creates a `test_run_jobs` row in Supabase.
4. Your local quality runner claims the queued job.
5. Playwright runs against `PLAYWRIGHT_BASE_URL` (normally `http://localhost:3000`).
6. UI tests capture a screenshot, visible text and interactive controls for every test.
7. The AI reviewer diagnoses each test and classifies the root cause as `AI_OUTPUT`, `UI`, `FLOW`, `TEST`, `INFRASTRUCTURE`, or `NONE`.
8. The complete run, test-level results, AI review, console output and UI evidence are saved in Supabase.
9. The deployed result page polls the job and then displays the permanent timestamped run.

## Local setup

Use Node 20.12+ because the runner uses Node's built-in `process.loadEnvFile` API.

Copy the quality-runner values from `.env.example` into `.env.local` and set:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PLAYWRIGHT_EMAIL`
- `PLAYWRIGHT_PASSWORD`
- `PLAYWRIGHT_BASE_URL=http://localhost:3000`
- `GEMINI_API_KEY`
- optional `TEST_REVIEW_MODEL`
- optional `TEST_REVIEW_FALLBACK_MODELS`

Do not expose `SUPABASE_SERVICE_ROLE_KEY` or Playwright credentials in the browser or deployed client bundle.

Install dependencies and Playwright browsers once, start TrialIQ locally, then start the runner:

```bash
npm install
npx playwright install chromium
npm run dev
npm run test:runner
```

Keep the runner process running while using the deployed test dashboard. It polls Supabase for queued jobs and executes one job at a time.

## Result storage

Test execution artifacts are written to the operating system temporary directory while the job is running. The repository working tree is not used for test-run persistence.

Supabase is the permanent source of truth for:

- timestamped test runs
- test counts and durations
- full Playwright JSON result
- complete console output
- test-level failures and errors
- UI screenshot evidence
- visible page text and controls
- AI review and root-cause classification
- AI recommendations

Git contains the test-suite source code only; the runner does not commit or push results.
