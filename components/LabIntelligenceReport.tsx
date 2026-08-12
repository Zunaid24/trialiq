interface Props {
  report: any;
}

export default function LabIntelligenceReport({
  report,
}: Props) {
  if (!report) return null;

  return (
    <div className="mt-10 space-y-8">

      {/* SUMMARY */}

      <div className="rounded-3xl bg-gradient-to-r from-rose-700 to-red-600 p-8 text-white shadow-xl">

        <p className="text-sm text-rose-100">
          AI Laboratory Intelligence
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          Laboratory Assessment
        </h2>

        <p className="mt-4 max-w-3xl leading-7 text-rose-100">
          {report.summary ||
            "Laboratory review completed."}
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">

          <Metric
            label="Patient"
            value={report.patientId}
          />

          <Metric
            label="Total Labs"
            value={report.labs?.length ?? 0}
          />

          <Metric
            label="Critical"
            value={report.criticalValues?.length ?? 0}
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

      {/* SCREENING READINESS */}

      <Section title="Screening Readiness">

        <div className="rounded-2xl border bg-slate-50 p-5">

          <p className="text-sm text-slate-500">
            AI Assessment
          </p>

          <p className="mt-2 text-xl font-semibold">
            {report.screeningReadiness ||
              "Review Required"}
          </p>

        </div>

      </Section>

      {/* LAB RESULTS */}

      <Section title="Laboratory Results">

        <div className="overflow-x-auto">

          <table className="w-full text-left">

            <thead>
              <tr className="border-b text-sm text-slate-500">

                <th className="px-4 py-3">
                  Test
                </th>

                <th className="px-4 py-3">
                  Value
                </th>

                <th className="px-4 py-3">
                  Reference
                </th>

                <th className="px-4 py-3">
                  Status
                </th>

                <th className="px-4 py-3">
                  Clinical Significance
                </th>

              </tr>
            </thead>

            <tbody>

              {report.labs?.map(
                (lab: any, index: number) => (
                  <LabRow
                    key={index}
                    lab={lab}
                  />
                )
              )}

            </tbody>

          </table>

        </div>

      </Section>

      {/* CRITICAL */}

      <Section title="Critical Values">

        {report.criticalValues?.length ? (
          <List
            items={report.criticalValues}
          />
        ) : (
          <Empty text="No critical laboratory values identified." />
        )}

      </Section>

      {/* PROTOCOL */}

      <Section title="Protocol-Relevant Concerns">

        {report.protocolViolations?.length ? (
          <List
            items={report.protocolViolations}
          />
        ) : (
          <Empty text="No protocol violations identified from the available laboratory information." />
        )}

      </Section>

      {/* MISSING */}

      <Section title="Missing Laboratory Information">

        {report.missingLabs?.length ? (
          <List
            items={report.missingLabs}
          />
        ) : (
          <Empty text="No missing laboratory information identified." />
        )}

      </Section>

      {/* ACTIONS */}

      <Section title="Follow-up Actions">

        <List
          items={report.followUpActions}
          numbered
        />

      </Section>

    </div>
  );
}

function LabRow({
  lab,
}: {
  lab: any;
}) {
  const status =
    String(lab.status || "").toLowerCase();

  let badge =
    "bg-slate-100 text-slate-700";

  if (status.includes("normal")) {
    badge = "bg-green-100 text-green-700";
  }

  if (status.includes("abnormal")) {
    badge = "bg-orange-100 text-orange-700";
  }

  if (status.includes("critical")) {
    badge = "bg-red-100 text-red-700";
  }

  if (status.includes("missing")) {
    badge = "bg-yellow-100 text-yellow-700";
  }

  return (
    <tr className="border-b">

      <td className="px-4 py-4 font-medium">
        {lab.test || "--"}
      </td>

      <td className="px-4 py-4">
        {lab.value || "--"}{" "}
        {lab.unit || ""}
      </td>

      <td className="px-4 py-4 text-sm text-slate-500">
        {lab.referenceRange || "--"}
      </td>

      <td className="px-4 py-4">

        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${badge}`}
        >
          {lab.status || "Unknown"}
        </span>

      </td>

      <td className="max-w-sm px-4 py-4 text-sm text-slate-600">
        {lab.clinicalSignificance || "--"}
      </td>

    </tr>
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

      <p className="text-sm text-rose-100">
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
    return (
      <Empty />
    );
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
              <span className="mr-3 font-semibold text-rose-600">
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