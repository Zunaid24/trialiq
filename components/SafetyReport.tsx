interface Props {
  report: any;
}

export default function SafetyReport({
  report,
}: Props) {
  if (!report) return null;

  const signals = Array.isArray(
    report.signals
  )
    ? report.signals
    : [];

  const patterns = Array.isArray(
    report.notablePatterns
  )
    ? report.notablePatterns
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

      <div className="rounded-3xl bg-gradient-to-r from-red-700 to-rose-600 p-8 text-white shadow-xl">

        <p className="text-sm text-red-100">
          AI Safety Signal Assessment
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          {report.studyTitle ||
            "Safety Signal Review"}
        </h2>

        <p className="mt-5 max-w-4xl leading-7 text-red-100">
          {report.summary ||
            "Safety signal analysis completed."}
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">

          <Metric
            label="Participants"
            value={
              report.participantsReviewed ?? "--"
            }
          />

          <Metric
            label="Events"
            value={
              report.eventsReviewed ?? "--"
            }
          />

          <Metric
            label="Signals"
            value={
              report.signalsDetected ??
              signals.length
            }
          />

          <Metric
            label="Safety Status"
            value={
              report.overallSafetyStatus ||
              "--"
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


      {/* SIGNALS */}

      <Section title="Potential Safety Signals">

        {signals.length > 0 ? (
          <div className="space-y-5">

            {signals.map(
              (signal: any, index: number) => (
                <div
                  key={index}
                  className="rounded-2xl border border-red-200 bg-red-50 p-6"
                >

                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">

                    <div>

                      <p className="text-sm font-medium text-red-700">
                        {signal.eventType ||
                          "Safety Pattern"}
                      </p>

                      <h3 className="mt-1 text-xl font-semibold text-red-950">
                        {signal.signal ||
                          "Potential Safety Signal"}
                      </h3>

                    </div>

                    <div className="flex gap-2">

                      <PriorityBadge
                        priority={
                          signal.priority ||
                          "Review"
                        }
                      />

                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                        {signal.status ||
                          "Requires Review"}
                      </span>

                    </div>

                  </div>


                  <p className="mt-4 text-sm leading-6 text-slate-700">
                    {signal.description ||
                      "Potential pattern identified in the available safety data."}
                  </p>


                  <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">

                    <Detail
                      label="Event Count"
                      value={
                        signal.eventCount
                          ?.toString()
                      }
                    />

                    <Detail
                      label="Serious Events"
                      value={
                        signal.seriousEvents
                          ?.toString()
                      }
                    />

                    <Detail
                      label="Severity Pattern"
                      value={
                        signal.severityPattern
                      }
                    />

                  </div>


                  {Array.isArray(
                    signal.affectedParticipants
                  ) &&
                    signal
                      .affectedParticipants
                      .length > 0 && (
                      <div className="mt-5">

                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Affected Participants
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">

                          {signal.affectedParticipants.map(
                            (
                              participant: string,
                              participantIndex: number
                            ) => (
                              <span
                                key={
                                  participantIndex
                                }
                                className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700"
                              >
                                {participant}
                              </span>
                            )
                          )}

                        </div>

                      </div>
                    )}


                  <div className="mt-5 rounded-xl border border-red-100 bg-white p-4">

                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Evidence
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {signal.evidence ||
                        "No specific evidence provided."}
                    </p>

                  </div>

                </div>
              )
            )}

          </div>
        ) : (
          <Empty
            text="No potential safety signals were identified from the available dataset."
          />
        )}

      </Section>


      {/* PATTERNS */}

      <Section title="Notable Safety Patterns">

        <List items={patterns} />

      </Section>


      {/* MISSING INFORMATION */}

      <Section title="Missing Information">

        <List items={missingInformation} />

      </Section>


      {/* ACTIONS */}

      <Section title="Recommended Safety Review Actions">

        <List
          items={recommendedActions}
          numbered
        />

      </Section>


      {/* DISCLAIMER */}

      <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">

        <p className="font-semibold text-yellow-900">
          Clinical Review Required
        </p>

        <p className="mt-2 text-sm leading-6 text-yellow-800">

          Potential safety signals identified by TrialIQ
          are observational findings intended to support
          further review. They do not establish causality
          or constitute a clinical or regulatory
          conclusion.

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

      <p className="text-sm text-red-100">
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
    <div className="rounded-xl border border-red-100 bg-white p-4">

      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-sm text-slate-700">
        {value || "Not available"}
      </p>

    </div>
  );
}


function PriorityBadge({
  priority,
}: {
  priority: string;
}) {
  const value =
    priority.toLowerCase();

  let className =
    "bg-slate-100 text-slate-700";

  if (value.includes("high")) {
    className =
      "bg-red-200 text-red-800";
  } else if (
    value.includes("moderate")
  ) {
    className =
      "bg-yellow-200 text-yellow-800";
  } else if (
    value.includes("low")
  ) {
    className =
      "bg-green-200 text-green-800";
  }

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${className}`}
    >
      {priority}
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
              <span className="mr-3 font-semibold text-red-600">
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