"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileText, Filter, Printer } from "lucide-react";

type Data = {
  study: { id: string; name: string };
  overview: { participants: number; critical: number; unresolved: number; findings: number };
  actions: any[];
};

export default function ReportsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [segment, setSegment] = useState("All");
  const [period, setPeriod] = useState("Current study");

  useEffect(() => {
    fetch("/api/dashboard", { cache: "no-store" }).then(r => r.json()).then(r => r.success && setData(r.data)).catch(() => {});
  }, []);

  const rows = useMemo(() => {
    if (!data) return [];
    const actions = data.actions || [];
    return segment === "All" ? actions : actions.filter((x: any) => x.type?.toLowerCase().includes(segment.toLowerCase()) || x.title?.toLowerCase().includes(segment.toLowerCase()));
  }, [data, segment]);

  function exportPdf() { window.print(); }
  if (!data) return <div className="p-10 text-sm text-muted-foreground">Loading reports…</div>;

  return (
    <main className="mx-auto max-w-7xl p-8 md:p-10">
      <style>{`@media print { body > * { visibility: hidden !important; } #trialiq-report, #trialiq-report * { visibility: visible !important; } #trialiq-report { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; max-width: none !important; margin: 0 !important; padding: 24px !important; } .report-controls { display:none !important; } }`}</style>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end report-controls">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Reporting</p><h1 className="mt-2 text-4xl font-bold tracking-tight">Reports</h1><p className="mt-2 max-w-3xl text-muted-foreground">Review persistent intelligence by segment and export a clean report for your team.</p></div>
        <button onClick={exportPdf} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"><Download size={16} />Export PDF</button>
      </div>

      <section id="trialiq-report" className="space-y-6">
        <header className="hidden print:block border-b pb-5"><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">TrialIQ AI · Clinical Intelligence Report</p><h1 className="mt-2 text-3xl font-bold">{data.study.name}</h1><p className="mt-1 text-sm text-slate-500">{data.study.id} · {period} · {segment} segment</p></header>
        <section className="rounded-2xl border bg-card p-5 shadow-sm print:rounded-none print:shadow-none">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-2"><Filter size={17} className="text-blue-700" /><span className="text-sm font-semibold">Report filters</span></div><div className="flex flex-wrap gap-3 report-controls"><select value={period} onChange={e => setPeriod(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm"><option>Current study</option><option>Last 30 days</option><option>Last 90 days</option></select><select value={segment} onChange={e => setSegment(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm"><option>All</option><option>Safety</option><option>Protocol</option><option>Data</option><option>Medication</option></select></div></div>
          <div className="mt-6 grid gap-3 sm:grid-cols-4"><Metric label="Participants" value={data.overview.participants} /><Metric label="Saved findings" value={data.overview.findings} /><Metric label="High-risk" value={data.overview.critical} /><Metric label="Open review" value={data.overview.unresolved} /></div>
        </section>
        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm print:rounded-none print:shadow-none"><div className="border-b px-5 py-4"><div className="flex items-center gap-2"><FileText size={18} className="text-blue-700" /><h2 className="font-bold">Action report</h2></div><p className="mt-1 text-xs text-muted-foreground">{period} · {segment} · {data.study.name}</p></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="px-5 py-3">Priority</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Finding</th><th className="px-5 py-3">Participant</th><th className="px-5 py-3">Time</th></tr></thead><tbody>{rows.length ? rows.map((r: any) => <tr key={r.id} className="border-t"><td className="px-5 py-3 font-semibold">{r.priority}</td><td className="px-5 py-3">{r.type}</td><td className="px-5 py-3 font-medium">{r.title}</td><td className="px-5 py-3 text-muted-foreground">{r.participant}</td><td className="px-5 py-3 text-muted-foreground">{r.time}</td></tr>) : <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">No records match this segment.</td></tr>}</tbody></table></div></section>
        <footer className="hidden print:flex items-center justify-between border-t pt-4 text-xs text-slate-400"><span>Generated by TrialIQ AI</span><span>{new Date().toLocaleDateString()}</span></footer>
      </section>
      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground report-controls"><Printer size={14} />Export includes only the report region. Choose “Save as PDF” in the print dialog.</div>
    </main>
  );
}
function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>; }
