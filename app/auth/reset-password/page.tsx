"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) setError(updateError.message);
    else {
      setMessage("Your password has been updated. Redirecting to sign in…");
      setTimeout(() => router.replace("/auth"), 1200);
    }
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.18)]">
        <Link href="/" className="inline-flex items-center gap-2.5 font-semibold tracking-tight text-slate-950"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-700 font-mono text-[11px] font-medium text-white">iq</span>TrialIQ AI</Link>
        <p className="mt-10 font-mono text-xs font-medium uppercase tracking-wider text-blue-700">Account security</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Set a new password</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">Choose a new password for your TrialIQ account.</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">New password</span><div className="relative"><LockKeyhole size={16} className="absolute left-3.5 top-3.5 text-slate-400" /><input type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-3.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></div></label>
          <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Confirm password</span><input type="password" minLength={6} required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
          {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
          {message && <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm text-blue-800">{message}</p>}
          <button disabled={loading} className="group flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-3.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">{loading ? "Updating…" : "Update password"}{!loading && <ArrowRight size={16} />}</button>
        </form>
      </div>
    </main>
  );
}
