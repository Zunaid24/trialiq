"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { DEMO_EMAIL } from "@/lib/authMode";
import { Button, Card, Field, Input, Notice, Page, PageHeader, Row } from "@/components/ds";

const roleLabels: Record<string, string> = { admin: "Administrator", investigator: "Investigator", clinical_reviewer: "Clinical reviewer", coordinator: "Study coordinator", viewer: "Viewer" };

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("coordinator");
  const [msg, setMsg] = useState<{ tone: "ok" | "no"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState(""); const [pw2, setPw2] = useState(""); const [pwMsg, setPwMsg] = useState<{ tone: "ok" | "no"; text: string } | null>(null);

  useEffect(() => {
    const s = createClient();
    s.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUser(data.user); setName(data.user.user_metadata?.full_name || "");
      const { data: p } = await s.from("profiles").select("full_name,role").eq("id", data.user.id).maybeSingle();
      if (p) { setName(p.full_name || data.user.user_metadata?.full_name || ""); setRole(p.role || "coordinator"); }
    });
  }, []);

  async function save() {
    if (!user) return;
    setSaving(true); setMsg(null);
    const s = createClient(); const full = name.trim() || "Clinical Research";
    const { error } = await s.from("profiles").update({ full_name: full }).eq("id", user.id);
    if (error) setMsg({ tone: "no", text: error.message }); else { await s.auth.updateUser({ data: { full_name: full } }); setMsg({ tone: "ok", text: "Profile saved." }); }
    setSaving(false);
  }
  async function changePassword() {
    setPwMsg(null);
    if (pw.length < 8) return setPwMsg({ tone: "no", text: "Use at least 8 characters." });
    if (pw !== pw2) return setPwMsg({ tone: "no", text: "The two passwords do not match." });
    const { error } = await createClient().auth.updateUser({ password: pw });
    if (error) setPwMsg({ tone: "no", text: error.message }); else { setPw(""); setPw2(""); setPwMsg({ tone: "ok", text: "Password changed." }); }
  }
  const demo = user?.email === DEMO_EMAIL;

  return (
    <Page width="narrow">
      <div className="space-y-6">
        <PageHeader title="Settings" lead="Your profile, password and who else can use this workspace." />
        <Card className="space-y-4 p-6">
          <h2 className="text-[15px] font-semibold text-ink">Profile</h2>
          <Field label="Full name" htmlFor="name"><Input id="name" value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <p className="text-[13px] text-ink-2">Signed in as {user?.email || "a test session"}. Role: {roleLabels[role] || role}.</p>
          {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
          <Button kind="primary" onClick={save} disabled={saving || !user}>{saving ? "Saving" : "Save profile"}</Button>
        </Card>
        <Card className="space-y-4 p-6">
          <h2 className="text-[15px] font-semibold text-ink">Password</h2>
          {demo ? <p className="text-[13px] text-ink-2">The shared demo account keeps its password so everyone you send it to can sign in.</p> : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="New password" htmlFor="pw"><Input id="pw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
                <Field label="Confirm password" htmlFor="pw2"><Input id="pw2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></Field>
              </div>
              {pwMsg && <Notice tone={pwMsg.tone}>{pwMsg.text}</Notice>}
              <Button onClick={changePassword} disabled={!pw || !pw2}>Change password</Button>
            </>
          )}
        </Card>
        <Card as="div" className="overflow-hidden"><Row href="/dashboard/team" title="Team" detail="Invite people and set who can sign off." status={<span className="text-sm font-semibold text-primary">Open</span>} /></Card>
      </div>
    </Page>
  );
}
