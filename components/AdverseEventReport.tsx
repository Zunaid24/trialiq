interface Props {
  report: any;
}

export default function AdverseEventReport({
  report,
}: Props) {
  if (!report) return null;

  return (
    <div className="mt-10 space-y-8">

      {/* HERO */}

      <div className="rounded-3xl bg-gradient-to-r from-red-700 to-rose-600 p-8 text-white shadow-xl">

        <p className="text-sm text-red-100">
          AI Adverse Event Assessment
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          {report.event || "Adverse Event"}
        </h2>

        <p className="mt-4 max-w-4xl leading-7 text-red-100">
          {report.eventSummary ||
            "Event assessment completed."}
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">

          <Metric
            label="Severity"
            value={report.severity}
          />

          <Metric
            label="Seriousness"
            value={report.seriousness}
          />

          <Metric
            label="Causality"
            value={report.causality}
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


      {/* EVENT DETAILS */}

      <Section title="Event Details">

        <div className="grid gap-4 md:grid-cols-2">

          <Info
            label="Participant"
            value={report.patientId}
          />

          <Info
            label="Event"
            value={report.event}
          />

          <Info
            label="Onset Date"
            value={report.onsetDate}
          />

          <Info
            label="Resolution Date"
            value={report.resolutionDate}
          />

          <Info
            label="Severity"
            value={report.severity}
          />

          <Info
            label="Seriousness"
            value={report.seriousness}
          />

          <Info
            label="Causality"
            value={report.causality}
          />

          <Info
            label="Outcome"
            value={report.outcome}
          />

        </div>

      </Section>


      {/* SERIOUSNESS FLAGS */}

      <Section title="Safety Classification">

        <div className="grid gap-4 md:grid-cols-3">

          <Flag
            label="Hospitalization"
            active={report.hospitalization}
          />

          <Flag
            label="Life Threatening"
            active={report.lifeThreatening}
          />

          <Flag
            label="Death"
            active={report.death}
          />

        </div>

      </Section>


      {/* ACTION */}

      <Section title="Action Taken">

        <div className="rounded-2xl border bg-slate-50 p-5">

          <p className="text-slate-700">
            {report.actionTaken ||
              "Not documented."}
          </p>

        </div>

      </Section>


      {/* EXPECTEDNESS */}

      <Section title="Expectedness">

        <div className="rounded-2xl border bg-slate-50 p-5">

          <p className="font-semibold">
            {report.expectedness ||
              "Not documented"}
          </p>

        </div>

      </Section>


      {/* FOLLOW UP */}

      <Section title="Follow-up Required">

        <List
          items={report.followUpRequired}
        />

      </Section>


      {/* REPORTING */}

      <Section title="Reporting Considerations">

        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">

          <p className="mb-4 text-sm text-yellow-800">
            These are considerations for investigator
            or safety-team review, not an automated
            determination of reportability.
          </p>

          <List
            items={
              report.reportingConsiderations
            }
          />

        </div>

      </Section>


      {/* COORDINATOR */}

      <Section title="Coordinator Actions">

        <List
          items={report.coordinatorActions}
          numbered
        />

      </Section>


      {/* MISSING */}

      <Section title="Missing Information">

        <List
          items={report.missingInformation}
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

      <p className="text-sm text-red-100">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold">
        {value || "--"}
      </p>

    </div>
  );
}


function Info({
  label,
  value,
}: {
  label: string;
  value: any;
}) {
  return (
    <div className="rounded-xl border bg-slate-50 p-4">

      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 font-semibold text-slate-800">
        {value || "Not documented"}
      </p>

    </div>
  );
}


function Flag({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        active
          ? "border-red-200 bg-red-50"
          : "border-green-200 bg-green-50"
      }`}
    >

      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 text-lg font-bold ${
          active
            ? "text-red-700"
            : "text-green-700"
        }`}
      >
        {active ? "Yes" : "No"}
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
    return (
      <p className="text-slate-500">
        No information available.
      </p>
    );
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