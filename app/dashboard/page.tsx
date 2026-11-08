"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

type Action = { id: string; priority: string; type: string; title: string; summary: string | null; createdAt: string; participantCode: string | null };
type Finding = { id: string; type: string; title: string; summary: string | null; participantCode: string | null; status: string; createdAt: string };
type Data = {
  study: { name?: string };
  overview: { findings: number; unresolved: number; critical: number; participants: number; documents: number };
  actions: Action[];
  recentFindings: Finding[];
};

function ago(v: string) {
  const m = Math.round((Date.now() - new Date(v).getTime()) / 60000);
  if (m < 60) return `${Math.max(1, m)} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function hrefFor(code: string | null) {
  return code ? `/dashboard/participants/${encodeURIComponent(code)}` : "/dashboard/review-queue";
}

export default function TodayPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/dashboard", { cache: "no-store" })
      .then(async (r) => { const x = await r.json(); if (!r.ok || !x.success) throw new Error(x.message); setData(x.data); })
      .catch((e) => setError(e.message || "Today could not load."));
  }, []);

  if (error) return <Shell><p className="text-sm text-no">{error}</p></Shell>;
  if (!data) return <Shell><p className="flex items-center gap-2 text-sm text-ink-2"><Loader2 size={16} className="animate-spin" />Loading today</p></Shell>;

  const o = data.overview;
  const decisions = data.actions.slice(0, 6);
  const changes = data.recentFindings.slice(0, 6);

  return (
    <Shell>
      <header className="border-b border-line pb-6">
        <h1 className="text-[28px] font-semibold tracking-[-0.015em] text-ink">Today</h1>
        <p className="mt-2 text-sm text-ink-2">
          {o.unresolved ? `${o.unresolved} items need a decision` : "Nothing is waiting for a decision"}
          {o.critical ? `, ${o.critical} of them high priority` : ""}. {o.participants} participants and {o.documents} source documents in {data.study?.name || "this study"}.
        </p>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-ink">Needs your decision</h2>
            {o.unresolved > decisions.length && <Link href="/dashboard/review-queue" className="text-sm font-medium text-primary hover:underline">All {o.unresolved}</Link>}
          </div>
          {decisions.length ? (
            <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
              {decisions.map((a) => (
                <li key={a.id}>
                  <Link href={hrefFor(a.participantCode)} className="group flex items-start gap-3 px-4 py-3.5 hover:bg-surface">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${a.priority === "HIGH" ? "bg-no" : "bg-rev"}`} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink">{a.title}</span>
                      <span className="mt-0.5 block text-xs text-ink-3">{a.type}{a.participantCode ? ` for ${a.participantCode}` : ""}, {ago(a.createdAt)}</span>
                    </span>
                    <ArrowRight size={16} className="mt-1 shrink-0 text-ink-3 group-hover:text-primary" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty text="No open items. Run an eligibility check to start." href="/dashboard/participants" cta="Open participants" />
          )}
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink">What changed</h2>
          {changes.length ? (
            <ol className="mt-3 space-y-4 border-l border-line pl-4">
              {changes.map((f) => (
                <li key={f.id}>
                  <p className="text-xs text-ink-3">{ago(f.createdAt)}, {f.type}</p>
                  <Link href={hrefFor(f.participantCode)} className="mt-0.5 block text-sm text-ink hover:text-primary">{f.title}</Link>
                  {f.summary && <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-ink-2">{f.summary}</p>}
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm text-ink-2">TrialIQ saves every run here so you can see what changed since your last visit.</p>
          )}
        </section>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen bg-white"><div className="mx-auto max-w-[1120px] px-6 py-8 md:px-10">{children}</div></main>;
}
function Empty({ text, href, cta }: { text: string; href: string; cta: string }) {
  return <div className="mt-3 rounded-lg border border-dashed border-line px-4 py-6 text-sm text-ink-2">{text} <Link href={href} className="font-medium text-primary hover:underline">{cta}</Link></div>;
}
