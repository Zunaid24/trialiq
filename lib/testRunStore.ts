import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;
let runnerClient: SupabaseClient | null = null;

/**
 * Store used by the deployed /test.html API routes.
 *
 * This must never require the service-role key because Netlify only needs the
 * public Supabase credentials to queue and read quality-run data. The local
 * runner uses getTestRunnerStore() below for privileged writes.
 */
export function getTestRunStore() {
  if (client) return client;

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase URL and a public Supabase key must be configured for the test quality dashboard."
    );
  }

  client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return client;
}

/**
 * Privileged store used only by the local Playwright runner.
 * The service-role key must stay local and must never be exposed to the
 * deployed browser/dashboard.
 */
export function getTestRunnerStore() {
  if (runnerClient) return runnerClient;

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured for the local test runner."
    );
  }

  runnerClient = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return runnerClient;
}

export function getTestRunnerConfig() {
  return {
    baseUrl: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    runnerId: process.env.TEST_RUNNER_ID || `runner-${process.platform}-${process.pid}`,
    pollMs: Number(process.env.TEST_RUNNER_POLL_MS || 2500),
  };
}
