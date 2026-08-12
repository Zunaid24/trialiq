"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, ArrowRight, CheckCircle2, CircleAlert, FileSearch, Link2, Loader2, ShieldAlert, Sparkles, ClipboardCheck } from "lucide-react";

type Evidence = { sourceId: string; fact: string };
type Finding = { priority: string; title: string; finding: string; whyItMatters: string; interpretation: string; evidence: Evidence[]; missingEvidence: string[]; recommendedAction: string; status: string; confidence: number };
type Intelligence = {
  studyTitle: string; participantId: string; executiveDecision: string; decisionReadiness: string; executiveSummary: string;
  priorityFindings: Finding[];
  crossDocumentLinks: { title: string; relationship: string; clinicalRelevance: string; evidence: Evidence[]; status: string }[];
  protocolImpact: { affectedCriteria: { criterion: string; impact: string; evidence: Evidence[]; status: string }[]; overallImpact: string };
  safetyAssessment: { signals: { title: string; interpretation: string; evidence: Evidence[]; status: string }[]; overallAssessment: string };
  dataGaps: { gap: string; whyItMatters: string; sourceIds: string[]; nextAction: string }[];
  coordinatorActions: { priority: string; action: string; reason: string; sourceIds: string[] }[];
  auditSummary: { sourcesReviewed: number; evidenceBackedFindings: number; unresolvedItems: number };
  evidenceQuality: string; confidence: number; confidenceRationale: string; limitations: string[];
  aiModel?: string;
};

function statusClass(status: string) {
  if (/not met|critical|high/i.test(status)) return "border-red-200 bg-red-50 text-red-700";
  if (/potential|pending|review|moderate/i.test(status)) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export default function ClinicalIntelligencePage() {
  const [data, setData] = useState<Intelligence | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runIntelligence() {
    setLoading(true); setError("");
    try {
      const source = await fetch("/demo/clinical-intelligence-evidence.json", { cache: "no-store" }).then((r) => r.json());
      const response = await fetch("/api/clinical-intelligence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ evidencePack: source }) });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to generate clinical intelligence.");
      setData(payload.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to generate clinical intelligence.");
    } finally { setLoading(false); }
  }

  useEffect(() => { runIntelligence(); }, []);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl p-6 md:p-10">
        <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-blue-700"><Sparkles size={16} />Clinical Intelligence</div>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">From evidence to decisions</h1>
            <p className="mt-2 max-w-3xl text-slate-600">TrialIQ connects protocol requirements, participant evidence, laboratory results, medications, safety events and deviations into review-ready intelligence.</p>
          </div>
          <button onClick={runIntelligence} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">{loading ? <Loader2 size={17} className="animate-spin" /> : <Activity size={17} />}{loading ? "Connecting evidence…" : "Refresh intelligence"}</button>
        </header>

        {loading && !data ? <div className="rounded-2xl border bg-white p-12 text-center shadow-sm"><Loader2 size={28} className="mx-auto animate-spin text-blue-700" /><p className="mt-4 font-semibold text-slate-900">Connecting clinical evidence</p><p className="mt-1 text-sm text-slate-500">TrialIQ is reasoning across the study evidence pack.</p></div> : null}
        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"><strong>Clinical intelligence unavailable.</strong> {error}</div> : null}

        {data && <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-4xl"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{data.studyTitle}</span><span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">Participant {data.participantId}</span></div><h2 className="mt-4 text-2xl font-bold text-slate-950">{data.executiveDecision}</h2><p className="mt-3 text-[15px] leading-7 text-slate-600">{data.executiveSummary}</p></div>
              <div className={`shrink-0 rounded-xl border px-4 py-3 ${statusClass(data.decisionReadiness)}`}><p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Decision readiness</p><p className="mt-1 font-bold">{data.decisionReadiness}</p><p className="mt-2 text-xs font-medium">Confidence {data.confidence}% · {data.evidenceQuality} evidence</p></div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3"><Metric icon={<FileSearch size={16} />} label="Sources reviewed" value={data.auditSummary.sourcesReviewed} /><Metric icon={<CheckCircle2 size={16} />} label="Evidence-backed findings" value={data.auditSummary.evidenceBackedFindings} /><Metric icon={<CircleAlert size={16} />} label="Unresolved items" value={data.auditSummary.unresolvedItems} /></div>
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between"><div><h2 className="text-xl font-bold text-slate-950">Priority findings</h2><p className="mt-1 text-sm text-slate-500">What changes the team's next decision.</p></div></div>
            <div className="grid gap-4 lg:grid-cols-2">{data.priorityFindings.map((f, i) => <FindingCard key={`${f.title}-${i}`} finding={f} />)}</div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border bg-white p-6 shadow-sm"><SectionTitle icon={<Link2 size={18} />} title="Cross-document connections" subtitle="Relationships TrialIQ found across source records." />{data.crossDocumentLinks.map((link, i) => <div key={i} className="border-b border-slate-100 py-4 last:border-0"><div className="flex items-start justify-between gap-3"><p className="font-semibold text-slate-900">{link.title}</p><span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${statusClass(link.status)}`}>{link.status}</span></div><p className="mt-1 text-sm font-medium text-slate-700">{link.relationship}</p><p className="mt-2 text-sm leading-6 text-slate-500">{link.clinicalRelevance}</p><EvidenceList evidence={link.evidence} /></div>)}</section>
            <section className="rounded-2xl border bg-white p-6 shadow-sm"><SectionTitle icon={<ClipboardCheck size={18} />} title="Protocol impact" subtitle="Where evidence intersects study requirements." />{data.protocolImpact.affectedCriteria.map((c, i) => <div key={i} className="border-b border-slate-100 py-4 last:border-0"><div className="flex items-start justify-between gap-3"><p className="font-semibold text-slate-900">{c.criterion}</p><span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${statusClass(c.status)}`}>{c.status}</span></div><p className="mt-2 text-sm leading-6 text-slate-600">{c.impact}</p><EvidenceList evidence={c.evidence} /></div>)}<div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-700">{data.protocolImpact.overallImpact}</div></section>
          </div>

          <section className="rounded-2xl border bg-white p-6 shadow-sm"><SectionTitle icon={<ShieldAlert size={18} />} title="Safety assessment" subtitle="Patterns, temporal relationships and evidence limitations." /><div className="grid gap-4 md:grid-cols-2">{data.safetyAssessment.signals.map((s, i) => <div key={i} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><p className="font-semibold text-slate-900">{s.title}</p><span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${statusClass(s.status)}`}>{s.status}</span></div><p className="mt-2 text-sm leading-6 text-slate-600">{s.interpretation}</p><EvidenceList evidence={s.evidence} /></div>)}</div><div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><strong>Safety assessment:</strong> {data.safetyAssessment.overallAssessment}</div></section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border bg-white p-6 shadow-sm"><SectionTitle icon={<CircleAlert size={18} />} title="Evidence gaps" subtitle="Unknowns that could change the assessment." />{data.dataGaps.map((g, i) => <div key={i} className="border-b border-slate-100 py-4 last:border-0"><p className="font-semibold text-slate-900">{g.gap}</p><p className="mt-1 text-sm leading-6 text-slate-500">{g.whyItMatters}</p><p className="mt-2 text-sm font-semibold text-blue-700">Next: {g.nextAction}</p></div>)}</section>
            <section className="rounded-2xl border bg-white p-6 shadow-sm"><SectionTitle icon={<ArrowRight size={18} />} title="Coordinator action plan" subtitle="Operational next steps grounded in the evidence." />{data.coordinatorActions.map((a, i) => <div key={i} className="flex gap-4 border-b border-slate-100 py-4 last:border-0"><span className={`mt-0.5 h-fit rounded-full border px-2 py-1 text-[10px] font-bold ${statusClass(a.priority)}`}>{a.priority}</span><div><p className="font-semibold text-slate-900">{a.action}</p><p className="mt-1 text-sm leading-6 text-slate-500">{a.reason}</p></div></div>)}</section>
          </div>

          <footer className="rounded-xl border border-slate-200 bg-slate-100 p-4 text-xs leading-5 text-slate-500">TrialIQ provides evidence-grounded review intelligence. It does not independently establish final eligibility, medical diagnosis, causality, safety-reportability, regulatory significance or final coding. {data.aiModel ? `Model: ${data.aiModel}.` : ""} Confidence reflects evidence completeness and consistency.</footer>
        </div>}
      </div>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) { return <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{icon}{label}</div><p className="mt-2 text-2xl font-bold text-slate-950">{value}</p></div>; }
function SectionTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) { return <div className="mb-2 flex gap-3"><div className="mt-0.5 text-blue-700">{icon}</div><div><h2 className="font-bold text-slate-950">{title}</h2><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div></div>; }
function EvidenceList({ evidence }: { evidence: Evidence[] }) { if (!evidence?.length) return null; return <div className="mt-3 space-y-1.5">{evidence.map((e, i) => <div key={i} className="flex gap-2 text-xs leading-5 text-slate-500"><span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">{e.sourceId}</span><span>{e.fact}</span></div>)}</div>; }
function FindingCard({ finding }: { finding: Finding }) { return <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-2"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusClass(finding.priority)}`}>{finding.priority}</span><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClass(finding.status)}`}>{finding.status}</span></div><span className="text-xs font-semibold text-slate-400">{finding.confidence}% confidence</span></div><h3 className="mt-4 text-lg font-bold text-slate-950">{finding.title}</h3><p className="mt-2 text-sm font-medium leading-6 text-slate-700">{finding.finding}</p><div className="mt-4 rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Why it matters</p><p className="mt-1 text-sm leading-6 text-slate-700">{finding.whyItMatters}</p></div><p className="mt-4 text-sm leading-6 text-slate-600">{finding.interpretation}</p><EvidenceList evidence={finding.evidence} />{finding.missingEvidence?.length ? <div className="mt-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Missing evidence</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">{finding.missingEvidence.map((x, i) => <li key={i}>{x}</li>)}</ul></div> : null}<div className="mt-5 flex gap-2 border-t border-slate-100 pt-4"><ArrowRight size={16} className="mt-0.5 shrink-0 text-blue-700" /><p className="text-sm font-semibold leading-6 text-blue-800">{finding.recommendedAction}</p></div></article>; }
