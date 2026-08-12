"use client";

const steps = [
  {
    number: "01",
    title: "Upload",
    description:
      "Add your protocol, participant record or clinical source document.",
  },
  {
    number: "02",
    title: "Extract",
    description:
      "AI identifies relevant clinical facts, rules, dates and terminology.",
  },
  {
    number: "03",
    title: "Analyze",
    description:
      "TrialIQ evaluates the information against clinical research context.",
  },
  {
    number: "04",
    title: "Review",
    description:
      "Inspect evidence, confidence and findings before taking action.",
  },
  {
    number: "05",
    title: "Act",
    description:
      "Move findings into the appropriate clinical workflow or follow-up.",
  },
];

export default function Workflow() {
  return (
    <section
      id="workflow"
      className="bg-white px-5 py-20 md:px-8"
    >
      <div className="mx-auto max-w-[1180px]">

        <div className="mb-9">

          <p className="font-mono text-xs font-medium uppercase tracking-wider text-blue-700">
            How TrialIQ Works
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
            From source document to
            <br className="hidden md:block" />
            clinical decision.
          </h2>

        </div>


        <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white md:grid-cols-5">

          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`p-6 ${
                index !== steps.length - 1
                  ? "border-b border-slate-200 md:border-b-0 md:border-r"
                  : ""
              }`}
            >

              <p className="font-mono text-[11px] text-blue-700">
                {step.number}
              </p>

              <h4 className="mt-3 text-[15px] font-semibold text-slate-900">
                {step.title}
              </h4>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                {step.description}
              </p>

            </div>
          ))}

        </div>

      </div>
    </section>
  );
}