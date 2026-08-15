"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, CheckCircle2, Clock3, Eye, FlaskConical, History, Loader2, Play, ShieldCheck, Sparkles, XCircle } from "lucide-react";

type RunStatus = "PASS" | "FAIL" | "QUEUED" | "RUNNING";
type HistoryItem = { id: string; jobId?: string; runId?: string; kind?: "RUN" | "JOB"; suite?: string; suiteKey?: string; startedAt: string; completedAt?: string; requestedAt?: string; durationMs: number; status: RunStatus; total: number; passed: number; failed: number; aiReview?: { overallScore?: number | null }; error?: string };
type SuiteKey = "ai" | "ui";

function formatDate(value?: string) { return value ? new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "medium" }) : "—"; }
function duration(ms: number) { return `${(ms / 1000).toFixed(1)}s`; }

const suites: Array<{ key: SuiteKey; title: string; description: string; count: string }> = [
  { key: "ai", title: "AI Quality", description: "Decision quality, evidence grounding, safe reasoning and auditability.", count: "33 gates" },
  { key: "ui", title: "UI Quality", description: "Playwright behavior plus AI visual, UX, accessibility and flow review.", count: "12 tests" },
];

export default function TestSuitePage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [running, setRunning] = useState<SuiteKey | null>(null);
  const [error, setError] = useState("");

  async function loadHistory() {
    try {
      const response = await fetch("/api/test-suite/history", { cache: "no-store" });
      const payload = await response.json();
      if (response.ok) setHistory(payload.reports || []);
    } catch {}
  }

  useEffect(() => {
    loadHistory();
    const timer = window.setInterval(loadHistory, 2500);
    return () => window.clearInterval(timer);
  }, []);

  async function startTest(suite: SuiteKey) {
    if (running) return;
    setRunning(suite);
    setError("");
    try {
      const response = await fetch("/api/test-suite/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ suite }) });
      const payload = await response.json();
      if (!response.ok || !payload?.job?.id) throw new Error(payload?.error || "Unable to queue test suite.");
      await loadHistory();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to queue test suite.");
    } finally {
      setRunning(null);
    }
  }

  const latest = history.find((item) => item.kind !== "JOB" || item.status === "PASS" || item.status === "FAIL");
  const activeJobs = history.filter((item) => item.kind === "JOB" && (item.status === "QUEUED" || item.status === "RUNNING"));
  const aiHistory = history.filter((run) => run.suiteKey === "ai" && run.kind !== "JOB");
  const uiHistory = history.filter((run) => run.suiteKey === "ui" && run.kind !== "JOB");
  const best = useMemo(() => history.filter((run) => run.kind !== "JOB").reduce((max, run) => Math.max(max, run.total ? (run.passed / run.total) * 100 : 0), 0), [history]);

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <div className="mx-auto max-w-6xl px-6 py-10 md:px-10 md:py-14">
        <header className="flex flex-col gap-6 border-b border-slate-200 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-700"><FlaskConical size={15} /> TrialIQ / Quality Lab</div>
            <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">AI Quality Engineering</h1>
            <p className="mt-3 max-w-3xl text-[15px] leading-7 text-slate-600">Automated tests prove behavior. A second AI reviewer evaluates the product experience and returns concrete refinements for every test.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"><Sparkles size={16} className="text-blue-700"/> Headless + AI reviewed</div>
        </header>

        {activeJobs.length > 0 && <section className="mt-6 space-y-3">{activeJobs.map((job) => <div key={job.id} className="rounded-2xl border border-blue-200 bg-blue-50 p-5"><div className="flex items-center gap-3"><Loader2 className="animate-spin text-blue-700" size={19}/><div><p className="font-bold text-blue-950">{job.suite} — {job.status === "RUNNING" ? "running" : "queued"}</p><p className="mt-1 text-sm text-blue-800">{job.status === "RUNNING" ? "Your local Playwright runner is executing this test." : "Waiting for your local Playwright runner to claim this job."}</p><p className="mt-1 font-mono text-[11px] text-blue-700">Job {job.id}</p></div></div></div>)}</section>}
        {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"><strong>Could not queue the suite.</strong> {error}</div>}

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <Stat icon={<Activity size={17}/>} label="Latest result" value={latest ? `${latest.passed}/${latest.total}` : "—"} detail={latest ? latest.status : "No runs yet"} />
          <Stat icon={<ShieldCheck size={17}/>} label="Best pass rate" value={history.length ? `${best.toFixed(0)}%` : "—"} detail={`${history.filter((r) => r.kind !== "JOB").length} recorded run${history.filter((r) => r.kind !== "JOB").length === 1 ? "" : "s"}`} />
          <Stat icon={<Sparkles size={17}/>} label="AI review" value={latest?.aiReview?.overallScore != null ? `${latest.aiReview.overallScore}/100` : "—"} detail="Latest product-quality score" />
          <Stat icon={<Clock3 size={17}/>} label="Latest duration" value={latest ? duration(latest.durationMs) : "—"} detail={latest ? formatDate(latest.completedAt) : "Awaiting first run"} />
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          {suites.map((suite) => {
            const suiteHistory = suite.key === "ai" ? aiHistory : uiHistory;
            const latestSuite = suiteHistory[0];
            return <div key={suite.key} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Quality layer</p><h2 className="mt-2 text-xl font-bold">{suite.title}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">{suite.description}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{suite.count}</span></div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-sm"><Metric label="Latest" value={latestSuite ? `${latestSuite.passed}/${latestSuite.total}` : "—"}/><Metric label="AI review" value={latestSuite?.aiReview?.overallScore != null ? `${latestSuite.aiReview.overallScore}` : "—"}/><Metric label="Runs" value={String(suiteHistory.length)}/></div>
              <button onClick={() => startTest(suite.key)} disabled={!!running || activeJobs.length > 0} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">{running === suite.key ? <Loader2 size={16} className="animate-spin"/> : <Play size={16} fill="currentColor"/>}{running === suite.key ? "Queuing…" : `Run ${suite.title}`}</button>
            </div>;
          })}
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">{["Role-Based Quality", "Scenario Quality", "Competitor Quality"].map((title, index) => <div key={title} className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Phase {index + 3}</p><h2 className="mt-2 font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">Same Playwright + AI reviewer architecture will be reused for permissions, real-world journeys and comparative experience quality.</p><span className="mt-4 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">Next</span></div>)}</section>

        <section className="mt-10 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><div><div className="flex items-center gap-2"><History size={17} className="text-blue-700"/><h2 className="font-bold">Test history</h2></div><p className="mt-1 text-sm text-slate-500">Queued, running and completed sessions are shown here in real time.</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{history.length} entries</span></div>
          {history.length === 0 ? <div className="px-6 py-14 text-center text-sm text-slate-500">No sessions yet. Run a quality layer above.</div> : <div className="divide-y divide-slate-100">
            {history.map((run) => {
              const active = run.kind === "JOB" && (run.status === "QUEUED" || run.status === "RUNNING");
              const content = <div className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between"><div className="flex items-start gap-4"><div className={`mt-0.5 rounded-full p-2 ${run.status === "PASS" ? "bg-emerald-50 text-emerald-700" : run.status === "QUEUED" || run.status === "RUNNING" ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"}`}>{run.status === "PASS" ? <CheckCircle2 size={18}/> : active ? <Loader2 size={18} className="animate-spin"/> : <XCircle size={18}/>}</div><div><div className="flex flex-wrap items-center gap-2"><span className="font-bold">{run.suite || "Test Suite"}</span>{active ? <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">{run.status}</span> : <span className="text-sm text-slate-500">{run.passed}/{run.total} passed</span>}{run.aiReview?.overallScore != null && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">AI {run.aiReview.overallScore}</span>}</div><p className="mt-1 text-sm text-slate-500">{active ? `Requested ${formatDate(run.requestedAt)}` : formatDate(run.startedAt)}</p>{run.error && <p className="mt-2 max-w-2xl truncate text-xs text-red-600">{run.error}</p>}{active && <p className="mt-2 text-xs text-blue-700">Job {run.id} · waiting for local runner</p>}</div></div><div className="flex items-center gap-5 text-sm text-slate-500">{!active && <span>{duration(run.durationMs)}</span>}<Eye size={16}/>{!active && <ArrowRight size={17} className="transition group-hover:translate-x-1 group-hover:text-slate-950"/>}</div></div>;
              return active ? <div key={run.id} className="bg-blue-50/20">{content}</div> : <Link key={run.id} href={`/test.html/run/${run.id}`} className="group block transition hover:bg-slate-50">{content}</Link>;
            })}
          </div>}
        </section>

        <p className="mt-8 text-xs leading-5 text-slate-400">Playwright never runs on Netlify. The deployed page queues jobs in Supabase; your local runner executes them against the configured PLAYWRIGHT_BASE_URL and writes results back to Supabase.</p>
      </div>
    </main>
  );
}

function Stat({icon,label,value,detail}:{icon:React.ReactNode;label:string;value:string;detail:string}) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">{icon}{label}</div><p className="mt-3 text-2xl font-bold">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>; }
function Metric({label,value}:{label:string;value:string}) { return <div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-lg font-bold text-slate-900">{value}</p></div>; }
