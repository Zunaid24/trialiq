"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CTA() {
  return (
    <section className="bg-slate-50 px-5 pb-20 md:px-8">
      <div className="mx-auto max-w-[1180px]">

        <div className="flex flex-col justify-between gap-8 rounded-2xl bg-slate-950 px-7 py-12 text-white md:flex-row md:items-center md:px-12">

          <div>

            <h3 className="max-w-xl text-2xl font-bold tracking-tight md:text-3xl">
              Ready to transform your trial operations?
            </h3>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              Launch the TrialIQ workspace and start
              turning clinical documents into structured,
              explainable intelligence.
            </p>

          </div>


          <div className="flex flex-wrap gap-3">

            <Link
              href="/dashboard/workspace"
              className="group inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-500 hover:shadow-lg"
            >
              Launch Workspace

              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>

            <a
              href="mailto:hello@trialiq.ai"
              className="inline-flex items-center rounded-md border border-slate-700 px-5 py-3 text-sm font-medium text-white transition hover:border-slate-500"
            >
              Contact
            </a>

          </div>

        </div>

      </div>
    </section>
  );
}