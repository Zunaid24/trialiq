"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Check, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://trialiq-ai.vercel.app";

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted && data.session) router.replace("/dashboard");
    });

    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${SITE_URL}/auth/callback?next=/dashboard`,
          },
        });

        if (signUpError) throw signUpError;

        if (data.session) {
          router.replace("/dashboard");
        } else {
          setMessage("Account created. Check your email to verify your account before signing in.");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        await supabase.rpc("touch_profile_last_seen");
        router.replace("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete authentication.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setError("Enter your email address first.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${SITE_URL}/auth/reset-password`,
    });

    if (resetError) setError(resetError.message);
    else setMessage("Password reset instructions have been sent to your email.");

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 md:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-12 lg:grid-cols-[1fr_440px]">
        <section className="hidden lg:block">
          <Link href="/" className="inline-flex items-center gap-2.5 font-semibold tracking-tight text-slate-950">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-700 font-mono text-xs font-medium text-white">iq</span>
            TrialIQ AI
          </Link>
          <p className="mt-12 font-mono text-xs font-medium uppercase tracking-wider text-blue-700">Clinical Trial Intelligence</p>
          <h1 className="mt-4 max-w-xl text-5xl font-bold leading-tight tracking-[-0.04em] text-slate-950">Your clinical intelligence workspace, securely tied to your account.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">Save studies, participant analyses, documents and findings so your TrialIQ workspace continues where you left off.</p>
          <div className="mt-8 space-y-3 text-sm text-slate-600">
            <p className="flex items-center gap-2"><Check size={16} className="text-blue-700" /> Persistent study and analysis history</p>
            <p className="flex items-center gap-2"><ShieldCheck size={16} className="text-blue-700" /> User-isolated clinical workspace data</p>
            <p className="flex items-center gap-2"><LockKeyhole size={16} className="text-blue-700" /> Secure account-based access</p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.18)] md:p-9">
          <Link href="/" className="mb-8 inline-flex items-center gap-2.5 font-semibold tracking-tight text-slate-950 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-700 font-mono text-[11px] font-medium text-white">iq</span>
            TrialIQ AI
          </Link>

          <div>
            <p className="font-mono text-xs font-medium uppercase tracking-wider text-blue-700">{mode === "signin" ? "Welcome back" : "Create your account"}</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{mode === "signin" ? "Sign in to TrialIQ" : "Start your TrialIQ workspace"}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">{mode === "signin" ? "Continue to your studies, findings and clinical workflows." : "Create a secure account to save your work and return to it later."}</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {mode === "signup" && (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Full name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-lg border border-slate-300 px-3.5 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
              </label>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
              <div className="relative"><Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-3.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
              <div className="relative"><LockKeyhole size={16} className="absolute left-3.5 top-3.5 text-slate-400" /><input type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-3.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></div>
            </label>

            {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
            {message && <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm text-blue-800">{message}</p>}

            <button disabled={loading} className="group flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
              {!loading && <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />}
            </button>
          </form>

          {mode === "signin" && (
            <button type="button" onClick={handleForgotPassword} disabled={loading} className="mt-4 w-full text-center text-sm font-medium text-blue-700 hover:text-blue-800">Forgot password?</button>
          )}

          <div className="mt-7 border-t border-slate-100 pt-6 text-center text-sm text-slate-500">
            {mode === "signin" ? "Don't have a TrialIQ account?" : "Already have a TrialIQ account?"}{" "}
            <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setMessage(""); }} className="font-semibold text-blue-700 hover:text-blue-800">
              {mode === "signin" ? "Create one" : "Sign in"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
