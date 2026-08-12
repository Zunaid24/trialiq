interface Props {
  report: any;
}

export default function DeviationReport({
  report,
}: Props) {
  if (!report) return null;

  const deviations = Array.isArray(
    report.deviations
  )
    ? report.deviations
    : [];

  const missingInformation = Array.isArray(
    report.missingInformation
  )
    ? report.missingInformation
    : [];

  const recommendedActions = Array.isArray(
    report.recommendedActions
  )
    ? report.recommendedActions
    : [];

  return (
    <div className="mt-10 space-y-8">

      {/* SUMMARY */}

      <div className="rounded-3xl bg-gradient-to-r from-orange-700 to-amber-600 p-8 text-white shadow-xl">

        <p className="text-sm text-orange-100">
          AI Protocol Deviation Assessment
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          {report.studyTitle ||
            "Protocol Deviation Review"}
        </h2>

        <p className="mt-2 text-orange-100">
          {report.participantId
            ? `Participant ${report.participantId}`
            : "Participant record"}
        </p>

        <p className="mt-5 max-w-4xl leading-7 text-orange-100">
          {report.summary ||
            "Protocol deviation analysis completed."}
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">

          <Metric
            label="Deviations"
            value={report.deviationCount ?? deviations.length}
          />

          <Metric
            label="Overall Risk"
            value={
              report.overallRisk || "--"
            }
          />

          <Metric
            label="Investigator Review"
            value={
              report.investigatorReviewRequired
                ? "Required"
                : "Not Flagged"
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


      {/* DEVIATIONS */}

      <Section title="Detected Deviations">

        {deviations.length > 0 ? (
          <div className="space-y-5">

            {deviations.map(
              (item: any, index: number) => (
                <div
                  key={index}
                  className="rounded-2xl border border-orange-200 bg-orange-50 p-6"
                >

                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">

                    <div>

                      <p className="text-sm font-medium text-orange-700">
                        {item.category ||
                          "Protocol Deviation"}
                      </p>

                      <h3 className="mt-1 text-lg font-semibold text-orange-950">
                        {item.description ||
                          "Potential deviation identified."}
                      </h3>

                    </div>

                    <StatusBadge
                      status={
                        item.status ||
                        "Requires Review"
                      }
                    />

                  </div>


                  <div className="mt-5 grid gap-4 md:grid-cols-2">

                    <Detail
                      label="Protocol Requirement"
                      value={
                        item.protocolRequirement
                      }
                    />

                    <Detail
                      label="Actual Event"
                      value={item.actualEvent}
                    />

                    <Detail
                      label="Date"
                      value={item.date}
                    />

                    <Detail
                      label="Severity"
                      value={item.severity}
                    />

                    <Detail
                      label="Impact"
                      value={item.impact}
                    />

                    <Detail
                      label="Evidence"
                      value={item.evidence}
                    />

                  </div>

                </div>
              )
            )}

          </div>
        ) : (
          <Empty
            text="No protocol deviations identified from the available information."
          />
        )}

      </Section>


      {/* MISSING INFORMATION */}

      <Section title="Missing Information">

        <List
          items={missingInformation}
        />

      </Section>


      {/* ACTIONS */}

      <Section title="Recommended Actions">

        <List
          items={recommendedActions}
          numbered
        />

      </Section>


      {/* REVIEW NOTICE */}

      <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">

        <p className="font-semibold text-yellow-900">
          Investigator / Study Team Review
        </p>

        <p className="mt-2 text-sm leading-6 text-yellow-800">

          AI-generated deviation findings should be
          verified against the source documentation and
          applicable study procedures before being recorded
          as an official protocol deviation.

        </p>

      </div>

    </div>
  );
}


function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">

      <p className="text-sm text-orange-100">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold">
        {value}
      </p>

    </div>
  );
}


function Detail({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="rounded-xl border border-orange-100 bg-white p-4">

      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-sm leading-6 text-slate-700">
        {value || "Not documented"}
      </p>

    </div>
  );
}


function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    status.toLowerCase();

  let className =
    "bg-slate-100 text-slate-700";

  if (normalized.includes("confirmed")) {
    className =
      "bg-red-100 text-red-700";
  } else if (
    normalized.includes("potential")
  ) {
    className =
      "bg-yellow-100 text-yellow-700";
  }

  return (
    <span
      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${className}`}
    >
      {status}
    </span>
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

      <h2 className="mb-6 text-2xl font-bold text-slate-900">
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
  items: string[];
  numbered?: boolean;
}) {
  if (!items.length) {
    return (
      <Empty text="No items identified." />
    );
  }

  return (
    <div className="space-y-3">

      {items.map(
        (item: string, index: number) => (
          <div
            key={index}
            className="rounded-xl border bg-slate-50 p-4 text-sm leading-6 text-slate-700"
          >

            {numbered && (
              <span className="mr-3 font-semibold text-orange-600">
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
  text,
}: {
  text: string;
}) {
  return (
    <p className="text-sm text-slate-500">
      {text}
    </p>
  );
}