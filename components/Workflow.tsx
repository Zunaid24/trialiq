const steps = [
  "Upload",
  "Extract",
  "Analyze",
  "Review",
  "Export",
];

export default function Workflow() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="mb-16 text-center text-4xl font-bold">
          AI Workflow
        </h2>

        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div
              key={step}
              className="flex flex-1 items-center"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
                {index + 1}
              </div>

              <div className="ml-4 text-lg font-semibold">
                {step}
              </div>

              {index !== steps.length - 1 && (
                <div className="mx-6 h-1 flex-1 bg-slate-200"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}