"use client";

// One criterion, read in three seconds: a plain verdict, the rule next to the record, and how far apart they are.
import { Check, CircleHelp, X } from "lucide-react";
import { compareCriterion, gapSentence, needText, prettyUnit, type Measure } from "@/lib/compareCriterion";
import { cx } from "@/components/ds";

type Group = "no" | "rev" | "ok";
const TONE = { no: "text-no", rev: "text-rev", ok: "text-ok" } as const;
const BG = { no: "bg-no-bg", rev: "bg-rev-bg", ok: "bg-ok-bg" } as const;

function Icon({ g, size = 14 }: { g: Group; size?: number }) {
  const I = g === "no" ? X : g === "ok" ? Check : CircleHelp;
  return <span className={cx("flex shrink-0 items-center justify-center rounded-full", BG[g], TONE[g])} style={{ width: size + 8, height: size + 8 }}><I size={size} strokeWidth={2.4} /></span>;
}
const groupOf = (m: Measure): Group => (m.ok === null ? "rev" : m.ok ? "ok" : "no");
const missing = (t?: string) => !t || /not documented|not found|missing|unknown|not available|not stated/i.test(t);

// A ruler showing the allowed zone, the protocol limit and where this participant sits.
function GapBar({ m }: { m: Measure }) {
  if (m.has === null) return null;
  const hi = Math.max(m.limit, m.has) * 1.3 || 1;
  const pos = (v: number) => `${Math.min(100, Math.max(0, (v / hi) * 100))}%`;
  const g = groupOf(m);
  const zone = m.dir === "min" ? { left: pos(m.limit), right: "0%" } : { left: "0%", right: `${100 - (m.limit / hi) * 100}%` };
  const from = Math.min(m.limit, m.has), to = Math.max(m.limit, m.has);
  return (
    <div className="pt-1">
      <div className="relative h-2 rounded-full bg-line">
        <div className="absolute inset-y-0 rounded-full bg-ok/25" style={zone} />
        {g === "no" && <div className="absolute inset-y-0 bg-no/35" style={{ left: pos(from), width: `calc(${pos(to)} - ${pos(from)})` }} />}
        <div className="absolute -top-1 h-4 w-0.5 rounded bg-ink-2" style={{ left: pos(m.limit) }} />
        <div className={cx("absolute -top-1 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-white shadow", g === "no" ? "bg-no" : "bg-ok")} style={{ left: pos(m.has) }} />
      </div>
      <div className="relative mt-2 h-4 text-[11px]">
        <span className="absolute -translate-x-1/2 whitespace-nowrap text-ink-3" style={{ left: pos(m.limit) }}>Limit {m.limit}</span>
      </div>
    </div>
  );
}

export default function CriterionDetail({ name, expected, actual, group, assessment }: { name: string; expected?: string; actual?: string; group: Group; assessment?: string }) {
  const measures = compareCriterion(expected, actual, name);
  const failing = measures.filter((m) => m.ok === false);
  const verdict = failing.length
    ? `${gapSentence(failing[0])}${failing.length > 1 ? ` ${failing.length - 1} more value${failing.length > 2 ? "s are" : " is"} out of range.` : ""}`
    : measures.length && measures.every((m) => m.ok)
      ? "Every value is inside the protocol limit."
      : missing(actual)
        ? "The record does not answer this yet."
        : group === "no" ? "The record does not meet this rule." : group === "ok" ? "The record meets this rule." : assessment || "This needs a person to read the source.";
  const tone: Group = failing.length ? "no" : measures.length && measures.every((m) => m.ok) ? "ok" : group;

  return (
    <div className="space-y-4">
      <p className="flex items-start gap-2.5 text-[15px] font-semibold leading-6 text-ink"><Icon g={tone} /><span>{verdict}</span></p>

      {measures.length ? (
        <div className="overflow-hidden rounded-xl border border-line">
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 bg-page px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">
            <span>Value</span><span className="w-20 text-right">Protocol</span><span className="w-20 text-right">Record</span>
          </div>
          {measures.map((m) => {
            const g = groupOf(m);
            return (
              <div key={m.label} className={cx("space-y-2 border-t border-line px-4 py-3", g === "no" && "bg-no-bg/40")}>
                <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4">
                  <span className="min-w-0 truncate text-sm font-medium text-ink">{m.label}</span>
                  <span className="w-20 text-right font-mono text-[13px] text-ink-2">{needText(m).replace(` ${m.unit}`, "")}</span>
                  <span className={cx("flex w-20 items-center justify-end gap-1.5 font-mono text-[13px] font-medium", TONE[g])}>{m.has ?? "None"}<Icon g={g} size={10} /></span>
                </div>
                {g === "no" && <GapBar m={m} />}
              </div>
            );
          })}
          {measures[0].unit && <p className="border-t border-line px-4 py-2 text-[11px] text-ink-3">Units as in the protocol: {Array.from(new Set(measures.map((m) => prettyUnit(m.unit)).filter(Boolean))).join(", ")}</p>}
        </div>
      ) : (
        <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-line">
          <div className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">Protocol needs</p>
            <p className="mt-1.5 text-sm leading-5 text-ink">{expected || "Not stated in the protocol"}</p>
          </div>
          <div className={cx("border-l border-line p-4", BG[group])}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">Record shows</p>
            <p className={cx("mt-1.5 text-sm font-medium leading-5", TONE[group])}>{missing(actual) ? "Nothing yet" : actual}</p>
          </div>
        </div>
      )}
    </div>
  );
}
