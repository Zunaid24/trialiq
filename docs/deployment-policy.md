# Deployment policy

TrialIQ uses local development and QA to conserve limited Vercel deployment capacity.

- Git pushes must not trigger automatic Vercel deployments during development.
- Accumulate meaningful improvements into a coherent batch.
- Validate the batch locally before production deployment.
- Prefer one deployment for a complete product improvement batch.
- Do not create commits solely to trigger a deployment.
