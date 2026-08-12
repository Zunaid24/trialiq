"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 px-5 py-10 md:px-8">
      <div className="mx-auto flex max-w-[1180px] flex-col justify-between gap-6 md:flex-row md:items-start">
        <div>
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight text-slate-900">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-blue-600 to-blue-800 font-mono text-[11px] font-medium text-white">iq</span>
            TrialIQ AI
          </Link>
          <p className="mt-2 text-xs text-slate-400">© 2026 TrialIQ AI · Zunaid Ahmed</p>
        </div>

        <div className="flex flex-wrap gap-6">
          <Link href="/platform" className="text-xs text-slate-500 transition hover:text-slate-900">Platform</Link>
          <Link href="/dashboard/workspace" className="text-xs text-slate-500 transition hover:text-slate-900">Modules</Link>
          <Link href="/workflow" className="text-xs text-slate-500 transition hover:text-slate-900">Workflow</Link>
          <Link href="/security" className="text-xs text-slate-500 transition hover:text-slate-900">Security</Link>
          <Link href="/dashboard" className="text-xs text-slate-500 transition hover:text-slate-900">Workspace</Link>
        </div>
      </div>
    </footer>
  );
}