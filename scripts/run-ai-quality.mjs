try {
  process.loadEnvFile?.(".env");
  process.loadEnvFile?.(".env.local");
} catch {}

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to queue an AI quality run.");
  process.exit(1);
}

const response = await fetch(`${url}/rest/v1/test_run_jobs`, {
  method: "POST",
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  },
  body: JSON.stringify({ suite: "ai", status: "QUEUED", metadata: { requestedFrom: "cli" } }),
});

const payload = await response.json().catch(() => null);
if (!response.ok) {
  console.error("Could not queue AI quality run:", JSON.stringify(payload));
  process.exit(1);
}

const job = Array.isArray(payload) ? payload[0] : payload;
console.log("TrialIQ AI Quality run queued.");
console.log(`Job: ${job?.id || "unknown"}`);
console.log("Keep `npm run test:runner` running to execute the job against localhost:3000.");
