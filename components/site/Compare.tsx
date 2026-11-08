"use client";

// Before and after, one task at a time: the manual way on the left, the TrialIQ way on the right.
import { useState } from "react";
import { StatusPill, type Tone } from "@/components/ds";

type Task = { id: string; label: string; before: string[]; after: string; rows: { id: string; name: string; value: string; tone: Tone; pill: string }[] };

const TASKS: Task[] = [
  { id: "elig", label: "Eligibility", before: ["Open the protocol in one window and the chart in another", "Find each criterion, then hunt for the matching fact", "Write the result on a checklist by hand"],
    after: "Every criterion comes back sorted, with the exact line from the record beside it.",
    rows: [{ id: "I4", name: "Blood counts", value: "ANC 1.1, protocol asks for 1.5 or more", tone: "no", pill: "Not met" }, { id: "E3", name: "Prohibited medicines", value: "Prednisone 01 to 05 Aug, washout unclear", tone: "rev", pill: "Needs evidence" }] },
  { id: "labs", label: "Lab values", before: ["Copy each value and its range out of the report", "Compare them one by one in a spreadsheet", "Flag the odd ones for the investigator"],
    after: "Values outside the reference range are flagged with the report line they came from.",
    rows: [{ id: "L2", name: "Creatinine", value: "1.4 mg/dL, range up to 1.2", tone: "no", pill: "High" }, { id: "L5", name: "Platelets", value: "145, inside the range", tone: "ok", pill: "Normal" }] },
  { id: "meds", label: "Medications", before: ["Read the medication list line by line", "Check each one against the prohibited list", "Work out washout dates on a calendar"],
    after: "Prohibited medicines and open washout periods are flagged for the investigator.",
    rows: [{ id: "M1", name: "Prednisone 20 mg", value: "Steroid inside the 14 day washout", tone: "no", pill: "Prohibited" }, { id: "M3", name: "Metformin", value: "Allowed by the protocol", tone: "ok", pill: "Allowed" }] },
  { id: "ae", label: "Adverse events", before: ["Read the narrative notes for each event", "Fill the AE form field by field", "Chase the missing details days later"],
    after: "A draft entry is ready, and the fields that are still missing are called out.",
    rows: [{ id: "AE1", name: "Neutropenia", value: "Grade 3, onset 06 Aug", tone: "rev", pill: "Outcome missing" }] },
  { id: "recon", label: "Reconciliation", before: ["Line up dates across every record by hand", "Look for values that disagree", "Raise queries after the monitor finds them"],
    after: "Records that disagree are listed while there is still time to fix them.",
    rows: [{ id: "R1", name: "AE onset date", value: "06 Aug in the AE form, 07 Aug in the lab report", tone: "no", pill: "Conflict" }] },
];

export default function Compare() {
  const [id, setId] = useState(TASKS[0].id);
  const t = TASKS.find((x) => x.id === id)!;
  return (
    <div>
      <div role="tablist" aria-label="Choose a task" className="no-scrollbar flex gap-2 overflow-x-auto">
        {TASKS.map((x) => (
          <button key={x.id} role="tab" aria-selected={x.id === id} onClick={() => setId(x.id)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${x.id === id ? "border-ink bg-ink text-white" : "border-line bg-white text-ink-2 hover:border-line-strong hover:text-ink"}`}>
            {x.label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="relative rounded-2xl border border-line bg-[#F1F2F5] p-7">
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-3">By hand today</p>
          <ol className="mt-5 space-y-4">
            {t.before.map((b, i) => (
              <li key={b} className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line-strong bg-white font-mono text-xs text-ink-3">{i + 1}</span>
                <span className="pt-0.5 text-[15px] leading-6 text-ink-2">{b}</span>
              </li>
            ))}
          </ol>
          <div className="mt-7 flex gap-2" aria-hidden>
            {[0, 1, 2].map((i) => <div key={i} className="h-16 flex-1 rounded-md border border-line-strong bg-white p-2"><div className="h-1.5 w-3/4 rounded bg-line" /><div className="mt-1.5 h-1.5 w-1/2 rounded bg-line" /><div className="mt-1.5 h-1.5 w-2/3 rounded bg-line" /></div>)}
          </div>
          <p className="mt-2 text-xs text-ink-3">Repeated for every participant, at every visit.</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-white p-7 shadow-[0_30px_60px_-30px_rgba(47,102,208,0.45)]">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" aria-hidden />
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-primary">With TrialIQ</p>
          <p className="mt-5 text-xl font-semibold leading-snug tracking-[-0.01em] text-ink">{t.after}</p>
          <div className="mt-6 divide-y divide-line overflow-hidden rounded-xl border border-line">
            {t.rows.map((r) => (
              <div key={r.id} className="flex items-center gap-3 bg-white px-4 py-3">
                <span className="w-8 font-mono text-xs text-ink-3">{r.id}</span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-ink">{r.name}</span><span className="block truncate text-xs text-ink-2">{r.value}</span></span>
                <StatusPill tone={r.tone}>{r.pill}</StatusPill>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-3">Drafted by AI. Confirmed by a person before it counts.</p>
        </div>
      </div>
    </div>
  );
}
