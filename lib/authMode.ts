// Sign-in is on by default. Set NEXT_PUBLIC_AUTH_DISABLED=true only for local testing; every visitor then
// gets an anonymous Supabase session and data stays isolated per browser (RLS still uses auth.uid()).
export const AUTH_DISABLED = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";

// Shared demo account so the product can be sent to anyone. Its data is synthetic.
export const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL || "demo@trialiq.app";
export const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD || "TrialIQdemo2026";
