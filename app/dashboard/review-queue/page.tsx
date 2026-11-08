"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AiBox, Button, Card, Empty, Field, Loading, Notice, Page, PageHeader, Row, StatusPill, Tabs, Textarea, ago } from "@/components/ds";

type Item = { id: string; priority: string; type: string; title: string; summary: string | null; createdAt: string; participantCode: string | null };

export default function ReviewPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");
  const [filter, setFilter] = useState<"all" | "high">("all");

  useEffect(() => {
    fetch("/api/dashboard", { cache: "no-store" })
      .then((r) => r.json())
      .then((x) => { if (x.success) { setItems(x.data.actions || []); setSelected(x.data.actions?.[0]?.id || ""); } })
      .finally(() => setLoading(false));
  }, []);

  const list = useMemo(() => items.filter((x) => filter === "all" || x.priority === "HIGH"), [items, filter]);
  const item = items.find((x) => x.id === selected);
  const high = items.filter((x) => x.priority === "HIGH").length;
  const ready = reason.trim().length >= 5;

  async function decide(action: "resolve" | "dismiss") {
    if (!item || !ready) return;
    setBusy(true);
    const r = await fetch(`/api/findings/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, note: reason.trim() }) });
    setBusy(false);
    if (!r.ok) { setDone("Could not save. Try again."); return; }
    const rest = items.filter((x) => x.id !== item.id);
    setItems(rest); setSelected(rest[0]?.id || ""); setReason("");
    setDone(`${action === "resolve" ? "Confirmed" : "Dismissed"} and logged with your reason.`);
  }

  return (
    <Page>
      <div className="space-y-6">
        <PageHeader title="Review" lead="TrialIQ drafts findings. A person signs each one off, and the reason is saved to the audit trail." />
        {done && <Notice tone={done.startsWith("Could") ? "no" : "ok"}>{done}</Notice>}
        {loading ? <Loading label="Loading review" /> : items.length === 0 ? (
          <Empty title="Nothing is waiting for sign-off" body="Findings from every check arrive here. Run a check on a participant to see how sign-off works." />
        ) : (
          <>
            <Tabs label="Filter findings" value={filter} onChange={setFilter} items={[{ id: "all", label: "All", count: items.length }, { id: "high", label: "High priority", count: high }]} />
            <div className="flex flex-col items-start gap-6 lg:flex-row">
              <Card as="div" className="w-full min-w-0 flex-1 divide-y divide-line overflow-hidden">
                {list.map((x) => (
                  <Row key={x.id} title={x.title} detail={`${x.type}${x.participantCode ? ` for ${x.participantCode}` : ""}, ${ago(x.createdAt)}`} selected={x.id === selected}
                    onClick={() => { setSelected(x.id); setReason(""); setDone(""); }}
                    status={<StatusPill tone={x.priority === "HIGH" ? "no" : "rev"}>{x.priority === "HIGH" ? "High" : "Review"}</StatusPill>} />
                ))}
                {list.length === 0 && <p className="px-4 py-6 text-sm text-ink-2">No high priority findings.</p>}
              </Card>

              {item && (
                <Card as="aside" className="w-full shrink-0 space-y-5 p-6 lg:sticky lg:top-6 lg:w-[400px]" aria-label="Sign-off">
                  <div>
                    <div className="flex items-center gap-2"><StatusPill tone={item.priority === "HIGH" ? "no" : "rev"}>{item.priority === "HIGH" ? "High priority" : "To review"}</StatusPill><span className="text-xs text-ink-3">{item.type}</span></div>
                    <h2 className="mt-2 text-lg font-semibold leading-snug text-ink">{item.title}</h2>
                  </div>
                  {item.summary && <AiBox label="TrialIQ read">{item.summary}</AiBox>}
                  {item.participantCode && <Link href={`/dashboard/participants/${encodeURIComponent(item.participantCode)}`} className="inline-block text-sm font-semibold text-primary hover:underline">Open {item.participantCode} evidence</Link>}
                  <div className="space-y-3 border-t border-line pt-4">
                    <Field label="Reason for your decision" htmlFor="reason" hint={ready ? undefined : "Required. At least a few words, so an auditor can follow the decision."}>
                      <Textarea id="reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="For example: checked against the source lab report, value confirmed." />
                    </Field>
                    <div className="grid grid-cols-[1fr_auto] gap-2.5">
                      <Button kind="primary" disabled={busy || !ready} onClick={() => decide("resolve")}>{busy ? "Saving" : "Confirm finding"}</Button>
                      <Button disabled={busy || !ready} onClick={() => decide("dismiss")}>Dismiss</Button>
                    </div>
                    <p className="text-xs text-ink-3">Saved with your name, the time and your reason.</p>
                  </div>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </Page>
  );
}
