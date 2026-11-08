"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LayoutGrid, Users, ListChecks, FileText, ShieldCheck, BarChart3, Settings, Bell, Search, LogOut, X, ArrowRight, CheckCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AUTH_DISABLED } from "@/lib/authMode";

type MenuItem = { title: string; href: string; icon: typeof LayoutGrid; match?: string[] };
type SearchResult = { title: string; type: string; href: string; detail?: string };
type Notification = { id: string; type: string; title: string; message: string | null; href: string | null; read_at: string | null; created_at: string };
type StudyRow = { name: string; protocol_name: string | null };
type ParticipantRow = { participant_code: string };
type DocumentRow = { name: string; document_type: string | null };
type FindingRow = { title: string; summary: string | null; analysis_type: string | null };

const menu: MenuItem[] = [
  { title: "Today", href: "/dashboard", icon: LayoutGrid, match: ["/dashboard/memory", "/dashboard/clinical-intelligence"] },
  { title: "Participants", href: "/dashboard/participants", icon: Users, match: ["/dashboard/workspace/eligibility", "/dashboard/workspace/patient-matching", "/dashboard/workspace/source-review", "/dashboard/workspace/lab-intelligence", "/dashboard/workspace/medications", "/dashboard/workspace/deviations", "/dashboard/workspace/adverse-events"] },
  { title: "Review", href: "/dashboard/review-queue", icon: ListChecks },
  { title: "Study", href: "/dashboard/study", icon: FileText, match: ["/dashboard/workspace/protocol", "/dashboard/workspace/visit-assistant", "/dashboard/workspace/safety"] },
  { title: "Data quality", href: "/dashboard/data-quality", icon: ShieldCheck, match: ["/dashboard/workspace/reconciliation", "/dashboard/workspace/medical-coding"] },
  { title: "Reports", href: "/dashboard/reports", icon: BarChart3, match: ["/dashboard/analytics"] },
];

const moduleResults = [
  { title: "Participant PT-1042", type: "Participant", href: "/dashboard/participants/PT-1042" },
  { title: "Protocol requirements", type: "Study", href: "/dashboard/workspace/protocol" },
  { title: "Eligibility", type: "Participant", href: "/dashboard/workspace/eligibility" },
  { title: "Visit plan", type: "Study", href: "/dashboard/workspace/visit-assistant" },
  { title: "Source documents", type: "Participant", href: "/dashboard/workspace/source-review" },
  { title: "Lab results", type: "Participant", href: "/dashboard/workspace/lab-intelligence" },
  { title: "Medications", type: "Participant", href: "/dashboard/workspace/medications" },
  { title: "Protocol deviations", type: "Participant", href: "/dashboard/workspace/deviations" },
  { title: "Adverse events", type: "Participant", href: "/dashboard/workspace/adverse-events" },
  { title: "Safety signals", type: "Study", href: "/dashboard/workspace/safety" },
  { title: "Reconciliation", type: "Data quality", href: "/dashboard/workspace/reconciliation" },
  { title: "Medical coding", type: "Data quality", href: "/dashboard/workspace/medical-coding" },
];

function formatNotificationTime(value: string) {
  const date = new Date(value); const diff = Date.now() - date.getTime(); const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now"; if (minutes < 60) return `${minutes}m ago`; const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`; const days = Math.floor(hours / 24); if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); const router = useRouter(); const searchRef = useRef<HTMLDivElement>(null); const notificationRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState(""); const [name, setName] = useState("Clinical Research"); const [ready, setReady] = useState(false); const [query, setQuery] = useState(""); const [results, setResults] = useState<SearchResult[]>([]); const [searching, setSearching] = useState(false); const [searchOpen, setSearchOpen] = useState(false); const [notifications, setNotifications] = useState<Notification[]>([]); const [notificationOpen, setNotificationOpen] = useState(false); const [notificationsLoading, setNotificationsLoading] = useState(false);
  const loadNotifications = async () => { setNotificationsLoading(true); const supabase = createClient(); const { data } = await supabase.from("notifications").select("id,type,title,message,href,read_at,created_at").order("created_at", { ascending: false }).limit(12); setNotifications((data ?? []) as Notification[]); setNotificationsLoading(false); };
  useEffect(() => { const supabase = createClient(); let mounted = true; supabase.auth.getUser().then(async ({ data: initial }) => { let data = initial; if (!mounted) return; let user = data.user; if (!user && AUTH_DISABLED) { const { data: anon } = await supabase.auth.signInAnonymously(); user = anon.user; } if (!mounted) return; if (!user) { router.replace(`/auth?next=${encodeURIComponent(pathname)}`); return; } data = { user }; setEmail(data.user.email ?? ""); setName(data.user.user_metadata?.full_name || "Clinical Research"); await supabase.rpc("touch_profile_last_seen"); await loadNotifications(); setReady(true); }); const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { if (!session && !AUTH_DISABLED) router.replace("/auth"); }); return () => { mounted = false; listener.subscription.unsubscribe(); }; }, [pathname, router]);
  useEffect(() => { function handleOutsideClick(event: MouseEvent) { const target = event.target as Node; if (searchRef.current && !searchRef.current.contains(target)) setSearchOpen(false); if (notificationRef.current && !notificationRef.current.contains(target)) setNotificationOpen(false); } document.addEventListener("mousedown", handleOutsideClick); return () => document.removeEventListener("mousedown", handleOutsideClick); }, []);
  useEffect(() => { const value = query.trim(); if (!value) { setResults([]); setSearching(false); return; } const timer = window.setTimeout(async () => { setSearching(true); const supabase = createClient(); const pattern = `%${value}%`; const [studies, participants, documents, findings] = await Promise.all([supabase.from("studies").select("id,name,protocol_name").or(`name.ilike.${pattern},protocol_name.ilike.${pattern}`).limit(5), supabase.from("participants").select("id,participant_code,study_id").ilike("participant_code", pattern).limit(5), supabase.from("documents").select("id,name,document_type").or(`name.ilike.${pattern},document_type.ilike.${pattern}`).limit(5), supabase.from("findings").select("id,title,summary,analysis_type").or(`title.ilike.${pattern},summary.ilike.${pattern},analysis_type.ilike.${pattern}`).limit(5)]); const dbResults: SearchResult[] = [...(studies.data ?? []).map((item: StudyRow) => ({ title: item.name, type: "Study", href: "/dashboard", detail: item.protocol_name || "Study record" })), ...(participants.data ?? []).map((item: ParticipantRow) => ({ title: item.participant_code, type: "Participant", href: "/dashboard", detail: "Participant record" })), ...(documents.data ?? []).map((item: DocumentRow) => ({ title: item.name, type: "Document", href: "/dashboard", detail: item.document_type || "Clinical document" })), ...(findings.data ?? []).map((item: FindingRow) => ({ title: item.title, type: "Finding", href: "/dashboard/review-queue", detail: item.analysis_type || item.summary || "Finding requiring review" }))]; const moduleMatches = moduleResults.filter((item) => item.title.toLowerCase().includes(value.toLowerCase())).slice(0, 5); setResults([...moduleMatches, ...dbResults].slice(0, 10)); setSearching(false); setSearchOpen(true); }, 250); return () => window.clearTimeout(timer); }, [query]);
  async function markNotificationRead(id: string, href?: string | null) { const supabase = createClient(); const now = new Date().toISOString(); await supabase.from("notifications").update({ read_at: now }).eq("id", id); setNotifications((current) => current.map((item) => item.id === id ? { ...item, read_at: now } : item)); if (href) router.push(href); setNotificationOpen(false); }
  async function markAllNotificationsRead() { const supabase = createClient(); const unreadIds = notifications.filter((item) => !item.read_at).map((item) => item.id); if (unreadIds.length) { const now = new Date().toISOString(); await supabase.from("notifications").update({ read_at: now }).in("id", unreadIds); setNotifications((current) => current.map((item) => ({ ...item, read_at: item.read_at || now }))); } }
  async function signOut() { const supabase = createClient(); await supabase.auth.signOut(); router.replace("/auth"); }
  function clearSearch() { setQuery(""); setResults([]); setSearchOpen(false); }
  const unreadCount = notifications.filter((item) => !item.read_at).length;
  if (!ready) return <div className="flex min-h-screen items-center justify-center bg-white"><p className="text-sm text-ink-3">Opening TrialIQ…</p></div>;
  const isActive = (item: MenuItem) => item.href === "/dashboard" ? pathname === "/dashboard" || (item.match ?? []).some((m) => pathname.startsWith(m)) : pathname.startsWith(item.href) || (item.match ?? []).some((m) => pathname.startsWith(m));
  const initials = (name || "TrialIQ").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="flex h-screen overflow-hidden bg-white text-ink">
      <aside className="flex w-56 shrink-0 flex-col border-r border-line bg-white px-3.5 py-5">
        <Link href="/dashboard" className="mb-5 flex items-center gap-2.5 px-2" aria-label="TrialIQ home"><span className="h-6 w-6 rounded-md bg-primary" /><span className="text-base font-semibold">TrialIQ</span></Link>
        <div className="mb-4 rounded-lg border border-line px-2.5 py-2"><p className="text-xs font-medium">TRIALIQ-101</p><p className="text-xs text-ink-3">Advanced NSCLC · Phase II</p></div>
        <nav className="space-y-0.5">{menu.map((item) => { const Icon = item.icon; const active = isActive(item); return <Link key={item.title} href={item.href} aria-current={active ? "page" : undefined} className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${active ? "bg-tint font-medium text-ink" : "text-ink-2 hover:bg-surface hover:text-ink"}`}><Icon size={17} strokeWidth={1.75} className={active ? "text-ink" : "text-ink-3"} />{item.title}</Link>; })}</nav>
        <div className="mt-auto space-y-0.5">
          <Link href="/dashboard/settings" className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm ${pathname.startsWith("/dashboard/settings") || pathname.startsWith("/dashboard/team") ? "bg-tint font-medium" : "text-ink-2 hover:bg-surface"}`}><Settings size={17} strokeWidth={1.75} className="text-ink-3" />Settings</Link>
          <div className="flex items-center gap-2.5 px-2 pt-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-[11px] font-semibold text-ink-2">{initials}</span><div className="min-w-0 flex-1"><p className="truncate text-[13px] font-medium">{name}</p><p className="truncate text-xs text-ink-3">{email || "Testing session"}</p></div>{!AUTH_DISABLED && <button onClick={signOut} className="rounded p-1 text-ink-3 hover:text-ink" aria-label="Sign out"><LogOut size={15} /></button>}</div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-line px-9">
          <div className="flex-1" />
          <div ref={searchRef} className="relative w-72">
            <div className="flex items-center gap-2 rounded-md border border-line px-3 py-1.5 focus-within:border-ink-3"><Search size={15} className="text-ink-3" /><input value={query} onChange={(event) => setQuery(event.target.value)} onFocus={() => query.trim() && setSearchOpen(true)} onKeyDown={(event) => { if (event.key === "Escape") clearSearch(); if (event.key === "Enter" && results[0]) router.push(results[0].href); }} aria-label="Search TrialIQ" placeholder="Search" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-3" />{searching && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-line border-t-ink-2" />}{!searching && query && <button onClick={clearSearch} className="text-ink-3 hover:text-ink" aria-label="Clear search"><X size={14} /></button>}</div>
            {searchOpen && query.trim() && <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-96 overflow-hidden rounded-lg border border-line bg-white shadow-lg">{results.length > 0 ? results.map((result) => <Link key={`${result.type}-${result.title}-${result.href}`} href={result.href} onClick={() => setSearchOpen(false)} className="flex items-center justify-between gap-4 px-4 py-2.5 hover:bg-surface"><div className="min-w-0"><p className="truncate text-sm">{result.title}</p><p className="truncate text-xs text-ink-3">{result.type}{result.detail ? ` · ${result.detail}` : ""}</p></div><ArrowRight size={14} className="shrink-0 text-ink-3" /></Link>) : !searching ? <p className="px-4 py-5 text-sm text-ink-2">No matches. Try a participant ID or document name.</p> : null}</div>}
          </div>
          <div ref={notificationRef} className="relative">
            <button onClick={() => { setNotificationOpen((open) => !open); if (!notificationOpen) loadNotifications(); }} className="relative rounded-md border border-line p-2 text-ink-2 hover:text-ink" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`} aria-expanded={notificationOpen}><Bell size={16} />{unreadCount > 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-no" />}</button>
            {notificationOpen && <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-[360px] overflow-hidden rounded-lg border border-line bg-white shadow-lg"><div className="flex items-center justify-between border-b border-line px-4 py-3"><p className="text-sm font-medium">Notifications</p>{unreadCount > 0 && <button onClick={markAllNotificationsRead} className="inline-flex items-center gap-1 text-xs font-medium text-primary"><CheckCheck size={13} />Mark all read</button>}</div><div className="max-h-[400px] overflow-y-auto">{notificationsLoading ? <p className="px-4 py-6 text-sm text-ink-3">Loading…</p> : notifications.length > 0 ? notifications.map((item) => <button key={item.id} onClick={() => markNotificationRead(item.id, item.href)} className="flex w-full gap-3 border-b border-line px-4 py-3 text-left hover:bg-surface"><span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${item.read_at ? "bg-line" : "bg-primary"}`} /><span className="min-w-0 flex-1"><span className="block text-sm">{item.title}</span>{item.message && <span className="mt-0.5 block line-clamp-2 text-xs text-ink-2">{item.message}</span>}<span className="mt-1 block text-[11px] text-ink-3">{formatNotificationTime(item.created_at)}</span></span></button>) : <p className="px-4 py-6 text-sm text-ink-3">Nothing new.</p>}</div></div>}
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
