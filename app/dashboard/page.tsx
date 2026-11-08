"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ButtonLink, Card, Empty, Loading, Notice, Page, PageHeader, Row, SectionTitle, StatusPill, ago } from "@/components/ds";

type Action = { id: string; priority: string; type: string; title: string; createdAt: string; participantCode: string | null };
type Finding = { id: string; type: string; title: string; summary: string | null; participantCode: string | null; createdAt: string };
type Data = { study: { name?: string }; overview: { unresolved: number; critical: number; participants: number; documents: number }; actions: Action[]; recentFindings: Finding[] };

const hrefFor = (code: string | null) => (code ? `/dashboard/participants/${encodeURIComponent(code)}` : "/dashboard/review-queue");

export default function TodayPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/dashboard", { cache: "no-store" })
      .then(async (r) => { const x = await r.json(); if (!r.ok || !x.success) throw new Error(x.message); setData(x.data); })
      .catch((e) => setError(e.message || "The worklist could not load."));
  }, []);

  if (error) return <Page><Notice>{error}</Notice></Page>;
  if (!data) return <Page><Loading label="Loading your worklist" /></Page>;

  const o = data.overview;
  const decisions = data.actions.slice(0, 6);
  const next = decisions[0];
  const hour = new Date().getHours();

  return (
    <Page>
      <div className="space-y-6">
        <PageHeader
          meta={<span>{new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</span>}
          title={hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"}
          lead={o.unresolved ? `${o.unresolved} ${o.unresolved === 1 ? "item needs" : "items need"} a decision${o.critical ? `, ${o.critical} of them high priority` : ""}. Start with the first one.` : "Nothing is waiting for a decision. Run a check on a participant to start."}
          actions={next ? <ButtonLink kind="primary" href={hrefFor(next.participantCode)}>Open next decision</ButtonLink> : <ButtonLink kind="primary" href="/dashboard/participants/PT-1042">Open demo participant</ButtonLink>}
        />

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section>
            <SectionTitle title="Needs your decision" count={o.unresolved} action={o.unresolved > decisions.length ? <Link href="/dashboard/review-queue" className="text-[13px] font-semibold text-primary hover:underline">See all</Link> : undefined} />
            {decisions.length ? (
              <Card as="div" className="divide-y divide-line overflow-hidden">
                {decisions.map((a) => (
                  <Row key={a.id} href={hrefFor(a.participantCode)} title={a.title} detail={`${a.type}${a.participantCode ? ` for ${a.participantCode}` : ""}, ${ago(a.createdAt)}`}
                    status={<StatusPill tone={a.priority === "HIGH" ? "no" : "rev"}>{a.priority === "HIGH" ? "High priority" : "To review"}</StatusPill>} />
                ))}
              </Card>
            ) : (
              <Empty title="All clear" body="When TrialIQ drafts a finding it lands here until someone signs it off." action={<ButtonLink href="/dashboard/workspace">See all checks</ButtonLink>} />
            )}
          </section>

          <section>
            <SectionTitle title="What changed" />
            <Card as="div" className="p-5">
              {data.recentFindings.length ? (
                <ol className="space-y-4 border-l border-line pl-4">
                  {data.recentFindings.slice(0, 6).map((f) => (
                    <li key={f.id} className="relative">
                      <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-soft ring-2 ring-white" aria-hidden />
                      <p className="text-xs text-ink-3">{ago(f.createdAt)}, {f.type}</p>
                      <Link href={hrefFor(f.participantCode)} className="mt-0.5 block text-sm font-medium text-ink hover:text-primary">{f.title}</Link>
                      {f.summary && <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-ink-2">{f.summary}</p>}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-ink-2">Every check you run is saved here, so you can see what changed since your last visit.</p>
              )}
            </Card>
            <p className="mt-3 text-xs text-ink-3">{o.participants} participants and {o.documents} source documents in {data.study?.name || "this workspace"}.</p>
          </section>
        </div>
      </div>
    </Page>
  );
}
