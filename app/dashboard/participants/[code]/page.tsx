"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { extractPdfText } from "@/lib/extractPdfText";

type Criterion = { criterion?: string; expected?: string; actual?: string; evidence?: string; sourceReference?: string; status?: string; assessment?: string };
type Report = {
  participantId?: string; studyTitle?: string; screeningResult?: string; executiveSummary?: string;
  criteriaEvaluation?: { inclusion?: Criterion[]; exclusion?: Criterion[] };
  recommendations?: string[]; audit?: { sourceReferences?: string[] };
};
type Row = Criterion & { id: string; name: string; group: "no" | "rev" | "ok"; kind: "Inclusion" | "Exclusion" };

const GROUPS = { no: { label: "Not met", dot: "bg-no", text: "text-no" }, rev: { label: "Needs evidence", dot: "bg-rev", text: "text-rev" }, ok: { label: "Met", dot: "bg-ok", text: "text-ink-2" } } as const;

function splitCriterion(text = "", fallback: string) {
  const m = text.match(/^\s*([IE]\d+)\s*[:.\-–]\s*(.*)$/i);
  return m ? { id: m[1].toUpperCase(), name: m[2] } : { id: fallback, name: text };
}
function groupOf(c: Criterion, kind: "Inclusion" | "Exclusion"): Row["group"] {
  const s = String(c.status || "").toLowerCase();
  if (s.includes("not met") || s.includes("fail")) return kind === "Inclusion" ? "no" : "ok";
  if (s === "met" || s.includes("pass")) return kind === "Inclusion" ? "ok" : "no";
  return "rev";
}
function ago(iso?: string) {
  if (!iso) return ""; const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now"; if (m < 60) return `${m} min ago`; const h = Math.round(m / 60); if (h < 24) return `${h} h ago`; return new Date(iso).toLocaleDateString();
}
// Shortens a value for the list; the panel always shows the full text.
const short = (s = "", n = 70) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export default function ParticipantPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [report, setReport] = useState<Report | null>(null);
  const [savedAt, setSavedAt] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string>();
  const [showAllRev, setShowAllRev] = useState(false);
  const [decisions, setDecisions] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from("findings").select("metadata,created_at").eq("analysis_type", "Eligibility Screening").order("created_at", { ascending: false }).limit(20);
      const run = (data ?? []).find((r: { metadata: { participantCode?: string } }) => (r.metadata?.participantCode || "").toUpperCase() === code.toUpperCase());
      if (run) { setReport(run.metadata.result as Report); setSavedAt(run.created_at); }
      setLoading(false);
    })();
  }, [code]);

  async function runCheck() {
    setRunning(true); setError("");
    try {
      const [p, q] = await Promise.all([fetch("/demo/protocol-demo.pdf"), fetch("/demo/participant-demo.pdf")]);
      const [pb, qb] = await Promise.all([p.blob(), q.blob()]);
      const [protocol, participant] = await Promise.all([
        extractPdfText(new File([pb], "protocol-demo.pdf", { type: "application/pdf" })),
        extractPdfText(new File([qb], "participant-demo.pdf", { type: "application/pdf" })),
      ]);
      const res = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ protocol, participant, participantCode: code }) });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "The check did not finish.");
      setReport(json.result); setSavedAt(new Date().toISOString()); setSelected(undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The check did not finish.");
    } finally { setRunning(false); }
  }

  const rows = useMemo<Row[]>(() => {
    if (!report) return [];
    const make = (list: Criterion[] = [], kind: Row["kind"]) => list.map((c, i) => { const s = splitCriterion(c.criterion, `${kind[0]}${i + 1}`); return { ...c, ...s, kind, group: groupOf(c, kind) }; });
    return [...make(report.criteriaEvaluation?.inclusion, "Inclusion"), ...make(report.criteriaEvaluation?.exclusion, "Exclusion")];
  }, [report]);
  const by = (g: Row["group"]) => rows.filter((r) => r.group === g);
  const notMet = by("no"), rev = by("rev"), met = by("ok");
  const current = rows.find((r) => r.id === selected) ?? notMet[0] ?? rev[0];
  const sources = report?.audit?.sourceReferences?.length ?? 0;

  const title = !report ? "Eligibility not checked yet" : notMet.length ? `Not eligible: ${notMet.length} ${notMet.length === 1 ? "criterion" : "criteria"} not met` : rev.length ? "Eligible so far, evidence still needed" : "All criteria met";
  const subtitle = !report ? "Run the check to compare this participant's records with the protocol." : rev.length ? `${rev.length} more ${rev.length === 1 ? "criterion needs" : "criteria need"} evidence before the PI can sign off.` : "Ready for PI sign-off.";

  return (
    <div className="px-9 pb-12 pt-7">
      <nav className="mb-5 text-[13px] text-ink-3"><Link href="/dashboard/participants" className="hover:text-ink">Participants</Link><span className="mx-2 text-line">/</span><span className="font-medium text-ink">{code}</span></nav>

      <div className="flex items-end gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-ink-3">{code}{report?.studyTitle ? ` · ${short(report.studyTitle, 60)}` : ""}</p>
          <h1 className="mt-1 text-[28px] font-semibold leading-tight tracking-[-0.015em]">{loading ? "Loading…" : title}</h1>
          <p className="mt-1 text-[15px] text-ink-2">{loading ? "" : subtitle}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button onClick={runCheck} disabled={running} className="rounded-md border border-line px-3.5 py-2 text-sm font-medium hover:bg-surface disabled:opacity-60">{running ? "Checking…" : report ? "Re-check" : "Run eligibility check"}</button>
          {report && <Link href="/dashboard/review-queue" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-strong">Send to PI for sign-off</Link>}
        </div>
      </div>

      {report && <p className="mt-3 text-[13px] text-ink-2">Checked by TrialIQ against {rows.length} protocol criteria{sources ? ` in ${sources} source ${sources === 1 ? "document" : "documents"}` : ""}, {ago(savedAt)}.</p>}
      {running && <p className="mt-3 text-[13px] text-ink-2">Reading the protocol and participant records. This usually takes under a minute.</p>}
      {error && <p className="mt-3 text-[13px] text-no">{error}</p>}

      <div className="mt-5 flex gap-7 border-b border-line text-sm">
        {[["Eligibility", ""], ["Sources", "/dashboard/workspace/source-review"], ["Visits", "/dashboard/workspace/deviations"], ["Safety", "/dashboard/workspace/adverse-events"]].map(([l, href]) => href
          ? <Link key={l} href={href} className="pb-2.5 text-ink-3 hover:text-ink">{l}</Link>
          : <span key={l} className="border-b-2 border-ink pb-2.5 font-medium">{l}</span>)}
      </div>

      {report ? (
        <div className="mt-6 flex items-start gap-7">
          <div className="min-w-0 flex-1 space-y-6">
            {(["no", "rev", "ok"] as const).map((g) => {
              const list = g === "rev" && !showAllRev ? rev.slice(0, 3) : g === "ok" ? [] : by(g);
              const all = by(g); if (!all.length) return null;
              return (
                <section key={g}>
                  <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold"><span className={`h-2 w-2 rounded-full ${GROUPS[g].dot}`} />{GROUPS[g].label}<span className="font-normal text-ink-3">{all.length}</span></h2>
                  {g === "ok" ? (
                    <button onClick={() => setSelected(met[0]?.id)} className="w-full border-t border-line px-3.5 py-2.5 text-left text-[13px] text-ink-2 hover:bg-surface">{met.map((m) => `${m.id} ${short(m.name, 28)}`).join("  ·  ")}</button>
                  ) : (
                    <ul>
                      {list.map((r) => {
                        const active = current?.id === r.id;
                        return (
                          <li key={r.id}>
                            <button onClick={() => setSelected(r.id)} aria-pressed={active} className={`grid w-full grid-cols-[36px_minmax(0,1.1fr)_minmax(0,1.4fr)_auto] items-center gap-4 px-3.5 py-3 text-left ${active ? "rounded-md bg-tint" : "border-t border-line hover:bg-surface"}`}>
                              <span className="font-mono text-xs text-ink-3">{r.id}</span>
                              <span className="truncate text-sm font-medium">{short(r.name, 48)}</span>
                              <span className={`truncate text-[13px] ${GROUPS[g].text}`}>{short(r.actual || r.assessment || "Not documented", 64)}</span>
                              <span className="text-xs text-ink-3">{decisions[r.id] ?? short(r.sourceReference?.split("—")[0]?.trim() || "", 22)}</span>
                            </button>
                          </li>
                        );
                      })}
                      {g === "rev" && rev.length > 3 && <li><button onClick={() => setShowAllRev((v) => !v)} className="w-full border-t border-line px-3.5 py-2.5 text-left text-[13px] font-medium text-ink-2 hover:text-ink">{showAllRev ? "Show fewer" : `Show ${rev.length - 3} more`}</button></li>}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>

          {current && (
            <aside className="sticky top-6 w-[380px] shrink-0 rounded-[10px] border border-line bg-white p-5">
              <p className="text-xs text-ink-3">{current.id} · {current.kind}</p>
              <h3 className="mt-1 text-xl font-semibold leading-snug tracking-[-0.01em]">{current.name}</h3>
              <dl className="mt-5 space-y-4 text-sm">
                <div><dt className="text-xs font-medium text-ink-3">Protocol requires</dt><dd className="mt-1">{current.expected || "Not stated in the protocol excerpt"}</dd></div>
                <div><dt className="text-xs font-medium text-ink-3">Participant record</dt><dd className="mt-1">{current.actual || "Not documented"}</dd>
                  {current.sourceReference && <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-2"><FileText size={13} className="text-ink-3" />{current.sourceReference}</p>}</div>
              </dl>
              {current.evidence && <div className="mt-4 rounded-lg bg-surface p-3"><p className="text-xs font-medium text-ink-2">TrialIQ read</p><p className="mt-1 text-[13px] leading-5 text-ink-2">{current.evidence}</p></div>}
              <div className="mt-5 border-t border-line pt-4">
                <p className="text-xs font-medium text-ink-3">Your decision</p>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => setDecisions((d) => ({ ...d, [current.id]: current.group === "ok" ? "Confirmed met" : "Confirmed not met" }))} className="rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-strong">{current.group === "ok" ? "Confirm met" : "Confirm not met"}</button>
                  <button onClick={() => setDecisions((d) => ({ ...d, [current.id]: "Sent to PI" }))} className="rounded-md border border-line px-3.5 py-2 text-sm font-medium hover:bg-surface">Needs PI review</button>
                </div>
                <p className="mt-2 text-xs text-ink-3">{decisions[current.id] ? `${decisions[current.id]}.` : "Choices are kept for this session. Saving them to the audit trail comes next."}</p>
              </div>
            </aside>
          )}
        </div>
      ) : !loading && (
        <div className="mt-10 max-w-md">
          <p className="text-sm text-ink-2">No eligibility check has been saved for {code}. TrialIQ will compare the study protocol with this participant&apos;s screening summary and show each criterion with its source.</p>
          <button onClick={runCheck} disabled={running} className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">{running ? "Checking…" : "Run eligibility check"}</button>
        </div>
      )}
    </div>
  );
}
