interface Props {
  report: any;
}

export default function VisitIntelligenceReport({
  report,
}: Props) {
  if (!report) return null;

  return (
    <div className="mt-10 space-y-8">

      <div className="rounded-3xl bg-gradient-to-r from-cyan-700 to-blue-600 p-8 text-white shadow-xl">

        <p className="text-sm text-cyan-100">
          AI Visit Intelligence
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          {report.studyTitle || "Clinical Trial"}
        </h2>

        <p className="mt-4 max-w-3xl leading-7 text-cyan-100">
          {report.visitSummary}
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">

          <Metric
            label="Visits"
            value={report.visits?.length ?? 0}
          />

          <Metric
            label="Critical Windows"
            value={report.criticalWindows?.length ?? 0}
          />

          <Metric
            label="Confidence"
            value={
              report.confidence != null
                ? `${report.confidence}%`
                : "--"
            }
          />

        </div>

      </div>

      <Section title="Visit Schedule">

        <div className="space-y-5">

          {report.visits?.map(
            (visit: any, index: number) => (
              <div
                key={index}
                className="rounded-2xl border p-6"
              >

                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">

                  <div>
                    <h3 className="text-xl font-semibold">
                      {visit.visit}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {visit.purpose}
                    </p>
                  </div>

                  <div className="flex gap-2">

                    <span className="rounded-full bg-cyan-100 px-3 py-1 text-sm text-cyan-700">
                      {visit.timing}
                    </span>

                    {visit.window && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                        {visit.window}
                      </span>
                    )}

                  </div>

                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">

                  <VisitBlock
                    title="Assessments"
                    items={visit.assessments}
                  />

                  <VisitBlock
                    title="Laboratory"
                    items={visit.labs}
                  />

                  <VisitBlock
                    title="Imaging"
                    items={visit.imaging}
                  />

                  <VisitBlock
                    title="Procedures"
                    items={visit.procedures}
                  />

                  <VisitBlock
                    title="Safety Checks"
                    items={visit.safetyChecks}
                  />

                  <VisitBlock
                    title="Coordinator Actions"
                    items={visit.coordinatorActions}
                  />

                </div>

                {visit.criticalRequirements?.length > 0 && (
                  <div className="mt-5 rounded-xl border border-yellow-200 bg-yellow-50 p-4">

                    <h4 className="font-semibold text-yellow-900">
                      Critical Requirements
                    </h4>

                    <List
                      items={
                        visit.criticalRequirements
                      }
                    />

                  </div>
                )}

              </div>
            )
          )}

        </div>

      </Section>

      <Section title="Critical Windows">

        <List items={report.criticalWindows} />

      </Section>

      <Section title="Coordinator Actions">

        <List
          items={report.overallCoordinatorActions}
          numbered
        />

      </Section>

      <Section title="Risk Flags">

        <List items={report.riskFlags} />

      </Section>

    </div>
  );
}

function VisitBlock({
  title,
  items,
}: {
  title: string;
  items?: string[];
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">

      <h4 className="font-semibold text-slate-800">
        {title}
      </h4>

      <List items={items} />

    </div>
  );
}

function List({
  items,
  numbered = false,
}: {
  items?: string[];
  numbered?: boolean;
}) {
  if (!items?.length) {
    return (
      <p className="mt-2 text-sm text-slate-400">
        None specified
      </p>
    );
  }

  return (
    <div className="mt-2 space-y-2">

      {items.map((item, index) => (
        <div
          key={index}
          className="text-sm leading-6 text-slate-600"
        >
          {numbered && (
            <span className="mr-2 font-semibold text-cyan-600">
              {index + 1}.
            </span>
          )}

          {item}
        </div>
      ))}

    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: any;
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">

      <p className="text-sm text-cyan-100">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {value ?? "--"}
      </p>

    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border bg-white p-8 shadow-sm">

      <h2 className="mb-6 text-2xl font-bold">
        {title}
      </h2>

      {children}

    </section>
  );
}