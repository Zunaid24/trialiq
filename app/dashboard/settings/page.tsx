"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, ShieldCheck, UserRound, Users, LockKeyhole, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const roleLabels: Record<string, string> = { admin: "Administrator", investigator: "Investigator", clinical_reviewer: "Clinical Reviewer", coordinator: "Clinical Coordinator", viewer: "Viewer" };

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("coordinator");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  async function changePassword() {
    setPasswordSaved(false); setPasswordError("");
    if (newPassword.length < 8) { setPasswordError("Password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setPasswordError("Passwords do not match."); return; }
    setChangingPassword(true);
    const s = createClient();
    const { error: updateError } = await s.auth.updateUser({ password: newPassword });
    if (updateError) setPasswordError(updateError.message);
    else { setNewPassword(""); setConfirmPassword(""); setPasswordSaved(true); }
    setChangingPassword(false);
  }

  return <main className="mx-auto max-w-5xl p-8 md:p-10">
    <div className="mb-8"><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Account</p><h1 className="mt-2 text-4xl font-bold tracking-tight">Settings</h1><p className="mt-2 text-muted-foreground">Manage your profile and workspace access.</p></div>
    <section className="rounded-2xl border bg-card shadow-sm">
      <div className="border-b p-6"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><UserRound size={19} /></div><div><h2 className="font-bold">Profile</h2><p className="text-sm text-muted-foreground">Your account information</p></div></div></div>
      <div className="space-y-6 p-6"><div><label className="mb-2 block text-sm font-medium">Full name</label><input value={name} onChange={e => setName(e.target.value)} className="w-full max-w-xl rounded-lg border bg-background px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Your name" /></div><div><label className="mb-2 block text-sm font-medium">Email</label><input value={user?.email || ""} disabled className="w-full max-w-xl rounded-lg border bg-muted px-3.5 py-3 text-sm text-muted-foreground" /></div></div>
    </section>

    <section className="mt-6 rounded-2xl border bg-card shadow-sm">
      <div className="border-b p-6"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><LockKeyhole size={19} /></div><div><h2 className="font-bold">Password</h2><p className="text-sm text-muted-foreground">Change your account password</p></div></div></div>
      <div className="space-y-5 p-6">
        <div className="grid max-w-xl gap-5 md:grid-cols-2">
          <div><label className="mb-2 block text-sm font-medium">New password</label><div className="relative"><input type={showNewPassword ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full rounded-lg border bg-background px-3.5 py-3 pr-11 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="At least 8 characters" autoComplete="new-password" /><button type="button" onClick={() => setShowNewPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showNewPassword ? "Hide password" : "Show password"}>{showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></div>
          <div><label className="mb-2 block text-sm font-medium">Confirm password</label><div className="relative"><input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full rounded-lg border bg-background px-3.5 py-3 pr-11 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Re-enter password" autoComplete="new-password" /><button type="button" onClick={() => setShowConfirmPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showConfirmPassword ? "Hide password" : "Show password"}>{showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></div>
        </div>
        <div className="flex items-center gap-4"><button onClick={changePassword} disabled={changingPassword || !newPassword || !confirmPassword} className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">{changingPassword ? "Updating…" : "Change password"}</button>{passwordSaved && <span className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700"><Check size={16} />Password updated.</span>}{passwordError && <span className="text-sm text-red-600">{passwordError}</span>}</div>
      </div>
    </section>

    <section className="mt-6 rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4"><div className="flex gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><ShieldCheck size={19} /></div><div><h2 className="font-bold">Workspace access</h2><p className="mt-1 text-sm text-muted-foreground">Your assigned role controls what you can access. Only administrators can change team roles.</p></div></div><span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">{roleLabels[role] || "Clinical Coordinator"}</span></div>
      <Link href="/dashboard/team" className="mt-5 flex items-center justify-between rounded-xl border p-4 transition hover:border-blue-300 hover:bg-blue-50/40"><div className="flex items-center gap-3"><Users size={18} className="text-blue-700" /><div><p className="text-sm font-semibold">Team management</p><p className="text-xs text-muted-foreground">Invite teammates and manage role assignments</p></div></div><ChevronRight size={17} className="text-muted-foreground" /></Link>
    </section>

    <div className="mt-6 flex items-center gap-4">{saved && <span className="text-sm font-medium text-blue-700">Changes saved.</span>}{error && <span className="text-sm text-red-600">{error}</span>}<button onClick={save} disabled={saving} className="ml-auto rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">{saving ? "Saving…" : "Save changes"}</button></div>
  </main>;
}
