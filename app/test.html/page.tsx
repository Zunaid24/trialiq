"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, CheckCircle2, Clock3, FlaskConical, History, Loader2, Play, ShieldCheck, XCircle } from "lucide-react";

type HistoryItem = {
  id: string;
  suite?: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  status: "PASS" | "FAIL";
  total: number;
  passed: number;
  failed: number;
  error?: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "medium" });
}
function duration(ms: number) {
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function TestSuitePage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  async function loadHistory() {
    const response = await fetch("/api/test-suite/history", { cache: "no-store" });
    const payload = await response.json();
    setHistory(payload.reports || []);
  }

  useEffect(() => { loadHistory(); }, []);

  async function startTest() {
    if (running) return;
    setRunning(true);
    setError("");
    try {
      const response = await fetch("/api/test-suite/run", { method: "POST" });
      const payload = await response.json();
      if (payload?.report?.id) {
        window.location.href = `/test.html/run/${payload.report.id}`;
        return;
      }
      throw new Error(payload?.error || "Unable to start benchmark.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to start benchmark.");
      await loadHistory();
    } finally {
      setRunning(false);
    }
  }

  const latest = history[0];
  const best = useMemo(() => history.reduce((max, run) => Math.max(max, run.total ? (run.passed / run.total) * 100 : 0), 0), [history]);

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <div className="mx-auto max-w-6xl px-6 py-10 md:px-10 md:py-14">
        <header className="flex flex-col gap-6 border-b border-slate-200 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-700"><FlaskConical size={15} /> TrialIQ / Quality Lab</div>
            <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">AI quality benchmark</h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-slate-600">Run the automated AI decision-quality gates against the live Clinical Intelligence output and keep a time-stamped history of how the product improves.</p>
          </div>
          <button onClick={startTest} disabled={running} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60">
            {running ? <Loader2 size={17} className="animate-spin" /> : <Play size={17} fill="currentColor" />}
            {running ? "Running benchmark…" : "Start test"}
          </button>
        </header>

        {running && <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5"><div className="flex items-center gap-3"><Loader2 className="animate-spin text-blue-700" size={19}/><div><p className="font-bold text-blue-950">Benchmark running</p><p className="mt-1 text-sm text-blue-800">Clinical Intelligence is being evaluated across the full AI quality suite. The browser runs headlessly; no Chrome window will open.</p></div></div></div>}
        {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"><strong>Could not start the benchmark.</strong> {error}</div>}

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <Stat icon={<Activity size={17}/>} label="Latest result" value={latest ? `${latest.passed}/${latest.total}` : "—"} detail={latest ? latest.status : "No runs yet"} />
          <Stat icon={<ShieldCheck size={17}/>} label="Best pass rate" value={history.length ? `${best.toFixed(0)}%` : "—"} detail={`${history.length} recorded run${history.length === 1 ? "" : "s"}`} />
          <Stat icon={<Clock3 size={17}/>} label="Latest duration" value={latest ? duration(latest.durationMs) : "—"} detail={latest ? formatDate(latest.completedAt) : "Awaiting first run"} />
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            ["AI output", "Decision readiness, evidence grounding and safe reasoning"],
            ["Scenario quality", "Uncertainty, lineage, reviewer actions and longitudinal context"],
            ["UI coverage", "Next phase: navigation, states, interactions and accessibility"],
            ["Role + scenario", "Later: permissions, workflows and end-to-end operational journeys"],
          ].map(([title, description]) => <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">QA phase</p><h2 className="mt-2 font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p></div>)}
        </section>

        <section className="mt-10 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><div><div className="flex items-center gap-2"><History size={17} className="text-blue-700"/><h2 className="font-bold">Test history</h2></div><p className="mt-1 text-sm text-slate-500">Every session gets its own result page and timestamp.</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">33 AI gates / run</span></div>
          {history.length === 0 ? <div className="px-6 py-14 text-center text-sm text-slate-500">No benchmark sessions yet. Start the first test above.</div> : <div className="divide-y divide-slate-100">
            {history.map((run) => <Link key={run.id} href={`/test.html/run/${run.id}`} className="group flex flex-col gap-4 px-6 py-5 transition hover:bg-slate-50 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4"><div className={`mt-0.5 rounded-full p-2 ${run.status === "PASS" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{run.status === "PASS" ? <CheckCircle2 size={18}/> : <XCircle size={18}/>}</div><div><div className="flex flex-wrap items-center gap-2"><span className="font-bold">{run.status}</span><span className="text-sm text-slate-500">{run.passed}/{run.total} passed</span></div><p className="mt-1 text-sm text-slate-500">{formatDate(run.startedAt)}</p>{run.error && <p className="mt-2 max-w-2xl truncate text-xs text-red-600">{run.error}</p>}</div></div>
              <div className="flex items-center gap-5 text-sm text-slate-500"><span>{duration(run.durationMs)}</span><ArrowRight size={17} className="transition group-hover:translate-x-1 group-hover:text-slate-950"/></div>
            </Link>)}
          </div>}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="font-bold">AI quality coverage</h2><div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2"><p>Decision readiness, confidence and executive conclusion quality.</p><p>Evidence grounding, source traceability and missing evidence.</p><p>Protocol impact, safety reasoning and cross-document relationships.</p><p>Operational recommendations, auditability and model provenance.</p><p>Evidence lineage, unsupported-claim suppression and uncertainty.</p><p>Reviewer action specificity and longitudinal context.</p></div></section>

        <p className="mt-8 text-xs leading-5 text-slate-400">Runs use the signed-in TrialIQ session and the demo evidence pack used by Clinical Intelligence. Credentials stay in local environment configuration and are never entered on this page.</p>
      </div>
    </main>
  );
}

function Stat({icon,label,value,detail}:{icon:React.ReactNode;label:string;value:string;detail:string}) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">{icon}{label}</div><p className="mt-3 text-2xl font-bold">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>; }
