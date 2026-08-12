"use client";

import {
  CheckCircle2,
  FileCheck2,
  ShieldCheck,
  Link2,
} from "lucide-react";

export default function Security() {
  return (
    <section
      id="security"
      className="bg-white px-5 py-14 md:px-8"
    >
      <div className="mx-auto max-w-[1180px]">

        <div className="mb-7 max-w-3xl">

          <p className="font-mono text-xs font-medium uppercase tracking-wider text-blue-700">
            Security & Explainability
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
            Built for clinical
            <br />
            research workflows.
          </h2>

          <p className="mt-4 text-base leading-7 text-slate-600">
            TrialIQ is designed around traceability,
            human review and evidence-backed AI outputs.
          </p>

        </div>


        <div className="grid gap-6 md:grid-cols-2">

          <SecurityCard
            icon={<FileCheck2 size={17} />}
            title="Evidence-backed outputs"
            description="Every finding is grounded in the source document and presented with the context needed for human review."
          />

          <SecurityCard
            icon={<ShieldCheck size={17} />}
            title="Human-in-the-loop"
            description="TrialIQ assists clinical research teams rather than replacing qualified clinical or coding decisions."
          />

          <SecurityCard
            icon={<CheckCircle2 size={17} />}
            title="Explainable by design"
            description="AI findings include confidence, source evidence and review status so users can understand why a result was produced."
          />

          <SecurityCard
            icon={<Link2 size={17} />}
            title="Traceable workflows"
            description="Move from extracted information to review and action without losing the relationship to the originating clinical record."
          />

        </div>

      </div>
    </section>
  );
}


function SecurityCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-7">

      <h4 className="flex items-center gap-2.5 text-[15px] font-semibold text-slate-900">

        <span className="text-blue-700">
          {icon}
        </span>

        {title}

      </h4>

      <p className="mt-3 text-[13.5px] leading-6 text-slate-500">
        {description}
      </p>

    </div>
  );
}