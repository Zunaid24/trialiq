"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, ShieldCheck, UserRound, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const roleLabels: Record<string, string> = { admin: "Administrator", investigator: "Investigator", clinical_reviewer: "Clinical Reviewer", coordinator: "Clinical Coordinator", viewer: "Viewer" };

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("coordinator");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const s = createClient();
    s.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUser(data.user);
      setName(data.user.user_metadata?.full_name || "");
      const { data: profile } = await s.from("profiles").select("full_name,role").eq("id", data.user.id).maybeSingle();
      if (profile) { setName(profile.full_name || data.user.user_metadata?.full_name || ""); setRole(profile.role || "coordinator"); }
    });
  }, []);

  async function save() {
    if (!user) return;
    setSaving(true); setSaved(false); setError("");
    const s = createClient();
    const { error: updateError } = await s.from("profiles").update({ full_name: name.trim() || "Clinical Research" }).eq("id", user.id);
    if (updateError) setError(updateError.message);
    else { await s.auth.updateUser({ data: { full_name: name.trim() || "Clinical Research" } }); setSaved(true); }
    setSaving(false);
  }

  return <main className="mx-auto max-w-5xl p-8 md:p-10">
    <div className="mb-8"><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Account</p><h1 className="mt-2 text-4xl font-bold tracking-tight">Settings</h1><p className="mt-2 text-muted-foreground">Manage your profile and workspace access.</p></div>
    <section className="rounded-2xl border bg-card shadow-sm">
      <div className="border-b p-6"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><UserRound size={19} /></div><div><h2 className="font-bold">Profile</h2><p className="text-sm text-muted-foreground">Your account information</p></div></div></div>
      <div className="space-y-6 p-6"><div><label className="mb-2 block text-sm font-medium">Full name</label><input value={name} onChange={e => setName(e.target.value)} className="w-full max-w-xl rounded-lg border bg-background px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Your name" /></div><div><label className="mb-2 block text-sm font-medium">Email</label><input value={user?.email || ""} disabled className="w-full max-w-xl rounded-lg border bg-muted px-3.5 py-3 text-sm text-muted-foreground" /></div></div>
    </section>

    <section className="mt-6 rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4"><div className="flex gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><ShieldCheck size={19} /></div><div><h2 className="font-bold">Workspace access</h2><p className="mt-1 text-sm text-muted-foreground">Your assigned role controls what you can access. Only administrators can change team roles.</p></div></div><span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">{roleLabels[role] || "Clinical Coordinator"}</span></div>
      <Link href="/dashboard/team" className="mt-5 flex items-center justify-between rounded-xl border p-4 transition hover:border-blue-300 hover:bg-blue-50/40"><div className="flex items-center gap-3"><Users size={18} className="text-blue-700" /><div><p className="text-sm font-semibold">Team management</p><p className="text-xs text-muted-foreground">Invite teammates and manage role assignments</p></div></div><ChevronRight size={17} className="text-muted-foreground" /></Link>
    </section>

    <div className="mt-6 flex items-center gap-4">{saved && <span className="text-sm font-medium text-blue-700">Changes saved.</span>}{error && <span className="text-sm text-red-600">{error}</span>}<button onClick={save} disabled={saving} className="ml-auto rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">{saving ? "Saving…" : "Save changes"}</button></div>
  </main>;
}
