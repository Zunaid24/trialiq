"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-slate-50/90 backdrop-blur-md">
      <div className="mx-auto flex h-[68px] max-w-[1180px] items-center justify-between px-5 md:px-8">

        <Link
          href="/"
          className="flex items-center gap-2.5 font-semibold tracking-tight text-slate-900"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-blue-600 to-blue-800 font-mono text-[11px] font-medium text-white">
            iq
          </span>

          TrialIQ AI

          <span className="ml-1 rounded border border-slate-300 px-1.5 py-0.5 font-mono text-[9px] font-medium text-slate-500">
            MVP
          </span>
        </Link>

        <nav className="hidden md:block">
          <ul className="flex items-center gap-8">
            <li>
              <a
                href="#platform"
                className="text-sm text-slate-500 transition hover:text-slate-900"
              >
                Platform
              </a>
            </li>

            <li>
              <a
                href="#modules"
                className="text-sm text-slate-500 transition hover:text-slate-900"
              >
                Modules
              </a>
            </li>

            <li>
              <a
                href="#workflow"
                className="text-sm text-slate-500 transition hover:text-slate-900"
              >
                Workflow
              </a>
            </li>

            <li>
              <a
                href="#security"
                className="text-sm text-slate-500 transition hover:text-slate-900"
              >
                Security
              </a>
            </li>
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="hidden rounded-md border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-500 hover:text-slate-900 sm:inline-flex"
          >
            Sign in
          </Link>

          <Link
            href="/dashboard/workspace"
            className="group inline-flex items-center gap-1.5 rounded-md bg-blue-700 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-blue-800 hover:shadow-lg"
          >
            Launch Workspace
            <ArrowRight
              size={14}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>

      </div>
    </header>
  );
}