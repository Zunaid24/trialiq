import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getTestRunStore() {
  if (client) return client;

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured for the test quality store.");
  }

  client = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return client;
}

export function getTestRunnerConfig() {
  return {
    baseUrl: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    runnerId: process.env.TEST_RUNNER_ID || `runner-${process.platform}-${process.pid}`,
    pollMs: Number(process.env.TEST_RUNNER_POLL_MS || 2500),
  };
}
