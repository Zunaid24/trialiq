"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  FileText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function Hero() {
  return (
    <>
      <section
        id="platform"
        className="bg-slate-50 px-5 pb-12 pt-[60px] md:px-8"
      >
        <div className="mx-auto max-w-[1180px]">

          {/* EYEBROW */}

          <div className="inline-flex items-center gap-2 rounded border border-blue-200 bg-blue-50 px-3 py-1.5 font-mono text-xs text-blue-800">
            <Sparkles size={13} />
            CLINICAL TRIAL INTELLIGENCE
          </div>

          {/* HERO */}

          <div className="mt-6 grid items-center gap-10 lg:grid-cols-[0.95fr_1fr]">

            <div>

              <h1 className="max-w-3xl text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-slate-950 md:text-6xl">
                Clinical trial operations,
                <br />
                <span className="text-blue-700">
                  read and reasoned by AI.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                TrialIQ turns protocols, participant records,
                laboratory data and clinical documents into
                structured intelligence for faster, safer trial
                operations.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">

                <Link
                  href="/dashboard/workspace"
                  className="group inline-flex items-center gap-2 rounded-md bg-blue-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-800 hover:shadow-lg"
                >
                  Launch Workspace
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </Link>

                <a
                  href="#modules"
                  className="inline-flex items-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-500 hover:text-slate-950"
                >
                  Explore Modules
                </a>

              </div>

              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">

                <span className="flex items-center gap-2">
                  <Check
                    size={14}
                    className="text-green-600"
                  />
                  Source-grounded analysis
                </span>

                <span className="flex items-center gap-2">
                  <Check
                    size={14}
                    className="text-green-600"
                  />
                  Human review workflows
                </span>

                <span className="flex items-center gap-2">
                  <Check
                    size={14}
                    className="text-green-600"
                  />
                  Clinical auditability
                </span>

              </div>

            </div>


            {/* PROTOCOL VISUAL */}

            <div className="relative">

              <div className="absolute -inset-4 rounded-[28px] bg-blue-100/50 blur-2xl" />

              <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.22)]">

                <div className="flex items-center justify-between border-b border-slate-100 pb-4">

                  <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                      <FileText size={17} />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Protocol_Study_001.pdf
                      </p>

                      <p className="font-mono text-[10px] text-slate-400">
                        248 pages · uploaded just now
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-green-50 px-2.5 py-1 font-mono text-[10px] font-medium text-green-700">
                    PROCESSED
                  </span>

                </div>


                <div className="py-5">

                  <div className="flex items-center justify-between">

                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                        AI Extraction
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        Eligibility Criteria
                      </p>
                    </div>

                    <span className="font-mono text-xs font-semibold text-blue-700">
                      97% confidence
                    </span>

                  </div>


                  <div className="mt-4 space-y-2.5">

                    <CriteriaItem>
                      Diagnosis — Confirmed Stage II–III
                    </CriteriaItem>

                    <CriteriaItem>
                      ECOG status — 0 to 1
                    </CriteriaItem>

                    <CriteriaItem>
                      Washout — 14-day exclusion window
                    </CriteriaItem>

                  </div>

                </div>


                <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">

                  <MiniStat
                    label="Visits"
                    value="12"
                  />

                  <MiniStat
                    label="Endpoints"
                    value="8"
                  />

                  <MiniStat
                    label="Risk Flags"
                    value="3"
                  />

                </div>

              </div>

            </div>

          </div>

        </div>
      </section>


      {/* TRUST STRIP */}

      <div className="border-y border-slate-200 bg-white">

        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-5 px-5 py-5 md:px-8">

          <TrustItem>
            <ShieldCheck size={17} />
            Built for clinical research workflows
          </TrustItem>

          <TrustItem>
            <Check size={17} />
            Source-to-decision traceability
          </TrustItem>

          <TrustItem>
            <FileText size={17} />
            Structured clinical intelligence
          </TrustItem>

          <TrustItem>
            <Sparkles size={17} />
            AI-assisted human review
          </TrustItem>

        </div>

      </div>
    </>
  );
}


function CriteriaItem({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">

      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-700">
        <Check
          size={11}
          strokeWidth={3}
          className="text-white"
        />
      </span>

      <span className="text-xs font-medium text-slate-700">
        {children}
      </span>

    </div>
  );
}


function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2.5">

      <p className="font-mono text-[9px] uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-0.5 text-lg font-semibold text-slate-900">
        {value}
      </p>

    </div>
  );
}


function TrustItem({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
      <span className="text-blue-700">
        {children}
      </span>
    </div>
  );
}