interface Props {
  report: any;
}

export default function ReconciliationReport({
  report,
}: Props) {
  if (!report) return null;

  return (
    <div className="mt-10 space-y-8">

      <div className="rounded-3xl bg-gradient-to-r from-indigo-700 to-blue-700 p-8 text-white shadow-xl">

        <p className="text-sm text-indigo-100">
          AI Clinical Data Reconciliation
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          {report.patientId
            ? `Participant ${report.patientId}`
            : "Clinical Record Reconciliation"}
        </h2>

        <p className="mt-4 max-w-4xl leading-7 text-indigo-100">
          {report.summary}
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">

          <Metric
            label="Discrepancies"
            value={
              report.discrepancies?.length ?? 0
            }
          />

          <Metric
            label="Date Conflicts"
            value={
              report.dateConflicts?.length ?? 0
            }
          />

          <Metric
            label="Missing Information"
            value={
              report.missingInformation?.length ?? 0
            }
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

      <Section title="Discrepancies">

        {report.discrepancies?.length ? (
          <div className="space-y-4">

            {report.discrepancies.map(
              (item: any, index: number) => (
                <div
                  key={index}
                  className="rounded-2xl border border-orange-200 bg-orange-50 p-5"
                >

                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                    <div>

                      <p className="text-sm font-medium text-orange-700">
                        {item.category}
                      </p>

                      <h3 className="mt-1 font-semibold text-orange-950">
                        {item.issue}
                      </h3>

                    </div>

                    <span className="w-fit rounded-full bg-orange-200 px-3 py-1 text-xs font-semibold text-orange-800">
                      {item.severity}
                    </span>

                  </div>

                  <p className="mt-3 text-sm text-orange-900">
                    {item.details}
                  </p>

                  {item.sources?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">

                      {item.sources.map(
                        (
                          source: string,
                          sourceIndex: number
                        ) => (
                          <span
                            key={sourceIndex}
                            className="rounded-full bg-white px-3 py-1 text-xs text-slate-600"
                          >
                            {source}
                          </span>
                        )
                      )}

                    </div>
                  )}

                </div>
              )
            )}

          </div>
        ) : (
          <Empty text="No cross-document discrepancies identified." />
        )}

      </Section>

      <Section title="Date Conflicts">

        {report.dateConflicts?.length ? (
          <div className="space-y-4">

            {report.dateConflicts.map(
              (item: any, index: number) => (
                <div
                  key={index}
                  className="rounded-2xl border p-5"
                >

                  <h3 className="font-semibold">
                    {item.event}
                  </h3>

                  <div className="mt-3 flex flex-wrap gap-2">

                    {item.dates?.map(
                      (
                        date: string,
                        dateIndex: number
                      ) => (
                        <span
                          key={dateIndex}
                          className="rounded-full bg-red-100 px-3 py-1 text-sm text-red-700"
                        >
                          {date}
                        </span>
                      )
                    )}

                  </div>

                  <p className="mt-3 text-sm text-slate-600">
                    {item.issue}
                  </p>

                </div>
              )
            )}

          </div>
        ) : (
          <Empty text="No conflicting dates identified." />
        )}

      </Section>

      <Section title="Missing Information">

        <List
          items={report.missingInformation?.map(
            (item: any) =>
              `${item.item}: ${item.reason}`
          )}
        />

      </Section>

      <Section title="Cross-Document Findings">

        {report.crossDocumentFindings?.length ? (
          <div className="space-y-3">

            {report.crossDocumentFindings.map(
              (item: any, index: number) => (
                <div
                  key={index}
                  className="rounded-xl border bg-slate-50 p-5"
                >

                  <h3 className="font-semibold">
                    {item.finding}
                  </h3>

                  <p className="mt-2 text-sm text-slate-600">
                    {item.clinicalRelevance}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">

                    {item.supportingSources?.map(
                      (
                        source: string,
                        sourceIndex: number
                      ) => (
                        <span
                          key={sourceIndex}
                          className="rounded-full bg-indigo-100 px-3 py-1 text-xs text-indigo-700"
                        >
                          {source}
                        </span>
                      )
                    )}

                  </div>

                </div>
              )
            )}

          </div>
        ) : (
          <Empty />
        )}

      </Section>

      <Section title="Coordinator Actions">

        <List
          items={report.coordinatorActions}
          numbered
        />

      </Section>

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

      <p className="text-sm text-indigo-100">
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

function List({
  items,
  numbered = false,
}: {
  items?: string[];
  numbered?: boolean;
}) {
  if (!items?.length) {
    return <Empty />;
  }

  return (
    <div className="space-y-3">

      {items.map(
        (item: string, index: number) => (
          <div
            key={index}
            className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-700"
          >

            {numbered && (
              <span className="mr-3 font-semibold text-indigo-600">
                {index + 1}.
              </span>
            )}

            {item}

          </div>
        )
      )}

    </div>
  );
}

function Empty({
  text = "No information available.",
}: {
  text?: string;
}) {
  return (
    <p className="text-slate-500">
      {text}
    </p>
  );
}