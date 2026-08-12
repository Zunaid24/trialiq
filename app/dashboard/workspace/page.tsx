import Link from "next/link";
import {
  ClipboardCheck,
  FileSearch,
  Users,
  FileText,
  CalendarCheck,
  ShieldAlert,
  TriangleAlert,
  FlaskConical,
} from "lucide-react";

const modules = [
  {
    title: "Eligibility Screening",
    description:
      "Compare clinical trial protocols with participant records using AI.",
    href: "/dashboard/workspace/eligibility",
    icon: ClipboardCheck,
    status: "LIVE",
  },
  {
    title: "Protocol Intelligence",
    description:
      "Summarize long protocols into actionable insights.",
    href: "/dashboard/workspace/protocol",
    icon: FileSearch,
    status: "LIVE",
  },
  {
    title: "Clinical Data Reconciliation",
    description:
      "Find the best clinical trials for a patient.",
    href: "/dashboard/workspace/reconciliation",
    icon: Users,
    status: "LIVE",
  },
  {
    title: "Source Review",
    description:
      "Extract structured clinical information from PDFs.",
    href: "/dashboard/workspace/source-review",
    icon: FileText,
    status: "LIVE",
  },
  {
    title: "Visit Assistant",
    description:
      "Generate visit schedules and AI checklists.",
    href: "/dashboard/workspace/visit-assistant",
    icon: CalendarCheck,
    status: "LIVE",
  },
  {
    title: "Protocol Deviations",
    description:
      "Automatically detect protocol violations.",
    href: "/dashboard/workspace/deviations",
    icon: ShieldAlert,
    status: "LIVE",
  },
  {
    title: "Adverse Events",
    description:
      "Review and classify adverse events.",
    href: "/dashboard/workspace/adverse-events",
    icon: TriangleAlert,
    status: "LIVE",
  },
  {
    title: "Lab Intelligence",
    description:
      "Interpret laboratory values using protocol context.",
    href: "/dashboard/workspace/lab-intelligence",
    icon: FlaskConical,
    status: "LIVE",
  },
];

export default function WorkspacePage() {
  return (
    <main>

      <div className="mb-12">

        <h1 className="text-4xl font-bold">
          Clinical Workspace
        </h1>

        <p className="mt-3 text-slate-500">
          Select an AI module to begin.
        </p>

      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        {modules.map((module) => {
          const Icon = module.icon;

          return (
            <Link
              key={module.title}
              href={module.href}
              className="group rounded-3xl border bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
            >

              <div className="flex items-center justify-between">

                <div className="rounded-2xl bg-blue-50 p-4">
                  <Icon
                    className="text-blue-600"
                    size={28}
                  />
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    module.status === "LIVE"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {module.status}
                </span>

              </div>

              <h2 className="mt-8 text-xl font-semibold">
                {module.title}
              </h2>

              <p className="mt-3 text-sm text-slate-500">
                {module.description}
              </p>

              <div className="mt-8 font-semibold text-blue-600 group-hover:translate-x-1 transition">
                Open Module →
              </div>

            </Link>
          );
        })}

      </div>

    </main>
  );
}