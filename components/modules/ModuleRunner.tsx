"use client";

// Runs any TrialIQ check the same way: pick the source documents, run, read the result, send it to review.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { extractPdfText } from "@/lib/extractPdfText";
import { moduleById, type ModuleInput } from "@/lib/modules";
import { AiStatus, Button, Card, Empty, Notice, PageHeader, SectionTitle, Spinner, StatusPill, ago } from "@/components/ds";
import ResultView from "./ResultView";

type Run = { result: Record<string, unknown>; savedAt: string | null; tookMs?: number; docs?: number };

export default function ModuleRunner({ id, embedded = false, participantCode = "PT-1042" }: { id: string; embedded?: boolean; participantCode?: string }) {
  const mod = moduleById(id);
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [run, setRun] = useState<Run | null>(null);
  const [loadingPrev, setLoadingPrev] = useState(true);
  const [step, setStep] = useState<string>("");
  const [error, setError] = useState("");
  const pickers = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!mod) return;
    let live = true;
    fetch(`/api/module-runs?module=${encodeURIComponent(mod.persistName)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((x) => { if (live && x?.run?.result) setRun({ result: x.run.result, savedAt: x.run.createdAt }); })
      .catch(() => {})
      .finally(() => live && setLoadingPrev(false));
    return () => { live = false; };
  }, [mod]);

  if (!mod) return <Empty title="This check does not exist" />;
  const m = mod;

  async function readInput(input: ModuleInput): Promise<{ text: string; name: string }> {
    const own = files[input.key];
    if (own) return { text: input.kind === "json" ? await own.text() : await extractPdfText(own), name: own.name };
    const res = await fetch(input.demo, { cache: "no-store" });
    if (!res.ok) throw new Error(`${input.label} demo record could not be loaded.`);
    if (input.kind === "json") return { text: await res.text(), name: input.demoName };
    const blob = await res.blob();
    return { text: await extractPdfText(new File([blob], input.demoName, { type: "application/pdf" })), name: input.demoName };
  }

  async function start() {
    setError("");
    const t0 = performance.now();
    try {
      setStep(`Reading ${m.inputs.length} document${m.inputs.length > 1 ? "s" : ""}`);
      const texts: Record<string, string> = {}; const names: Record<string, string> = {};
      for (const input of m.inputs) {
        const r = await readInput(input);
        if (!r.text.trim()) throw new Error(`${input.label} has no readable text. Upload a text-based PDF.`);
        texts[input.key] = r.text; names[input.key] = r.name;
      }
      setStep("Checking against the evidence");
      const res = await fetch(m.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(m.body(texts, names)) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success || !data?.result) throw new Error(data?.message || "The check could not finish. Try again in a minute.");
      if (!m.serverPersists) {
        setStep("Saving to the audit trail");
        await fetch("/api/module-runs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ module: m.persistName, participantCode: m.area === "participant" ? participantCode : null, title: `${m.title}${m.area === "participant" ? ` for ${participantCode}` : ""}: ready for review`, result: data.result }) }).catch(() => {});
      }
      setRun({ result: data.result, savedAt: new Date().toISOString(), tookMs: performance.now() - t0, docs: m.inputs.length });
    } catch (e) {
      setError(e instanceof Error ? e.message : "The check could not finish.");
    } finally {
      setStep("");
    }
  }

  const busy = Boolean(step);
  const action = <Button kind="primary" onClick={start} disabled={busy}>{busy ? "Running" : run ? "Run again" : "Run check"}</Button>;

  return (
    <div className="space-y-6">
      {embedded ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">{m.title}</h2>
            <p className="mt-0.5 text-sm text-ink-2">{m.job}</p>
          </div>
          {action}
        </div>
      ) : (
        <PageHeader meta={<span>{m.area === "participant" ? `Participant check, ${participantCode}` : m.area === "study" ? "Study check" : "Data quality check"}</span>} title={m.title} lead={m.job} actions={action}>
          <p className="text-[13px] leading-6 text-ink-2"><span className="font-medium text-ink">Takes off your plate:</span> {m.replaces} <span className="font-medium text-ink">Signed off by:</span> {m.signOff}.</p>
        </PageHeader>
      )}

      <section>
        <SectionTitle title="Source documents" count={m.inputs.length} />
        <Card as="div" className="divide-y divide-line">
          {m.inputs.map((input) => {
            const own = files[input.key];
            return (
              <div key={input.key} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{input.label}</p>
                  <p className="truncate text-[13px] text-ink-2">{own ? own.name : input.demoName}</p>
                </div>
                {!own && <StatusPill tone="neutral">Demo record</StatusPill>}
                <input ref={(el) => { pickers.current[input.key] = el; }} type="file" accept={input.kind === "json" ? "application/json,.json" : "application/pdf,.pdf"} className="sr-only" aria-label={`Upload ${input.label}`}
                  onChange={(e) => setFiles((f) => ({ ...f, [input.key]: e.target.files?.[0] ?? null }))} />
                <Button size="sm" onClick={() => pickers.current[input.key]?.click()} disabled={busy}>{own ? "Replace" : "Upload your own"}</Button>
                {own && <Button size="sm" kind="ghost" onClick={() => setFiles((f) => ({ ...f, [input.key]: null }))} disabled={busy}>Use demo</Button>}
              </div>
            );
          })}
        </Card>
        {embedded && <p className="mt-2 text-xs text-ink-3">Takes off your plate: {m.replaces} Signed off by {m.signOff}.</p>}
      </section>

      {busy && <Card as="div" className="p-5"><Spinner label={`${step}…`} /></Card>}
      {error && <Notice>{error}</Notice>}

      {!busy && run && (
        <>
          <AiStatus action={<Link href="/dashboard/review-queue" className="font-semibold text-primary hover:underline">Open review</Link>}>
            {run.tookMs ? `Done in ${Math.max(1, Math.round(run.tookMs / 1000))} s from ${run.docs} document${run.docs === 1 ? "" : "s"}. Saved for sign-off.` : `Last run ${run.savedAt ? ago(run.savedAt) : ""}. Saved for sign-off.`}
          </AiStatus>
          <ResultView result={run.result as never} savedAt={run.savedAt ? ago(run.savedAt) : null} />
        </>
      )}

      {!busy && !run && !loadingPrev && !error && (
        <Empty title="No result yet" body={`Run the check on the demo record, or upload your own ${m.inputs.map((i) => i.label.toLowerCase()).join(" and ")}. Nothing is decided until a person signs it off.`} action={action} />
      )}
      {!busy && !run && loadingPrev && <Card as="div" className="p-5"><Spinner label="Loading the last result" /></Card>}
    </div>
  );
}
