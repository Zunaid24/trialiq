"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, ArrowUpRight, CheckCircle2, ShieldAlert, TrendingUp } from "lucide-react";

type Dashboard = { kpis: { totalParticipants:number; activeParticipants:number; protocolDeviations:number; safetySignals:number; adverseEvents:number; dataQualityIssues:number; labIssues:number; medicationConcerns:number }; health:{ participantRetention:number; visitCompliance:number; dataCompleteness:number; protocolCompliance:number } };

export default function AnalyticsPage() {
  const [data,setData]=useState<Dashboard|null>(null);
  useEffect(()=>{ fetch("/api/dashboard",{cache:"no-store"}).then(r=>r.json()).then(r=>r.success&&setData(r.data)).catch(()=>{}); },[]);
  const insights=useMemo(()=>{ if(!data) return []; const h=data.health; return [
    {label:"Protocol compliance",value:`${h.protocolCompliance}%`,tone:h.protocolCompliance>=90?"Strong":"Needs attention",detail:h.protocolCompliance>=90?"Study execution is within a healthy compliance range.":"Prioritize deviation review and coordinator follow-up."},
    {label:"Data completeness",value:`${h.dataCompleteness}%`,tone:h.dataCompleteness>=90?"Strong":"Opportunity",detail:"Improving source completeness can reduce downstream reconciliation work."},
    {label:"Visit compliance",value:`${h.visitCompliance}%`,tone:h.visitCompliance>=90?"Strong":"Opportunity",detail:"Monitor missed or late visits before they become protocol deviations."},
  ]; },[data]);
  if(!data) return <div className="p-10 text-sm text-muted-foreground">Loading analytics…</div>;
  const risk=Math.min(100,data.kpis.protocolDeviations*4+data.kpis.safetySignals*8+data.kpis.adverseEvents*3+data.kpis.dataQualityIssues*2);
  const bars=[{label:"Protocol deviations",value:data.kpis.protocolDeviations},{label:"Safety signals",value:data.kpis.safetySignals},{label:"Adverse events",value:data.kpis.adverseEvents},{label:"Data quality issues",value:data.kpis.dataQualityIssues},{label:"Lab issues",value:data.kpis.labIssues},{label:"Medication concerns",value:data.kpis.medicationConcerns}];
  return <main className="mx-auto max-w-7xl p-8 md:p-10">
    <div className="mb-8"><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Intelligence</p><h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground">Analytics</h1><p className="mt-2 max-w-3xl text-muted-foreground">Meaningful study insights, operational trends and risk signals to help your team decide where to focus next.</p></div>
    <div className="grid gap-4 md:grid-cols-3">
      {insights.map(i=><div key={i.label} className="rounded-2xl border bg-card p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm font-medium text-muted-foreground">{i.label}</span><CheckCircle2 size={18} className="text-blue-700"/></div><div className="mt-4 flex items-end gap-3"><span className="text-3xl font-bold">{i.value}</span><span className="mb-1 text-xs font-semibold text-blue-700">{i.tone}</span></div><p className="mt-3 text-sm leading-6 text-muted-foreground">{i.detail}</p></div>)}
    </div>
    <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_.6fr]">
      <section className="rounded-2xl border bg-card p-6 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Operational risk signals</h2><p className="mt-1 text-sm text-muted-foreground">Current workload by issue category</p></div><Activity size={20} className="text-blue-700"/></div><div className="mt-7 space-y-5">{bars.map(b=>{const max=Math.max(1,...bars.map(x=>x.value));return <div key={b.label}><div className="mb-2 flex justify-between text-sm"><span className="font-medium">{b.label}</span><span className="font-semibold">{b.value}</span></div><div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-blue-700" style={{width:`${Math.max(4,b.value/max*100)}%`}}/></div></div>})}</div></section>
      <section className="rounded-2xl border bg-card p-6 shadow-sm"><div className="flex items-center gap-2"><ShieldAlert size={20} className="text-blue-700"/><h2 className="text-xl font-bold">Study risk index</h2></div><div className="mt-7 flex items-end gap-3"><span className="text-5xl font-bold">{risk}</span><span className="mb-2 text-sm text-muted-foreground">/ 100</span></div><p className="mt-3 text-sm leading-6 text-muted-foreground">A directional workload indicator based on active safety, deviation, event and data-quality signals.</p><div className="mt-6 rounded-xl bg-blue-50 p-4"><div className="flex gap-3"><TrendingUp size={18} className="mt-0.5 text-blue-700"/><div><p className="text-sm font-semibold text-blue-900">Recommended focus</p><p className="mt-1 text-xs leading-5 text-blue-800">Review the highest-priority findings first, then improve data completeness to reduce repeat work.</p></div></div></div></section>
    </div>
    <section className="mt-6 rounded-2xl border bg-card p-6 shadow-sm"><div className="flex items-center gap-2"><ArrowUpRight size={19} className="text-blue-700"/><h2 className="text-xl font-bold">Improvement opportunities</h2></div><div className="mt-5 grid gap-3 md:grid-cols-3"><div className="rounded-xl border p-4"><p className="font-semibold">Reduce review backlog</p><p className="mt-1 text-sm text-muted-foreground">Route high-priority safety and deviation findings into the review queue.</p></div><div className="rounded-xl border p-4"><p className="font-semibold">Improve source quality</p><p className="mt-1 text-sm text-muted-foreground">Target incomplete records before reconciliation becomes manual.</p></div><div className="rounded-xl border p-4"><p className="font-semibold">Protect visit compliance</p><p className="mt-1 text-sm text-muted-foreground">Watch upcoming visits and intervene before windows are missed.</p></div></div></section>
  </main>;
}
