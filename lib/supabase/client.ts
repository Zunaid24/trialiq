import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

/**
 * Keep one browser Supabase client for the lifetime of the tab.
 *
 * A singleton prevents multiple GoTrue instances from competing over the
 * same refresh token and auth event stream when different Client Components
 * call createClient(). Supabase's browser client keeps session persistence
 * and automatic token refresh enabled by default.
 */
export function createClient(): SupabaseClient {
  if (browserClient) return browserClient;

  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  return browserClient;
}
