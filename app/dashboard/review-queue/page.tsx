"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

type Item = { id: string; priority: string; type: string; title: string; summary: string | null; createdAt: string; participantCode: string | null };

export default function ReviewPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string>("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string>("");
  const [filter, setFilter] = useState<"ALL" | "HIGH">("ALL");

  useEffect(() => {
    fetch("/api/dashboard", { cache: "no-store" })
      .then((r) => r.json())
      .then((x) => { if (x.success) { setItems(x.data.actions || []); setSelected(x.data.actions?.[0]?.id || ""); } })
      .finally(() => setLoading(false));
  }, []);

  const list = useMemo(() => items.filter((x) => filter === "ALL" || x.priority === "HIGH"), [items, filter]);
  const item = items.find((x) => x.id === selected);
  const high = items.filter((x) => x.priority === "HIGH").length;

  async function decide(action: "resolve" | "dismiss") {
    if (!item || reason.trim().length < 5) return;
    setBusy(true);
    const r = await fetch(`/api/findings/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, note: reason.trim() }) });
    setBusy(false);
    if (!r.ok) { setDone("Could not save. Try again."); return; }
    const rest = items.filter((x) => x.id !== item.id);
    setItems(rest);
    setSelected(rest[0]?.id || "");
    setReason("");
    setDone(`${action === "resolve" ? "Confirmed" : "Dismissed"} and logged with your reason.`);
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-white text-sm text-ink-2"><Loader2 size={16} className="mr-2 animate-spin" />Loading review</main>;

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1180px] px-6 py-8 md:px-10">
        <header className="border-b border-line pb-6">
          <h1 className="text-[28px] font-semibold tracking-[-0.015em] text-ink">Review</h1>
          <p className="mt-2 text-sm text-ink-2">TrialIQ drafts findings. A person signs each one off, and the reason goes into the audit trail.</p>
        </header>

        {items.length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed border-line px-5 py-10 text-center text-sm text-ink-2">
            {done && <p className="mb-2 text-ok">{done}</p>}
            Nothing is waiting for sign off.
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_400px]">
            <section>
              <div className="flex gap-1 text-sm" role="tablist">
                {(["ALL", "HIGH"] as const).map((f) => (
                  <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
                    className={`rounded-md px-3 py-1.5 ${filter === f ? "bg-tint font-medium text-primary" : "text-ink-2 hover:text-ink"}`}>
                    {f === "ALL" ? `All ${items.length}` : `High priority ${high}`}
                  </button>
                ))}
              </div>
              <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
                {list.map((x) => (
                  <li key={x.id}>
                    <button onClick={() => { setSelected(x.id); setReason(""); setDone(""); }}
                      className={`flex w-full items-start gap-3 px-4 py-3.5 text-left ${x.id === selected ? "bg-tint" : "hover:bg-surface"}`}>
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${x.priority === "HIGH" ? "bg-no" : "bg-rev"}`} aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-ink">{x.title}</span>
                        <span className="mt-0.5 block text-xs text-ink-3">{x.type}{x.participantCode ? ` for ${x.participantCode}` : ""}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            {item && (
              <aside className="h-fit rounded-lg border border-line p-5 lg:sticky lg:top-20">
                <p className="text-xs text-ink-3">{item.type}{item.priority === "HIGH" ? ", high priority" : ""}</p>
                <h2 className="mt-1 text-lg font-semibold text-ink">{item.title}</h2>
                {item.summary && <p className="mt-3 text-sm leading-6 text-ink-2">{item.summary}</p>}
                {item.participantCode && (
                  <Link href={`/dashboard/participants/${encodeURIComponent(item.participantCode)}`} className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
                    Open {item.participantCode} evidence
                  </Link>
                )}
                <label htmlFor="reason" className="mt-6 block text-sm font-medium text-ink">Reason for your decision</label>
                <textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
                  placeholder="For example: checked against source lab report, value confirmed."
                  className="mt-2 w-full rounded-md border border-line px-3 py-2 text-sm text-ink outline-none focus:border-primary" />
                <div className="mt-4 flex gap-2">
                  <button disabled={busy || reason.trim().length < 5} onClick={() => decide("resolve")}
                    className="h-10 flex-1 rounded-md bg-primary text-sm font-medium text-white hover:bg-[#121D35] disabled:opacity-40">
                    {busy ? "Saving" : "Confirm finding"}
                  </button>
                  <button disabled={busy || reason.trim().length < 5} onClick={() => decide("dismiss")}
                    className="h-10 rounded-md border border-line px-4 text-sm font-medium text-ink hover:bg-surface disabled:opacity-40">
                    Dismiss
                  </button>
                </div>
                <p className="mt-3 text-xs text-ink-3">{done || "A reason is required before you can sign off."}</p>
              </aside>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
