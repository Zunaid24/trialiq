import Link from "next/link";
import { ArrowRight, CheckCircle2, FileCheck2, ShieldCheck, Link2, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const principles = [
  { icon: FileCheck2, title: "Evidence-backed outputs", text: "Findings are presented with source context so reviewers can understand what information supports an AI-generated result." },
  { icon: Users, title: "Human-in-the-loop", text: "TrialIQ assists qualified clinical research teams and keeps review and action with the appropriate human decision-maker." },
  { icon: CheckCircle2, title: "Explainable by design", text: "Confidence, evidence and review status are treated as first-class parts of the intelligence workflow." },
  { icon: Link2, title: "Traceable workflows", text: "Move from extraction to review and action while maintaining the relationship to the originating clinical record." },
];

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      <section className="px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-[1180px]">
          <p className="font-mono text-xs font-medium uppercase tracking-wider text-blue-700">Security & Explainability</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-6xl">Built for clinical research workflows.</h1>
          <p className="mt-6 max-w-3xl text-base leading-7 text-slate-600 md:text-lg">TrialIQ is designed around traceability, human review and evidence-backed AI outputs so teams can understand and validate what the system produces.</p>
        </div>
      </section>

      <section className="bg-white px-5 py-16 md:px-8">
        <div className="mx-auto max-w-[1180px]">
          <div className="grid gap-6 md:grid-cols-2">
            {principles.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-7">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><Icon size={18} /></div>
                  <h2 className="mt-5 text-lg font-semibold text-slate-900">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 md:px-8">
        <div className="mx-auto max-w-[1180px] rounded-2xl border border-blue-100 bg-blue-50 p-8 md:p-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-start">
            <ShieldCheck className="shrink-0 text-blue-700" size={24} />
            <div>
              <h2 className="text-xl font-semibold text-slate-950">A review-first approach</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">TrialIQ is an AI-assisted clinical research tool. Outputs should be reviewed by appropriately qualified users before they are used for clinical, regulatory or operational decisions.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-16 md:px-8">
        <div className="mx-auto max-w-[1180px] flex flex-col justify-between gap-6 rounded-2xl bg-slate-950 px-7 py-12 text-white md:flex-row md:items-center md:px-12">
          <div><h2 className="text-2xl font-bold md:text-3xl">Ready to review TrialIQ?</h2><p className="mt-3 text-sm text-slate-300">Open the workspace to explore the intelligence modules.</p></div>
          <Link href="/dashboard" className="group inline-flex w-fit items-center gap-2 rounded-md bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-500">Launch Workspace <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" /></Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}