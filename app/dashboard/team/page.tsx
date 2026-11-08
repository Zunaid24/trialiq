"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Card, Field, Input, Loading, Notice, Page, PageHeader, Row, ago } from "@/components/ds";

const roles = [["admin", "Administrator"], ["investigator", "Investigator"], ["clinical_reviewer", "Clinical reviewer"], ["coordinator", "Study coordinator"], ["viewer", "Viewer"]];
type Member = { id: string; email: string; full_name: string; role: string; last_seen_at: string | null; created_at: string };
const selectCls = "h-10 rounded-lg border border-line-strong bg-white px-3 text-sm text-ink outline-none focus:border-primary";

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
    const body = await r.json().catch(() => ({}));
    if (!r.ok) setError(body.message || "Only administrators can manage the team."); else setMembers(body.users || []);
    setLoading(false);
  }
  useEffect(() => { void Promise.resolve().then(load); }, []);

  async function invite() {
    setSaving("invite"); setMessage(""); setError("");
    const r = await fetch("/api/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, role: inviteRole }) });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) setError(body.message || "Invitation failed."); else { setMessage(`Invitation sent to ${email}.`); setEmail(""); await load(); }
    setSaving("");
  }
  async function changeRole(id: string, role: string) {
    setSaving(id); setError("");
    const r = await fetch("/api/team", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, role }) });
    if (!r.ok) setError("Role change failed."); else setMembers((m) => m.map((x) => (x.id === id ? { ...x, role } : x)));
    setSaving("");
  }

  return (
    <Page width="narrow">
      <div className="space-y-6">
        <nav aria-label="Breadcrumb" className="text-[13px] text-ink-3"><Link href="/dashboard/settings" className="hover:text-ink">Settings</Link><span className="mx-2">/</span><span className="font-medium text-ink">Team</span></nav>
        <PageHeader title="Team" lead="Who can open this workspace and what they can sign off." />
        {error && <Notice>{error}</Notice>}
        {message && <Notice tone="ok">{message}</Notice>}
        <Card className="space-y-4 p-6">
          <h2 className="text-[15px] font-semibold text-ink">Invite someone</h2>
          <div className="grid gap-3 sm:grid-cols-[1fr_200px_auto] sm:items-end">
            <Field label="Email" htmlFor="invite-email"><Input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@site.org" /></Field>
            <Field label="Role" htmlFor="invite-role"><select id="invite-role" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className={selectCls}>{roles.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
            <Button kind="primary" disabled={!email || saving === "invite"} onClick={invite}>{saving === "invite" ? "Sending" : "Send invite"}</Button>
          </div>
        </Card>
        {loading ? <Loading label="Loading team" /> : (
          <Card as="div" className="divide-y divide-line overflow-hidden">
            {members.map((m) => (
              <Row key={m.id} title={m.full_name || m.email} detail={`${m.email}${m.last_seen_at ? `, active ${ago(m.last_seen_at)}` : ""}`}
                status={<select aria-label={`Role for ${m.email}`} value={m.role} disabled={saving === m.id} onChange={(e) => changeRole(m.id, e.target.value)} className={selectCls}>{roles.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>} />
            ))}
            {members.length === 0 && <p className="px-4 py-6 text-sm text-ink-2">No team members yet.</p>}
          </Card>
        )}
      </div>
    </Page>
  );
}
