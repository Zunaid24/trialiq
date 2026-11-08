// Temporary testing mode: when sign-in is disabled, every visitor is given an
// anonymous Supabase session automatically, so the workspace opens without a
// login screen while data stays isolated per browser (RLS still uses auth.uid()).
// Set NEXT_PUBLIC_AUTH_DISABLED=false to bring the sign-in screen back.
export const AUTH_DISABLED = process.env.NEXT_PUBLIC_AUTH_DISABLED !== "false";
