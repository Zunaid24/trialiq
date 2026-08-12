"use client";

import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileText,
  Layers3,
  Loader2,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type DashboardData = {
  study: { id: string; name: string; status: string };
  overview: {
    findings: number;
    unresolved: number;
    critical: number;
    studies: number;
    participants: number;
    documents: number;
    avgConfidence: number | null;
  };
  findingMix: { label: string; value: number }[];
  trend: { date: string; value: number }[];
  insights: { tone: string; title: string; body: string }[];
  recentFindings: { id: string; type: string; title: string; summary: string | null; confidence: number | null; status: string; createdAt: string }[];
  studies: { id: string; name: string; protocol_name: string | null; status: string; updated_at: string }[];
  recentDocuments: { id: string; name: string; document_type: string | null; processing_status: string | null; created_at: string }[];
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function toneClasses(tone: string) {
  if (tone === "critical") return "border-red-200 bg-red-50 text-red-900";
  if (tone === "warning") return "border-amber-200 bg-amber-50 text-amber-900";
  if (tone === "positive") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  return "border-blue-200 bg-blue-50 text-blue-900";
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "Failed to load dashboard.");
        setData(result.data);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Failed to load dashboard."))
      .finally(() => setLoading(false));
  }, []);

  const maxTrend = useMemo(() => Math.max(1, ...(data?.trend.map((item) => item.value) ?? [1])), [data]);
  const maxMix = useMemo(() => Math.max(1, ...(data?.findingMix.map((item) => item.value) ?? [1])), [data]);

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50"><div className="flex items-center gap-3 text-slate-500"><Loader2 size={20} className="animate-spin" />Loading your intelligence workspace…</div></main>;
  if (error || !data) return <main className="flex min-h-screen items-center justify-center bg-slate-50"><div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm"><AlertCircle size={32} className="mx-auto text-red-500" /><h1 className="mt-4 text-xl font-semibold text-slate-950">Dashboard unavailable</h1><p className="mt-2 text-sm text-slate-500">{error || "Unable to load your workspace."}</p></div></main>;

  const { overview } = data;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1440px] px-5 py-8 md:px-8 md:py-10">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700"><Sparkles size={14} />Clinical intelligence workspace</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950 md:text-4xl">What needs your attention?</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">A longitudinal view of the evidence TrialIQ has saved for you — patterns, review pressure, and the latest intelligence rather than a wall of KPI cards.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/dashboard/review-queue" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:border-blue-300 hover:text-blue-700"><ShieldAlert size={16} />Review queue</Link>
            <Link href="/dashboard/clinical-intelligence" className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"><Sparkles size={16} />Run analysis</Link>
          </div>
        </header>

        <section className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InsightMetric icon={Layers3} label="Saved findings" value={overview.findings} detail={overview.unresolved ? `${overview.unresolved} still open` : "All findings reviewed"} />
          <InsightMetric icon={ShieldAlert} label="High-risk findings" value={overview.critical} detail={overview.critical ? "Prioritise these first" : "No obvious high-risk signals"} danger={overview.critical > 0} />
          <InsightMetric icon={Users} label="Participants" value={overview.participants} detail={`${overview.studies} ${overview.studies === 1 ? "study" : "studies"} in workspace`} />
          <InsightMetric icon={Activity} label="Avg. AI confidence" value={overview.avgConfidence == null ? "—" : `${overview.avgConfidence}%`} detail={`${overview.documents} source documents`} />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div><div className="flex items-center gap-2"><TrendingUp size={18} className="text-blue-700" /><h2 className="text-lg font-semibold text-slate-950">Intelligence activity</h2></div><p className="mt-1 text-sm text-slate-500">Saved findings created over the last 7 days</p></div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">7 days</span>
            </div>
            <div className="mt-8 flex h-48 items-end gap-2 border-b border-slate-100 pb-0">
              {data.trend.map((item) => {
                const height = item.value === 0 ? 4 : Math.max(10, (item.value / maxTrend) * 100);
                return <div key={item.date} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-xs font-semibold text-slate-600">{item.value || ""}</span><div className="w-full max-w-12 rounded-t-lg bg-blue-600 transition" style={{ height: `${height}%` }} /><span className="text-[10px] text-slate-400">{formatDate(item.date)}</span></div>;
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
            <div className="flex items-center gap-2"><BarChart3 size={18} className="text-blue-700" /><h2 className="text-lg font-semibold text-slate-950">Where your intelligence comes from</h2></div>
            <p className="mt-1 text-sm text-slate-500">Distribution of saved analyses by workflow</p>
            {data.findingMix.length ? <div className="mt-7 space-y-4">{data.findingMix.slice(0, 7).map((item) => <div key={item.label}><div className="mb-1.5 flex justify-between gap-3 text-sm"><span className="truncate font-medium text-slate-700">{item.label}</span><span className="font-semibold text-slate-900">{item.value}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${(item.value / maxMix) * 100}%` }} /></div></div>)}</div> : <EmptyState title="No saved analyses yet" body="Run an analysis to start building your personal intelligence history." href="/dashboard/clinical-intelligence" />}
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5"><div><h2 className="text-lg font-semibold text-slate-950">Actionable insights</h2><p className="mt-1 text-sm text-slate-500">TrialIQ's interpretation of the saved evidence</p></div><CheckCircle2 size={19} className="text-blue-600" /></div>
            <div className="divide-y divide-slate-100">{data.insights.map((insight, index) => <div key={`${insight.title}-${index}`} className="flex gap-4 p-5 md:p-6"><div className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${insight.tone === "critical" ? "bg-red-500" : insight.tone === "warning" ? "bg-amber-500" : "bg-blue-500"}`} /><div><p className="font-semibold text-slate-900">{insight.title}</p><p className="mt-1 text-sm leading-6 text-slate-600">{insight.body}</p></div></div>)}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2"><Clock3 size={18} className="text-blue-700" /><h2 className="text-lg font-semibold text-slate-950">Review pressure</h2></div>
            <p className="mt-1 text-sm text-slate-500">How much saved intelligence still needs a decision</p>
            <div className="mt-7 flex items-center gap-5"><div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(#2563eb ${overview.findings ? (overview.unresolved / overview.findings) * 100 : 0}%, #e2e8f0 0)` }}><div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-2xl font-semibold text-slate-950">{overview.findings ? Math.round((overview.unresolved / overview.findings) * 100) : 0}%</div></div><div><p className="text-2xl font-semibold text-slate-950">{overview.unresolved}</p><p className="text-sm text-slate-500">open findings</p></div></div>
            <Link href="/dashboard/review-queue" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800">Open review queue <ArrowRight size={15} /></Link>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5"><div><h2 className="text-lg font-semibold text-slate-950">Latest findings</h2><p className="mt-1 text-sm text-slate-500">Persistent intelligence from your recent work</p></div><Link href="/dashboard/review-queue" className="text-sm font-semibold text-blue-700">View all</Link></div>
            {data.recentFindings.length ? <div className="divide-y divide-slate-100">{data.recentFindings.map((item) => <div key={item.id} className="flex gap-4 p-5"><div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-semibold uppercase tracking-wide text-blue-700">{item.type}</span><span className="text-xs text-slate-400">{formatDate(item.createdAt)}</span></div><p className="mt-1 font-semibold text-slate-900">{item.title}</p><p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{item.summary || "No summary available."}</p></div>{item.confidence != null && <div className="shrink-0 text-right"><p className="text-sm font-semibold text-slate-900">{Math.round(Number(item.confidence))}%</p><p className="text-[11px] text-slate-400">confidence</p></div>}</div>)}</div> : <EmptyState title="Your findings history is empty" body="Once analyses are persisted, this becomes your longitudinal record." href="/dashboard/clinical-intelligence" />}
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-2"><FileText size={18} className="text-blue-700" /><h2 className="text-lg font-semibold text-slate-950">Workspace sources</h2></div><div className="mt-5 space-y-3">{data.recentDocuments.length ? data.recentDocuments.map((doc) => <div key={doc.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3.5"><p className="truncate text-sm font-medium text-slate-800">{doc.name}</p><p className="mt-1 text-xs text-slate-500">{doc.document_type || "Clinical document"} · {doc.processing_status || "ready"}</p></div>) : <p className="text-sm text-slate-500">No source documents saved yet.</p>}</div></div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6"><p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Product opportunity</p><h2 className="mt-2 text-lg font-semibold text-slate-950">Move from analysis to memory</h2><p className="mt-2 text-sm leading-6 text-slate-700">Unlike a report-only workflow, TrialIQ can accumulate findings across modules and surface recurring risks, unresolved evidence and longitudinal patterns.</p><Link href="/dashboard/clinical-intelligence" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">Open Clinical Intelligence <ArrowRight size={15} /></Link></div>
          </div>
        </section>
      </div>
    </main>
  );
}

function InsightMetric({ icon: Icon, label, value, detail, danger = false }: { icon: typeof Activity; label: string; value: string | number; detail: string; danger?: boolean }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${danger ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-700"}`}><Icon size={19} /></div><span className="text-xs font-medium text-slate-400">workspace</span></div><p className="mt-5 text-sm text-slate-500">{label}</p><p className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">{value}</p><p className={`mt-2 text-xs font-medium ${danger ? "text-red-600" : "text-slate-500"}`}>{detail}</p></div>;
}

function EmptyState({ title, body, href }: { title: string; body: string; href: string }) {
  return <div className="p-8"><p className="font-semibold text-slate-900">{title}</p><p className="mt-1 text-sm leading-6 text-slate-500">{body}</p><Link href={href} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">Get started <ArrowRight size={15} /></Link></div>;
}
