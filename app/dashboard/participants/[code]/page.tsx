"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { extractPdfText } from "@/lib/extractPdfText";
import { modulesForTab } from "@/lib/modules";
import ModuleRunner from "@/components/modules/ModuleRunner";
import { AiBox, AiStatus, Button, Card, Disclosure, Loading, Notice, Page, PageHeader, Row, Segmented, Spinner, StatusPill, Tabs, Textarea, ago, cx, type Tone } from "@/components/ds";

type Criterion = { criterion?: string; expected?: string; actual?: string; evidence?: string; sourceReference?: string; status?: string; assessment?: string };
type Report = {
  studyTitle?: string; screeningResult?: string; executiveSummary?: string;
  criteriaEvaluation?: { inclusion?: Criterion[]; exclusion?: Criterion[] };
  audit?: { sourceReferences?: string[] };
};
type Item = Criterion & { id: string; name: string; group: "no" | "rev" | "ok"; kind: "Inclusion" | "Exclusion" };
type TabId = "eligibility" | "sources" | "visits" | "safety";

const ACTION: Record<Item["group"], { label: string; done: string }> = {
  no: { label: "Confirm not met", done: "Confirmed not met" },
  rev: { label: "Request evidence", done: "Evidence requested" },
  ok: { label: "Confirm met", done: "Confirmed met" },
};
const GROUP: Record<Item["group"], { label: string; tone: Tone }> = {
  no: { label: "Not met", tone: "no" },
  rev: { label: "Needs evidence", tone: "rev" },
  ok: { label: "Met", tone: "ok" },
};

function split(text = "", fallback: string) {
  const m = text.match(/^\s*([IE]\d+)\s*[:.\-–]\s*(.*)$/i);
  return m ? { id: m[1].toUpperCase(), name: m[2] } : { id: fallback, name: text };
}
function groupOf(c: Criterion, kind: Item["kind"]): Item["group"] {
  const s = String(c.status || "").toLowerCase();
  if (s.includes("not met") || s.includes("fail")) return kind === "Inclusion" ? "no" : "ok";
  if (s === "met" || s.includes("pass")) return kind === "Inclusion" ? "ok" : "no";
  return "rev";
}

export default function ParticipantPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [tab, setTab] = useState<TabId>("eligibility");
  const [report, setReport] = useState<Report | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string>();
  const [segPick, setSeg] = useState<Item["group"]>();
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState("");
  const [sub, setSub] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const { data } = await createClient().from("findings").select("id,metadata,created_at").eq("analysis_type", "Eligibility Screening").order("created_at", { ascending: false }).limit(20);
      const run = (data ?? []).find((r: { metadata: { participantCode?: string } }) => (r.metadata?.participantCode || "").toUpperCase() === code.toUpperCase());
      if (run) { setReport(run.metadata.result as Report); setSavedAt(run.created_at); setRunId(run.id); }
      setLoading(false);
    })();
  }, [code]);

  async function runCheck() {
    setRunning(true); setError(""); setSent("");
    try {
      const [p, q] = await Promise.all([fetch("/demo/protocol-demo.pdf"), fetch("/demo/participant-demo.pdf")]);
      const [pb, qb] = await Promise.all([p.blob(), q.blob()]);
      const [protocol, participant] = await Promise.all([
        extractPdfText(new File([pb], "protocol-demo.pdf", { type: "application/pdf" })),
        extractPdfText(new File([qb], "participant-demo.pdf", { type: "application/pdf" })),
      ]);
      const res = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ protocol, participant, participantCode: code }) });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "The check did not finish. Try again in a minute.");
      setReport(json.result); setSavedAt(new Date().toISOString()); setRunId(json.runId ?? null); setSelected(undefined); setSeg(undefined); setDecisions({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "The check did not finish.");
    } finally { setRunning(false); }
  }

  const items = useMemo<Item[]>(() => {
    if (!report) return [];
    const make = (list: Criterion[] = [], kind: Item["kind"]) => list.map((c, i) => ({ ...c, ...split(c.criterion, `${kind[0]}${i + 1}`), kind, group: groupOf(c, kind) }));
    return [...make(report.criteriaEvaluation?.inclusion, "Inclusion"), ...make(report.criteriaEvaluation?.exclusion, "Exclusion")];
  }, [report]);
  const by = (g: Item["group"]) => items.filter((r) => r.group === g);
  const notMet = by("no"), rev = by("rev"), met = by("ok");
  const seg: Item["group"] = segPick ?? (notMet.length ? "no" : rev.length ? "rev" : "ok");
  const current = items.find((r) => r.id === selected) ?? by(seg)[0];
  const openItems = [...notMet, ...rev];
  const reviewed = openItems.filter((r) => decisions[r.id]).length;
  const sources = report?.audit?.sourceReferences?.length ?? 0;
  const open = notMet.length + rev.length;

  const title = loading ? "Loading participant" : !report ? "Eligibility not checked yet" : notMet.length ? `Not eligible: ${notMet.length} ${notMet.length === 1 ? "criterion" : "criteria"} not met` : rev.length ? "Eligible so far, evidence still needed" : "All criteria met";
  const lead = !report ? "TrialIQ compares the protocol with this participant's records and shows each criterion with its source." : open ? `Review the ${open} open ${open === 1 ? "criterion" : "criteria"} one at a time, then send to the PI.` : "Ready for PI sign-off.";

  // Each decision is written to the audit trail against the saved eligibility run.
  async function decide(item: Item, label: string) {
    const next = { ...decisions, [item.id]: label };
    setDecisions(next);
    // Move straight to the next open criterion without a decision, so the coordinator never hunts for it.
    const after = openItems.find((r) => !next[r.id]);
    if (after) { setSeg(after.group); setSelected(after.id); }
    if (!runId) return;
    await fetch(`/api/findings/${runId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "review", note: `${item.id} ${item.name}: ${label}${note.trim() ? `. ${note.trim()}` : ""}` }) }).catch(() => {});
    setNote("");
  }
  async function sendToPi() {
    if (!runId) return;
    setSaving(true);
    const summary = `Sent to PI for sign-off. ${notMet.length} not met, ${rev.length} need evidence, ${met.length} met. Coordinator decisions: ${Object.entries(decisions).map(([k, v]) => `${k} ${v}`).join("; ") || "none yet"}.`;
    const r = await fetch(`/api/findings/${runId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "review", note: summary }) }).catch(() => null);
    setSaving(false);
    setSent(r?.ok ? "Sent. The PI sees it in Review with your decisions attached." : "Could not send. Try again.");
  }

  const tabs = [
    { id: "eligibility" as const, label: "Eligibility", count: report ? `${open} open` : "" },
    { id: "sources" as const, label: "Sources", count: modulesForTab("sources").length },
    { id: "visits" as const, label: "Visits", count: modulesForTab("visits").length },
    { id: "safety" as const, label: "Safety", count: modulesForTab("safety").length },
  ];

  return (
    <Page>
      <div className="space-y-6">
        <nav aria-label="Breadcrumb" className="text-[13px] text-ink-3"><Link href="/dashboard/participants" className="hover:text-ink">Participants</Link><span className="mx-2">/</span><span className="font-mono font-medium text-ink">{code}</span></nav>

        <PageHeader
          meta={<><span className="font-mono text-ink-2">{code}</span><span>{report?.studyTitle || "Screening visit"}</span></>}
          title={title}
          lead={loading ? undefined : lead}
          actions={<>
            <Button kind={report ? "ghost" : "primary"} onClick={runCheck} disabled={running || loading}>{running ? "Checking" : report ? "Re-check" : "Run eligibility check"}</Button>
            {report && <Button kind="primary" onClick={sendToPi} disabled={saving || !runId}>{saving ? "Sending" : "Send to PI for sign-off"}</Button>}
          </>}
        >
          {running ? <Spinner label="Reading the protocol and participant record. This usually takes under a minute." />
            : report ? <AiStatus>TrialIQ checked {items.length} criteria against {sources || 2} sources, {savedAt ? ago(savedAt) : "just now"}.</AiStatus>
            : <AiStatus tone="neutral">Not checked yet. Running the check reads 2 synthetic demo documents.</AiStatus>}
        </PageHeader>

        {error && <Notice>{error}</Notice>}
        {sent && <Notice tone={sent.startsWith("Sent") ? "ok" : "no"}>{sent}</Notice>}

        <Tabs label="Participant record" items={tabs} value={tab} onChange={setTab} />

        {tab === "eligibility" && (loading ? <Loading label="Loading the last check" /> : report ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Segmented label="Criteria by result" value={seg} onChange={(g) => { setSeg(g); setSelected(by(g)[0]?.id); }}
                items={(["no", "rev", "ok"] as const).map((g) => ({ id: g, label: GROUP[g].label, count: by(g).length, tone: GROUP[g].tone }))} />
              {open > 0 && <p className="text-[13px] text-ink-2"><span className="font-semibold text-ink">{reviewed} of {open}</span> open criteria reviewed</p>}
            </div>

            {open > 0 && reviewed === open && !sent && (
              <Notice tone="ok">Every open criterion has your decision. Send it to the PI for sign-off.</Notice>
            )}

            <div className="flex flex-col items-start gap-6 lg:flex-row">
              <div className="w-full min-w-0 flex-1 space-y-3">
                <Card as="div" className="divide-y divide-line overflow-hidden">
                  {by(seg).map((r) => (
                    <Row key={r.id} id={r.id} title={r.name} selected={current?.id === r.id} onClick={() => setSelected(r.id)}
                      status={decisions[r.id] ? <span className="text-xs font-medium text-ok">{decisions[r.id]}</span> : seg === "ok" ? undefined : <StatusPill tone={GROUP[seg].tone}>{GROUP[seg].label}</StatusPill>} />
                  ))}
                </Card>
                <Link href="/dashboard/workspace/patient-matching" className="inline-block text-[13px] font-semibold text-primary hover:underline">Check trial fit before screening</Link>
              </div>

              {current && (
                <Card as="aside" className="w-full shrink-0 space-y-5 p-6 lg:sticky lg:top-6 lg:w-[420px]" aria-label={`Criterion ${current.id}`}>
                  <div>
                    <p className="flex items-center gap-2 text-xs text-ink-3"><span className="font-mono">{current.id}</span><span>{current.kind} criterion</span></p>
                    <h2 className="mt-1.5 text-xl font-semibold leading-snug tracking-[-0.01em] text-ink">{current.name}</h2>
                  </div>
                  <dl className="space-y-3 text-sm">
                    <div><dt className="text-xs font-semibold text-ink-3">Protocol requires</dt><dd className="mt-0.5 text-ink">{current.expected || "Not stated in the protocol"}</dd></div>
                    <div><dt className="text-xs font-semibold text-ink-3">Record shows</dt><dd className={cx("mt-0.5 font-semibold", current.group === "no" ? "text-no" : current.group === "rev" ? "text-rev" : "text-ok")}>{current.actual || "Not documented"}</dd></div>
                  </dl>

                  {decisions[current.id] ? (
                    <div className="flex items-center justify-between gap-3 rounded-lg bg-ok-bg px-4 py-3 text-[13px]">
                      <span className="font-semibold text-ok">{decisions[current.id]}. Saved to the audit trail.</span>
                      <button type="button" onClick={() => setDecisions((d) => Object.fromEntries(Object.entries(d).filter(([k]) => k !== current.id)))} className="font-semibold text-ink-2 hover:text-ink">Undo</button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-[1fr_auto] gap-2.5">
                      <Button kind="primary" onClick={() => decide(current, ACTION[current.group].done)}>{ACTION[current.group].label}</Button>
                      {current.group !== "ok" && <Button onClick={() => decide(current, "Sent to PI")}>Ask the PI</Button>}
                    </div>
                  )}

                  <div className="border-t border-line pt-4">
                    <Disclosure label="Show evidence and add a note" openLabel="Hide evidence">
                      <div className="space-y-3">
                        {current.sourceReference && <p className="text-[13px] text-ink-2"><span className="font-semibold">Source: </span>{current.sourceReference}</p>}
                        {current.evidence && <AiBox label="TrialIQ read">{current.evidence}</AiBox>}
                        <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note, saved with your decision" aria-label="Note for the audit trail" />
                      </div>
                    </Disclosure>
                  </div>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <Card as="div" className="border-dashed px-6 py-10 text-center">
            <p className="text-sm font-semibold text-ink">No eligibility check saved for {code}</p>
            <p className="mx-auto mt-1 max-w-md text-[13px] leading-6 text-ink-2">TrialIQ reads the protocol and the screening summary, then sorts every criterion into not met, needs evidence or met, each with its source.</p>
            <div className="mt-4 flex justify-center"><Button kind="primary" onClick={runCheck} disabled={running}>{running ? "Checking" : "Run eligibility check"}</Button></div>
          </Card>
        ))}

        {tab !== "eligibility" && (() => {
          const mods = modulesForTab(tab);
          const active = sub[tab] ?? mods[0]?.id;
          return (
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              <nav aria-label={`${tab} checks`} className="w-full shrink-0 lg:w-56">
                <Card as="div" className="divide-y divide-line overflow-hidden">
                  {mods.map((m) => <Row key={m.id} title={m.title} selected={active === m.id} onClick={() => setSub((s) => ({ ...s, [tab]: m.id }))} />)}
                </Card>
              </nav>
              <div className="min-w-0 flex-1">{active && <ModuleRunner key={active} id={active} embedded participantCode={code} />}</div>
            </div>
          );
        })()}
      </div>
    </Page>
  );
}
