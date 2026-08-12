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
  BarChart3,
  Pill,
  ArrowRight,
} from "lucide-react";

const modules = [
  {
    title: "Eligibility Screening",
    description: "Compare protocol and participant using AI.",
    href: "/dashboard/workspace/eligibility",
    icon: ClipboardCheck,
    status: "Live",
  },
  {
    title: "Protocol Intelligence",
    description: "Understand any clinical protocol instantly.",
    href: "/dashboard/workspace/protocol",
    icon: FileSearch,
    status: "Live",
  },
  {
    title: "Clinical Data Reconciliation",
    description: "Find the best matching trials for patients.",
    href: "/dashboard/workspace/reconciliation",
    icon: Users,
    status: "Live",
  },
  {
  title: "Medication Review",
  description:
    "Review concomitant medications, dosing, timing, indications and potential protocol concerns.",
  href: "/dashboard/workspace/medications",
  icon: Pill,status: "Live",
},
  {
    title: "Source Review",
    description: "Extract clinical information from documents.",
    href: "/dashboard/workspace/source-review",
    icon: FileText,
    status: "Live",
  },
  {
    title: "Visit Assistant",
    description: "AI generated visit checklist.",
    href: "/dashboard/workspace/visit-assistant",
    icon: CalendarCheck,
    status: "Live",
  },
  {
    title: "Protocol Deviations",
    description: "Detect protocol deviations automatically.",
    href: "/dashboard/workspace/deviations",
    icon: ShieldAlert,
    status: "Live",
  },
  {
    title: "Adverse Events",
    description: "Analyze and classify adverse events.",
    href: "/dashboard/workspace/adverse-events",
    icon: TriangleAlert,
    status: "Live",
  },
  {
    title: "Lab Intelligence",
    description: "Interpret laboratory values using AI.",
    href: "/dashboard/workspace/lab-intelligence",
    icon: FlaskConical,
    status: "Live",
  },
  {
    title: "Trial Analytics",
    description: "Clinical trial insights and dashboards.",
    href: "/dashboard/analytics",
    icon: BarChart3,
    status: "Live",
  },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-8 py-12">

        <div className="mb-12">
          <p className="text-blue-600 font-semibold">
            TrialIQ AI Workspace
          </p>

          <h1 className="mt-2 text-5xl font-bold">
            Welcome Back
          </h1>

          <p className="mt-4 max-w-3xl text-lg text-slate-500">
            Choose an AI module to accelerate clinical trial operations.
          </p>
        </div>

        {/* Stats */}

        <div className="grid gap-6 md:grid-cols-4">

          <StatCard
            title="Patients Reviewed"
            value="24"
          />

          <StatCard
            title="Eligible"
            value="18"
          />

          <StatCard
            title="Pending"
            value="5"
          />

          <StatCard
            title="Screen Failures"
            value="1"
          />

        </div>

        <div className="mt-16">

          <h2 className="mb-8 text-3xl font-bold">
            AI Modules
          </h2>

          <div className="grid gap-6 md:grid-cols-3">

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
                        module.status === "Live"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {module.status}
                    </span>

                  </div>

                  <h3 className="mt-8 text-2xl font-semibold">
                    {module.title}
                  </h3>

                  <p className="mt-3 text-slate-500">
                    {module.description}
                  </p>

                  <div className="mt-8 flex items-center gap-2 font-semibold text-blue-600">

                    Open Module

                    <ArrowRight
                      className="transition group-hover:translate-x-1"
                      size={18}
                    />

                  </div>

                </Link>
              );
            })}

          </div>

        </div>

        {/* Recent Activity */}

        <div className="mt-20 rounded-3xl border bg-white p-8 shadow-sm">

          <h2 className="text-2xl font-bold">
            Recent Activity
          </h2>

          <div className="mt-8 space-y-5">

            <Activity
              patient="P-001"
              result="Eligible"
              time="10 mins ago"
              color="green"
            />

            <Activity
              patient="P-002"
              result="Pending MRI"
              time="25 mins ago"
              color="yellow"
            />

            <Activity
              patient="P-003"
              result="ALT Exceeded"
              time="1 hour ago"
              color="red"
            />

          </div>

        </div>

      </div>
    </main>
  );
}
<Link
  href="/dashboard/workspace"
  className="mb-10 flex items-center justify-between rounded-3xl bg-blue-600 p-8 text-white"
>
  <div>
    <h2 className="text-3xl font-bold">
      Clinical Workspace
    </h2>

    <p className="mt-2 text-blue-100">
      Launch AI-powered clinical research tools.
    </p>
  </div>

  <span className="text-xl font-semibold">
    Open →
  </span>
</Link>
function StatCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <p className="text-slate-500">{title}</p>

      <h2 className="mt-2 text-4xl font-bold">
        {value}
      </h2>
    </div>
  );
}

function Activity({
  patient,
  result,
  time,
  color,
}: {
  patient: string;
  result: string;
  time: string;
  color: "green" | "yellow" | "red";
}) {
  const badge =
    color === "green"
      ? "bg-green-100 text-green-700"
      : color === "yellow"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700";

  return (
    <div className="flex items-center justify-between rounded-2xl border p-5">

      <div>

        <h3 className="font-semibold">
          {patient}
        </h3>

        <p className="text-sm text-slate-500">
          {time}
        </p>

      </div>

      <span className={`rounded-full px-3 py-1 text-sm ${badge}`}>
        {result}
      </span>

    </div>
  );
}