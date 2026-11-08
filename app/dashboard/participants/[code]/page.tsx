"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { extractPdfText } from "@/lib/extractPdfText";
import { modulesForTab } from "@/lib/modules";
import ModuleRunner from "@/components/modules/ModuleRunner";
import { AiBox, AiStatus, Button, Card, Loading, Notice, Page, PageHeader, Row, SectionTitle, Spinner, StatusPill, Tabs, Textarea, ago, cx, type Tone } from "@/components/ds";

type Criterion = { criterion?: string; expected?: string; actual?: string; evidence?: string; sourceReference?: string; status?: string; assessment?: string };
type Report = {
  studyTitle?: string; screeningResult?: string; executiveSummary?: string;
  criteriaEvaluation?: { inclusion?: Criterion[]; exclusion?: Criterion[] };
  audit?: { sourceReferences?: string[] };
};
type Item = Criterion & { id: string; name: string; group: "no" | "rev" | "ok"; kind: "Inclusion" | "Exclusion" };
type TabId = "eligibility" | "sources" | "visits" | "safety";

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
  const [showAll, setShowAll] = useState(false);
  const [showMet, setShowMet] = useState(false);
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
      setReport(json.result); setSavedAt(new Date().toISOString()); setRunId(json.runId ?? null); setSelected(undefined); setDecisions({});
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
  const current = items.find((r) => r.id === selected) ?? notMet[0] ?? rev[0] ?? met[0];
  const sources = report?.audit?.sourceReferences?.length ?? 0;
  const open = notMet.length + rev.length;

  const title = loading ? "Loading participant" : !report ? "Eligibility not checked yet" : notMet.length ? `Not eligible: ${notMet.length} ${notMet.length === 1 ? "criterion" : "criteria"} not met` : rev.length ? "Eligible so far, evidence still needed" : "All criteria met";
  const lead = !report ? "TrialIQ compares the protocol with this participant's records and shows each criterion with its source." : rev.length ? `${rev.length} more ${rev.length === 1 ? "criterion needs" : "criteria need"} evidence before the PI can sign off.` : "Ready for PI sign-off.";

  // Each decision is written to the audit trail against the saved eligibility run.
  async function decide(item: Item, label: string) {
    setDecisions((d) => ({ ...d, [item.id]: label }));
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
            <Button onClick={runCheck} disabled={running || loading}>{running ? "Checking" : report ? "Re-check" : "Run eligibility check"}</Button>
            {report && <Button kind="primary" onClick={sendToPi} disabled={saving || !runId}>{saving ? "Sending" : "Send to PI for sign-off"}</Button>}
          </>}
        >
          {running ? <Spinner label="Reading the protocol and participant record. This usually takes under a minute." />
            : report ? <AiStatus action={<button type="button" onClick={() => setTab("eligibility")} className="font-semibold text-primary hover:underline">View checks</button>}>Checked by TrialIQ against {items.length} protocol criteria{sources ? ` in ${sources} source references` : ""}, {savedAt ? ago(savedAt) : "just now"}.</AiStatus>
            : <AiStatus tone="neutral">Not checked yet. Running the check reads 2 synthetic demo documents.</AiStatus>}
        </PageHeader>

        {error && <Notice>{error}</Notice>}
        {sent && <Notice tone={sent.startsWith("Sent") ? "ok" : "no"}>{sent}</Notice>}

        <Tabs label="Participant record" items={tabs} value={tab} onChange={setTab} />

        {tab === "eligibility" && (loading ? <Loading label="Loading the last check" /> : report ? (
          <div className="flex flex-col items-start gap-6 lg:flex-row">
            <div className="w-full min-w-0 flex-1 space-y-5">
              {(["no", "rev"] as const).map((g) => {
                const all = by(g); if (!all.length) return null;
                const list = g === "rev" && !showAll ? all.slice(0, 4) : all;
                return (
                  <section key={g}>
                    <SectionTitle title={GROUP[g].label} count={all.length} />
                    <Card as="div" className="divide-y divide-line overflow-hidden">
                      {list.map((r) => (
                        <Row key={r.id} id={r.id} title={r.name} detail={r.actual || r.assessment || "Not documented"} aside={decisions[r.id] || r.sourceReference?.split(/[—,]/)[0]?.trim()}
                          status={<StatusPill tone={GROUP[g].tone}>{!r.actual || /not documented/i.test(r.actual) ? (g === "rev" ? "Missing" : GROUP[g].label) : GROUP[g].label}</StatusPill>}
                          selected={current?.id === r.id} onClick={() => setSelected(r.id)} />
                      ))}
                      {g === "rev" && all.length > 4 && <button type="button" onClick={() => setShowAll((v) => !v)} className="w-full px-4 py-3 text-left text-[13px] font-semibold text-primary hover:bg-page">{showAll ? "Show fewer" : `Show ${all.length - 4} more`}</button>}
                    </Card>
                  </section>
                );
              })}
              {met.length > 0 && (
                <Card as="div" className="overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <StatusPill tone="ok">Met</StatusPill>
                    <p className="min-w-0 flex-1 truncate text-[13px] text-ink-2">{met.length} criteria met: {met.map((m) => `${m.id} ${m.name}`).join(", ")}</p>
                    <button type="button" onClick={() => setShowMet((v) => !v)} className="text-[13px] font-semibold text-primary" aria-expanded={showMet}>{showMet ? "Hide" : "Show"}</button>
                  </div>
                  {showMet && <div className="divide-y divide-line border-t border-line">{met.map((r) => <Row key={r.id} id={r.id} title={r.name} detail={r.actual} selected={current?.id === r.id} onClick={() => setSelected(r.id)} />)}</div>}
                </Card>
              )}
              <Card as="div" className="overflow-hidden"><Row href="/dashboard/workspace/patient-matching" title="Trial fit" detail="See which trial characteristics fit this participant before formal screening." status={<span className="text-sm font-semibold text-primary">Open</span>} /></Card>
            </div>

            {current && (
              <Card as="aside" className="w-full shrink-0 space-y-5 p-6 lg:sticky lg:top-6 lg:w-[400px]" aria-label={`Criterion ${current.id}`}>
                <div>
                  <div className="flex items-center gap-2"><span className="font-mono text-xs text-ink-3">{current.id}</span><StatusPill tone={GROUP[current.group].tone}>{GROUP[current.group].label}</StatusPill><span className="text-xs text-ink-3">{current.kind}</span></div>
                  <h2 className="mt-2 text-xl font-semibold leading-snug tracking-[-0.01em] text-ink">{current.name}</h2>
                </div>
                <dl className="overflow-hidden rounded-lg border border-line text-[13px]">
                  <div className="grid grid-cols-[120px_1fr] border-b border-line"><dt className="bg-page px-3 py-2.5 font-semibold text-ink-2">Protocol requires</dt><dd className="px-3 py-2.5 text-ink">{current.expected || "Not stated in the protocol excerpt"}</dd></div>
                  <div className="grid grid-cols-[120px_1fr]"><dt className="bg-page px-3 py-2.5 font-semibold text-ink-2">Participant record</dt><dd className={cx("px-3 py-2.5 font-medium", current.group === "no" ? "text-no" : current.group === "rev" ? "text-rev" : "text-ink")}>{current.actual || "Not documented"}</dd></div>
                </dl>
                {current.sourceReference && <p className="text-[13px] text-ink-2"><span className="text-xs font-semibold text-ink-2">Source </span>{current.sourceReference}</p>}
                {current.evidence && <AiBox label="TrialIQ read">{current.evidence}</AiBox>}
                <div className="space-y-3 border-t border-line pt-4">
                  <p className="text-[13px] font-semibold text-ink">Your decision</p>
                  <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note for the audit trail" aria-label="Note for the audit trail" />
                  <div className="grid grid-cols-2 gap-2.5">
                    <Button onClick={() => decide(current, current.group === "ok" ? "Confirmed met" : current.group === "no" ? "Confirmed not met" : "Evidence requested")}>{current.group === "ok" ? "Confirm met" : current.group === "no" ? "Confirm not met" : "Request evidence"}</Button>
                    <Button onClick={() => decide(current, "Needs PI review")}>Needs PI review</Button>
                  </div>
                  <p className="text-xs text-ink-3">{decisions[current.id] ? `${decisions[current.id]}. Saved to the audit trail with your name and time.` : "Saved to the audit trail with your name and time."}</p>
                </div>
              </Card>
            )}
          </div>
        ) : (
          <Card as="div" className="border-dashed px-6 py-10 text-center">
            <p className="text-sm font-semibold text-ink">No eligibility check saved for {code}</p>
            <p className="mx-auto mt-1 max-w-md text-[13px] leading-6 text-ink-2">TrialIQ reads the protocol and the screening summary, then lists every criterion as not met, needs evidence or met, each with its source.</p>
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
