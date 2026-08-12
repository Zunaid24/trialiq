"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Filter,
  Loader2,
  Search,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";

type QueueItem = {
  id: string;
  priority: string;
  type: string;
  title: string;
  participant: string;
  time: string;
  href: string;
};

type DashboardResponse = {
  success: boolean;
  data?: {
    study: { id: string; name: string; status: string };
    actions: QueueItem[];
  };
  message?: string;
};

const priorityOptions = ["ALL", "HIGH", "MEDIUM"];

export default function ReviewQueuePage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [study, setStudy] = useState<DashboardResponse["data"] extends infer T ? T extends { study: infer S } ? S : never : never>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("ALL");

  useEffect(() => {
    async function loadQueue() {
      try {
        const response = await fetch("/api/dashboard", { cache: "no-store" });
        const result = (await response.json()) as DashboardResponse;
        if (!response.ok || !result.success || !result.data) {
          throw new Error(result.message || "Unable to load the review queue.");
        }
        setItems(result.data.actions ?? []);
        setStudy(result.data.study);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load the review queue.");
      } finally {
        setLoading(false);
      }
    }
    loadQueue();
  }, []);

  const filteredItems = useMemo(() => {
    const value = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesPriority = priority === "ALL" || item.priority === priority;
      const matchesQuery = !value || [item.title, item.participant, item.type, item.priority].some((field) => field.toLowerCase().includes(value));
      return matchesPriority && matchesQuery;
    });
  }, [items, priority, query]);

  const highPriority = items.filter((item) => item.priority === "HIGH").length;
  const mediumPriority = items.filter((item) => item.priority !== "HIGH").length;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 size={20} className="animate-spin" />
          Loading review queue…
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-8">
        <div className="max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
          <AlertCircle size={32} className="mx-auto text-red-500" />
          <h1 className="mt-4 text-xl font-bold text-foreground">Review queue unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Link href="/dashboard" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">
            Back to dashboard <ArrowRight size={15} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl p-8 md:p-10">
        <header className="mb-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand">
                <CheckCircle2 size={16} />
                Review Queue
              </div>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground">Needs your attention</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Prioritized clinical findings across {study?.id || "your active study"}. Review evidence, resolve findings, and move work forward.
              </p>
            </div>
            <div className="rounded-xl border bg-card px-4 py-3 shadow-sm">
              <p className="text-xs text-muted-foreground">Active study</p>
              <p className="mt-0.5 font-semibold text-foreground">{study?.id || "—"}</p>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <QueueStat label="Open reviews" value={items.length} icon={Clock3} />
          <QueueStat label="High priority" value={highPriority} icon={ShieldAlert} emphasis="high" />
          <QueueStat label="Standard priority" value={mediumPriority} icon={CheckCircle2} />
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="flex flex-col gap-4 border-b p-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search findings or participants…"
                className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-50"
                aria-label="Search review queue"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Filter size={14} /> Priority
              </div>
              {priorityOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setPriority(option)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${priority === option ? "bg-blue-50 text-blue-700" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
                >
                  {option === "ALL" ? "All" : option === "HIGH" ? "High" : "Standard"}
                </button>
              ))}
              <button className="ml-1 rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground" aria-label="More filters">
                <SlidersHorizontal size={15} />
              </button>
            </div>
          </div>

          {filteredItems.length > 0 ? (
            <div>
              {filteredItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group flex flex-col gap-4 border-b p-5 transition last:border-b-0 hover:bg-slate-50 md:flex-row md:items-center"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.priority === "HIGH" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-700"}`}>
                    {item.priority === "HIGH" ? <AlertCircle size={17} /> : <Clock3 size={17} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${item.priority === "HIGH" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}>
                        {item.priority}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-brand">{item.type}</span>
                    </div>
                    <p className="mt-1.5 font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.participant}</p>
                  </div>
                  <div className="flex items-center justify-between gap-5 md:justify-end">
                    <span className="text-xs text-muted-foreground">{item.time}</span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition group-hover:gap-2.5">
                      Review <ArrowRight size={15} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <CheckCircle2 size={34} className="mx-auto text-green-500" />
              <h2 className="mt-4 text-lg font-semibold text-foreground">Nothing matches these filters</h2>
              <p className="mt-1 text-sm text-muted-foreground">Try a different search or priority filter.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function QueueStat({ label, value, icon: Icon, emphasis }: { label: string; value: number; icon: typeof Clock3; emphasis?: "high" }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${emphasis === "high" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-700"}`}>
          <Icon size={19} />
        </div>
        <span className="text-3xl font-bold text-foreground">{value}</span>
      </div>
      <p className="mt-4 text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
