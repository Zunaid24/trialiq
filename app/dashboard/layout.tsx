import Link from "next/link";
import {
  LayoutDashboard,
  ClipboardCheck,
  FileSearch,
  Users,
  FileText,
  CalendarCheck,
  ShieldAlert,
  TriangleAlert,
  FlaskConical,
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
  return (
    <div className="flex min-h-screen bg-slate-100">

      {/* Sidebar */}

      <aside className="w-72 border-r bg-white">

        <div className="border-b p-8">

          <h1 className="text-3xl font-bold text-blue-600">
            TrialIQ AI
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Clinical AI Platform
          </p>

        </div>

        <nav className="space-y-2 p-5">

          {menu.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.title}
                href={item.href}
                className="flex items-center gap-4 rounded-2xl px-4 py-3 text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
              >
                <Icon size={20} />

                {item.title}
              </Link>
            );
          })}

        </nav>

      </aside>

      {/* Main */}

      <div className="flex flex-1 flex-col">

        {/* Topbar */}

        <header className="flex items-center justify-between border-b bg-white px-8 py-5">

          <div className="flex items-center gap-3 rounded-2xl border bg-slate-50 px-4 py-3">

            <Search size={18} />

            <input
              placeholder="Search..."
              className="bg-transparent outline-none"
            />

          </div>

          <div className="flex items-center gap-5">

            <button className="rounded-xl border p-3">
              <Bell size={18} />
            </button>

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
                A
              </div>

              <div>

                <p className="font-semibold">
                  Admin
                </p>

                <p className="text-xs text-slate-500">
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