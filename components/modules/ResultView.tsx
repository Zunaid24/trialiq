"use client";

// Renders any TrialIQ module result with the same design system pieces, so every check reads the same way:
// what TrialIQ concluded, what needs a person, and the evidence behind each line.
import { useState, type ReactNode } from "react";
import { AiBox, AiStatus, Card, KeyValues, SectionTitle, StatusPill, toneFor, cx } from "@/components/ds";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };
type Obj = { [k: string]: Json };

const HIDDEN = new Set(["audit", "aiModel", "aiFallbackUsed", "metadata", "runId", "quality", "evidenceGraph", "reviewPressure", "patientId", "participantId", "studyTitle", "assessmentConfidence"]);
const SUMMARY_KEYS = ["executiveSummary", "summary", "eventSummary", "overallAssessment", "overallImpact"];
const HEADLINE_KEYS = ["executiveDecision", "screeningResult", "overallSafetyStatus", "reviewStatus", "decisionReadiness", "screeningReadiness"];
const META_KEYS = new Set(["confidence", "confidenceRationale", "evidenceQuality", "limitations", "evidenceCompleteness", ...SUMMARY_KEYS, ...HEADLINE_KEYS]);
const TITLE_FIELDS = ["criterion", "name", "test", "medication", "event", "title", "verbatimTerm", "term", "issue", "concern", "factor", "item", "finding", "signal", "deviation", "gap", "action", "category", "visit", "requirement", "assessment", "gap", "evidenceNeeded", "missing"];
const STATUS_FIELDS = ["status", "severity", "priority", "interpretation", "classification", "result"];
const QUOTE_FIELDS = ["evidence"];
const SOURCE_FIELDS = ["sourceReference", "source", "sources", "sourceIds", "relatedSource"];

export function humanize(key: string) {
  const s = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").trim().toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/\b(ae|pi|ecog|anc|meddra|crf|id)\b/gi, (m) => m.toUpperCase());
}
const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);
const isEmpty = (v: Json | undefined): boolean => v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0) || (isObj(v) && Object.values(v).every((x) => isEmpty(x)));
const text = (v: Json): string => (Array.isArray(v) ? v.map(text).filter(Boolean).join(", ") : isObj(v) ? Object.values(v).map(text).filter(Boolean).join(", ") : v === true ? "Yes" : v === false ? "No" : String(v ?? ""));

export function pct(v: unknown): number | null {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.round(n <= 1 ? n * 100 : n);
}

export function summaryOf(r: Obj): string | null {
  for (const k of SUMMARY_KEYS) if (typeof r[k] === "string" && r[k]) return r[k] as string;
  return null;
}
export function headlineOf(r: Obj): string | null {
  for (const k of HEADLINE_KEYS) if (typeof r[k] === "string" && r[k]) return r[k] as string;
  return null;
}

function Item({ o }: { o: Obj }) {
  const titleKey = TITLE_FIELDS.find((k) => typeof o[k] === "string" && o[k]);
  const statusKey = STATUS_FIELDS.find((k) => typeof o[k] === "string" && o[k] && (o[k] as string).length < 40);
  const quote = QUOTE_FIELDS.map((k) => o[k]).find((v) => typeof v === "string" && v) as string | undefined;
  const src = SOURCE_FIELDS.map((k) => o[k]).find((v) => !isEmpty(v));
  const rest = Object.entries(o).filter(([k, v]) => k !== titleKey && k !== statusKey && !QUOTE_FIELDS.includes(k) && !SOURCE_FIELDS.includes(k) && k !== "reviewRequired" && !isEmpty(v));
  const title = titleKey ? String(o[titleKey]) : rest[0] ? text(rest[0][1]) : "Item";
  const shown = titleKey ? rest : rest.slice(1);
  return (
    <li className="px-4 py-3.5">
      <div className="flex items-start gap-3">
        <p className="min-w-0 flex-1 text-sm font-semibold text-ink">{title}</p>
        {statusKey && <StatusPill tone={toneFor(o[statusKey])}>{String(o[statusKey])}</StatusPill>}
        {o.reviewRequired === true && !statusKey && <StatusPill tone="rev">Needs review</StatusPill>}
      </div>
      {shown.length > 0 && (
        <dl className="mt-1.5 grid gap-x-6 gap-y-1 text-[13px] sm:grid-cols-2">
          {shown.map(([k, v]) => (
            <div key={k} className={cx("min-w-0", text(v).length > 60 && "sm:col-span-2")}>
              <dt className="inline text-ink-3">{humanize(k)}: </dt>
              <dd className="inline text-ink-2">{text(v)}</dd>
            </div>
          ))}
        </dl>
      )}
      {quote && <p className="mt-2 border-l-2 border-soft pl-3 text-[13px] leading-5 text-ink-2">“{quote}”</p>}
      {src !== undefined && <p className="mt-1 text-xs text-ink-3">Source: {text(src as Json)}</p>}
    </li>
  );
}

function Block({ k, v, depth = 0 }: { k: string; v: Json; depth?: number }): ReactNode {
  if (isEmpty(v)) return null;
  if (Array.isArray(v)) {
    const objs = v.filter(isObj) as Obj[];
    if (objs.length) {
      const flagged = objs.filter((o) => toneFor(STATUS_FIELDS.map((f) => o[f]).find((x) => typeof x === "string")) !== "ok").length;
      return (
        <section>
          <SectionTitle title={humanize(k)} count={objs.length} action={flagged && flagged !== objs.length ? <span className="text-xs text-ink-3">{flagged} need attention</span> : undefined} />
          <Card as="div" className="overflow-hidden"><ul className="divide-y divide-line">{objs.map((o, i) => <Item key={i} o={o} />)}</ul></Card>
        </section>
      );
    }
    return (
      <section>
        <SectionTitle title={humanize(k)} count={v.length} />
        <Card as="div" className="px-4 py-3">
          <ul className="list-disc space-y-1.5 pl-4 text-[13px] leading-6 text-ink marker:text-ink-3">{v.map((x, i) => <li key={i}>{text(x)}</li>)}</ul>
        </Card>
      </section>
    );
  }
  if (isObj(v)) {
    const scalars = Object.entries(v).filter(([, x]) => !isObj(x) && !(Array.isArray(x) && x.some(isObj)) && !isEmpty(x));
    const nested = Object.entries(v).filter(([, x]) => (isObj(x) || (Array.isArray(x) && x.some(isObj))) && !isEmpty(x));
    return (
      <section className="space-y-4">
        {depth === 0 && <SectionTitle title={humanize(k)} />}
        {scalars.length > 0 && <Card as="div" className="p-4"><KeyValues items={scalars.map(([kk, x]) => ({ k: humanize(kk), v: text(x) }))} /></Card>}
        {nested.map(([kk, x]) => <Block key={kk} k={depth === 0 ? `${humanize(k)}: ${humanize(kk)}` : kk} v={x} depth={depth + 1} />)}
      </section>
    );
  }
  return null;
}

export default function ResultView({ result, savedAt }: { result: Obj; savedAt?: string | null }) {
  const [open, setOpen] = useState(false);
  const summary = summaryOf(result);
  const headline = headlineOf(result);
  const confidence = pct(result.confidence);
  const sources = Array.isArray((result.audit as Obj | undefined)?.sourceReferences) ? ((result.audit as Obj).sourceReferences as Json[]).length : null;
  const scalars = Object.entries(result).filter(([k, v]) => !HIDDEN.has(k) && !META_KEYS.has(k) && !isObj(v) && !Array.isArray(v) && !isEmpty(v));
  const blocks = Object.entries(result).filter(([k, v]) => !HIDDEN.has(k) && !META_KEYS.has(k) && (isObj(v) || Array.isArray(v)) && !isEmpty(v));
  const limitations = Array.isArray(result.limitations) ? (result.limitations as Json[]).map(text).filter(Boolean) : [];

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-5">
        {headline && <div className="flex flex-wrap items-center gap-2"><StatusPill tone={toneFor(headline)}>{headline}</StatusPill>{typeof result.decisionReadiness === "string" && result.decisionReadiness !== headline && <StatusPill tone={toneFor(result.decisionReadiness)}>{String(result.decisionReadiness)}</StatusPill>}</div>}
        {summary && <AiBox label="TrialIQ read">{summary}</AiBox>}
        <AiStatus tone={confidence !== null && confidence < 70 ? "rev" : "ok"}
          action={(limitations.length > 0 || typeof result.confidenceRationale === "string") ? <button type="button" onClick={() => setOpen((o) => !o)} className="font-semibold text-primary hover:underline" aria-expanded={open}>{open ? "Hide how this was checked" : "How this was checked"}</button> : undefined}>
          {[
            confidence !== null ? `Evidence completeness ${confidence}%` : null,
            typeof result.evidenceQuality === "string" ? `${result.evidenceQuality} evidence quality` : null,
            sources ? `${sources} source references` : null,
            savedAt ? `saved ${savedAt}` : null,
          ].filter(Boolean).join(", ") || "Checked by TrialIQ"}
        </AiStatus>
        {open && (
          <div className="space-y-2 border-t border-line pt-3 text-[13px] leading-6 text-ink-2">
            {typeof result.confidenceRationale === "string" && <p>{result.confidenceRationale}</p>}
            {limitations.length > 0 && <ul className="list-disc pl-4">{limitations.map((l, i) => <li key={i}>{l}</li>)}</ul>}
            <p className="text-xs text-ink-3">TrialIQ drafts. A qualified person confirms every finding before it is used.</p>
          </div>
        )}
        {scalars.length > 0 && <div className="border-t border-line pt-4"><KeyValues items={scalars.map(([k, v]) => ({ k: humanize(k), v: text(v) }))} /></div>}
      </Card>
      {blocks.map(([k, v]) => <Block key={k} k={k} v={v} />)}
    </div>
  );
}
