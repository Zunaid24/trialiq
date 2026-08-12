"use client";

import { useEffect, useState } from "react";
import { MailPlus, ShieldCheck, UserRound, Users } from "lucide-react";

const roles = [
  ["admin", "Administrator"], ["investigator", "Investigator"], ["clinical_reviewer", "Clinical Reviewer"], ["coordinator", "Clinical Coordinator"], ["viewer", "Viewer"],
];

type Member = { id: string; email: string; full_name: string; role: string; last_seen_at: string | null; created_at: string };

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("coordinator");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    const r = await fetch("/api/team", { cache: "no-store" });
    const body = await r.json();
    if (!r.ok) setError(body.message || "Unable to load team."); else setMembers(body.users || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function invite() {
    setSaving("invite"); setMessage(""); setError("");
    const r = await fetch("/api/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, role: inviteRole }) });
    const body = await r.json();
    if (!r.ok) setError(body.message || "Invitation failed."); else { setMessage(`Invitation sent to ${email}.`); setEmail(""); await load(); }
    setSaving("");
  }

  async function changeRole(id: string, role: string) {
    setSaving(id); setError("");
    const r = await fetch("/api/team", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, role }) });
    const body = await r.json();
    if (!r.ok) setError(body.message || "Role update failed."); else setMembers(prev => prev.map(m => m.id === id ? { ...m, role } : m));
    setSaving("");
  }

  return <main className="mx-auto max-w-6xl p-8 md:p-10">
    <div className="mb-8"><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Administration</p><h1 className="mt-2 text-4xl font-bold tracking-tight">Team management</h1><p className="mt-2 max-w-3xl text-muted-foreground">Invite collaborators and control their TrialIQ workspace roles.</p></div>
    <section className="rounded-2xl border bg-card p-6 shadow-sm"><div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><MailPlus size={19} /></div><div><h2 className="font-bold">Invite a teammate</h2><p className="mt-1 text-sm text-muted-foreground">They will receive a secure email invitation to join the workspace.</p></div></div><div className="mt-5 flex flex-col gap-3 md:flex-row"><input value={email} onChange={e => setEmail(e.target.value)} placeholder="colleague@company.com" type="email" className="flex-1 rounded-lg border bg-background px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /><select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="rounded-lg border bg-background px-3.5 py-3 text-sm">{roles.map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select><button onClick={invite} disabled={!email || saving === "invite"} className="rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">{saving === "invite" ? "Sending…" : "Send invitation"}</button></div></section>
    {message && <p className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">{message}</p>}{error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    <section className="mt-6 overflow-hidden rounded-2xl border bg-card shadow-sm"><div className="border-b p-6"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted"><Users size={19} /></div><div><h2 className="font-bold">Workspace members</h2><p className="text-sm text-muted-foreground">{members.length} account{members.length === 1 ? "" : "s"}</p></div></div></div>{loading ? <div className="p-8 text-sm text-muted-foreground">Loading team…</div> : <div className="divide-y">{members.map(member => <div key={member.id} className="flex flex-col gap-4 p-5 md:flex-row md:items-center"><div className="flex min-w-0 flex-1 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-semibold text-white">{(member.full_name || member.email || "U").charAt(0).toUpperCase()}</div><div className="min-w-0"><p className="truncate font-semibold">{member.full_name || "Unnamed user"}</p><p className="truncate text-sm text-muted-foreground">{member.email}</p></div></div><div className="flex items-center gap-3"><ShieldCheck size={16} className="text-muted-foreground" /><select value={member.role} disabled={saving === member.id} onChange={e => changeRole(member.id, e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm">{roles.map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select><span className="hidden text-xs text-muted-foreground lg:inline">{member.last_seen_at ? `Last active ${new Date(member.last_seen_at).toLocaleDateString()}` : "Not active yet"}</span></div></div>)}{!members.length && <div className="p-10 text-center text-sm text-muted-foreground"><UserRound className="mx-auto mb-3" size={24} />No workspace members yet.</div>}</div>}</section>
  </main>;
}
