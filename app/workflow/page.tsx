import Link from "next/link";
import { ArrowRight, Upload, ScanSearch, Brain, Eye, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const steps = [
  { number: "01", icon: Upload, title: "Upload", text: "Add a protocol, participant record or clinical source document." },
  { number: "02", icon: ScanSearch, title: "Extract", text: "TrialIQ identifies relevant facts, rules, dates, terminology and clinical entities." },
  { number: "03", icon: Brain, title: "Analyze", text: "AI evaluates the extracted information against clinical research context." },
  { number: "04", icon: Eye, title: "Review", text: "Inspect evidence, confidence and findings before making a decision." },
  { number: "05", icon: CheckCircle2, title: "Act", text: "Move validated findings into the appropriate clinical workflow or follow-up." },
];

export default function WorkflowPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      <section className="px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-[1180px]">
          <p className="font-mono text-xs font-medium uppercase tracking-wider text-blue-700">How TrialIQ Works</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-6xl">From source document to clinical decision.</h1>
          <p className="mt-6 max-w-3xl text-base leading-7 text-slate-600 md:text-lg">A straightforward workflow keeps the source evidence connected to every AI-assisted finding, review step and operational action.</p>
        </div>
      </section>

      <section className="bg-white px-5 py-16 md:px-8">
        <div className="mx-auto max-w-[1180px]">
          <div className="relative">
            <div className="absolute left-[10%] right-[10%] top-5 hidden h-px bg-blue-100 md:block" />
            <div className="relative grid overflow-hidden rounded-2xl border border-slate-200 bg-white md:grid-cols-5">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.number} className="border-b border-slate-200 p-6 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
                    <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-white font-mono text-[10px] font-semibold text-blue-700 shadow-sm"><Icon size={16} /></div>
                    <p className="mt-4 font-mono text-[10px] font-semibold text-blue-700">{step.number}</p>
                    <h2 className="mt-2 text-lg font-semibold text-slate-900">{step.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{step.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 md:px-8">
        <div className="mx-auto max-w-[1180px] flex flex-col justify-between gap-6 rounded-2xl bg-slate-950 px-7 py-12 text-white md:flex-row md:items-center md:px-12">
          <div><h2 className="text-2xl font-bold md:text-3xl">See the workflow in action.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Open the Clinical Workspace and choose an intelligence module.</p></div>
          <Link href="/dashboard/workspace" className="group inline-flex w-fit items-center gap-2 rounded-md bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-500">Open Workspace <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" /></Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}