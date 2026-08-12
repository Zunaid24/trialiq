"use client";

import Link from "next/link";

import {
  Users,
  UserCheck,
  ClipboardX,
  ShieldAlert,
  AlertTriangle,
  Database,
  FlaskConical,
  Pill,
  ArrowRight,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Activity,
  Loader2,
} from "lucide-react";

import { useEffect, useState } from "react";

type DashboardData = {
  study: {
    id: string;
    name: string;
    status: string;
  };

  kpis: {
    totalParticipants: number;
    activeParticipants: number;
    protocolDeviations: number;
    safetySignals: number;
    adverseEvents: number;
    dataQualityIssues: number;
    labIssues: number;
    medicationConcerns: number;
  };

  health: {
    participantRetention: number;
    visitCompliance: number;
    dataCompleteness: number;
    protocolCompliance: number;
  };

  actions: {
    id: string;
    priority: string;
    type: string;
    title: string;
    participant: string;
    time: string;
    href: string;
  }[];

  activity: {
    id: string;
    title: string;
    description: string;
    time: string;
    type: string;
  }[];
};

export default function DashboardPage() {
  const [data, setData] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);

        const response = await fetch(
          "/api/dashboard",
          {
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              "Failed to load dashboard."
          );
        }

        setData(result.data);
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="flex items-center gap-3 text-slate-600">

          <Loader2
            size={22}
            className="animate-spin"
          />

          Loading Study Intelligence...

        </div>

      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">

          <AlertCircle
            size={32}
            className="mx-auto text-red-500"
          />

          <h1 className="mt-4 text-xl font-bold">
            Dashboard unavailable
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error ||
              "Unable to load study intelligence."}
          </p>

        </div>

      </main>
    );
  }

  const { kpis, health, actions, activity } =
    data;

  const kpiCards = [
    {
      label: "Total Participants",
      value: kpis.totalParticipants,
      change: "+12 this month",
      icon: Users,
      href: "/dashboard/workspace/eligibility",
    },

    {
      label: "Active Participants",
      value: kpis.activeParticipants,
      change: "73.4% of enrolled",
      icon: UserCheck,
      href: "/dashboard/workspace/eligibility",
    },

    {
      label: "Protocol Deviations",
      value: kpis.protocolDeviations,
      change: "2 require review",
      icon: ClipboardX,
      href: "/dashboard/workspace/deviations",
    },

    {
      label: "Safety Signals",
      value: kpis.safetySignals,
      change: "1 high priority",
      icon: ShieldAlert,
      href: "/dashboard/workspace/safety",
    },

    {
      label: "Adverse Events",
      value: kpis.adverseEvents,
      change: "3 serious events",
      icon: AlertTriangle,
      href: "/dashboard/workspace/adverse-events",
    },

    {
      label: "Data Quality Issues",
      value: kpis.dataQualityIssues,
      change: "6 high priority",
      icon: Database,
      href: "/dashboard/workspace/reconciliation",
    },

    {
      label: "Lab Issues",
      value: kpis.labIssues,
      change: "3 require follow-up",
      icon: FlaskConical,
      href: "/dashboard/workspace/labs",
    },

    {
      label: "Medication Concerns",
      value: kpis.medicationConcerns,
      change: "4 require review",
      icon: Pill,
      href: "/dashboard/workspace/medications",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">

      <div className="mx-auto max-w-7xl p-8 md:p-10">

        {/* HEADER */}

        <div className="mb-10">

          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-violet-600">

            <Activity size={16} />

            TrialIQ AI

          </div>

          <div className="mt-3 flex flex-col justify-between gap-4 md:flex-row md:items-end">

            <div>

              <h1 className="text-4xl font-bold text-slate-900">
                Study Dashboard
              </h1>

              <p className="mt-2 max-w-3xl text-slate-500">
                Clinical trial intelligence, safety,
                protocol compliance and coordinator
                actions in one place.
              </p>

            </div>

            <div className="rounded-xl border bg-white px-4 py-3 text-sm shadow-sm">

              <p className="text-xs text-slate-400">
                Study
              </p>

              <p className="font-semibold text-slate-900">
                {data.study.id}
              </p>

            </div>

          </div>

        </div>


        {/* TRIAL ANALYTICS */}

        <section>

          <div className="mb-5">

            <h2 className="text-2xl font-bold text-slate-900">
              Trial Analytics
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current study-level intelligence
            </p>

          </div>


          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {kpiCards.map((kpi) => {
              const Icon = kpi.icon;

              return (
                <Link
                  key={kpi.label}
                  href={kpi.href}
                  className="group rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >

                  <div className="flex items-start justify-between">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600">

                      <Icon size={21} />

                    </div>

                    <ArrowRight
                      size={17}
                      className="text-slate-300 transition group-hover:text-violet-600"
                    />

                  </div>

                  <p className="mt-5 text-sm text-slate-500">
                    {kpi.label}
                  </p>

                  <p className="mt-1 text-3xl font-bold text-slate-900">
                    {kpi.value}
                  </p>

                  <p className="mt-2 text-xs font-medium text-slate-400">
                    {kpi.change}
                  </p>

                </Link>
              );
            })}

          </div>

        </section>


        {/* ACTION CENTER */}

        <section className="mt-10">

          <div className="mb-5 flex items-end justify-between">

            <div>

              <h2 className="text-2xl font-bold text-slate-900">
                Coordinator Action Center
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Issues requiring attention across the
                study.
              </p>

            </div>

            <div className="hidden items-center gap-2 text-sm text-slate-500 md:flex">

              <Clock3 size={16} />

              Live study queue

            </div>

          </div>


          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

            {actions.map((action) => (

              <Link
                key={action.id}
                href={action.href}
                className="group flex flex-col gap-4 border-b p-5 transition last:border-b-0 hover:bg-slate-50 md:flex-row md:items-center"
              >

                <div
                  className={`flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
                    action.priority === "HIGH"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >

                  {action.priority ===
                  "HIGH" ? (
                    <AlertCircle size={14} />
                  ) : (
                    <Clock3 size={14} />
                  )}

                  {action.priority}

                </div>


                <div className="min-w-0 flex-1">

                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
                    {action.type}
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {action.title}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {action.participant}
                  </p>

                </div>


                <div className="flex items-center gap-4">

                  <span className="text-xs text-slate-400">
                    {action.time}
                  </span>

                  <span className="text-sm font-semibold text-violet-600">
                    Review →
                  </span>

                </div>

              </Link>

            ))}

          </div>

        </section>


        {/* LOWER GRID */}

        <div className="mt-10 grid gap-6 lg:grid-cols-2">

          {/* STUDY HEALTH */}

          <section className="rounded-2xl border bg-white p-6 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  Study Health
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  High-level operational indicators
                </p>

              </div>

              <CheckCircle2
                className="text-green-500"
                size={22}
              />

            </div>


            <div className="mt-6 space-y-5">

              <HealthRow
                label="Participant Retention"
                value={`${health.participantRetention}%`}
                progress={
                  health.participantRetention
                }
              />

              <HealthRow
                label="Visit Compliance"
                value={`${health.visitCompliance}%`}
                progress={
                  health.visitCompliance
                }
              />

              <HealthRow
                label="Data Completeness"
                value={`${health.dataCompleteness}%`}
                progress={
                  health.dataCompleteness
                }
              />

              <HealthRow
                label="Protocol Compliance"
                value={`${health.protocolCompliance}%`}
                progress={
                  health.protocolCompliance
                }
              />

            </div>

          </section>


          {/* RECENT INTELLIGENCE */}

          <section className="rounded-2xl border bg-white p-6 shadow-sm">

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                Recent Intelligence
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Latest activity generated by TrialIQ
              </p>

            </div>


            <div className="mt-6 space-y-5">

              {activity.map((item) => {

                const Icon =
                  item.type === "safety"
                    ? ShieldAlert
                    : item.type ===
                        "medication"
                      ? Pill
                      : item.type ===
                          "adverse-event"
                        ? AlertTriangle
                        : ClipboardX;

                return (
                  <div
                    key={item.id}
                    className="flex gap-4"
                  >

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">

                      <Icon size={18} />

                    </div>

                    <div className="min-w-0">

                      <p className="font-medium text-slate-900">
                        {item.title}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {item.description}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {item.time}
                      </p>

                    </div>

                  </div>
                );
              })}

            </div>

          </section>

        </div>

      </div>

    </main>
  );
}


function HealthRow({
  label,
  value,
  progress,
}: {
  label: string;
  value: string;
  progress: number;
}) {
  return (
    <div>

      <div className="mb-2 flex items-center justify-between">

        <span className="text-sm font-medium text-slate-700">
          {label}
        </span>

        <span className="text-sm font-semibold text-slate-900">
          {value}
        </span>

      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">

        <div
          className="h-full rounded-full bg-violet-600"
          style={{
            width: `${progress}%`,
          }}
        />

      </div>

    </div>
  );
}