"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LayoutDashboard, ClipboardCheck, FileText, BarChart3, Settings, Bell, Search, LogOut, X, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const menu = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Clinical Workspace", href: "/dashboard/workspace", icon: ClipboardCheck },
  { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { title: "Reports", href: "/dashboard/reports", icon: FileText },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

const moduleResults = [
  { title: "Protocol Intelligence", type: "Workflow", href: "/dashboard/workspace/protocol" },
  { title: "Eligibility Screening", type: "Workflow", href: "/dashboard/workspace/eligibility" },
  { title: "Visit Assistant", type: "Workflow", href: "/dashboard/workspace/visit-assistant" },
  { title: "Source Review", type: "Workflow", href: "/dashboard/workspace/source-review" },
  { title: "Lab Intelligence", type: "Workflow", href: "/dashboard/workspace/lab-intelligence" },
  { title: "Medication Review", type: "Workflow", href: "/dashboard/workspace/medications" },
  { title: "Protocol Deviations", type: "Workflow", href: "/dashboard/workspace/deviations" },
  { title: "Adverse Events", type: "Workflow", href: "/dashboard/workspace/adverse-events" },
  { title: "Safety Signal Detection", type: "Workflow", href: "/dashboard/workspace/safety" },
  { title: "Clinical Data Reconciliation", type: "Workflow", href: "/dashboard/workspace/reconciliation" },
  { title: "Medical Coding Intelligence", type: "Workflow", href: "/dashboard/workspace/medical-coding" },
];

type SearchResult = { title: string; type: string; href: string; detail?: string };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("Clinical Research");
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!mounted) return;
      if (!data.user) {
        router.replace(`/auth?next=${encodeURIComponent(pathname)}`);
        return;
      }
      setEmail(data.user.email ?? "");
      setName(data.user.user_metadata?.full_name || "Clinical Research");
      await supabase.rpc("touch_profile_last_seen");
      setReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/auth");
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [pathname, router]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setSearchOpen(false);
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const value = query.trim();
    if (!value) {
      setResults([]);
      setSearching(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearching(true);
      const supabase = createClient();
      const pattern = `%${value}%`;

      const [studies, participants, documents, findings] = await Promise.all([
        supabase.from("studies").select("id,name,protocol_name").or(`name.ilike.${pattern},protocol_name.ilike.${pattern}`).limit(5),
        supabase.from("participants").select("id,participant_code,study_id").ilike("participant_code", pattern).limit(5),
        supabase.from("documents").select("id,name,document_type").or(`name.ilike.${pattern},document_type.ilike.${pattern}`).limit(5),
        supabase.from("findings").select("id,title,summary,analysis_type").or(`title.ilike.${pattern},summary.ilike.${pattern},analysis_type.ilike.${pattern}`).limit(5),
      ]);

      const dbResults: SearchResult[] = [
        ...(studies.data ?? []).map((item) => ({ title: item.name, type: "Study", href: "/dashboard", detail: item.protocol_name || "Study record" })),
        ...(participants.data ?? []).map((item) => ({ title: item.participant_code, type: "Participant", href: "/dashboard", detail: "Participant record" })),
        ...(documents.data ?? []).map((item) => ({ title: item.name, type: "Document", href: "/dashboard", detail: item.document_type || "Clinical document" })),
        ...(findings.data ?? []).map((item) => ({ title: item.title, type: "Finding", href: "/dashboard", detail: item.analysis_type || item.summary || "Finding requiring review" })),
      ];

      const moduleMatches = moduleResults
        .filter((item) => item.title.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5);

      if (mounted) {
        setResults([...moduleMatches, ...dbResults].slice(0, 10));
        setSearching(false);
        setSearchOpen(true);
      }
    }, 250);

    let mounted = true;
    return () => {
      mounted = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/auth");
  }

  function clearSearch() {
    setQuery("");
    setResults([]);
    setSearchOpen(false);
  }

  if (!ready) return <div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="text-sm font-medium text-slate-500">Loading your TrialIQ workspace…</div></div>;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 flex h-screen w-72 shrink-0 flex-col border-r border-border bg-card">
        <div className="shrink-0 border-b border-border px-6 py-6">
          <Link href="/" className="flex w-fit items-center gap-2.5 font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80" aria-label="TrialIQ AI home">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-700 font-mono text-[11px] font-medium text-white">iq</span>
            <span className="text-base font-semibold">TrialIQ AI</span>
            <span className="ml-0.5 rounded border border-slate-300 px-1.5 py-0.5 font-mono text-[9px] font-medium text-slate-500">MVP</span>
          </Link>
          <p className="mt-2 pl-10 text-xs text-muted-foreground">Clinical AI Platform</p>
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-4">
          {menu.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
            return <Link key={item.title} href={item.href} className={`flex items-center gap-3.5 rounded-lg px-4 py-2.5 text-sm font-medium transition ${isActive ? "bg-blue-50 text-blue-700" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}><Icon size={18} />{item.title}</Link>;
          })}
        </nav>

        <div className="shrink-0 border-t border-border bg-card p-4">
          <button onClick={signOut} className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-red-50 hover:text-red-700"><LogOut size={18} />Sign out</button>
        </div>
      </aside>

      <div className="ml-72 flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between border-b border-border bg-card px-8 py-4">
          <div ref={searchRef} className="relative w-full max-w-xl">
            <div className={`flex w-full items-center gap-3 rounded-lg border bg-secondary px-4 py-3 text-sm transition ${searchOpen ? "border-blue-300 ring-2 ring-blue-50" : "border-border focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-50"}`}>
              <Search size={17} className="shrink-0 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => query.trim() && setSearchOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") clearSearch();
                  if (event.key === "Enter" && results[0]) router.push(results[0].href);
                }}
                aria-label="Search TrialIQ"
                placeholder="Search participants, protocols, documents, findings…"
                className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              {searching && <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-slate-300 border-t-blue-700" aria-label="Searching" />}
              {!searching && query && <button onClick={clearSearch} className="rounded p-0.5 text-muted-foreground hover:text-foreground" aria-label="Clear search"><X size={15} /></button>}
            </div>

            {searchOpen && query.trim() && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                <div className="border-b border-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Search results</div>
                {results.length > 0 ? results.map((result) => (
                  <Link key={`${result.type}-${result.title}-${result.href}`} href={result.href} onClick={() => setSearchOpen(false)} className="flex items-center justify-between gap-4 px-4 py-3 transition hover:bg-slate-50">
                    <div className="min-w-0"><p className="truncate text-sm font-medium text-slate-900">{result.title}</p><p className="mt-0.5 truncate text-xs text-slate-500">{result.type}{result.detail ? ` · ${result.detail}` : ""}</p></div>
                    <ArrowRight size={15} className="shrink-0 text-slate-300" />
                  </Link>
                )) : !searching ? (
                  <div className="px-4 py-6 text-center"><p className="text-sm font-medium text-slate-700">No matches found</p><p className="mt-1 text-xs text-slate-500">Try a participant ID, study name, document or finding.</p></div>
                ) : null}
                <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-[11px] text-slate-400">Searches your TrialIQ workspace and workflows</div>
              </div>
            )}
          </div>

          <div className="ml-8 flex shrink-0 items-center gap-4">
            <button className="rounded-lg border border-border p-2.5 text-muted-foreground transition hover:text-foreground" aria-label="Notifications"><Bell size={17} /></button>
            <div className="flex items-center gap-3 border-l border-border pl-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-700 font-mono text-sm font-medium text-white">{(name || email || "T").charAt(0).toUpperCase()}</div>
              <div><p className="text-sm font-semibold text-foreground">{name}</p><p className="max-w-48 truncate text-xs text-muted-foreground">{email}</p></div>
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
