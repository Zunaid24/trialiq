"use client";

import Link from "next/link";
import {
  FileSearch,
  ShieldCheck,
  CalendarDays,
  FileText,
  FlaskConical,
  GitCompareArrows,
  AlertTriangle,
  Pill,
  ClipboardX,
  Activity,
  Stethoscope,
  ArrowUpRight,
} from "lucide-react";

const modules = [
  {
    title: "Protocol Intelligence",
    description:
      "Extract eligibility rules, endpoints, visits, safety requirements and protocol risks.",
    href: "/dashboard/workspace/protocol",
    icon: FileSearch,
    group: "Protocol",
  },
  {
    title: "Eligibility Screening",
    description:
      "Evaluate participant inclusion and exclusion criteria against the study protocol.",
    href: "/dashboard/workspace/eligibility",
    icon: ShieldCheck,
    group: "Participant",
  },
  {
    title: "Visit & Schedule Intelligence",
    description:
      "Convert protocol visit requirements into a structured clinical workflow.",
    href: "/dashboard/workspace/visits",
    icon: CalendarDays,
    group: "Participant",
  },
  {
    title: "Source Document Review",
    description:
      "Review clinical source documents and extract relevant participant information.",
    href: "/dashboard/workspace/source-review",
    icon: FileText,
    group: "Data",
  },
  {
    title: "Lab Intelligence",
    description:
      "Analyze laboratory results, abnormalities, missing values and follow-up requirements.",
    href: "/dashboard/workspace/labs",
    icon: FlaskConical,
    group: "Data",
  },
  {
    title: "Clinical Data Reconciliation",
    description:
      "Compare clinical records and identify conflicting dates, missing information and discrepancies.",
    href: "/dashboard/workspace/reconciliation",
    icon: GitCompareArrows,
    group: "Data",
  },
  {
    title: "Adverse Event Assessment",
    description:
      "Structure adverse events by severity, seriousness, causality, outcome and follow-up.",
    href: "/dashboard/workspace/adverse-events",
    icon: AlertTriangle,
    group: "Safety",
  },
  {
    title: "Medication Review",
    description:
      "Review concomitant medications, timing, indications and potential protocol concerns.",
    href: "/dashboard/workspace/medications",
    icon: Pill,
    group: "Safety",
  },
  {
    title: "Protocol Deviation Detection",
    description:
      "Identify missed visits, out-of-window assessments and other protocol deviations.",
    href: "/dashboard/workspace/deviations",
    icon: ClipboardX,
    group: "Safety",
  },
  {
    title: "Safety Signal Detection",
    description:
      "Surface clinically relevant safety patterns across available study information.",
    href: "/dashboard/workspace/safety",
    icon: Activity,
    group: "Safety",
  },
  {
    title: "Medical Coding Intelligence",
    description:
      "Generate AI-assisted MedDRA and ICD-10 coding suggestions with evidence and confidence.",
    href: "/dashboard/workspace/medical-coding",
    icon: Stethoscope,
    group: "Clinical Coding",
  },
];

export default function ModuleGrid() {
  return (
    <section
      id="modules"
      className="bg-slate-50 px-5 py-14 md:px-8"
    >
      <div className="mx-auto max-w-[1180px]">

        <div className="mb-10 max-w-3xl">

          <p className="font-mono text-xs font-medium uppercase tracking-wider text-blue-700">
            Core AI Modules
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
            One workspace for every
            <br className="hidden md:block" />
            trial-operations workflow.
          </h2>

          <p className="mt-4 text-base leading-7 text-slate-600">
            Purpose-built intelligence across the clinical
            trial lifecycle — from protocol interpretation
            and participant screening to safety, data
            quality and medical coding.
          </p>

        </div>


        <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white md:grid-cols-2 lg:grid-cols-3">

          {modules.map((module) => {
            const Icon = module.icon;

            return (
              <Link
                key={module.href}
                href={module.href}
                className="group border-b border-slate-200 p-6 transition hover:bg-blue-50/40 lg:[&:nth-child(3n)]:border-r-0"
              >

                <div className="mb-4 flex items-center justify-between">

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                    <Icon size={17} />
                  </div>

                  <ArrowUpRight
                    size={16}
                    className="text-slate-300 transition group-hover:text-blue-700"
                  />

                </div>

                <p className="mb-2 font-mono text-[9px] uppercase tracking-wider text-slate-400">
                  {module.group}
                </p>

                <h3 className="text-[15.5px] font-semibold tracking-tight text-slate-900">
                  {module.title}
                </h3>

                <p className="mt-2 text-[13.5px] leading-6 text-slate-500">
                  {module.description}
                </p>

              </Link>
            );
          })}

        </div>

      </div>
    </section>
  );
}