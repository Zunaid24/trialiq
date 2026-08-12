const modules = [
  "Eligibility Screening",
  "Protocol Intelligence",
  "Clinical Data Reconciliation",
  "Source Review",
  "Visit Assistant",
  "Protocol Deviations",
  "Adverse Events",
  "Lab Intelligence",
  "Trial Analytics",
  "Medication Review",
  "Protocol Deviation Detection",
  "Safety Signal Detection",
  "Coordinator Action Center",
];

export default function ModuleGrid() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <h2 className="mb-12 text-center text-4xl font-bold">
        Core AI Modules
      </h2>

      <div className="grid gap-6 md:grid-cols-3">
        {modules.map((module) => (
          <div
            key={module}
            className="rounded-3xl border bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="mb-5 text-4xl">🧬</div>

            <h3 className="text-xl font-semibold">{module}</h3>

            <p className="mt-3 text-slate-500">
              AI-powered workflow for clinical research teams.
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}