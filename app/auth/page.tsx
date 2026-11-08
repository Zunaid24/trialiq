"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/authMode";
import { Button, Card, Field, Input, Notice } from "@/components/ds";
import { Logo } from "@/components/brand/Logo";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://trialai.vercel.app";

function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(params.get("demo") ? DEMO_EMAIL : "");
  const [password, setPassword] = useState(params.get("demo") ? DEMO_PASSWORD : "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => { if (data.user && !data.user.is_anonymous) router.replace(next); });
  }, [router, next]);

  async function signIn(e: string, p: string) {
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email: e, password: p });
    if (err) throw err;
    await supabase.rpc("touch_profile_last_seen");
    router.replace(next);
    router.refresh();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true); setError(""); setMessage("");
    try {
      if (mode === "signup") {
        const { data, error: err } = await createClient().auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: `${SITE_URL}/auth/callback?next=/dashboard` } });
        if (err) throw err;
        if (data.session) router.replace("/dashboard"); else setMessage("Account created. Check your email to confirm it, then sign in.");
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? (/invalid login/i.test(err.message) ? "That email and password do not match. Check them or use the demo account." : err.message) : "Sign in did not work.");
    } finally { setLoading(false); }
  }

  async function useDemo() {
    setEmail(DEMO_EMAIL); setPassword(DEMO_PASSWORD); setMode("signin");
    setLoading(true); setError("");
    try { await signIn(DEMO_EMAIL, DEMO_PASSWORD); } catch (err) { setError(err instanceof Error ? err.message : "The demo account is not available."); } finally { setLoading(false); }
  }

  async function forgot() {
    if (!email) { setError("Enter your email first."); return; }
    setLoading(true); setError(""); setMessage("");
    const { error: err } = await createClient().auth.resetPasswordForEmail(email, { redirectTo: `${SITE_URL}/auth/reset-password` });
    if (err) setError(err.message); else setMessage("We sent you a link to reset your password.");
    setLoading(false);
  }

  return (
    <div className="w-full max-w-[420px] space-y-5">
      <Link href="/" className="flex items-center justify-center" aria-label="TrialIQ home"><Logo size={28} /></Link>

      <Card className="space-y-4 border-soft bg-tint p-5">
        <div>
          <p className="text-sm font-semibold text-brand-800">Demo account</p>
          <p className="mt-1 text-[13px] leading-5 text-ink-2">Open the product with synthetic records. Anyone with these details can sign in.</p>
        </div>
        <dl className="grid grid-cols-[80px_1fr] gap-y-1 text-[13px]">
          <dt className="text-ink-3">Email</dt><dd className="font-mono text-ink">{DEMO_EMAIL}</dd>
          <dt className="text-ink-3">Password</dt><dd className="font-mono text-ink">{DEMO_PASSWORD}</dd>
        </dl>
        <Button kind="primary" className="w-full" onClick={useDemo} disabled={loading}>{loading ? "Opening" : "Open the demo"}</Button>
      </Card>

      <Card className="p-6">
        <h1 className="text-xl font-semibold tracking-[-0.01em] text-ink">{mode === "signin" ? "Sign in with your own account" : "Create an account"}</h1>
        <form onSubmit={submit} className="mt-5 space-y-4">
          {mode === "signup" && <Field label="Full name" htmlFor="name"><Input id="name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" /></Field>}
          <Field label="Email" htmlFor="email"><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></Field>
          <Field label="Password" htmlFor="password"><Input id="password" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={mode === "signin" ? "current-password" : "new-password"} /></Field>
          {error && <Notice>{error}</Notice>}
          {message && <Notice tone="ok">{message}</Notice>}
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Please wait" : mode === "signin" ? "Sign in" : "Create account"}</Button>
        </form>
        <div className="mt-4 flex items-center justify-between text-[13px]">
          {mode === "signin" ? <button type="button" onClick={forgot} className="font-semibold text-primary hover:underline">Forgot password</button> : <span />}
          <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setMessage(""); }} className="font-semibold text-primary hover:underline">{mode === "signin" ? "Create an account" : "I already have an account"}</button>
        </div>
      </Card>
      <p className="text-center text-xs text-ink-3">Synthetic demo data only. Not for clinical use.</p>
    </div>
  );
}

export default function AuthPage() {
  return <main className="flex min-h-screen items-center justify-center bg-page px-5 py-10"><Suspense fallback={null}><AuthForm /></Suspense></main>;
}
