"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Item = { code: string; title: string; status: string; at: string };

export default function ParticipantsPage() {
  const [items, setItems] = useState<Item[] | null>(null);
  useEffect(() => {
    (async () => {
      const { data } = await createClient().from("findings").select("title,status,created_at,metadata").eq("analysis_type", "Eligibility Screening").order("created_at", { ascending: false }).limit(100);
      const seen = new Map<string, Item>();
      for (const r of data ?? []) { const code = r.metadata?.participantCode; if (code && !seen.has(code)) seen.set(code, { code, title: r.title, status: r.status, at: r.created_at }); }
      setItems([...seen.values()]);
    })();
  }, []);
  const list = items ?? [];
  const hasDemo = list.some((i) => i.code === "PT-1042");
  return (
    <div className="max-w-4xl px-9 pb-12 pt-8">
      <h1 className="text-[28px] font-semibold tracking-[-0.015em]">Participants</h1>
      <p className="mt-1 text-[15px] text-ink-2">Everyone in screening or on study at your site, with what blocks their next decision.</p>
      <ul className="mt-6">
        {list.map((i) => (
          <li key={i.code}><Link href={`/dashboard/participants/${i.code}`} className="grid grid-cols-[110px_1fr_auto] items-center gap-4 border-t border-line px-3 py-3.5 hover:bg-surface">
            <span className="font-mono text-[13px]">{i.code}</span><span className="truncate text-sm">{i.title}</span><span className="text-xs text-ink-3">{new Date(i.at).toLocaleDateString()}</span>
          </Link></li>
        ))}
        {items && !hasDemo && (
          <li><Link href="/dashboard/participants/PT-1042" className="grid grid-cols-[110px_1fr_auto] items-center gap-4 border-t border-line px-3 py-3.5 hover:bg-surface">
            <span className="font-mono text-[13px]">PT-1042</span><span className="text-sm text-ink-2">Demo participant, eligibility not checked yet</span><span className="text-xs text-ink-3">Demo</span>
          </Link></li>
        )}
      </ul>
      {!items && <p className="mt-6 text-sm text-ink-3">Loading…</p>}
    </div>
  );
}
