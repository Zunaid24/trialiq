"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Field, Input, Notice } from "@/components/ds";
import { Logo } from "@/components/brand/Logo";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirm) { setError("The two passwords do not match."); return; }
    setLoading(true); setError(""); setMessage("");
    const { error: err } = await createClient().auth.updateUser({ password });
    if (err) setError(err.message);
    else { setMessage("Password updated. Taking you to sign in."); setTimeout(() => router.replace("/auth"), 1200); }
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-5 py-10">
      <div className="w-full max-w-[420px] space-y-5">
        <Link href="/" className="flex items-center justify-center" aria-label="TrialIQ home"><Logo size={28} /></Link>
        <Card className="p-6">
          <h1 className="text-xl font-semibold text-ink">Choose a new password</h1>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <Field label="New password" htmlFor="pw"><Input id="pw" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" /></Field>
            <Field label="Confirm password" htmlFor="pw2"><Input id="pw2" type="password" minLength={8} required value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" /></Field>
            {error && <Notice>{error}</Notice>}
            {message && <Notice tone="ok">{message}</Notice>}
            <Button kind="primary" type="submit" className="w-full" disabled={loading}>{loading ? "Saving" : "Save password"}</Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
