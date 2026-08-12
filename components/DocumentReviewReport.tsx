interface Props {
  report: any;
}

export default function DocumentReviewReport({
  report,
}: Props) {
  if (!report) return null;

  return (
    <div className="mt-10 space-y-8">

      {/* Summary */}

      <div className="rounded-3xl bg-gradient-to-r from-violet-700 to-purple-600 p-8 text-white shadow-xl">

        <p className="text-sm text-violet-100">
          AI Source Document Review
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          {report.documentType ||
            "Clinical Document"}
        </h2>

        <p className="mt-4 max-w-3xl leading-7 text-violet-100">
          {report.clinicalSummary ||
            "Document review completed."}
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">

          <Metric
            label="Patient"
            value={report.patientId}
          />

          <Metric
            label="Risk Flags"
            value={
              report.riskFlags?.length ?? 0
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

      {/* Key Findings */}

      <Section title="Key Findings">

        <div className="space-y-3">

          {report.keyFindings?.length ? (
            report.keyFindings.map(
              (item: any, index: number) => (
                <div
                  key={index}
                  className="rounded-xl border p-4"
                >
                  <h3 className="font-semibold">
                    {item.finding}
                  </h3>

                  <p className="mt-2 text-sm text-slate-600">
                    {item.clinicalRelevance}
                  </p>
                </div>
              )
            )
          ) : (
            <Empty />
          )}

        </div>

      </Section>

      {/* Abnormal Findings */}

      <Section title="Abnormal Findings">

        <div className="space-y-3">

          {report.abnormalFindings?.length ? (
            report.abnormalFindings.map(
              (item: any, index: number) => (
                <div
                  key={index}
                  className="rounded-xl border border-orange-200 bg-orange-50 p-4"
                >

                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">

                    <h3 className="font-semibold text-orange-900">
                      {item.finding}
                    </h3>

                    <span className="rounded-full bg-orange-200 px-3 py-1 text-sm text-orange-800">
                      {item.value}
                    </span>

                  </div>

                  <p className="mt-2 text-sm text-orange-800">
                    {item.clinicalImpact}
                  </p>

                </div>
              )
            )
          ) : (
            <Empty />
          )}

        </div>

      </Section>

      {/* Critical Findings */}

      <Section title="Critical Findings">

        <div className="space-y-3">

          {report.criticalFindings?.length ? (
            report.criticalFindings.map(
              (item: any, index: number) => (
                <div
                  key={index}
                  className="rounded-xl border border-red-200 bg-red-50 p-4"
                >

                  <div className="flex items-center justify-between gap-4">

                    <h3 className="font-semibold text-red-900">
                      {item.finding}
                    </h3>

                    <span className="rounded-full bg-red-200 px-3 py-1 text-xs font-medium text-red-800">
                      {item.urgency}
                    </span>

                  </div>

                  <p className="mt-2 text-sm text-red-800">
                    {item.reason}
                  </p>

                </div>
              )
            )
          ) : (
            <Empty text="No critical findings identified." />
          )}

        </div>

      </Section>

      {/* Missing Information */}

      <Section title="Missing Information">

        <List
          items={report.missingInformation?.map(
            (item: any) =>
              `${item.item}: ${item.reason}`
          )}
        />

      </Section>

      {/* Risk Flags */}

      <Section title="Risk Flags">

        <div className="space-y-3">

          {report.riskFlags?.length ? (
            report.riskFlags.map(
              (item: any, index: number) => (
                <div
                  key={index}
                  className="rounded-xl border border-yellow-200 bg-yellow-50 p-4"
                >

                  <div className="flex items-center justify-between gap-4">

                    <h3 className="font-semibold text-yellow-900">
                      {item.risk}
                    </h3>

                    <span className="rounded-full bg-yellow-200 px-3 py-1 text-xs font-medium text-yellow-800">
                      {item.severity}
                    </span>

                  </div>

                  <p className="mt-2 text-sm text-yellow-800">
                    {item.reason}
                  </p>

                </div>
              )
            )
          ) : (
            <Empty text="No risk flags identified." />
          )}

        </div>

      </Section>

      {/* Actions */}

      <Section title="Recommended Actions">

        <List
          items={report.recommendedActions}
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

      <p className="text-sm text-violet-100">
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
            className="rounded-xl border bg-slate-50 p-4"
          >
            {numbered && (
              <span className="mr-3 font-semibold text-violet-600">
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