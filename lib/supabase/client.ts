import { createBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Keep one browser Supabase client for the lifetime of the tab.
 *
 * A singleton prevents multiple GoTrue instances from competing over the
 * same refresh token and auth event stream when different Client Components
 * call createClient(). Supabase's browser client keeps session persistence
 * and automatic token refresh enabled by default.
 */
export function createClient() {
  if (browserClient) return browserClient;

  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  return browserClient;
}
