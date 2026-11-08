"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, Loading, Page, PageHeader, Row, StatusPill, ago, toneFor } from "@/components/ds";

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
  return (
    <Page>
      <div className="space-y-6">
        <PageHeader title="Participants" lead="Everyone in screening or on study at your site, with what blocks their next decision." />
        {!items ? <Loading label="Loading participants" /> : (
          <Card as="div" className="divide-y divide-line overflow-hidden">
            {list.map((i) => (
              <Row key={i.code} id={i.code} href={`/dashboard/participants/${i.code}`} title={i.title} detail={`Last eligibility check ${ago(i.at)}`} status={<StatusPill tone={toneFor(i.title)}>{/not met/i.test(i.title) ? "Not eligible" : "In screening"}</StatusPill>} />
            ))}
            {!list.some((i) => i.code === "PT-1042") && (
              <Row id="PT-1042" href="/dashboard/participants/PT-1042" title="Synthetic demo participant" detail="Eligibility not checked yet" status={<StatusPill tone="neutral">Not checked</StatusPill>} />
            )}
          </Card>
        )}
      </div>
    </Page>
  );
}
