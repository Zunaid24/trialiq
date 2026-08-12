import Link from "next/link";
import { ArrowRight, Brain, FileSearch, ShieldCheck, Activity } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const capabilities = [
  {
    icon: FileSearch,
    title: "Clinical document intelligence",
    text: "Turn protocols, participant records, laboratory reports and source documents into structured clinical information.",
  },
  {
    icon: Brain,
    title: "Context-aware AI reasoning",
    text: "Evaluate extracted information against protocol and clinical research context rather than treating documents as isolated text.",
  },
  {
    icon: ShieldCheck,
    title: "Review-ready intelligence",
    text: "Surface evidence, confidence and findings in a format designed for qualified clinical research teams to review.",
  },
  {
    icon: Activity,
    title: "Operational workflows",
    text: "Move from document understanding to screening, reconciliation, safety, coding and follow-up without leaving the workspace.",
  },
];

export default function PlatformPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      <section className="px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-[1180px]">
          <p className="font-mono text-xs font-medium uppercase tracking-wider text-blue-700">The TrialIQ Platform</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-6xl">
            Clinical intelligence built around the way trial teams actually work.
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
            TrialIQ connects clinical documents, AI extraction, contextual reasoning and human review into one operational layer for clinical research.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard" className="group inline-flex items-center gap-2 rounded-md bg-blue-700 px-5 py-3 text-sm font-medium text-white hover:bg-blue-800">
              Launch Workspace <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="/dashboard/workspace" className="inline-flex items-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:border-slate-500">
              Explore Modules
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-5 py-16 md:px-8">
        <div className="mx-auto max-w-[1180px]">
          <div className="grid gap-6 md:grid-cols-2">
            {capabilities.map((item) => {
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
        <div className="mx-auto max-w-[1180px] rounded-2xl bg-slate-950 px-7 py-12 text-white md:px-12">
          <p className="font-mono text-xs uppercase tracking-wider text-blue-300">Platform principle</p>
          <h2 className="mt-3 max-w-3xl text-2xl font-bold tracking-tight md:text-3xl">AI should reduce the work around clinical decisions, not obscure the evidence behind them.</h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">TrialIQ is designed as an intelligence layer that helps teams find, structure and review the information that matters.</p>
        </div>
      </section>
      <Footer />
    </main>
  );
}