"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AUTH_DISABLED } from "@/lib/authMode";

export default function Navbar() {
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      if (data.user) {
        setUser({
          email: data.user.email,
          name: data.user.user_metadata?.full_name || data.user.email?.split("@")[0],
        });
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ? {
        email: session.user.email,
        name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0],
      } : null);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-slate-50/90 backdrop-blur-md">
      <div className="mx-auto flex h-[68px] max-w-[1180px] items-center justify-between px-5 md:px-8">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight text-slate-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-blue-600 to-blue-800 font-mono text-[11px] font-medium text-white">iq</span>
          TrialIQ AI
          <span className="ml-1 rounded border border-slate-300 px-1.5 py-0.5 font-mono text-[9px] font-medium text-slate-500">MVP</span>
        </Link>

        <nav className="hidden md:block">
          <ul className="flex items-center gap-8">
            <li><Link href="/platform" className="text-sm text-slate-500 transition hover:text-slate-900">Platform</Link></li>
            <li><Link href="/dashboard/workspace" className="text-sm text-slate-500 transition hover:text-slate-900">Modules</Link></li>
            <li><Link href="/workflow" className="text-sm text-slate-500 transition hover:text-slate-900">Workflow</Link></li>
            <li><Link href="/security" className="text-sm text-slate-500 transition hover:text-slate-900">Security</Link></li>
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <Link href="/dashboard" className="hidden items-center gap-2 rounded-md border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-500 hover:text-slate-900 sm:inline-flex">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-700 text-[10px] font-semibold text-white">{(user.name || user.email || "U").charAt(0).toUpperCase()}</span>
              {user.name}
            </Link>
          ) : (
            AUTH_DISABLED ? null : <Link href="/auth" className="hidden rounded-md border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-500 hover:text-slate-900 sm:inline-flex">Sign in</Link>
          )}
          <Link href="/dashboard" className="group inline-flex items-center gap-1.5 rounded-md bg-blue-700 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-blue-800 hover:shadow-lg">
            {user ? "Open Workspace" : "Launch Workspace"}
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}