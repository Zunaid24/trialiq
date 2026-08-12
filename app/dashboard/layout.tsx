"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, ClipboardCheck, FileText, BarChart3, Settings, Bell, Search, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

const menu = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Clinical Workspace", href: "/dashboard/workspace", icon: ClipboardCheck },
  { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { title: "Reports", href: "/dashboard/reports", icon: FileText },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("Clinical Research");
  const [ready, setReady] = useState(false);

  useEffect(() => {
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

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/auth");
  }

  if (!ready) return <div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="text-sm font-medium text-slate-500">Loading your TrialIQ workspace…</div></div>;

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border bg-card">
        <div className="border-b border-border px-6 py-6">
          <Link href="/" className="flex w-fit items-center gap-2.5 font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80" aria-label="TrialIQ AI home">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-700 font-mono text-[11px] font-medium text-white">iq</span>
            <span className="text-base font-semibold">TrialIQ AI</span>
            <span className="ml-0.5 rounded border border-slate-300 px-1.5 py-0.5 font-mono text-[9px] font-medium text-slate-500">MVP</span>
          </Link>
          <p className="mt-2 pl-10 text-xs text-muted-foreground">Clinical AI Platform</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {menu.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
            return <Link key={item.title} href={item.href} className={`flex items-center gap-3.5 rounded-lg px-4 py-2.5 text-sm font-medium transition ${isActive ? "bg-blue-50 text-blue-700" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}><Icon size={18} />{item.title}</Link>;
          })}
        </nav>
        <div className="border-t border-border p-4">
          <button onClick={signOut} className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-red-50 hover:text-red-700"><LogOut size={18} />Sign out</button>
        </div>
      </aside>
      <div className="ml-72 flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card px-8 py-4">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm"><Search size={16} className="text-muted-foreground" /><input placeholder="Search participants, protocols, sites…" className="w-64 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" /></div>
          <div className="flex items-center gap-4">
            <button className="rounded-lg border border-border p-2.5 text-muted-foreground transition hover:text-foreground" aria-label="Notifications"><Bell size={17} /></button>
            <div className="flex items-center gap-3 border-l border-border pl-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-700 font-mono text-sm font-medium text-white">{(name || email || "T").charAt(0).toUpperCase()}</div>
              <div><p className="text-sm font-semibold text-foreground">{name}</p><p className="max-w-48 truncate text-xs text-muted-foreground">{email}</p></div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
