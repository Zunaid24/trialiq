import Link from "next/link";

export default function Hero() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-28 text-center">
      <span className="rounded-full border bg-white px-4 py-2 text-sm font-medium">
        AI Clinical Trial Intelligence
      </span>

      <h1 className="mt-8 text-7xl font-bold tracking-tight">
        The AI Operating System
        <br />
        for Clinical Trials
      </h1>

      <p className="mx-auto mt-8 max-w-3xl text-xl text-slate-600">
        Accelerate participant screening, protocol analysis and trial
        operations using explainable AI.
      </p>

      <div className="mt-10 flex justify-center gap-4">
        <button className="rounded-2xl bg-blue-600 px-8 py-4 text-white hover:bg-blue-700">
          <Link
  href="/dashboard"
  className="rounded-2xl bg-blue-600 px-8 py-4 text-white hover:bg-blue-700"
>
  Launch Workspace
</Link>
        </button>

        <button className="rounded-2xl border px-8 py-4 hover:bg-slate-100">
          Explore Modules
        </button>
      </div>
    </section>
  );
}