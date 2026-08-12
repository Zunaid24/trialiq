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
  Stethoscope,
  Activity,
  Pill,
  GitCompareArrows,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const groups = [
  {
    title: "Study Operations",
    description: "Understand the protocol and keep participant workflows aligned to study requirements.",
    modules: [
      { title: "Protocol Intelligence", description: "Extract eligibility rules, visits, endpoints and protocol risks.", href: "/dashboard/workspace/protocol", icon: FileSearch },
      { title: "Eligibility Screening", description: "Compare protocol requirements with participant information and surface review items.", href: "/dashboard/workspace/eligibility", icon: ClipboardCheck, featured: true },
      { title: "Visit Assistant", description: "Generate visit schedules, checks and follow-up requirements from protocol context.", href: "/dashboard/workspace/visit-assistant", icon: CalendarCheck },
    ],
  },
  {
    title: "Participant Intelligence",
    description: "Bring participant documents, laboratory results and medications into one review context.",
    modules: [
      { title: "Source Review", description: "Extract structured clinical information from source documents.", href: "/dashboard/workspace/source-review", icon: FileText },
      { title: "Lab Intelligence", description: "Identify abnormal, missing and follow-up laboratory findings.", href: "/dashboard/workspace/lab-intelligence", icon: FlaskConical },
      { title: "Medication Review", description: "Review medications for timing, indication and potential protocol concerns.", href: "/dashboard/workspace/medications", icon: Pill },
    ],
  },
  {
    title: "Safety & Compliance",
    description: "Surface issues that need clinical or coordinator review before they become operational problems.",
    modules: [
      { title: "Protocol Deviations", description: "Identify missed visits, out-of-window assessments and protocol deviations.", href: "/dashboard/workspace/deviations", icon: ShieldAlert },
      { title: "Adverse Events", description: "Structure adverse events for severity, seriousness, causality and follow-up review.", href: "/dashboard/workspace/adverse-events", icon: TriangleAlert },
      { title: "Safety Signal Detection", description: "Surface recurring patterns and potential signals requiring clinical review.", href: "/dashboard/workspace/safety", icon: Activity },
    ],
  },
  {
    title: "Data Quality & Coding",
    description: "Resolve inconsistencies and turn clinical terminology into review-ready coding suggestions.",
    modules: [
      { title: "Clinical Data Reconciliation", description: "Compare records and identify conflicting dates, missing information and discrepancies.", href: "/dashboard/workspace/reconciliation", icon: GitCompareArrows },
      { title: "Medical Coding Intelligence", description: "Generate AI-assisted MedDRA and ICD-10 suggestions with evidence and confidence.", href: "/dashboard/workspace/medical-coding", icon: Stethoscope },
      { title: "Participant Intelligence", description: "Review the most important findings and actions for a participant from the study dashboard.", href: "/dashboard", icon: Users },
    ],
  },
];

export default function WorkspacePage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-8 md:px-10 md:py-10">
      <div className="mb-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            <Sparkles size={14} />
            AI-ASSISTED CLINICAL OPERATIONS
          </span>
        </div>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground">
          Clinical Workspace
        </h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Move from study requirements to participant findings and review actions without switching between disconnected AI tools.
        </p>
      </div>

      <div className="mb-10 rounded-2xl border border-blue-100 bg-blue-50/60 p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Recommended starting point</p>
            <h2 className="mt-2 text-xl font-bold text-slate-950">Screen a participant against the study protocol</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Start with the core TrialIQ workflow: protocol requirements → participant information → AI-assisted eligibility findings → human review.
            </p>
          </div>
          <Link
            href="/dashboard/workspace/eligibility"
            className="group inline-flex w-fit shrink-0 items-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            Start Screening
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      <div className="space-y-10">
        {groups.map((group) => (
          <section key={group.title}>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-foreground">{group.title}</h2>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{group.description}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {group.modules.map((module) => {
                const Icon = module.icon;
                return (
                  <Link
                    key={module.title}
                    href={module.href}
                    className={`group rounded-2xl border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md ${module.featured ? "border-blue-200 ring-1 ring-blue-50" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                        <Icon size={19} />
                      </div>
                      <ArrowRight size={17} className="text-muted-foreground/40 transition group-hover:text-blue-700" />
                    </div>

                    <h3 className="mt-5 text-[16px] font-semibold text-foreground">{module.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{module.description}</p>
                    <div className="mt-5 text-sm font-semibold text-blue-700">Open workflow →</div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">TrialIQ principle</p>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
          TrialIQ assists clinical research teams by extracting and connecting relevant information. Findings are intended for human review and action, not autonomous clinical decision-making.
        </p>
      </div>
    </main>
  );
}