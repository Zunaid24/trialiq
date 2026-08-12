"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardCheck,
  FileText,
  BarChart3,
  Settings,
  Bell,
  Search,
} from "lucide-react";

const menu = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Clinical Workspace",
    href: "/dashboard/workspace",
    icon: ClipboardCheck,
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Reports",
    href: "/dashboard/reports",
    icon: FileText,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-72 border-r border-border bg-card">
        {/* Product navigation */}
        <div className="border-b border-border px-6 py-6">
          <Link
            href="/"
            className="flex w-fit items-center gap-2.5 font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80"
            aria-label="TrialIQ AI home"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-blue-600 to-blue-800 font-mono text-[11px] font-medium text-white">
              iq
            </span>

            <span className="text-base font-semibold">
              TrialIQ AI
            </span>

            <span className="ml-0.5 rounded border border-slate-300 px-1.5 py-0.5 font-mono text-[9px] font-medium text-slate-500">
              MVP
            </span>
          </Link>

          <p className="mt-2 pl-10 text-xs text-muted-foreground">
            Clinical AI Platform
          </p>
        </div>

        <nav className="space-y-1 p-4">
          {menu.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/dashboard"
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.title}
                href={item.href}
                className={`flex items-center gap-3.5 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon size={18} />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        {/* Topbar */}
        <header className="flex items-center justify-between border-b border-border bg-card px-8 py-4">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm">
            <Search size={16} className="text-muted-foreground" />
            <input
              placeholder="Search participants, protocols, sites…"
              className="w-64 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="rounded-lg border border-border p-2.5 text-muted-foreground transition hover:text-foreground">
              <Bell size={17} />
            </button>

            <div className="flex items-center gap-3 border-l border-border pl-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand font-mono text-sm font-medium text-brand-foreground">
                A
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground">
                  Admin
                </p>
                <p className="text-xs text-muted-foreground">
                  Clinical Research
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}