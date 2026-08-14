"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, FileWarning, FlaskConical, Loader2, Sparkles, Terminal, XCircle } from "lucide-react";

type TestCase = { id: number; name: string; passed: boolean; durationMs: number; error?: string };
type Review = {
  testId: number;
  score: number;
  verdict: string;
  rootCauseLayer?: "AI_OUTPUT" | "UI" | "FLOW" | "TEST" | "INFRASTRUCTURE" | "NONE";
  rootCauseConfidence?: number;
  isProductDefect?: boolean;
  strengths?: string[];
  issues?: Array<{ severity: string; issue: string; evidence: string }>;
  recommendations?: Array<{ priority: string; layer?: string; recommendation: string; expectedImpact: string }>;
  reviewNotes?: string;
};
type Report = { id: string; suite?: string; suiteKey?: string; startedAt: string; completedAt: string; durationMs: number; status: "PASS" | "FAIL"; total: number; passed: number; failed: number; result: any; tests: TestCase[]; aiReview?: { status?: string; model?: string; overallScore?: number | null; overallSummary?: string; reviews?: Review[]; error?: string }; error?: string; logs?: string };

function formatDate(value: string) { return new Date(value).toLocaleString([], { dateStyle: "full", timeStyle: "medium" }); }
function duration(ms: number) { return `${(ms / 1000).toFixed(1)}s`; }
function layerLabel(layer?: Review["rootCauseLayer"]) {
  if (!layer) return "Not classified";
  return layer === "AI_OUTPUT" ? "AI output" : layer === "INFRASTRUCTURE" ? "Infrastructure" : layer;
}
function layerClass(layer?: Review["rootCauseLayer"]) {
  if (layer === "AI_OUTPUT") return "bg-purple-50 text-purple-700 border-purple-200";
  if (layer === "UI" || layer === "FLOW") return "bg-blue-50 text-blue-700 border-blue-200";
  if (layer === "TEST") return "bg-amber-50 text-amber-700 border-amber-200";
  if (layer === "INFRASTRUCTURE") return "bg-orange-50 text-orange-700 border-orange-200";
  return "bg-slate-50 text-slate-600 border-slate-200";
}

export default function TestRunPage({ params }: { params: Promise<{ id: string }> }) {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then(({ id }) => fetch(`/api/test-suite/history/${encodeURIComponent(id)}`, { cache: "no-store" }).then(async (r) => {
      const payload = await r.json();
      if (!r.ok) throw new Error(payload.error || "Run not found");
      setReport(payload.report);
    }).catch((e) => setError(e instanceof Error ? e.message : "Unable to load run.")));
  }, [params]);

  if (error) return <main className="min-h-screen bg-[#f7f8fa] p-10"><div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-8"><h1 className="text-xl font-bold text-red-950">Run unavailable</h1><p className="mt-2 text-sm text-red-800">{error}</p><Link href="/test.html" className="mt-5 inline-flex font-semibold text-red-900 underline">Back to test suite</Link></div></main>;
  if (!report) return <main className="grid min-h-screen place-items-center bg-[#f7f8fa]"><Loader2 className="animate-spin text-blue-700"/></main>;

  const rate = report.total ? (report.passed / report.total) * 100 : 0;
  const reviewById = new Map((report.aiReview?.reviews || []).map((review) => [review.testId, review]));
  const reviewScore = report.aiReview?.overallScore;
  const title = report.suite || "Quality run";
  const reviews = report.aiReview?.reviews || [];
  const productDefects = reviews.filter((review) => review.isProductDefect && review.rootCauseLayer !== "TEST" && review.rootCauseLayer !== "INFRASTRUCTURE").length;
  const uiFlowIssues = reviews.filter((review) => review.rootCauseLayer === "UI" || review.rootCauseLayer === "FLOW").length;
  const aiOutputIssues = reviews.filter((review) => review.rootCauseLayer === "AI_OUTPUT").length;
  const testIssues = reviews.filter((review) => review.rootCauseLayer === "TEST").length;

  return <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
    <div className="mx-auto max-w-6xl px-6 py-10 md:px-10 md:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4"><Link href="/test.html" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"><ArrowLeft size={16}/> Test suite</Link><span className="font-mono text-xs text-slate-400">{report.id}</span></div>
      <header className="mt-8 border-b border-slate-200 pb-8"><div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-700"><FlaskConical size={15}/> TrialIQ / {title}</div><h1 className="mt-3 text-4xl font-bold tracking-tight">{report.status === "PASS" ? "Automated tests passed" : "Automated tests need attention"}</h1><p className="mt-3 text-sm text-slate-500">{formatDate(report.startedAt)}</p></div><div className="grid grid-cols-2 gap-3"><Score label="Automated" value={`${rate.toFixed(0)}%`} good={report.status === "PASS"}/><Score label="AI review" value={reviewScore != null ? `${reviewScore}` : "—"} good={reviewScore == null || reviewScore >= 80}/></div></div></header>

      <section className="mt-8 grid gap-4 md:grid-cols-4"><Stat label="Passed" value={`${report.passed}`} tone="good"/><Stat label="Failed" value={`${report.failed}`} tone={report.failed ? "bad" : "neutral"}/><Stat label="Product issues" value={`${productDefects}`} tone={productDefects ? "bad" : "good"}/><Stat label="Duration" value={duration(report.durationMs)} tone="neutral"/></section>

      {report.aiReview?.overallSummary && <section className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-6"><div className="flex items-start gap-3"><Sparkles className="mt-0.5 text-blue-700" size={20}/><div><h2 className="font-bold text-blue-950">AI product review</h2><p className="mt-2 text-sm leading-6 text-blue-900">{report.aiReview.overallSummary}</p>{report.aiReview.model && <p className="mt-3 text-xs font-semibold text-blue-700">Reviewer model: {report.aiReview.model}</p>}</div></div></section>}
      {report.aiReview?.status === "COMPLETE" && <section className="mt-6 grid gap-3 sm:grid-cols-4"><DiagnosisMetric label="AI output issues" value={aiOutputIssues} tone="purple"/><DiagnosisMetric label="UI / flow issues" value={uiFlowIssues} tone="blue"/><DiagnosisMetric label="Test issues" value={testIssues} tone="amber"/><DiagnosisMetric label="Product defects" value={productDefects} tone={productDefects ? "red" : "green"}/></section>}
      {report.aiReview?.error && <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900"><strong>AI review layer error:</strong> {report.aiReview.error}</section>}
      {report.error && <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6"><div className="flex gap-3"><FileWarning className="text-red-700"/><div><h2 className="font-bold text-red-950">Run error</h2><pre className="mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-red-950 p-4 font-mono text-xs leading-5 text-red-50">{report.error}</pre></div></div></section>}

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-6 py-5"><h2 className="font-bold">Test-by-test quality review</h2><p className="mt-1 text-sm text-slate-500">Each automated result is paired with an AI assessment. Root cause determines whether the next improvement belongs in AI, UI, flow, tests or infrastructure.</p></div><div className="divide-y divide-slate-100">
        {report.tests.map((test) => {
          const review = reviewById.get(test.id);
          return <article key={test.id} className="px-6 py-6">
            <div className="flex items-start gap-4"><div className="mt-0.5">{test.passed ? <CheckCircle2 size={19} className="text-emerald-600"/> : <XCircle size={19} className="text-red-600"/>}</div><div className="min-w-0 flex-1"><div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between"><div><p className="font-semibold text-slate-900"><span className="mr-2 font-mono text-xs text-slate-400">{String(test.id).padStart(2,"0")}</span>{test.name}</p><p className="mt-1 text-xs text-slate-400">Automated: {test.passed ? "PASS" : "FAIL"} · {test.durationMs}ms</p></div>{review && <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-bold ${review.score >= 90 ? "bg-emerald-50 text-emerald-700" : review.score >= 80 ? "bg-blue-50 text-blue-700" : review.score >= 70 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>AI {review.score}/100 · {review.verdict}</span><span className={`rounded-full border px-3 py-1 text-xs font-bold ${layerClass(review.rootCauseLayer)}`}>{layerLabel(review.rootCauseLayer)}{review.rootCauseConfidence != null ? ` · ${review.rootCauseConfidence}%` : ""}</span></div>}</div>
              {test.error && <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-red-50 p-3 font-mono text-xs leading-5 text-red-700">{test.error}</pre>}
              {review && <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">AI strengths</p><ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">{(review.strengths || []).map((item, i) => <li key={i}>✓ {item}</li>)}</ul></div>
                <div className="rounded-xl bg-amber-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-amber-700">AI diagnosis</p><p className="mt-2 text-sm font-semibold text-amber-950">Root cause: {layerLabel(review.rootCauseLayer)}</p><p className="mt-1 text-xs text-amber-800">{review.isProductDefect ? "Product defect indicated" : "No confirmed product defect"}{review.rootCauseConfidence != null ? ` · ${review.rootCauseConfidence}% confidence` : ""}</p><ul className="mt-3 space-y-2 text-sm leading-6 text-amber-950">{(review.issues || []).map((item, i) => <li key={i}><strong>{item.severity}:</strong> {item.issue}<span className="block text-xs text-amber-800">Evidence: {item.evidence}</span></li>)}</ul></div>
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 lg:col-span-2"><p className="text-xs font-bold uppercase tracking-wide text-blue-700">Recommended refinement</p><ul className="mt-2 space-y-3 text-sm leading-6 text-blue-950">{(review.recommendations || []).map((item, i) => <li key={i}><strong>{item.priority}{item.layer ? ` · ${item.layer}` : ""}</strong> — {item.recommendation}<span className="block text-xs text-blue-700">Expected impact: {item.expectedImpact}</span></li>)}</ul></div>
                {review.reviewNotes && <p className="text-sm leading-6 text-slate-600 lg:col-span-2">{review.reviewNotes}</p>}
              </div>}
              {report.suiteKey === "ui" && <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-slate-50"><img src={`/api/test-suite/history/${encodeURIComponent(report.id)}/evidence/${test.id}`} alt={`Captured UI evidence for test ${test.id}`} className="max-h-[520px] w-full object-contain" onError={(event) => { event.currentTarget.style.display = "none"; }} /></div>}
            </div></div>
          </article>;
        })}
      </div></section>

      {report.logs && <details className="mt-6 rounded-2xl border border-slate-200 bg-white p-6"><summary className="flex cursor-pointer list-none items-center gap-2 font-semibold"><Terminal size={16}/> Show runner logs</summary><pre className="mt-4 max-h-[600px] overflow-auto whitespace-pre-wrap rounded-xl bg-slate-950 p-5 font-mono text-xs leading-5 text-slate-100">{report.logs}</pre></details>}
      {report.result && <details className="mt-6 rounded-2xl border border-slate-200 bg-white p-6"><summary className="cursor-pointer font-semibold">Show captured AI output</summary><pre className="mt-4 max-h-[600px] overflow-auto rounded-xl bg-slate-950 p-5 font-mono text-xs leading-5 text-slate-100">{JSON.stringify(report.result, null, 2)}</pre></details>}
      <p className="mt-8 text-xs leading-5 text-slate-400">Run ID: {report.id}. Stored locally under <code>test-reports/web-runs/</code>.</p>
    </div>
  </main>;
}
function Stat({label,value,tone}:{label:string;value:string;tone:"good"|"bad"|"neutral"}) { const cls=tone==="good"?"border-emerald-200 bg-emerald-50 text-emerald-700":tone==="bad"?"border-red-200 bg-red-50 text-red-700":"border-slate-200 bg-white text-slate-950"; return <div className={`rounded-2xl border p-5 shadow-sm ${cls}`}><p className="text-xs font-bold uppercase tracking-wide opacity-70">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>; }
function Score({label,value,good}:{label:string;value:string;good:boolean}) { return <div className={`rounded-2xl border px-5 py-4 ${good ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>; }
function DiagnosisMetric({label,value,tone}:{label:string;value:number;tone:"purple"|"blue"|"amber"|"red"|"green"}) { const cls=tone==="purple"?"border-purple-200 bg-purple-50 text-purple-700":tone==="blue"?"border-blue-200 bg-blue-50 text-blue-700":tone==="amber"?"border-amber-200 bg-amber-50 text-amber-700":tone==="red"?"border-red-200 bg-red-50 text-red-700":"border-emerald-200 bg-emerald-50 text-emerald-700"; return <div className={`rounded-2xl border p-4 ${cls}`}><p className="text-xs font-bold uppercase tracking-wide opacity-70">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>; }
